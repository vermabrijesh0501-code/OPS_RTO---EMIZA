import { supabase, isSupabaseConfigured } from './supabase';

export type SyncEventType =
  | 'SYNC_ALL'
  | 'STORAGE_SYNC'
  | 'ITEM_SCANNED'
  | 'ITEM_UPDATED'
  | 'ITEM_DELETED'
  | 'BATCH_CREATED'
  | 'BATCH_UPDATED'
  | 'BATCH_CLOSED'
  | 'GATE_ENTRY_CREATED'
  | 'GATE_ENTRY_UPDATED'
  | 'AUDIT_RECORD_ADDED'
  | 'DEVICE_HEARTBEAT'
  | 'DEVICE_LOGIN'
  | 'DEVICE_LOGOUT'
  | 'DEVICE_SESSION_UPDATED'
  | 'USER_UPDATED'
  | 'MASTERS_UPDATED';

export interface SyncMessage {
  type: SyncEventType;
  payload?: any;
  timestamp: string;
  senderId?: string;
}

type SyncCallback = (msg: SyncMessage) => void;

class RealtimeSyncManager {
  private broadcastChannel: BroadcastChannel | null = null;
  private subscribers: Set<SyncCallback> = new Set();
  private supabaseChannel: any = null;
  private currentDeviceId: string = '';
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;
  private isOnline: boolean = true;

  constructor() {
    this.currentDeviceId = this.getOrCreateDeviceId();
    this.initBroadcastChannel();
    this.initStorageEventListener();
    this.initNetworkListeners();
    this.initSupabaseRealtime();
    this.startHeartbeat();
  }

  public getDeviceId(): string {
    return this.currentDeviceId;
  }

  private getOrCreateDeviceId(): string {
    try {
      if (typeof window === 'undefined') return 'device-server';
      let id = localStorage.getItem('emiza_device_unique_id');
      if (!id) {
        id = `dev-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
        localStorage.setItem('emiza_device_unique_id', id);
      }
      return id;
    } catch {
      return `dev-${Date.now()}`;
    }
  }

  private initBroadcastChannel() {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('emiza_wop_realtime_sync');
        this.broadcastChannel.onmessage = (event: MessageEvent<SyncMessage>) => {
          if (event.data && event.data.senderId !== this.currentDeviceId) {
            this.notifySubscribers(event.data);
          }
        };
      }
    } catch (err) {
      console.warn('[SyncService] BroadcastChannel unavailable, using storage events fallback', err);
    }
  }

  private initStorageEventListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event: StorageEvent) => {
        if (event.key && event.key.startsWith('emiza_')) {
          this.notifySubscribers({
            type: 'STORAGE_SYNC',
            payload: { key: event.key },
            timestamp: new Date().toISOString(),
            senderId: 'storage-event',
          });
        }
      });
    }
  }

  private initNetworkListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.initSupabaseRealtime();
      this.notifySubscribers({
        type: 'SYNC_ALL',
        payload: { reason: 'network_online' },
        timestamp: new Date().toISOString(),
        senderId: this.currentDeviceId,
      });
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isOnline) {
        // Refresh connection & sync state when tab becomes active
        this.initSupabaseRealtime();
        this.notifySubscribers({
          type: 'SYNC_ALL',
          payload: { reason: 'visibility_change' },
          timestamp: new Date().toISOString(),
          senderId: this.currentDeviceId,
        });
      }
    });
  }

  private startHeartbeat() {
    if (typeof window === 'undefined') return;
    this.heartbeatTimer = setInterval(() => {
      if (this.isOnline && isSupabaseConfigured() && this.supabaseChannel) {
        try {
          this.supabaseChannel.send({
            type: 'broadcast',
            event: 'warehouse_heartbeat',
            payload: {
              deviceId: this.currentDeviceId,
              timestamp: new Date().toISOString(),
            },
          });
        } catch {
          // Ignore
        }
      }
    }, 15000);
  }

  public initSupabaseRealtime() {
    if (!isSupabaseConfigured()) return;
    try {
      if (this.supabaseChannel) {
        try {
          supabase.removeChannel(this.supabaseChannel);
        } catch {
          // ignore
        }
      }

      this.supabaseChannel = supabase
        .channel('emiza_warehouse_live_sync', {
          config: {
            broadcast: { self: false },
          },
        })
        // 1. High-speed multi-device broadcast channel
        .on('broadcast', { event: 'warehouse_update' }, ({ payload }) => {
          if (payload && payload.senderId !== this.currentDeviceId) {
            this.notifySubscribers(payload);
          }
        })
        // 2. Direct PostgreSQL Database Changes on scanned_return_items
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'scanned_return_items' },
          (payload: any) => {
            const raw = payload.new || payload.old;
            const normalizedItem = raw ? {
              id: raw.id,
              batchId: raw.batch_id || raw.batchId,
              trackingNumber: raw.tracking_number || raw.trackingNumber,
              orderNumber: raw.order_number || raw.orderNumber,
              skuCode: raw.sku_code || raw.skuCode,
              productName: raw.product_name || raw.productName,
              remark: raw.remark || raw.qc_condition || raw.qcCondition || 'Good',
              photoUrl: raw.photo_url || raw.photoUrl,
              scannedAt: raw.scanned_at || raw.scannedAt || new Date().toISOString(),
              scannedBy: raw.scanned_by || raw.scannedBy,
              scannedByName: raw.scanned_by_name || raw.scannedByName,
            } : null;

            let eventType: SyncEventType = 'ITEM_SCANNED';
            if (payload.eventType === 'DELETE') {
              eventType = 'ITEM_DELETED';
            } else if (payload.eventType === 'UPDATE') {
              eventType = 'ITEM_UPDATED';
            }

            this.notifySubscribers({
              type: eventType,
              payload: {
                item: normalizedItem,
                itemId: raw?.id,
                batchId: raw?.batch_id || raw?.batchId,
              },
              timestamp: new Date().toISOString(),
              senderId: 'supabase-postgres-changes',
            });
          }
        )
        // 3. PostgreSQL Changes on return_batches
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'return_batches' },
          (payload: any) => {
            const raw = payload.new;
            const normalizedBatch = raw ? {
              id: raw.id,
              batchNumber: raw.batch_number || raw.batchNumber,
              batchType: raw.batch_type || raw.batchType || 'RTO/B2C',
              warehouseId: raw.warehouse_id || raw.warehouseId,
              clientId: raw.client_id || raw.clientId,
              courierId: raw.courier_id || raw.courierId,
              status: raw.status || 'Open',
              expectedCount: raw.expected_count ?? raw.expectedCount ?? 0,
              totalScanned: raw.total_scanned ?? raw.totalScanned ?? 0,
              remarksBreakdown: raw.remarks_breakdown || raw.remarksBreakdown,
              createdAt: raw.created_at || raw.createdAt,
              closedAt: raw.closed_at || raw.closedAt,
              createdBy: raw.created_by || raw.createdBy,
            } : null;

            this.notifySubscribers({
              type: payload.eventType === 'INSERT' ? 'BATCH_CREATED' : 'BATCH_UPDATED',
              payload: {
                batch: normalizedBatch,
                batchId: raw?.id,
              },
              timestamp: new Date().toISOString(),
              senderId: 'supabase-postgres-changes',
            });
          }
        )
        // 4. PostgreSQL Changes on inward_gate_entries
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'inward_gate_entries' },
          (payload: any) => {
            const raw = payload.new;
            const normalizedEntry = raw ? {
              id: raw.id,
              gatePassNumber: raw.gate_pass_number || raw.gatePassNumber,
              warehouseId: raw.warehouse_id || raw.warehouseId,
              companyId: raw.company_id || raw.companyId,
              clientId: raw.client_id || raw.clientId,
              courierId: raw.courier_id || raw.courierId,
              vehicleNumber: raw.vehicle_number || raw.vehicleNumber,
              vehicleTypeId: raw.vehicle_type_id || raw.vehicleTypeId,
              driverName: raw.driver_name || raw.driverName,
              driverMobile: raw.driver_mobile || raw.driverMobile,
              invoiceChallanNumber: raw.invoice_challan_number || raw.invoiceChallanNumber,
              invoiceValue: raw.invoice_value ?? raw.invoiceValue,
              expectedBoxCount: raw.expected_box_count ?? raw.expectedBoxCount,
              receivedBoxCount: raw.received_box_count ?? raw.receivedBoxCount,
              dockNumber: raw.dock_number || raw.dockNumber,
              status: raw.status,
              entryTime: raw.entry_time || raw.entryTime,
              createdBy: raw.created_by || raw.createdBy,
            } : null;

            this.notifySubscribers({
              type: payload.eventType === 'INSERT' ? 'GATE_ENTRY_CREATED' : 'GATE_ENTRY_UPDATED',
              payload: {
                entry: normalizedEntry,
                id: raw?.id,
              },
              timestamp: new Date().toISOString(),
              senderId: 'supabase-postgres-changes',
            });
          }
        )
        // 5. Active floor devices and guns
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'active_devices' },
          (payload: any) => {
            this.notifySubscribers({
              type: 'DEVICE_HEARTBEAT',
              payload: payload.new,
              timestamp: new Date().toISOString(),
              senderId: 'supabase-postgres-changes',
            });
          }
        )
        .subscribe((status: string) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn('[SyncService] Supabase Realtime channel error, scheduling reconnect in 3s...');
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = setTimeout(() => {
              this.initSupabaseRealtime();
            }, 3000);
          }
        });
    } catch (e) {
      console.warn('[SyncService] Supabase Realtime subscription error:', e);
    }
  }

  public broadcast(type: SyncEventType, payload?: any) {
    const msg: SyncMessage = {
      type,
      payload,
      timestamp: new Date().toISOString(),
      senderId: this.currentDeviceId,
    };

    // 1. Broadcast to local tabs via BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(msg);
      } catch (err) {
        console.warn('[SyncService] Error posting to BroadcastChannel:', err);
      }
    }

    // 2. Broadcast to other network devices via Supabase Channel
    if (isSupabaseConfigured() && this.supabaseChannel) {
      try {
        this.supabaseChannel.send({
          type: 'broadcast',
          event: 'warehouse_update',
          payload: msg,
        });
      } catch (err) {
        console.warn('[SyncService] Error sending to Supabase channel:', err);
      }
    }

    // 3. Notify local subscribers
    this.notifySubscribers(msg);
  }

  public subscribe(callback: SyncCallback): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(msg: SyncMessage) {
    this.subscribers.forEach(cb => {
      try {
        cb(msg);
      } catch (e) {
        console.error('[SyncService] Error in subscriber callback:', e);
      }
    });
  }
}

export const SyncService = new RealtimeSyncManager();
