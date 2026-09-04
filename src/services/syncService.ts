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
  | 'GATE_ENTRY_DELETED'
  | 'AUDIT_RECORD_ADDED'
  | 'AUDIT_RECORD_DELETED'
  | 'DEVICE_HEARTBEAT'
  | 'DEVICE_LOGIN'
  | 'DEVICE_LOGOUT'
  | 'DEVICE_SESSION_UPDATED'
  | 'DEVICES_UPDATED'
  | 'USER_UPDATED'
  | 'MASTERS_UPDATED'
  | 'ACTIVITY_LOG_ADDED';

export interface SyncMessage {
  type: SyncEventType;
  payload?: any;
  timestamp: string;
  senderId?: string;
}

export interface ConnectedDeviceInfo {
  id: string;
  userId?: string;
  userName: string;
  userRole: string;
  userEmail?: string;
  warehouseId?: string;
  warehouseName?: string;
  deviceType: 'Desktop' | 'Mobile / Scanner' | 'Tablet';
  deviceName: string;
  browserInfo?: string;
  ipAddress?: string;
  loginTime: string;
  lastActiveAt: string;
  status: 'Online' | 'Idle' | 'Offline';
}

export interface SyncStatus {
  status: 'connected' | 'connecting' | 'offline';
  connectedDevicesCount: number;
  connectedDevices: ConnectedDeviceInfo[];
  lastSyncedAt: string;
  latencyMs: number;
  currentDeviceId: string;
  deviceType: 'Desktop' | 'Mobile / Scanner' | 'Tablet';
  deviceName: string;
}

type SyncCallback = (msg: SyncMessage) => void;
type StatusCallback = (status: SyncStatus) => void;

class RealtimeSyncManager {
  private ws: WebSocket | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private subscribers: Set<SyncCallback> = new Set();
  private statusListeners: Set<StatusCallback> = new Set();
  private supabaseChannel: any = null;

  private currentDeviceId: string = '';
  private deviceName: string = '';
  private deviceType: 'Desktop' | 'Mobile / Scanner' | 'Tablet' = 'Desktop';
  private userName: string = 'Operator';
  private userRole: string = 'Super Admin';
  private warehouseId: string = 'wh-main';

  private wsReconnectTimer: any = null;
  private pingTimer: any = null;
  private pingSentTime: number = 0;
  private latencyMs: number = 0;

  private connectionStatus: 'connected' | 'connecting' | 'offline' = 'connecting';
  private connectedDevices: ConnectedDeviceInfo[] = [];
  private lastSyncedAt: string = new Date().toISOString();
  private isOnline: boolean = true;

  constructor() {
    this.currentDeviceId = this.getOrCreateDeviceId();
    this.detectDeviceMetadata();
    this.initBroadcastChannel();
    this.initStorageEventListener();
    this.initNetworkListeners();
    this.connectWebSocket();
    this.initSupabaseRealtime();
    this.startPingLoop();
  }

  public getDeviceId(): string {
    return this.currentDeviceId;
  }

  private detectDeviceMetadata() {
    if (typeof window === 'undefined') return;
    const ua = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || window.innerWidth < 1024;
    const isTablet = /(iPad|Tablet|(Android(?!.*Mobile)))/i.test(ua) || (window.innerWidth >= 768 && window.innerWidth <= 1024);

    if (isTablet) {
      this.deviceType = 'Tablet';
      this.deviceName = 'Tablet App';
    } else if (isMobile) {
      this.deviceType = 'Mobile / Scanner';
      this.deviceName = /iPhone/i.test(ua) ? 'iPhone (Mobile App)' : /Android/i.test(ua) ? 'Android (Mobile App)' : 'Phone App';
    } else {
      this.deviceType = 'Desktop';
      this.deviceName = /Mac/i.test(ua) ? 'Mac (System App)' : /Windows/i.test(ua) ? 'PC (System App)' : 'System App (Desktop)';
    }
  }

  public updateUserInfo(userName: string, userRole: string, warehouseId: string = 'wh-main') {
    this.userName = userName;
    this.userRole = userRole;
    this.warehouseId = warehouseId;
    this.sendDeviceRegistration();
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

  // --- WebSocket Setup ---
  private connectWebSocket() {
    if (typeof window === 'undefined') return;

    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      this.connectionStatus = 'connecting';
      this.emitStatusChange();

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.connectionStatus = 'connected';
        this.lastSyncedAt = new Date().toISOString();
        this.sendDeviceRegistration();
        this.emitStatusChange();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'PONG') {
            if (this.pingSentTime > 0) {
              this.latencyMs = Math.max(1, Date.now() - this.pingSentTime);
              this.emitStatusChange();
            }
            return;
          }

          if (data.type === 'DEVICES_UPDATED') {
            if (Array.isArray(data.payload)) {
              this.connectedDevices = data.payload;
              this.emitStatusChange();
            }
            return;
          }

          if (data.type === 'INIT_STATE') {
            if (data.payload?.activeDevices) {
              this.connectedDevices = data.payload.activeDevices;
            }
            this.lastSyncedAt = new Date().toISOString();
            this.emitStatusChange();

            // Notify subscribers with INIT/SYNC_ALL state
            this.notifySubscribers({
              type: 'SYNC_ALL',
              payload: data.payload?.store || data.payload,
              timestamp: new Date().toISOString(),
              senderId: 'server-init',
            });
            return;
          }

          // Inbound mutation event from server
          if (data.senderId !== this.currentDeviceId) {
            this.lastSyncedAt = new Date().toISOString();
            this.emitStatusChange();
            this.notifySubscribers(data);
          }
        } catch (err) {
          console.warn('[SyncService] Failed parsing WS message:', err);
        }
      };

      this.ws.onclose = () => {
        this.connectionStatus = 'offline';
        this.emitStatusChange();
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.connectionStatus = 'offline';
        this.emitStatusChange();
      };
    } catch (err) {
      console.warn('[SyncService] WS connection failed, will retry:', err);
      this.connectionStatus = 'offline';
      this.emitStatusChange();
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    clearTimeout(this.wsReconnectTimer);
    this.wsReconnectTimer = setTimeout(() => {
      if (this.isOnline) {
        this.connectWebSocket();
      }
    }, 2500);
  }

  private sendDeviceRegistration() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    try {
      this.ws.send(
        JSON.stringify({
          type: 'REGISTER_DEVICE',
          payload: {
            deviceId: this.currentDeviceId,
            deviceName: this.deviceName,
            deviceType: this.deviceType,
            userName: this.userName,
            userRole: this.userRole,
            warehouseId: this.warehouseId,
          },
          senderId: this.currentDeviceId,
          timestamp: new Date().toISOString(),
        })
      );
    } catch {
      // ignore
    }
  }

  private startPingLoop() {
    if (typeof window === 'undefined') return;
    this.pingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.pingSentTime = Date.now();
        try {
          this.ws.send(JSON.stringify({ type: 'PING' }));
        } catch {
          // ignore
        }
      }
    }, 12000);
  }

  // --- Local BroadcastChannel & Fallbacks ---
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
      console.warn('[SyncService] BroadcastChannel unavailable', err);
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
      this.connectWebSocket();
      this.initSupabaseRealtime();
      this.forceSyncNow();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.connectionStatus = 'offline';
      this.emitStatusChange();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isOnline) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
          this.connectWebSocket();
        }
        this.forceSyncNow();
      }
    });
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
          config: { broadcast: { self: false } },
        })
        .on('broadcast', { event: 'warehouse_update' }, ({ payload }) => {
          if (payload && payload.senderId !== this.currentDeviceId) {
            this.notifySubscribers(payload);
          }
        })
        .subscribe();
    } catch (e) {
      console.warn('[SyncService] Supabase Realtime subscription error:', e);
    }
  }

  // --- Broadcasting Mutations ---
  public broadcast(type: SyncEventType, payload?: any) {
    const msg: SyncMessage = {
      type,
      payload,
      timestamp: new Date().toISOString(),
      senderId: this.currentDeviceId,
    };

    this.lastSyncedAt = msg.timestamp;
    this.emitStatusChange();

    // 1. Broadcast over WebSocket (Real-Time Sub-20ms to all other devices)
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(msg));
      } catch (err) {
        console.warn('[SyncService] Error sending via WebSocket:', err);
      }
    }

    // 2. Broadcast via REST POST (as persistent guaranteed fallback)
    try {
      fetch('/api/sync/mutate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg),
      }).catch(() => {
        // Safe failover if offline
      });
    } catch {
      // ignore
    }

    // 3. Broadcast to local tabs via BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(msg);
      } catch (err) {
        console.warn('[SyncService] Error posting to BroadcastChannel:', err);
      }
    }

    // 4. Broadcast to Supabase if configured
    if (isSupabaseConfigured() && this.supabaseChannel) {
      try {
        this.supabaseChannel.send({
          type: 'broadcast',
          event: 'warehouse_update',
          payload: msg,
        });
      } catch {
        // ignore
      }
    }

    // 5. Notify local subscribers
    this.notifySubscribers(msg);
  }

  // --- Force Manual Sync ---
  public async forceSyncNow(): Promise<boolean> {
    try {
      this.connectionStatus = 'connecting';
      this.emitStatusChange();

      const res = await fetch('/api/sync/state');
      if (!res.ok) throw new Error('Failed to fetch server state');
      const json = await res.json();

      if (json.data) {
        this.lastSyncedAt = new Date().toISOString();
        this.connectionStatus = this.ws && this.ws.readyState === WebSocket.OPEN ? 'connected' : 'connected';
        if (Array.isArray(json.activeDevices)) {
          this.connectedDevices = json.activeDevices;
        }
        this.emitStatusChange();

        this.notifySubscribers({
          type: 'SYNC_ALL',
          payload: json.data,
          timestamp: this.lastSyncedAt,
          senderId: 'force-sync',
        });
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[SyncService] Force sync failed:', err);
      this.connectionStatus = 'offline';
      this.emitStatusChange();
      return false;
    }
  }

  // --- Status & Subscription Management ---
  public getSyncStatus(): SyncStatus {
    const activeCount = this.connectedDevices.length > 0 ? this.connectedDevices.length : 1;
    return {
      status: this.connectionStatus,
      connectedDevicesCount: activeCount,
      connectedDevices: this.connectedDevices,
      lastSyncedAt: this.lastSyncedAt,
      latencyMs: this.latencyMs,
      currentDeviceId: this.currentDeviceId,
      deviceType: this.deviceType,
      deviceName: this.deviceName,
    };
  }

  public onSyncStatusChange(callback: StatusCallback): () => void {
    this.statusListeners.add(callback);
    callback(this.getSyncStatus());
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  private emitStatusChange() {
    const status = this.getSyncStatus();
    this.statusListeners.forEach((cb) => {
      try {
        cb(status);
      } catch (err) {
        console.error('[SyncService] Error in status listener callback:', err);
      }
    });
  }

  public subscribe(callback: SyncCallback): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(msg: SyncMessage) {
    this.subscribers.forEach((cb) => {
      try {
        cb(msg);
      } catch (e) {
        console.error('[SyncService] Error in subscriber callback:', e);
      }
    });
  }
}

export const SyncService = new RealtimeSyncManager();
