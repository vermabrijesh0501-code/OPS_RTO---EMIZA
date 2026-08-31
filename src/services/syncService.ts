import { supabase, isSupabaseConfigured } from './supabase';

export type SyncEventType =
  | 'SYNC_ALL' | 'STORAGE_SYNC' | 'SYNC_ERROR'
  | 'ITEM_SCANNED' | 'ITEM_UPDATED' | 'ITEM_DELETED'
  | 'BATCH_CREATED' | 'BATCH_UPDATED' | 'BATCH_CLOSED'
  | 'GATE_ENTRY_CREATED' | 'GATE_ENTRY_UPDATED'
  | 'AUDIT_RECORD_ADDED' | 'DEVICE_HEARTBEAT' | 'DEVICE_LOGIN'
  | 'DEVICE_LOGOUT' | 'DEVICE_SESSION_UPDATED' | 'USER_UPDATED' | 'MASTERS_UPDATED';

export interface SyncMessage {
  type: SyncEventType;
  payload?: any;
  timestamp: string;
  senderId?: string;
}

type SyncCallback = (msg: SyncMessage) => void;

class RealtimeSyncManager {
  private broadcastChannel: BroadcastChannel | null = null;
  private subscribers = new Set<SyncCallback>();
  private supabaseChannel: any = null;
  private currentDeviceId = '';
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;
  private reconnectDelay = 1000;
  private lastRealtimeStatus = 'DISCONNECTED';

  constructor() {
    this.currentDeviceId = this.getOrCreateDeviceId();
    this.initBroadcastChannel();
    this.initStorageEventListener();
    this.initNetworkListeners();
    this.initSupabaseRealtime();
    this.startHeartbeat();
  }

  public getDeviceId(): string { return this.currentDeviceId; }

  private getOrCreateDeviceId(): string {
    try {
      if (typeof window === 'undefined') return 'device-server';
      let id = localStorage.getItem('emiza_device_unique_id');
      if (!id) {
        id = `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
        localStorage.setItem('emiza_device_unique_id', id);
      }
      return id;
    } catch { return `dev-${Date.now()}`; }
  }

  private initBroadcastChannel() {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('emiza_wop_realtime_sync');
        this.broadcastChannel.onmessage = (event: MessageEvent<SyncMessage>) => {
          if (event.data && event.data.senderId !== this.currentDeviceId) this.notifySubscribers(event.data);
        };
      }
    } catch (error) { console.warn('[SyncService] BroadcastChannel unavailable:', error); }
  }

  private initStorageEventListener() {
    if (typeof window === 'undefined') return;
    window.addEventListener('storage', event => {
      if (event.key?.startsWith('emiza_')) {
        this.notifySubscribers({ type: 'STORAGE_SYNC', payload: { key: event.key }, timestamp: new Date().toISOString(), senderId: 'storage-event' });
      }
    });
  }

  private initNetworkListeners() {
    if (typeof window === 'undefined') return;
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.reconnectDelay = 1000;
      this.initSupabaseRealtime();
      this.notifySubscribers({ type: 'SYNC_ALL', payload: { reason: 'network_online' }, timestamp: new Date().toISOString(), senderId: this.currentDeviceId });
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.lastRealtimeStatus = 'OFFLINE';
      this.notifySubscribers({ type: 'SYNC_ERROR', payload: { operation: 'realtime', message: 'Network connection is offline. Waiting for reconnection.' }, timestamp: new Date().toISOString(), senderId: this.currentDeviceId });
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isOnline) {
        this.initSupabaseRealtime();
        this.notifySubscribers({ type: 'SYNC_ALL', payload: { reason: 'visibility_change' }, timestamp: new Date().toISOString(), senderId: this.currentDeviceId });
      }
    });
  }

  private startHeartbeat() {
    if (typeof window === 'undefined') return;
    this.heartbeatTimer = setInterval(() => {
      if (this.isOnline && isSupabaseConfigured() && this.supabaseChannel) {
        this.supabaseChannel.send({ type: 'broadcast', event: 'warehouse_heartbeat', payload: { deviceId: this.currentDeviceId, timestamp: new Date().toISOString() } }).catch?.(() => undefined);
      }
    }, 15000);
  }

  public initSupabaseRealtime() {
    if (!isSupabaseConfigured() || !this.isOnline) return;
    try {
      if (this.supabaseChannel) {
        supabase.removeChannel(this.supabaseChannel).catch?.(() => undefined);
        this.supabaseChannel = null;
      }
      this.supabaseChannel = supabase.channel('emiza_warehouse_live_sync', { config: { broadcast: { self: false } } })
        .on('broadcast', { event: 'warehouse_update' }, ({ payload }) => {
          if (payload && payload.senderId !== this.currentDeviceId) this.notifySubscribers(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'scanned_return_items' }, payload => {
          const raw: any = payload.new || payload.old;
          if (!raw) return;
          const item = {
            id: raw.id, batchId: raw.batch_id || raw.batchId, trackingNumber: raw.tracking_number || raw.trackingNumber,
            orderNumber: raw.order_number || raw.orderNumber, skuCode: raw.sku_code || raw.skuCode || '', productName: raw.product_name || raw.productName || '',
            remark: raw.remark || raw.qc_condition || 'Good', photoUrl: raw.photo_url || raw.photoUrl,
            scannedAt: raw.scanned_at || raw.scannedAt || new Date().toISOString(), scannedBy: raw.scanned_by || raw.scannedBy || '', scannedByName: raw.scanned_by_name || raw.scannedByName || 'Operator'
          };
          this.notifySubscribers({ type: payload.eventType === 'DELETE' ? 'ITEM_DELETED' : payload.eventType === 'UPDATE' ? 'ITEM_UPDATED' : 'ITEM_SCANNED', payload: { item, itemId: raw.id, batchId: raw.batch_id || raw.batchId }, timestamp: new Date().toISOString(), senderId: 'supabase-postgres-changes' });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'return_batches' }, payload => {
          const raw: any = payload.new || payload.old;
          if (!raw) return;
          const batch = {
            id: raw.id, batchNumber: raw.batch_number || raw.batchNumber, batchType: raw.batch_type || 'RTO/B2C', warehouseId: raw.warehouse_id || raw.warehouseId,
            clientId: raw.client_id || raw.clientId, courierId: raw.courier_id || raw.courierId, status: raw.status || 'Open', dockNumber: raw.dock_number,
            expectedCount: raw.expected_count ?? 0, totalScanned: raw.total_scanned ?? 0, remarksBreakdown: raw.remarks_breakdown || {}, createdAt: raw.created_at,
            closedAt: raw.closed_at, createdBy: raw.created_by, createdByName: raw.created_by_name, driverName: raw.driver_name, driverMobile: raw.driver_mobile,
            driverSignature: raw.driver_signature, supervisorSigner: raw.supervisor_signer, notes: raw.notes
          };
          this.notifySubscribers({ type: payload.eventType === 'INSERT' ? 'BATCH_CREATED' : payload.eventType === 'DELETE' ? 'BATCH_UPDATED' : 'BATCH_UPDATED', payload: { batch, batchId: raw.id }, timestamp: new Date().toISOString(), senderId: 'supabase-postgres-changes' });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'inward_gate_entries' }, payload => {
          const raw: any = payload.new || payload.old;
          if (!raw) return;
          const entry = {
            id: raw.id, gatePassNumber: raw.gate_pass_number || raw.gatePassNumber, warehouseId: raw.warehouse_id || raw.warehouseId, companyId: raw.company_id || raw.companyId,
            clientId: raw.client_id || raw.clientId, courierId: raw.courier_id || raw.courierId, vehicleNumber: raw.vehicle_number || raw.vehicleNumber,
            vehicleTypeId: raw.vehicle_type_id || raw.vehicleTypeId, driverName: raw.driver_name || raw.driverName, driverMobile: raw.driver_mobile || raw.driverMobile,
            invoiceChallanNumber: raw.invoice_challan_number || raw.invoiceChallanNumber, invoiceValue: raw.invoice_value ?? 0, expectedBoxCount: raw.expected_box_count ?? 0,
            receivedBoxCount: raw.received_box_count ?? 0, dockNumber: raw.dock_number, status: raw.status || 'Arrived', entryTime: raw.entry_time, createdBy: raw.created_by
          };
          this.notifySubscribers({ type: payload.eventType === 'INSERT' ? 'GATE_ENTRY_CREATED' : 'GATE_ENTRY_UPDATED', payload: { entry, id: raw.id }, timestamp: new Date().toISOString(), senderId: 'supabase-postgres-changes' });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'active_devices' }, payload => {
          this.notifySubscribers({ type: 'DEVICE_HEARTBEAT', payload: payload.new || payload.old, timestamp: new Date().toISOString(), senderId: 'supabase-postgres-changes' });
        })
        .subscribe((status: string) => {
          this.lastRealtimeStatus = status;
          if (status === 'SUBSCRIBED') {
            this.reconnectDelay = 1000;
            console.info('[SyncService] Supabase Realtime connected');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            this.notifySubscribers({ type: 'SYNC_ERROR', payload: { operation: 'realtime', message: `Realtime channel ${status.toLowerCase()}. Reconnecting automatically.` }, timestamp: new Date().toISOString(), senderId: this.currentDeviceId });
            this.scheduleReconnect();
          } else if (status === 'CLOSED') {
            this.scheduleReconnect();
          }
        });
    } catch (error: any) {
      console.error('[SyncService] Realtime initialization failed:', error);
      this.notifySubscribers({ type: 'SYNC_ERROR', payload: { operation: 'realtime', message: error?.message || 'Realtime initialization failed' }, timestamp: new Date().toISOString(), senderId: this.currentDeviceId });
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (!this.isOnline || !isSupabaseConfigured() || this.reconnectTimer) return;
    const delay = this.reconnectDelay;
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.initSupabaseRealtime();
    }, delay);
  }

  public broadcast(type: SyncEventType, payload?: any) {
    const msg: SyncMessage = { type, payload, timestamp: new Date().toISOString(), senderId: this.currentDeviceId };
    try { this.broadcastChannel?.postMessage(msg); } catch (error) { console.warn('[SyncService] BroadcastChannel error:', error); }
    if (isSupabaseConfigured() && this.supabaseChannel) {
      this.supabaseChannel.send({ type: 'broadcast', event: 'warehouse_update', payload: msg }).catch?.((error: any) => console.warn('[SyncService] Supabase broadcast error:', error));
    }
    this.notifySubscribers(msg);
  }

  public getStatus(): string { return this.lastRealtimeStatus; }
  public subscribe(callback: SyncCallback): () => void { this.subscribers.add(callback); return () => this.subscribers.delete(callback); }
  private notifySubscribers(msg: SyncMessage) { this.subscribers.forEach(cb => { try { cb(msg); } catch (error) { console.error('[SyncService] Subscriber error:', error); } }); }
}

export const SyncService = new RealtimeSyncManager();
