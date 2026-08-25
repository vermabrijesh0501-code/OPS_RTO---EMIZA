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
} from './types';

export const initialCompanies: Company[] = [
  {
    id: 'comp-1',
    name: 'EMIZA Supply Chain Services Pvt Ltd',
    code: 'EMIZA-HQ',
    gstin: '27AAAAA0000A1Z5',
    address: 'Bhiwandi Logistics Hub, Building 4, Thane, Maharashtra 421302',
    status: 'Active',
  },
];

export const initialWarehouses: Warehouse[] = [
  {
    id: 'wh-main',
    companyId: 'comp-1',
    code: 'WH-BHW-01',
    name: 'Bhiwandi WH',
    city: 'Bhiwandi / Mumbai Hub',
    address: 'Bldg A3, Indospace Park, National Highway 3, Bhiwandi, MH 421302',
    totalDocks: 16,
    contactPerson: 'Brijesh Verma',
    phone: '+91 98201 12345',
    status: 'Active',
  },
];

export const initialClients: Client[] = [
  {
    id: 'cli-bellavita',
    companyId: 'comp-1',
    code: 'CLI-BV',
    name: 'Bella Vita Organic & Luxury',
    email: 'ops@bellavitaorganic.com',
    phone: '+91 93117 32425',
    category: 'Fragrance & Cosmetics',
    status: 'Active',
  },
  {
    id: 'cli-nykaa',
    companyId: 'comp-1',
    code: 'CLI-NYK',
    name: 'Nykaa E-Retail Limited',
    email: 'logistics@nykaa.com',
    phone: '+91 22 6614 1000',
    category: 'Beauty & Fashion',
    status: 'Active',
  },
  {
    id: 'cli-mama',
    companyId: 'comp-1',
    code: 'CLI-MME',
    name: 'Honasa Consumer (Mamaearth)',
    email: 'warehouse.ops@mamaearth.in',
    phone: '+91 124 400 2300',
    category: 'Personal Care',
    status: 'Active',
  },
  {
    id: 'cli-boat',
    companyId: 'comp-1',
    code: 'CLI-BOAT',
    name: 'Imagine Marketing (boAt)',
    email: 'supplychain@boat-lifestyle.com',
    phone: '+91 22 4970 0000',
    category: 'Consumer Electronics',
    status: 'Active',
  },
  {
    id: 'cli-sugar',
    companyId: 'comp-1',
    code: 'CLI-SUG',
    name: 'Vellvette Lifestyle (SUGAR)',
    email: 'ops@sugarcosmetics.com',
    phone: '+91 22 2800 1122',
    category: 'Cosmetics',
    status: 'Active',
  },
];

export const initialCouriers: Courier[] = [
  {
    id: 'cour-delhivery',
    code: 'DELHIVERY',
    name: 'Delhivery Surface & Express',
    trackingFormatPattern: '14 DIGITS / DELH...',
    contactNumber: '1800-103-6354',
    apiSupported: true,
    status: 'Active',
  },
  {
    id: 'cour-bluedart',
    code: 'BLUEDART',
    name: 'Blue Dart Express Ltd',
    trackingFormatPattern: '11 DIGITS (e.g. 78201923841)',
    contactNumber: '1860-233-1234',
    apiSupported: true,
    status: 'Active',
  },
  {
    id: 'cour-xpressbees',
    code: 'XPRESSBEES',
    name: 'XpressBees Logistics',
    trackingFormatPattern: 'XB+12 DIGITS',
    contactNumber: '020-4911-6100',
    apiSupported: true,
    status: 'Active',
  },
  {
    id: 'cour-shadowfax',
    code: 'SHADOWFAX',
    name: 'Shadowfax Technologies',
    trackingFormatPattern: 'SFX+10 DIGITS',
    contactNumber: '080-6818-8000',
    apiSupported: true,
    status: 'Active',
  },
  {
    id: 'cour-ecom',
    code: 'ECOM_EXP',
    name: 'Ecom Express Ltd',
    trackingFormatPattern: 'ECOM+9 DIGITS',
    contactNumber: '0120-6868200',
    apiSupported: true,
    status: 'Active',
  },
];

export const initialSKUs: SKU[] = [
  {
    id: 'sku-bv-1',
    clientId: 'cli-bellavita',
    skuCode: 'BV-WHITE-OUD-100',
    eanBarcode: '8906105610014',
    name: 'Bella Vita Luxury White Oud Perfume 100ml',
    category: 'Perfume',
    unitPrice: 899,
    weightGrams: 350,
    status: 'Active',
  },
  {
    id: 'sku-bv-2',
    clientId: 'cli-bellavita',
    skuCode: 'BV-SKAI-AQUATIC-100',
    eanBarcode: '8906105610021',
    name: 'Bella Vita Skai Aquatic Eau De Cologne 100ml',
    category: 'Perfume',
    unitPrice: 799,
    weightGrams: 350,
    status: 'Active',
  },
  {
    id: 'sku-bv-3',
    clientId: 'cli-bellavita',
    skuCode: 'BV-CEO-MAN-100',
    eanBarcode: '8906105610038',
    name: 'Bella Vita CEO Man Luxury Perfume 100ml',
    category: 'Perfume',
    unitPrice: 899,
    weightGrams: 350,
    status: 'Active',
  },
  {
    id: 'sku-bv-4',
    clientId: 'cli-bellavita',
    skuCode: 'BV-EYELIFT-20G',
    eanBarcode: '8906105610052',
    name: 'Bella Vita Organic EyeLift Under Eye Cream Gel 20g',
    category: 'Skin Care',
    unitPrice: 349,
    weightGrams: 45,
    status: 'Active',
  },
  {
    id: 'sku-1',
    clientId: 'cli-nykaa',
    skuCode: 'NYK-LIP-RED-01',
    eanBarcode: '8901020304011',
    name: 'Matte Liquid Lipstick - Ruby Red 5ml',
    category: 'Makeup',
    unitPrice: 499,
    weightGrams: 45,
    status: 'Active',
  },
  {
    id: 'sku-2',
    clientId: 'cli-mama',
    skuCode: 'MME-ONION-SHAM-250',
    eanBarcode: '8904030506022',
    name: 'Onion Hair Fall Control Shampoo 250ml',
    category: 'Hair Care',
    unitPrice: 349,
    weightGrams: 290,
    status: 'Active',
  },
  {
    id: 'sku-3',
    clientId: 'cli-boat',
    skuCode: 'BOAT-Airdopes-141-BLK',
    eanBarcode: '8906040708033',
    name: 'Airdopes 141 TWS Earbuds - Bold Black',
    category: 'Audio',
    unitPrice: 1299,
    weightGrams: 150,
    status: 'Active',
  },
  {
    id: 'sku-4',
    clientId: 'cli-sugar',
    skuCode: 'SUG-FOUND-WARM-02',
    eanBarcode: '8908050901044',
    name: 'Ace Of Face Foundation Stick - Warm Sand',
    category: 'Cosmetics',
    unitPrice: 999,
    weightGrams: 80,
    status: 'Active',
  },
];

export const initialDrivers: Driver[] = [
  {
    id: 'drv-1',
    name: 'Suresh Kumar Yadav',
    mobile: '+91 98765 43210',
    licenseNumber: 'MH04 20180012345',
    transporterName: 'Om Logistics Transporters',
    status: 'Active',
  },
  {
    id: 'drv-2',
    name: 'Sunil Sharma',
    mobile: '+91 97654 32109',
    licenseNumber: 'DL01 20200054321',
    transporterName: 'Bella Vita Direct Fleet',
    status: 'Active',
  },
];

export const initialVehicleTypes: VehicleType[] = [
  { id: 'vt-1', typeName: '32ft Multi-Axle Container', capacityTons: 15, status: 'Active' },
  { id: 'vt-2', typeName: '24ft Container', capacityTons: 9, status: 'Active' },
  { id: 'vt-3', typeName: '14ft Eicher Truck', capacityTons: 4, status: 'Active' },
  { id: 'vt-4', typeName: 'Tata Ace / Bolero Pickup', capacityTons: 1.5, status: 'Active' },
];

export const initialReturnReasons: ReturnReason[] = [
  { id: 'rr-1', code: 'GOOD', label: 'Good', category: 'Both', requirePhoto: false, status: 'Active' },
  { id: 'rr-2', code: 'DAMAGE', label: 'Damage', category: 'Both', requirePhoto: true, status: 'Active' },
  { id: 'rr-3', code: 'OPEN_BOX', label: 'Open Box', category: 'RTO', requirePhoto: true, status: 'Active' },
  { id: 'rr-4', code: 'WRONG_PROD', label: 'Wrong Product', category: 'Both', requirePhoto: true, status: 'Active' },
  { id: 'rr-5', code: 'SHORT_QTY', label: 'Short Qty', category: 'Both', requirePhoto: false, status: 'Active' },
  { id: 'rr-6', code: 'MISSING_PROD', label: 'Missing Product', category: 'Both', requirePhoto: true, status: 'Active' },
  { id: 'rr-7', code: 'OTHERS', label: 'Others', category: 'Both', requirePhoto: false, status: 'Active' },
];

export const initialUsers: User[] = [
  {
    id: 'usr-super',
    name: 'Brijesh',
    email: 'verma.brijesh0501@gmail.com',
    password: 'password123',
    role: 'Super Admin',
    assignedWarehouseIds: ['wh-main'],
    assignedClientIds: ['cli-bellavita', 'cli-nykaa', 'cli-mama', 'cli-boat', 'cli-sugar'],
    status: 'Active',
    lastLoginAt: '2026-08-22T08:30:00Z',
  },
  {
    id: 'usr-wh-mgr',
    name: 'Vikram Mehta',
    email: 'vikram.m@emiza.com',
    password: 'password123',
    role: 'Warehouse Manager',
    assignedWarehouseIds: ['wh-main'],
    assignedClientIds: ['cli-bellavita', 'cli-nykaa', 'cli-boat'],
    status: 'Active',
    lastLoginAt: '2026-08-22T07:15:00Z',
  },
  {
    id: 'usr-sup',
    name: 'Pooja Deshmukh',
    email: 'pooja.d@emiza.com',
    password: 'password123',
    role: 'Supervisor',
    assignedWarehouseIds: ['wh-main'],
    assignedClientIds: ['cli-bellavita', 'cli-nykaa', 'cli-mama', 'cli-boat', 'cli-sugar'],
    status: 'Active',
    lastLoginAt: '2026-08-22T08:00:00Z',
  },
  {
    id: 'usr-op1',
    name: 'Amit Patel',
    email: 'amit.p@emiza.com',
    password: 'password123',
    role: 'Operator',
    assignedWarehouseIds: ['wh-main'],
    assignedClientIds: ['cli-bellavita', 'cli-nykaa'],
    status: 'Active',
    lastLoginAt: '2026-08-22T08:12:00Z',
  },
];

// Auditor Devices - dynamic list populated in real-time as scanner guns connect and scan on floor
export const initialAuditorDevices: AuditorDevice[] = [];

// Inward Gate entries - starts clean for real-time live gate entries
export const initialInwardGateEntries: InwardGateEntry[] = [];

// Return batches - starts clean for real-time live return batch scanning
export const initialReturnBatches: ReturnBatch[] = [];

// Scanned items - starts clean for real-time live item scanning
export const initialScannedItems: ScannedReturnItem[] = [];

// Initial Audit (Cycle Count) records across auditor guns - starts clean
export const initialAuditRecords: AuditRecord[] = [];

// Initial Activity Logs - starts clean
export const initialActivityLogs: ActivityLog[] = [];

export const initialSupabaseConfig: SupabaseConfig = {
  supabaseUrl: 'https://xyzcompany.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  autoSyncEnabled: false,
  connectedStatus: 'Disconnected',
};

