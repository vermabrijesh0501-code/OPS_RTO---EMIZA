import {
  User,
  Company,
  Warehouse,
  Client,
  Courier,
  SKU,
  Driver,
  VehicleType,
  ReturnReason,
  InwardGateEntry,
  ReturnBatch,
  ScannedReturnItem,
  ActivityLog,
  AuditorDevice,
  AuditRecord,
  SupabaseConfig,
  ActiveDeviceSession,
  AuthSessionData,
} from '../types';

import {
  initialCompanies,
  initialWarehouses,
  initialClients,
  initialCouriers,
  initialSKUs,
  initialDrivers,
  initialVehicleTypes,
  initialReturnReasons,
  initialUsers,
  initialInwardGateEntries,
  initialReturnBatches,
  initialScannedItems,
  initialActivityLogs,
  initialAuditorDevices,
  initialAuditRecords,
  initialSupabaseConfig,
  initialActiveDevices,
} from '../mockData';
import { SyncService } from './syncService';

const STORAGE_KEYS = {
  COMPANIES: 'emiza_companies_v3',
  WAREHOUSES: 'emiza_warehouses_v3',
  CLIENTS: 'emiza_clients_v3',
  COURIERS: 'emiza_couriers_v3',
  SKUS: 'emiza_skus_v3',
  DRIVERS: 'emiza_drivers_v3',
  VEHICLE_TYPES: 'emiza_vehicle_types_v3',
  RETURN_REASONS: 'emiza_return_reasons_v3',
  USERS: 'emiza_users_v3',
  CURRENT_USER: 'emiza_current_user_v3',
  CURRENT_WH: 'emiza_current_wh_v3',
  GATE_ENTRIES: 'emiza_gate_entries_v3',
  RETURN_BATCHES: 'emiza_return_batches_v3',
  SCANNED_ITEMS: 'emiza_scanned_items_v3',
  AUDITOR_DEVICES: 'emiza_auditor_devices_v3',
  AUDIT_RECORDS: 'emiza_audit_records_v3',
  ACTIVE_AUDITOR_ID: 'emiza_active_auditor_id_v3',
  LOGS: 'emiza_logs_v3',
  SUPABASE_CONFIG: 'emiza_supabase_config_v3',
  AUTH_SESSION: 'emiza_auth_session_v3',
  ACTIVE_DEVICES: 'emiza_active_devices_v3',
};

// Auto-purge any stale mock/test scan keys
(() => {
  try {
    const staleKeys = [
      'emiza_gate_entries', 'emiza_gate_entries_v1', 'emiza_gate_entries_v2',
      'emiza_return_batches', 'emiza_return_batches_v1', 'emiza_return_batches_v2',
      'emiza_scanned_items', 'emiza_scanned_items_v1', 'emiza_scanned_items_v2',
      'emiza_audit_records', 'emiza_audit_records_v1', 'emiza_audit_records_v2',
      'emiza_auditor_devices', 'emiza_auditor_devices_v1', 'emiza_auditor_devices_v2',
      'emiza_logs', 'emiza_logs_v1', 'emiza_logs_v2',
    ];
    staleKeys.forEach(k => {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(k);
      }
    });
  } catch {
    // Ignore in non-browser context
  }
})();

function loadItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Failed loading ${key} from storage`, e);
    return fallback;
  }
}

function saveItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed saving ${key} to storage`, e);
  }
}

export const StorageService = {
  getCompanies: (): Company[] => loadItem(STORAGE_KEYS.COMPANIES, initialCompanies),
  saveCompanies: (data: Company[]) => {
    saveItem(STORAGE_KEYS.COMPANIES, data);
    SyncService.broadcast('MASTERS_UPDATED', { category: 'companies', allRecords: data, count: data.length });
  },

  getWarehouses: (): Warehouse[] => loadItem(STORAGE_KEYS.WAREHOUSES, initialWarehouses),
  saveWarehouses: (data: Warehouse[]) => {
    saveItem(STORAGE_KEYS.WAREHOUSES, data);
    SyncService.broadcast('MASTERS_UPDATED', { category: 'warehouses', allRecords: data, count: data.length });
  },

  getClients: (): Client[] => loadItem(STORAGE_KEYS.CLIENTS, initialClients),
  saveClients: (data: Client[]) => {
    saveItem(STORAGE_KEYS.CLIENTS, data);
    SyncService.broadcast('MASTERS_UPDATED', { category: 'clients', allRecords: data, count: data.length });
  },

  getCouriers: (): Courier[] => loadItem(STORAGE_KEYS.COURIERS, initialCouriers),
  saveCouriers: (data: Courier[]) => {
    saveItem(STORAGE_KEYS.COURIERS, data);
    SyncService.broadcast('MASTERS_UPDATED', { category: 'couriers', allRecords: data, count: data.length });
  },

  getSKUs: (): SKU[] => loadItem(STORAGE_KEYS.SKUS, initialSKUs),
  saveSKUs: (data: SKU[]) => {
    saveItem(STORAGE_KEYS.SKUS, data);
    SyncService.broadcast('MASTERS_UPDATED', { category: 'skus', allRecords: data, count: data.length });
  },

  getDrivers: (): Driver[] => loadItem(STORAGE_KEYS.DRIVERS, initialDrivers),
  saveDrivers: (data: Driver[]) => {
    saveItem(STORAGE_KEYS.DRIVERS, data);
    SyncService.broadcast('MASTERS_UPDATED', { category: 'drivers', allRecords: data, count: data.length });
  },

  getVehicleTypes: (): VehicleType[] => loadItem(STORAGE_KEYS.VEHICLE_TYPES, initialVehicleTypes),
  saveVehicleTypes: (data: VehicleType[]) => {
    saveItem(STORAGE_KEYS.VEHICLE_TYPES, data);
    SyncService.broadcast('MASTERS_UPDATED', { category: 'vehicle_types', allRecords: data, count: data.length });
  },

  getReturnReasons: (): ReturnReason[] => loadItem(STORAGE_KEYS.RETURN_REASONS, initialReturnReasons),
  saveReturnReasons: (data: ReturnReason[]) => {
    saveItem(STORAGE_KEYS.RETURN_REASONS, data);
    SyncService.broadcast('MASTERS_UPDATED', { category: 'return_reasons', allRecords: data, count: data.length });
  },

  getUsers: (): User[] => {
    const raw = (() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.USERS);
        if (stored !== null) {
          // Key exists: the list was intentionally customized/synced — never
          // resurrect seed users here (that caused deleted users to reappear
          // and diverge across devices).
          return JSON.parse(stored);
        }
      } catch {
        // fall through to seeding
      }
      return null;
    })();
    if (Array.isArray(raw)) {
      return raw.map(({ password: _, ...rest }) => rest as User);
    }
    // First run only: seed standard users
    const seeded = initialUsers.map(({ password: _, ...rest }) => rest as User);
    saveItem(STORAGE_KEYS.USERS, seeded);
    return seeded;
  },
  saveUsers: (data: User[]) => {
    // Strictly strip password from all records to guarantee zero password exposure in storage
    const sanitized = data.map(({ password: _, ...rest }) => rest as User);
    saveItem(STORAGE_KEYS.USERS, sanitized);
    SyncService.broadcast('MASTERS_UPDATED', { category: 'users', allRecords: sanitized, count: sanitized.length });
  },
  updateUser: (id: string, updates: Partial<User>) => {
    const users = StorageService.getUsers();
    const { password: _, ...safeUpdates } = updates as any;
    const updated = users.map(u => (u.id === id || u.email.toLowerCase() === id.toLowerCase() ? { ...u, ...safeUpdates } : u));
    StorageService.saveUsers(updated);
  },

  getCurrentUser: (): User | null => {
    const session = loadItem<AuthSessionData>(STORAGE_KEYS.AUTH_SESSION, { isLoggedIn: false });
    if (!session.isLoggedIn) return null;
    const rawUser = loadItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (!rawUser) return null;
    const { password: _, ...cleanUser } = rawUser;
    return cleanUser as User;
  },
  saveCurrentUser: (user: User | null) => {
    if (user) {
      const { password: _, ...cleanUser } = user;
      saveItem(STORAGE_KEYS.CURRENT_USER, cleanUser);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  getCurrentWarehouseId: (): string => loadItem(STORAGE_KEYS.CURRENT_WH, 'wh-main'),
  saveCurrentWarehouseId: (id: string) => saveItem(STORAGE_KEYS.CURRENT_WH, id),

  getGateEntries: (): InwardGateEntry[] => loadItem(STORAGE_KEYS.GATE_ENTRIES, initialInwardGateEntries),
  saveGateEntries: (data: InwardGateEntry[]) => {
    saveItem(STORAGE_KEYS.GATE_ENTRIES, data);
    SyncService.broadcast('GATE_ENTRY_UPDATED', { allGateEntries: data, count: data.length });
  },

  getReturnBatches: (): ReturnBatch[] => loadItem(STORAGE_KEYS.RETURN_BATCHES, initialReturnBatches),
  saveReturnBatches: (data: ReturnBatch[]) => {
    saveItem(STORAGE_KEYS.RETURN_BATCHES, data);
    SyncService.broadcast('BATCH_UPDATED', { allBatches: data, count: data.length });
  },

  getScannedItems: (): ScannedReturnItem[] => loadItem(STORAGE_KEYS.SCANNED_ITEMS, initialScannedItems),
  saveScannedItems: (data: ScannedReturnItem[]) => {
    saveItem(STORAGE_KEYS.SCANNED_ITEMS, data);
    SyncService.broadcast('ITEM_UPDATED', { allScannedItems: data, count: data.length });
  },

  getActiveDevices: (): ActiveDeviceSession[] => loadItem(STORAGE_KEYS.ACTIVE_DEVICES, initialActiveDevices),
  saveActiveDevices: (data: ActiveDeviceSession[]) => {
    saveItem(STORAGE_KEYS.ACTIVE_DEVICES, data);
    SyncService.broadcast('DEVICE_HEARTBEAT', { count: data.length });
  },

  registerDeviceSession: (session: ActiveDeviceSession): ActiveDeviceSession[] => {
    const devices = StorageService.getActiveDevices();
    const existingIndex = devices.findIndex(d => d.id === session.id || (d.userId === session.userId && d.deviceType === session.deviceType));
    let updated: ActiveDeviceSession[];
    if (existingIndex >= 0) {
      updated = [...devices];
      updated[existingIndex] = {
        ...updated[existingIndex],
        ...session,
        status: 'Online',
        lastActiveAt: new Date().toISOString(),
      };
    } else {
      updated = [session, ...devices];
    }
    StorageService.saveActiveDevices(updated);
    SyncService.broadcast('DEVICE_LOGIN', session);
    return updated;
  },

  updateDeviceHeartbeat: (sessionId: string): void => {
    const devices = StorageService.getActiveDevices();
    const index = devices.findIndex(d => d.id === sessionId);
    if (index >= 0) {
      devices[index].lastActiveAt = new Date().toISOString();
      devices[index].status = 'Online';
      StorageService.saveActiveDevices(devices);
    }
  },

  removeDeviceSession: (sessionId: string): void => {
    const devices = StorageService.getActiveDevices();
    const updated = devices.map(d => (d.id === sessionId ? { ...d, status: 'Offline' as const, lastActiveAt: new Date().toISOString() } : d));
    StorageService.saveActiveDevices(updated);
    SyncService.broadcast('DEVICE_LOGOUT', { sessionId });
  },

  cleanupStaleDevices: (maxIdleMinutes: number = 30): ActiveDeviceSession[] => {
    const devices = StorageService.getActiveDevices();
    const now = Date.now();
    const thresholdMs = maxIdleMinutes * 60 * 1000;
    const updated = devices.map(d => {
      const lastActive = new Date(d.lastActiveAt).getTime();
      if (d.status === 'Online' && now - lastActive > thresholdMs) {
        return { ...d, status: 'Idle' as const };
      }
      return d;
    });
    StorageService.saveActiveDevices(updated);
    return updated;
  },

  getAuditorDevices: (): AuditorDevice[] => loadItem(STORAGE_KEYS.AUDITOR_DEVICES, initialAuditorDevices),
  saveAuditorDevices: (data: AuditorDevice[]) => saveItem(STORAGE_KEYS.AUDITOR_DEVICES, data),

  getActiveAuditorId: (): string => loadItem(STORAGE_KEYS.ACTIVE_AUDITOR_ID, 'AUD-01'),
  saveActiveAuditorId: (id: string) => saveItem(STORAGE_KEYS.ACTIVE_AUDITOR_ID, id),

  getAuditRecords: (): AuditRecord[] => loadItem(STORAGE_KEYS.AUDIT_RECORDS, initialAuditRecords),
  saveAuditRecords: (data: AuditRecord[]) => {
    saveItem(STORAGE_KEYS.AUDIT_RECORDS, data);
    SyncService.broadcast('AUDIT_RECORD_ADDED', { allAuditRecords: data });
  },
  addAuditRecord: (record: Omit<AuditRecord, 'id' | 'scannedAt'>): AuditRecord => {
    const current = StorageService.getAuditRecords();
    const newRecord: AuditRecord = {
      ...record,
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      scannedAt: new Date().toISOString(),
    };
    const updated = [newRecord, ...current];
    saveItem(STORAGE_KEYS.AUDIT_RECORDS, updated);
    SyncService.broadcast('AUDIT_RECORD_ADDED', { record: newRecord, allAuditRecords: updated });
    return newRecord;
  },

  getActivityLogs: (): ActivityLog[] => loadItem(STORAGE_KEYS.LOGS, initialActivityLogs),
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const logs = StorageService.getActivityLogs();
    const newLog: ActivityLog = {
      ...log,
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    const updated = [newLog, ...logs].slice(0, 150);
    saveItem(STORAGE_KEYS.LOGS, updated);
    SyncService.broadcast('ACTIVITY_LOG_ADDED', { log: newLog, allLogs: updated });
    return newLog;
  },

  // Apply full authoritative remote server store to local cache
  applyRemoteStore: (remoteStore: any) => {
    if (!remoteStore || typeof remoteStore !== 'object') return;
    try {
      if (Array.isArray(remoteStore.gateEntries)) saveItem(STORAGE_KEYS.GATE_ENTRIES, remoteStore.gateEntries);
      if (Array.isArray(remoteStore.batches)) saveItem(STORAGE_KEYS.RETURN_BATCHES, remoteStore.batches);
      if (Array.isArray(remoteStore.scannedItems)) saveItem(STORAGE_KEYS.SCANNED_ITEMS, remoteStore.scannedItems);
      if (Array.isArray(remoteStore.companies)) saveItem(STORAGE_KEYS.COMPANIES, remoteStore.companies);
      if (Array.isArray(remoteStore.warehouses)) saveItem(STORAGE_KEYS.WAREHOUSES, remoteStore.warehouses);
      if (Array.isArray(remoteStore.clients)) saveItem(STORAGE_KEYS.CLIENTS, remoteStore.clients);
      if (Array.isArray(remoteStore.couriers)) saveItem(STORAGE_KEYS.COURIERS, remoteStore.couriers);
      if (Array.isArray(remoteStore.skus)) saveItem(STORAGE_KEYS.SKUS, remoteStore.skus);
      if (Array.isArray(remoteStore.drivers)) saveItem(STORAGE_KEYS.DRIVERS, remoteStore.drivers);
      if (Array.isArray(remoteStore.vehicleTypes)) saveItem(STORAGE_KEYS.VEHICLE_TYPES, remoteStore.vehicleTypes);
      if (Array.isArray(remoteStore.returnReasons)) saveItem(STORAGE_KEYS.RETURN_REASONS, remoteStore.returnReasons);
      if (Array.isArray(remoteStore.users)) saveItem(STORAGE_KEYS.USERS, remoteStore.users);
      if (Array.isArray(remoteStore.activityLogs)) saveItem(STORAGE_KEYS.LOGS, remoteStore.activityLogs);
      if (Array.isArray(remoteStore.auditRecords)) saveItem(STORAGE_KEYS.AUDIT_RECORDS, remoteStore.auditRecords);
      if (Array.isArray(remoteStore.auditorDevices)) saveItem(STORAGE_KEYS.AUDITOR_DEVICES, remoteStore.auditorDevices);
    } catch (e) {
      console.warn('[StorageService] Error applying remote store:', e);
    }
  },

  // Silently persist a masters list received via realtime sync (no re-broadcast).
  // Keeps each device's offline/localStorage fallback identical to the central data.
  applyMasterUpdate: (category: string, records: any[]) => {
    if (!category || !Array.isArray(records)) return;
    const keyMap: Record<string, string> = {
      companies: STORAGE_KEYS.COMPANIES,
      warehouses: STORAGE_KEYS.WAREHOUSES,
      clients: STORAGE_KEYS.CLIENTS,
      couriers: STORAGE_KEYS.COURIERS,
      skus: STORAGE_KEYS.SKUS,
      drivers: STORAGE_KEYS.DRIVERS,
      vehicle_types: STORAGE_KEYS.VEHICLE_TYPES,
      return_reasons: STORAGE_KEYS.RETURN_REASONS,
      users: STORAGE_KEYS.USERS,
    };
    const key = keyMap[category];
    if (!key) return;
    try {
      const sanitized = category === 'users'
        ? records.map(({ password: _, ...rest }) => rest)
        : records;
      saveItem(key, sanitized as any);
    } catch (e) {
      console.warn('[StorageService] Error applying master update:', e);
    }
  },

  getSupabaseConfig: (): SupabaseConfig => {
    const cfg = loadItem<SupabaseConfig>(STORAGE_KEYS.SUPABASE_CONFIG, initialSupabaseConfig);
    if (cfg?.supabaseUrl?.includes('xyzcompany') || cfg?.supabaseUrl?.includes('placeholder') || cfg?.supabaseAnonKey?.includes('...')) {
      return {
        supabaseUrl: '',
        supabaseAnonKey: '',
        autoSyncEnabled: false,
        connectedStatus: 'Disconnected',
      };
    }
    return cfg;
  },
  saveSupabaseConfig: (config: SupabaseConfig) => saveItem(STORAGE_KEYS.SUPABASE_CONFIG, config),

  // Authentication Session (Secure, device/date/expiry enforced)
  getAuthSession: (): AuthSessionData =>
    loadItem<AuthSessionData>(STORAGE_KEYS.AUTH_SESSION, { isLoggedIn: false }),
  saveAuthSession: (session: Partial<AuthSessionData> & { isLoggedIn: boolean; userId?: string }) => {
    const now = Date.now();
    const today = new Date().toISOString().slice(0, 10);
    const sessionObj: AuthSessionData = {
      isLoggedIn: session.isLoggedIn,
      userId: session.userId,
      userEmail: session.userEmail,
      userName: session.userName,
      userRole: session.userRole,
      loginDate: session.loginDate || today,
      loginTimestamp: session.loginTimestamp || now,
      expiresAt: session.expiresAt || (now + 12 * 60 * 60 * 1000), // 12-hour active shift session
      sessionToken: session.sessionToken || `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      deviceId: session.deviceId || SyncService.getDeviceId(),
    };
    saveItem(STORAGE_KEYS.AUTH_SESSION, sessionObj);
  },
  clearAuthSession: () => {
    saveItem(STORAGE_KEYS.AUTH_SESSION, { isLoggedIn: false });
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  resetToDefault: () => {
    localStorage.clear();
    window.location.reload();
  },
};


export function generateSupabaseDDL(): string {
  return `-- WOP-Emiza Phase 1 PostgreSQL Database Schema (for Supabase SQL Editor)
-- Run this in your Supabase project's SQL Editor to create all 13+ tables & indexes.

-- OPTIONAL: Drop existing tables if re-initializing or fixing column type conflicts (e.g. TEXT vs UUID)
DROP TABLE IF EXISTS scanned_return_items CASCADE;
DROP TABLE IF EXISTS return_batches CASCADE;
DROP TABLE IF EXISTS inward_gate_entries CASCADE;
DROP TABLE IF EXISTS return_reasons CASCADE;
DROP TABLE IF EXISTS vehicle_types CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS skus CASCADE;
DROP TABLE IF EXISTS couriers CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;

-- 1. Companies
CREATE TABLE companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    gstin TEXT,
    address TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Warehouses
CREATE TABLE warehouses (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT,
    total_docks INT DEFAULT 10,
    contact_person TEXT,
    phone TEXT,
    status TEXT DEFAULT 'Active'
);

-- 3. Clients
CREATE TABLE clients (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    category TEXT,
    status TEXT DEFAULT 'Active'
);

-- 4. Couriers
CREATE TABLE couriers (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    tracking_format_pattern TEXT,
    contact_number TEXT,
    api_supported BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'Active'
);

-- 5. SKUs
CREATE TABLE skus (
    id TEXT PRIMARY KEY,
    client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
    sku_code TEXT NOT NULL,
    ean_barcode TEXT,
    name TEXT NOT NULL,
    category TEXT,
    unit_price NUMERIC(10,2),
    weight_grams INT,
    status TEXT DEFAULT 'Active'
);

-- 6. Users
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    assigned_warehouse_ids TEXT[],
    assigned_client_ids TEXT[],
    status TEXT DEFAULT 'Active',
    last_login_at TIMESTAMPTZ
);

-- 7. Drivers
CREATE TABLE drivers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    license_number TEXT,
    transporter_name TEXT,
    status TEXT DEFAULT 'Active'
);

-- 8. Vehicle Types
CREATE TABLE vehicle_types (
    id TEXT PRIMARY KEY,
    type_name TEXT NOT NULL,
    capacity_tons NUMERIC(5,2),
    status TEXT DEFAULT 'Active'
);

-- 9. Return Reasons
CREATE TABLE return_reasons (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    category TEXT DEFAULT 'Both',
    require_photo BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'Active'
);

-- 10. Inward Gate Entries
CREATE TABLE inward_gate_entries (
    id TEXT PRIMARY KEY,
    gate_pass_number TEXT UNIQUE NOT NULL,
    warehouse_id TEXT REFERENCES warehouses(id) ON DELETE CASCADE,
    company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
    client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
    courier_id TEXT REFERENCES couriers(id) ON DELETE SET NULL,
    vehicle_number TEXT NOT NULL,
    vehicle_type_id TEXT,
    driver_name TEXT NOT NULL,
    driver_mobile TEXT NOT NULL,
    driver_license TEXT,
    invoice_challan_number TEXT,
    invoice_value NUMERIC(12,2),
    expected_box_count INT DEFAULT 0,
    received_box_count INT DEFAULT 0,
    dock_number TEXT,
    status TEXT DEFAULT 'Arrived',
    entry_time TIMESTAMPTZ DEFAULT NOW(),
    dock_allocated_time TIMESTAMPTZ,
    unloading_end_time TIMESTAMPTZ,
    remarks TEXT,
    created_by TEXT
);

-- 11. Return Batches
CREATE TABLE return_batches (
    id TEXT PRIMARY KEY,
    batch_number TEXT UNIQUE NOT NULL,
    batch_type TEXT NOT NULL,
    warehouse_id TEXT REFERENCES warehouses(id) ON DELETE CASCADE,
    client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
    courier_id TEXT REFERENCES couriers(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'Open',
    expected_count INT DEFAULT 0,
    total_scanned INT DEFAULT 0,
    remarks_breakdown JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    created_by TEXT,
    created_by_name TEXT,
    driver_name TEXT,
    driver_mobile TEXT,
    driver_signature TEXT,
    supervisor_signer TEXT,
    notes TEXT
);

-- 12. Scanned Return Items
CREATE TABLE scanned_return_items (
    id TEXT PRIMARY KEY,
    batch_id TEXT REFERENCES return_batches(id) ON DELETE CASCADE,
    tracking_number TEXT NOT NULL,
    order_number TEXT,
    sku_code TEXT,
    product_name TEXT,
    remark TEXT NOT NULL,
    photo_url TEXT,
    scanned_at TIMESTAMPTZ DEFAULT NOW(),
    scanned_by TEXT,
    scanned_by_name TEXT
);

-- 13. Activity Logs
CREATE TABLE activity_logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_id TEXT,
    user_name TEXT,
    user_role TEXT,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    details TEXT
);

-- 14. Active Devices & Live Sessions
CREATE TABLE active_devices (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    user_email TEXT NOT NULL,
    warehouse_id TEXT REFERENCES warehouses(id) ON DELETE CASCADE,
    warehouse_name TEXT,
    client_id TEXT,
    device_type TEXT DEFAULT 'Desktop',
    browser_info TEXT,
    ip_address TEXT,
    login_time TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'Online'
);

-- Indexes for lightning fast barcode & tracking lookups
CREATE INDEX IF NOT EXISTS idx_scanned_items_tracking ON scanned_return_items(tracking_number);
CREATE INDEX IF NOT EXISTS idx_scanned_items_batch ON scanned_return_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_gate_entries_wh ON inward_gate_entries(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_batches_wh ON return_batches(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_active_devices_wh ON active_devices(warehouse_id);

-- Enable Row Level Security (RLS) on all operational tables
ALTER TABLE scanned_return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE inward_gate_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_devices ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies for Authenticated Operations Staff
CREATE POLICY "Allow authenticated read/write on return batches" ON return_batches FOR ALL USING (true);
CREATE POLICY "Allow authenticated read/write on scanned items" ON scanned_return_items FOR ALL USING (true);
CREATE POLICY "Allow authenticated read/write on gate entries" ON inward_gate_entries FOR ALL USING (true);
CREATE POLICY "Allow authenticated read/write on active devices" ON active_devices FOR ALL USING (true);
CREATE POLICY "Allow authenticated read/write on users" ON users FOR ALL USING (true);
`;
}
