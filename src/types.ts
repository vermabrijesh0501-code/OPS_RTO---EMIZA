export type UserRole = 
  | 'Super Admin'
  | 'Admin'
  | 'Warehouse Manager'
  | 'Supervisor'
  | 'Security Officer'
  | 'RTO Operator'
  | 'GRN Operator'
  | 'Auditor'
  | 'Operator'
  | 'Read Only';

export type Department =
  | 'Central Admin'
  | 'Operations Management'
  | 'Gate Security'
  | 'RTO & Returns'
  | 'GRN & Inward'
  | 'Inventory & Audit'
  | 'Quality & Inspection'
  | 'IT & Systems';

export interface ModulePermission {
  view: boolean;
  create?: boolean;
  edit?: boolean;
  delete?: boolean;
  scan?: boolean;
  export?: boolean;
  approve?: boolean;
  closeBatch?: boolean;
}

export type ModuleId =
  | 'dashboard'
  | 'inward'
  | 'returns_rto'
  | 'returns_b2b'
  | 'audit'
  | 'masters'
  | 'reports'
  | 'supabase_hub';

export interface User {
  id: string;
  empId?: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role: UserRole;
  department?: Department | string;
  companyId?: string;
  avatarUrl?: string;
  assignedWarehouseIds: string[];
  assignedClientIds: string[];
  permissions?: Partial<Record<ModuleId, ModulePermission>>;
  status: 'Active' | 'Inactive';
  lastLoginAt?: string;
  createdAt?: string;
}

export interface Company {
  id: string;
  name: string;
  code: string;
  gstin: string;
  address: string;
  status: 'Active' | 'Inactive' | 'On Hold';
}

export interface Warehouse {
  id: string;
  companyId: string;
  code: string;
  name: string;
  city: string;
  address: string;
  totalDocks: number;
  contactPerson: string;
  phone: string;
  status: 'Active' | 'Inactive' | 'On Hold';
}

export interface Client {
  id: string;
  companyId: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  status: 'Active' | 'Inactive' | 'On Hold';
}

export interface Courier {
  id: string;
  code: string;
  name: string;
  trackingFormatPattern: string;
  contactNumber: string;
  apiSupported: boolean;
  status: 'Active' | 'Inactive' | 'On Hold';
}

export interface SKU {
  id: string;
  clientId: string;
  skuCode: string;
  eanBarcode: string;
  name: string;
  category: string;
  unitPrice: number;
  weightGrams: number;
  status: 'Active' | 'Inactive' | 'On Hold';
}

export interface Driver {
  id: string;
  name: string;
  mobile: string;
  licenseNumber: string;
  transporterName: string;
  status: 'Active' | 'Inactive' | 'On Hold';
}

export interface VehicleType {
  id: string;
  typeName: string; // e.g. '32ft Multi-Axle', '14ft Eicher', 'Tempo', 'E-Rickshaw'
  capacityTons: number;
  status: 'Active' | 'Inactive' | 'On Hold';
}

export interface ReturnReason {
  id: string;
  code: string;
  label: string; // e.g. Good, Damage, Open Box, Wrong Product, Short Qty, Missing Product, Others
  category: 'RTO' | 'B2B' | 'Both';
  requirePhoto: boolean;
  status: 'Active' | 'Inactive' | 'On Hold';
}

export interface InwardGateEntry {
  id: string;
  gatePassNumber: string;
  warehouseId: string;
  companyId: string;
  clientId: string;
  courierId: string;
  vehicleNumber: string;
  vehicleTypeId: string;
  driverName: string;
  driverMobile: string;
  driverLicense: string;
  invoiceChallanNumber: string;
  invoiceValue: number;
  expectedBoxCount: number;
  receivedBoxCount: number;
  dockNumber?: string;
  status: 'Arrived' | 'Gate In' | 'Dock Allocated' | 'Unloading' | 'Verified' | 'Completed';
  entryTime: string;
  dockAllocatedTime?: string;
  unloadingEndTime?: string;
  remarks?: string;
  createdBy: string;
}

export type ReturnRemarkType = 
  | 'Good' 
  | 'Damage' 
  | 'Open Box' 
  | 'Wrong Product' 
  | 'Short Qty' 
  | 'Missing Product' 
  | 'Others';

export interface ScannedReturnItem {
  id: string;
  batchId: string;
  trackingNumber: string;
  orderNumber?: string;
  skuCode?: string;
  productName?: string;
  remark: ReturnRemarkType;
  photoUrl?: string;
  scannedAt: string;
  scannedBy: string;
  scannedByName: string;
}

export interface ReturnBatch {
  id: string;
  batchNumber: string;
  batchType: 'RTO/B2C' | 'B2B Return';
  warehouseId: string;
  clientId: string;
  courierId: string;
  status: 'Open' | 'Closed';
  dockNumber?: string;
  expectedCount?: number;
  totalScanned: number;
  remarksBreakdown: Record<ReturnRemarkType, number>;
  createdAt: string;
  closedAt?: string;
  createdBy: string;
  createdByName: string;
  driverName?: string;
  driverMobile?: string;
  driverSignature?: string; // base64 or status
  supervisorSigner?: string;
  notes?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  module: 'Inward' | 'RTO' | 'B2B' | 'Masters' | 'Auth' | 'System' | 'Audit';
  details: string;
}

export type AuditScanMode = 'WITH_BATCH' | 'WITHOUT_BATCH';

export interface AuditorDevice {
  id: string; // e.g. 'AUD-01'
  name: string; // e.g. 'Auditor Gun 01 (Bay A)'
  assignedPerson: string;
  zone: string;
  status: 'Active' | 'Idle' | 'Offline';
  batteryPercent?: number;
  lastActiveAt?: string;
}

export interface AuditRecord {
  id: string;
  auditorDeviceId: string; // e.g. 'AUD-01'
  auditorName: string;
  clientId: string;
  clientName: string;
  mode: AuditScanMode;
  skuCode: string;
  eanBarcode: string;
  productName: string;
  location: string;
  quantity: number;
  // Batch details (for WITH_BATCH mode)
  batchNumber?: string;
  mfgDate?: string;
  expDate?: string;
  // QC and timestamp
  qcStatus?: 'Good' | 'Damage' | 'Expired' | 'QC Check Required';
  scannedAt: string;
  notes?: string;
}

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  autoSyncEnabled: boolean;
  connectedStatus: 'Connected' | 'Disconnected' | 'Pending';
}

