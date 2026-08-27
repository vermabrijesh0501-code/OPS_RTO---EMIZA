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

  constructor() {
    this.currentDeviceId = this.getOrCreateDeviceId();
    this.initBroadcastChannel();
    this.initStorageEventListener();
    this.initSupabaseRealtime();
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
            type: 'SYNC_ALL',
            payload: { key: event.key },
            timestamp: new Date().toISOString(),
            senderId: 'storage-event',
          });
        }
      });
    }
  }

  public initSupabaseRealtime() {
    if (!isSupabaseConfigured()) return;
    try {
      if (this.supabaseChannel) {
        supabase.removeChannel(this.supabaseChannel);
      }

      this.supabaseChannel = supabase
        .channel('emiza_warehouse_live_sync')
        .on('broadcast', { event: 'warehouse_update' }, ({ payload }) => {
          if (payload && payload.senderId !== this.currentDeviceId) {
            this.notifySubscribers(payload);
          }
        })
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'scanned_return_items' },
          (payload: any) => {
            this.notifySubscribers({
              type: payload.eventType === 'DELETE' ? 'ITEM_DELETED' : 'ITEM_SCANNED',
              payload: payload.new || payload.old,
              timestamp: new Date().toISOString(),
              senderId: 'supabase-realtime',
            });
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'return_batches' },
          (payload: any) => {
            this.notifySubscribers({
              type: 'BATCH_UPDATED',
              payload: payload.new,
              timestamp: new Date().toISOString(),
              senderId: 'supabase-realtime',
            });
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'active_devices' },
          (payload: any) => {
            this.notifySubscribers({
              type: 'DEVICE_HEARTBEAT',
              payload: payload.new,
              timestamp: new Date().toISOString(),
              senderId: 'supabase-realtime',
            });
          }
        )
        .subscribe();
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
