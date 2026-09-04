export type UserRole = 
  | 'Super Admin'
  | 'Admin'
  | 'Warehouse Manager'
  | 'Supervisor'
  | 'Security'
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
  | 'grn'
  | 'returns_rto'
  | 'returns_b2b'
  | 'inventory'
  | 'audit'
  | 'clients'
  | 'couriers'
  | 'locations'
  | 'reports'
  | 'notifications'
  | 'masters'
  | 'user_management'
  | 'supabase_hub'
  | 'settings';

export type OperationProcessType = 'Inward' | 'GRN' | 'RTO Return' | 'B2B Return' | 'Inventory Audit';
export type OperationPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type OperationStatus = 
  | 'Arrived'
  | 'Gate In'
  | 'Dock Allocated'
  | 'Under Inspection'
  | 'GRN Pending'
  | 'Unloading'
  | 'Scanned'
  | 'Verified'
  | 'Open'
  | 'In Progress'
  | 'Completed'
  | 'On Hold';

export interface OperationRecord {
  id: string;
  referenceNo: string;
  process: OperationProcessType;
  clientId: string;
  clientName: string;
  warehouseId: string;
  warehouseName: string;
  status: OperationStatus;
  priority: OperationPriority;
  createdAt: string;
  assignedToName: string;
  assignedToRole?: string;
  itemsCount?: number;
  vehicleNumber?: string;
  dockNumber?: string;
  notes?: string;
  rawType: 'gate_entry' | 'batch' | 'audit' | 'grn';
  rawId: string;
}

export interface DashboardFilterState {
  dateRange: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'all';
  companyId: string;
  warehouseId: string;
  clientId: string;
  status: string;
  priority: string;
  searchQuery: string;
}

export interface User {
  id: string;
  empId?: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: UserRole;
  department?: Department | string;
  companyId?: string;
  avatarUrl?: string;
  assignedWarehouseIds: string[];
  assignedClientIds: string[];
  permissions?: Partial<Record<ModuleId, ModulePermission>>;
  status: 'Active' | 'Inactive';
  mustChangePassword?: boolean;
  tempPasswordSetAt?: string;
  authProvider?: 'supabase' | 'local';
  lastLoginAt?: string;
  createdAt?: string;
}

export interface AuthSessionData {
  isLoggedIn: boolean;
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: UserRole;
  loginDate?: string; // YYYY-MM-DD
  loginTimestamp?: number;
  expiresAt?: number;
  sessionToken?: string;
  deviceId?: string;
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

export interface InwardInvoiceItem {
  id: string;
  invoiceNumber: string;
  boxCount: number;
  qcCondition: 'Good' | 'Damage' | 'Open Boxes' | 'Missing Boxes' | 'Other';
  otherRemark?: string;
}

export interface InwardDocket {
  id: string;
  docketNumber: string;
  invoices: InwardInvoiceItem[];
  notes?: string;
}

export interface Phase1SecurityData {
  gateEntryDateTime: string; // DD/MM/YYYY : HH:mm (24-hour auto)
  vehicleNumber: string;
  vehicleTypeId: string;
  vehicleTypeName?: string;
  courierId?: string;
  courierName?: string;
  courierPartner?: string; // Free-text Courier Partner
  transporterName?: string; // Free-text Transporter
  driverName: string;
  driverMobile: string;
  driverLicense: string;
  clientId: string; // Account Name from Account Master
  clientName?: string;
  invoiceCount: number;
  boxCount?: number; // Manual box count
  alignedDock: string;
  remarks?: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
}

export interface Phase2UnloadingData {
  dockConfirmed: string;
  confirmedInvoiceCount: number;
  dockets: InwardDocket[];
  unloadingInchargeId: string;
  unloadingInchargeName: string;
  unloadedAt: string;
  totalDocketsCount: number;
  totalInvoicesCount: number;
  totalBoxesCount: number;
  goodCount: number;
  damageCount: number;
  openBoxesCount: number;
  missingBoxesCount: number;
  otherCount: number;
  notes?: string;
}

export interface Phase3HandoverData {
  accountInchargeId: string;
  accountInchargeName: string;
  totalInvoicesCalculated: number; // auto-calculated from Phase 02
  totalBoxesCalculated: number; // auto-calculated from Phase 02
  receivedBoxesConfirmed: number;
  differenceCount: number; // receivedBoxesConfirmed - totalBoxesCalculated
  shortageComment?: string; // mandatory if differenceCount !== 0
  conditionConfirmed: boolean;
  signatureDataUrl?: string; // digital signature
  signerName: string;
  completedAt: string;
  remarks?: string;
}

export type InwardWorkflowPhase = 
  | 'Phase 01 - Vehicle Received'
  | 'Phase 02 - Unloading & Dock QC'
  | 'Phase 03 - Handover Completed';

export interface InwardGateEntry {
  id: string;
  gatePassNumber: string; // Unique Gate Entry ID
  warehouseId: string;
  companyId: string;
  clientId: string;
  courierId?: string;
  courierPartner?: string;
  transporterName?: string;
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
  status: 'Arrived' | 'Gate In' | 'At Gate' | 'Dock Allocated' | 'In Progress' | 'Unloading' | 'Dock QC' | 'QC Completed' | 'Handover Pending' | 'Handover Completed' | 'Completed' | 'Verified';
  currentPhase?: InwardWorkflowPhase | string;
  entryTime: string;
  dockAllocatedTime?: string;
  unloadingEndTime?: string;
  handoverCompletedTime?: string;
  remarks?: string;
  createdBy: string;
  createdByName?: string;
  
  // Linked 3-Phase structured data
  phase1?: Phase1SecurityData;
  phase2?: Phase2UnloadingData;
  phase3?: Phase3HandoverData;
  entryType?: 'Inward' | 'B2B Return';
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
  // Denormalized snapshots taken at creation time so batches always display
  // correctly even if master lists differ/diverge on another device.
  clientName?: string;
  courierName?: string;
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

export interface ActiveDeviceSession {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  userEmail: string;
  warehouseId: string;
  warehouseName: string;
  clientId?: string;
  deviceType: 'Desktop' | 'Mobile / Scanner' | 'Tablet';
  browserInfo: string;
  ipAddress?: string;
  loginTime: string;
  lastActiveAt: string;
  status: 'Online' | 'Idle' | 'Offline';
}

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  autoSyncEnabled: boolean;
  connectedStatus: 'Connected' | 'Disconnected' | 'Pending';
}

