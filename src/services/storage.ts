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
} from '../mockData';

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
  saveCompanies: (data: Company[]) => saveItem(STORAGE_KEYS.COMPANIES, data),

  getWarehouses: (): Warehouse[] => loadItem(STORAGE_KEYS.WAREHOUSES, initialWarehouses),
  saveWarehouses: (data: Warehouse[]) => saveItem(STORAGE_KEYS.WAREHOUSES, data),

  getClients: (): Client[] => loadItem(STORAGE_KEYS.CLIENTS, initialClients),
  saveClients: (data: Client[]) => saveItem(STORAGE_KEYS.CLIENTS, data),

  getCouriers: (): Courier[] => loadItem(STORAGE_KEYS.COURIERS, initialCouriers),
  saveCouriers: (data: Courier[]) => saveItem(STORAGE_KEYS.COURIERS, data),

  getSKUs: (): SKU[] => loadItem(STORAGE_KEYS.SKUS, initialSKUs),
  saveSKUs: (data: SKU[]) => saveItem(STORAGE_KEYS.SKUS, data),

  getDrivers: (): Driver[] => loadItem(STORAGE_KEYS.DRIVERS, initialDrivers),
  saveDrivers: (data: Driver[]) => saveItem(STORAGE_KEYS.DRIVERS, data),

  getVehicleTypes: (): VehicleType[] => loadItem(STORAGE_KEYS.VEHICLE_TYPES, initialVehicleTypes),
  saveVehicleTypes: (data: VehicleType[]) => saveItem(STORAGE_KEYS.VEHICLE_TYPES, data),

  getReturnReasons: (): ReturnReason[] => loadItem(STORAGE_KEYS.RETURN_REASONS, initialReturnReasons),
  saveReturnReasons: (data: ReturnReason[]) => saveItem(STORAGE_KEYS.RETURN_REASONS, data),

  getUsers: (): User[] => {
    const loaded = loadItem<User[]>(STORAGE_KEYS.USERS, initialUsers);
    // Ensure all standard initial users are present
    const existingEmails = new Set(loaded.map(u => u.email.toLowerCase()));
    let hasAdditions = false;
    const merged = [...loaded];
    for (const initU of initialUsers) {
      if (!existingEmails.has(initU.email.toLowerCase())) {
        merged.push(initU);
        hasAdditions = true;
      }
    }
    if (hasAdditions) {
      saveItem(STORAGE_KEYS.USERS, merged);
    }
    return merged;
  },
  saveUsers: (data: User[]) => saveItem(STORAGE_KEYS.USERS, data),

  getCurrentUser: (): User => loadItem(STORAGE_KEYS.CURRENT_USER, initialUsers[0]),
  saveCurrentUser: (user: User) => saveItem(STORAGE_KEYS.CURRENT_USER, user),

  getCurrentWarehouseId: (): string => loadItem(STORAGE_KEYS.CURRENT_WH, 'wh-main'),
  saveCurrentWarehouseId: (id: string) => saveItem(STORAGE_KEYS.CURRENT_WH, id),

  getGateEntries: (): InwardGateEntry[] => loadItem(STORAGE_KEYS.GATE_ENTRIES, initialInwardGateEntries),
  saveGateEntries: (data: InwardGateEntry[]) => saveItem(STORAGE_KEYS.GATE_ENTRIES, data),

  getReturnBatches: (): ReturnBatch[] => loadItem(STORAGE_KEYS.RETURN_BATCHES, initialReturnBatches),
  saveReturnBatches: (data: ReturnBatch[]) => saveItem(STORAGE_KEYS.RETURN_BATCHES, data),

  getScannedItems: (): ScannedReturnItem[] => loadItem(STORAGE_KEYS.SCANNED_ITEMS, initialScannedItems),
  saveScannedItems: (data: ScannedReturnItem[]) => saveItem(STORAGE_KEYS.SCANNED_ITEMS, data),

  getAuditorDevices: (): AuditorDevice[] => loadItem(STORAGE_KEYS.AUDITOR_DEVICES, initialAuditorDevices),
  saveAuditorDevices: (data: AuditorDevice[]) => saveItem(STORAGE_KEYS.AUDITOR_DEVICES, data),

  getActiveAuditorId: (): string => loadItem(STORAGE_KEYS.ACTIVE_AUDITOR_ID, 'AUD-01'),
  saveActiveAuditorId: (id: string) => saveItem(STORAGE_KEYS.ACTIVE_AUDITOR_ID, id),

  getAuditRecords: (): AuditRecord[] => loadItem(STORAGE_KEYS.AUDIT_RECORDS, initialAuditRecords),
  saveAuditRecords: (data: AuditRecord[]) => saveItem(STORAGE_KEYS.AUDIT_RECORDS, data),
  addAuditRecord: (record: Omit<AuditRecord, 'id' | 'scannedAt'>): AuditRecord => {
    const current = StorageService.getAuditRecords();
    const newRecord: AuditRecord = {
      ...record,
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      scannedAt: new Date().toISOString(),
    };
    const updated = [newRecord, ...current];
    StorageService.saveAuditRecords(updated);
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
    const updated = [newLog, ...logs].slice(0, 100);
    saveItem(STORAGE_KEYS.LOGS, updated);
    return newLog;
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

  // Authentication Session
  getAuthSession: (): { isLoggedIn: boolean; userId?: string } =>
    loadItem(STORAGE_KEYS.AUTH_SESSION, { isLoggedIn: true, userId: 'usr-super' }),
  saveAuthSession: (session: { isLoggedIn: boolean; userId?: string }) =>
    saveItem(STORAGE_KEYS.AUTH_SESSION, session),
  clearAuthSession: () =>
    saveItem(STORAGE_KEYS.AUTH_SESSION, { isLoggedIn: false }),

  // User Credential & Password Management
  updateUserPassword: (email: string, newPassword: string): boolean => {
    const users = StorageService.getUsers();
    const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (userIndex === -1) return false;
    users[userIndex].password = newPassword;
    StorageService.saveUsers(users);
    return true;
  },

  registerTeamUser: (userData: Omit<User, 'id'> & { id?: string }): User => {
    const users = StorageService.getUsers();
    const newUser: User = {
      ...userData,
      id: userData.id || `usr-${Date.now()}`,
      status: 'Active',
      lastLoginAt: new Date().toISOString(),
    };
    const updated = [...users, newUser];
    StorageService.saveUsers(updated);
    return newUser;
  },

  resetToDefault: () => {
    localStorage.clear();
    window.location.reload();
  },
};


export function generateSupabaseDDL(): string {
  return `-- EMIZA-WOP Phase 1 PostgreSQL Database Schema (for Supabase SQL Editor)
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

-- Indexes for lightning fast barcode & tracking lookups
CREATE INDEX IF NOT EXISTS idx_scanned_items_tracking ON scanned_return_items(tracking_number);
CREATE INDEX IF NOT EXISTS idx_scanned_items_batch ON scanned_return_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_gate_entries_wh ON inward_gate_entries(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_batches_wh ON return_batches(warehouse_id);
`;
}
