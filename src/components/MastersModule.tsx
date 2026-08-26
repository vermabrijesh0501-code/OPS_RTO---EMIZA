import React, { useState } from 'react';
import {
  Layers,
  Building2,
  Warehouse as WHIcon,
  Users,
  Truck,
  Package,
  Shield,
  Phone,
  Mail,
  Sliders,
  Bell,
  Globe,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  PlayCircle,
  Edit2,
  Trash2,
  X,
  Lock,
  CheckSquare,
  Square,
  Sparkles,
  Key,
  ShieldCheck,
  UserCheck,
  FileSpreadsheet,
} from 'lucide-react';
import {
  Company,
  Warehouse,
  Client,
  Courier,
  SKU,
  User,
  UserRole,
  Department,
  Driver,
  VehicleType,
  ReturnReason,
  ModuleId,
  ModulePermission,
} from '../types';
import { ROLE_DEFAULT_PERMISSIONS, getRoleBadgeConfig } from '../utils/rbac';
import { downloadCSV } from '../utils/csvExporter';

interface MastersModuleProps {
  companies: Company[];
  warehouses: Warehouse[];
  clients: Client[];
  couriers: Courier[];
  skus: SKU[];
  users: User[];
  drivers: Driver[];
  vehicleTypes: VehicleType[];
  returnReasons: ReturnReason[];
  onAddMasterRecord: (category: string, record: any) => void;
  onUpdateMasterRecord: (category: string, id: string, updatedRecord: any) => void;
  onDeleteMasterRecord: (category: string, id: string) => void;
  onToggleHoldMasterRecord: (category: string, id: string) => void;
}

const ALL_SYSTEM_MODULES: { id: ModuleId; label: string; description: string }[] = [
  { id: 'dashboard', label: 'Dashboard & Daily KPIs', description: 'Overview metrics, pie charts & live dock stats' },
  { id: 'inward', label: 'Inward Gate Entry', description: 'Vehicle gate register, driver logging & box counts' },
  { id: 'returns_rto', label: 'RTO / B2C Returns', description: 'Batch scanning, 7 QC conditions & closed manifests' },
  { id: 'returns_b2b', label: 'B2B Returns', description: 'Box-level pallet inward & bulk invoice validation' },
  { id: 'audit', label: 'Audit / Cycle Count', description: 'Barcode gun scanning, physical counting & variance' },
  { id: 'masters', label: 'Master Data & RBAC', description: 'Client, courier, SKU, facility & user access controls' },
  { id: 'reports', label: 'Reports & Manifest', description: 'PDF manifest downloads, CSV exports & courier reports' },
];

export const MastersModule: React.FC<MastersModuleProps> = ({
  companies,
  warehouses,
  clients,
  couriers,
  skus,
  users,
  drivers,
  vehicleTypes,
  returnReasons,
  onAddMasterRecord,
  onUpdateMasterRecord,
  onDeleteMasterRecord,
  onToggleHoldMasterRecord,
}) => {
  const [activeTab, setActiveTab] = useState<string>('clients');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'On Hold' | 'Inactive'>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<{ category: string; data: any } | null>(null);

  // Form State
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [userPermissions, setUserPermissions] = useState<Record<ModuleId, ModulePermission>>(() =>
    JSON.parse(JSON.stringify(ROLE_DEFAULT_PERMISSIONS['Supervisor']))
  );

  const masterCategories = [
    { id: 'clients', label: '1. Client / Brand Master', icon: Users, count: clients.length },
    { id: 'couriers', label: '2. Courier Master', icon: Truck, count: couriers.length },
    { id: 'users', label: '3. User Master & Access Control', icon: Shield, count: users.length },
    { id: 'skus', label: '4. SKU / Item Master', icon: Package, count: skus.length },
    { id: 'warehouses', label: '5. Warehouse Master', icon: WHIcon, count: warehouses.length },
    { id: 'return_reasons', label: '6. Return Conditions (7)', icon: Sliders, count: returnReasons.length },
    { id: 'companies', label: '7. Company Master', icon: Building2, count: companies.length },
    { id: 'drivers', label: '8. Driver Master', icon: Phone, count: drivers.length },
    { id: 'vehicle_types', label: '9. Vehicle Types', icon: Truck, count: vehicleTypes.length },
  ];

  // Open Add Record Modal
  const handleOpenAdd = () => {
    let initial: Record<string, any> = { status: 'Active' };
    if (activeTab === 'clients') {
      initial = {
        code: `CLI-${(clients.length + 1).toString().padStart(3, '0')}`,
        name: '',
        category: 'Personal Care',
        email: '',
        phone: '',
        companyId: companies[0]?.id || 'comp-1',
        status: 'Active',
      };
    } else if (activeTab === 'couriers') {
      initial = {
        code: '',
        name: '',
        trackingFormatPattern: 'AWB 10-14 DIGITS',
        contactNumber: '',
        apiSupported: true,
        status: 'Active',
      };
    } else if (activeTab === 'users') {
      initial = {
        empId: `EMP-${1000 + users.length + 1}`,
        name: '',
        email: '',
        phone: '',
        password: 'password123',
        role: 'Supervisor',
        department: 'Operations Management',
        companyId: companies[0]?.id || 'comp-1',
        assignedWarehouseIds: [warehouses[0]?.id || 'wh-main'],
        assignedClientIds: clients.map(c => c.id),
        status: 'Active',
      };
      setUserPermissions(JSON.parse(JSON.stringify(ROLE_DEFAULT_PERMISSIONS['Supervisor'])));
    } else if (activeTab === 'skus') {
      initial = {
        clientId: clients[0]?.id || '',
        skuCode: '',
        eanBarcode: '',
        name: '',
        category: 'General',
        unitPrice: 499,
        weightGrams: 100,
        status: 'Active',
      };
    } else if (activeTab === 'warehouses') {
      initial = {
        code: `WH-0${warehouses.length + 1}`,
        name: '',
        city: '',
        address: '',
        totalDocks: 10,
        companyId: companies[0]?.id || 'comp-1',
        status: 'Active',
      };
    } else if (activeTab === 'return_reasons') {
      initial = {
        code: `REASON-${returnReasons.length + 1}`,
        label: '',
        category: 'Both',
        requirePhoto: false,
        status: 'Active',
      };
    } else if (activeTab === 'drivers') {
      initial = {
        name: '',
        mobile: '',
        licenseNumber: '',
        transporterName: couriers[0]?.name || 'Logistics Partner',
        status: 'Active',
      };
    } else if (activeTab === 'vehicle_types') {
      initial = {
        typeName: '',
        capacityTons: 5,
        status: 'Active',
      };
    }
    setFormData(initial);
    setIsAddModalOpen(true);
  };

  // Open Edit Record Modal
  const handleOpenEdit = (category: string, item: any) => {
    setEditingRecord({ category, data: item });
    setFormData({ ...item });
    if (category === 'users') {
      if (item.permissions) {
        setUserPermissions(JSON.parse(JSON.stringify(item.permissions)));
      } else if (ROLE_DEFAULT_PERMISSIONS[item.role as UserRole]) {
        setUserPermissions(JSON.parse(JSON.stringify(ROLE_DEFAULT_PERMISSIONS[item.role as UserRole])));
      }
    }
  };

  // Save Add
  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `${activeTab.slice(0, 3)}-${Date.now()}`;
    const newRecord = {
      id,
      ...formData,
      status: formData.status || 'Active',
      ...(activeTab === 'users' ? { permissions: userPermissions } : {}),
    };
    onAddMasterRecord(activeTab, newRecord);
    setIsAddModalOpen(false);
    setFormData({});
  };

  // Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    const updated = {
      ...formData,
      ...(editingRecord.category === 'users' ? { permissions: userPermissions } : {}),
    };
    onUpdateMasterRecord(editingRecord.category, editingRecord.data.id, updated);
    setEditingRecord(null);
    setFormData({});
  };

  // Delete
  const handleDelete = (category: string, id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from ${category.toUpperCase()} master?`)) {
      onDeleteMasterRecord(category, id);
    }
  };

  // Quick Preset Add Brand
  const handleQuickAddBrand = (brandName: string, category: string, code: string) => {
    const id = `cli-${code.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    if (clients.some(c => c.code === code || c.name.toLowerCase() === brandName.toLowerCase())) {
      alert(`Brand ${brandName} already exists!`);
      return;
    }
    const newClient: Client = {
      id,
      companyId: companies[0]?.id || 'comp-1',
      code,
      name: brandName,
      email: `ops@${code.toLowerCase().replace(/[^a-z0-9]/g, '')}.in`,
      phone: '+91 22 4000 0000',
      category,
      status: 'Active',
    };
    onAddMasterRecord('clients', newClient);
  };

  // Quick Preset Add Courier
  const handleQuickAddCourier = (courierName: string, code: string, pattern: string, helpline: string) => {
    const id = `cour-${code.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    if (couriers.some(c => c.code === code || c.name.toLowerCase() === courierName.toLowerCase())) {
      alert(`Courier ${courierName} already exists!`);
      return;
    }
    const newCourier: Courier = {
      id,
      code,
      name: courierName,
      trackingFormatPattern: pattern,
      contactNumber: helpline,
      apiSupported: true,
      status: 'Active',
    };
    onAddMasterRecord('couriers', newCourier);
  };

  // Toggle user permission module / action
  const togglePermission = (modId: ModuleId, action: keyof ModulePermission) => {
    setUserPermissions(prev => {
      const current = prev[modId] || { view: false };
      return {
        ...prev,
        [modId]: {
          ...current,
          [action]: !current[action],
        },
      };
    });
  };

  // Apply Role Preset to Permissions
  const applyRolePreset = (role: UserRole) => {
    if (ROLE_DEFAULT_PERMISSIONS[role]) {
      setUserPermissions(JSON.parse(JSON.stringify(ROLE_DEFAULT_PERMISSIONS[role])));
      setFormData(prev => ({ ...prev, role }));
    }
  };

  const getStatusBadge = (status?: string) => {
    if (status === 'Active') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
          <CheckCircle2 className="w-3 h-3" /> Active
        </span>
      );
    }
    if (status === 'On Hold') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 w-fit">
          <PauseCircle className="w-3 h-3" /> On Hold
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30 flex items-center gap-1 w-fit">
        <AlertCircle className="w-3 h-3" /> Inactive
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Title & Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-400" /> Master Data Management & RBAC Access Control
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure Client Brands, Courier Logistics Partners, User Roles & Approved Tabs, SKUs, and Warehouse Facilities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add New {masterCategories.find(c => c.id === activeTab)?.label.split('. ')[1] || 'Record'}
          </button>
        </div>
      </div>

      {/* Master Tabs List */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800/80 pb-2 scrollbar-thin">
        {masterCategories.map(cat => {
          const Icon = cat.icon;
          const isActive = activeTab === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveTab(cat.id);
                setSearchQuery('');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{cat.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder={`Search in ${activeTab.toUpperCase()} master...`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Status:</span>
          <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700">
            {(['ALL', 'Active', 'On Hold', 'Inactive'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  statusFilter === st ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* QUICK PRESETS FOR CLIENTS & BRANDS */}
      {activeTab === 'clients' && (
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Quick Add Popular Brands & Accounts:
            </span>
            <span className="text-[11px] text-slate-500">Click any brand to instantly provision</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { name: 'Bella Vita Organic', cat: 'Personal Care', code: 'CLI-BV' },
              { name: 'Nykaa E-Retail', cat: 'Cosmetics', code: 'CLI-NYK' },
              { name: 'Honasa (Mamaearth)', cat: 'Personal Care', code: 'CLI-MME' },
              { name: 'Imagine Marketing (boAt)', cat: 'Consumer Electronics', code: 'CLI-BOAT' },
              { name: 'SUGAR Cosmetics', cat: 'Cosmetics', code: 'CLI-SUG' },
              { name: 'Wow Skin Science', cat: 'Skin Care', code: 'CLI-WOW' },
              { name: 'Minimalist (Be Minimalist)', cat: 'Skin Care', code: 'CLI-MIN' },
              { name: 'Plum Goodness', cat: 'Beauty & Wellness', code: 'CLI-PLUM' },
              { name: 'Snitch Menswear', cat: 'Apparel & Fashion', code: 'CLI-SNITCH' },
              { name: 'Noise Electronics', cat: 'Smart Wearables', code: 'CLI-NOISE' },
              { name: 'Fire-Boltt', cat: 'Smart Wearables', code: 'CLI-FIRE' },
              { name: 'The Man Company', cat: 'Men Grooming', code: 'CLI-TMC' },
            ].map(b => (
              <button
                key={b.code}
                onClick={() => handleQuickAddBrand(b.name, b.cat, b.code)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3 h-3 text-blue-400" /> {b.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* QUICK PRESETS FOR COURIERS */}
      {activeTab === 'couriers' && (
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Quick Add Popular Courier Logistics Partners:
            </span>
            <span className="text-[11px] text-slate-500">Click any courier to instantly provision</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { name: 'Delhivery Surface & Express', code: 'DELHIVERY', pattern: '14 DIGITS / DELH...', helpline: '1800-103-6354' },
              { name: 'Blue Dart Express Ltd', code: 'BLUEDART', pattern: '11 DIGITS', helpline: '1860-233-1234' },
              { name: 'XpressBees Logistics', code: 'XPRESSBEES', pattern: 'XB+12 DIGITS', helpline: '020-4911-6100' },
              { name: 'Shadowfax Technologies', code: 'SHADOWFAX', pattern: 'SFX+10 DIGITS', helpline: '080-6818-8000' },
              { name: 'Ecom Express Ltd', code: 'ECOM_EXP', pattern: 'ECOM+9 DIGITS', helpline: '0124-490-5000' },
              { name: 'DTDC Express Ltd', code: 'DTDC', pattern: 'D+9 DIGITS', helpline: '080-2536-5032' },
              { name: 'Amazon Shipping India', code: 'AMAZON_SHIP', pattern: 'TBA+12 DIGITS', helpline: '1800-3000-9009' },
              { name: 'Ekart Logistics', code: 'EKART', pattern: 'FMPC+10 DIGITS', helpline: '1800-208-9898' },
              { name: 'Smartr Logistics', code: 'SMARTR', pattern: 'SMR+10 DIGITS', helpline: '1800-200-8899' },
            ].map(cr => (
              <button
                key={cr.code}
                onClick={() => handleQuickAddCourier(cr.name, cr.code, cr.pattern, cr.helpline)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3 h-3 text-emerald-400" /> {cr.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 1. CLIENTS TABLE */}
      {activeTab === 'clients' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">Client Code</th>
                  <th className="px-4 py-3">Brand Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Email & Contact</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {clients
                  .filter(c => {
                    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
                    if (searchQuery) {
                      const q = searchQuery.toLowerCase();
                      return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || (c.category || '').toLowerCase().includes(q);
                    }
                    return true;
                  })
                  .map(client => (
                    <tr key={client.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-mono font-bold text-indigo-400">{client.code}</td>
                      <td className="px-4 py-3 font-bold text-white text-sm">{client.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 font-medium text-slate-300 border border-slate-700">
                          {client.category || 'General'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        <div>{client.email || '-'}</div>
                        <div className="text-[10px] text-slate-500">{client.phone || '-'}</div>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(client.status)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onToggleHoldMasterRecord('clients', client.id)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              client.status === 'Active' ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                            }`}
                            title={client.status === 'Active' ? 'Put on Hold' : 'Activate Client'}
                          >
                            {client.status === 'Active' ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleOpenEdit('clients', client)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Edit Client"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete('clients', client.id, client.name)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-300 transition-colors cursor-pointer"
                            title="Delete Client"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. COURIERS TABLE */}
      {activeTab === 'couriers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">Courier Code</th>
                  <th className="px-4 py-3">Logistics Partner Name</th>
                  <th className="px-4 py-3">AWB Tracking Format</th>
                  <th className="px-4 py-3">Helpline Contact</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {couriers
                  .filter(cr => {
                    if (statusFilter !== 'ALL' && cr.status !== statusFilter) return false;
                    if (searchQuery) {
                      const q = searchQuery.toLowerCase();
                      return cr.name.toLowerCase().includes(q) || cr.code.toLowerCase().includes(q);
                    }
                    return true;
                  })
                  .map(courier => (
                    <tr key={courier.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-mono font-bold text-blue-400">{courier.code}</td>
                      <td className="px-4 py-3 font-bold text-white text-sm">{courier.name}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                        {courier.trackingFormatPattern || 'Standard 10-14 Digits'}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{courier.contactNumber || '1800-XXX-XXXX'}</td>
                      <td className="px-4 py-3">{getStatusBadge(courier.status)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onToggleHoldMasterRecord('couriers', courier.id)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              courier.status === 'Active' ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                            }`}
                            title={courier.status === 'Active' ? 'Put on Hold' : 'Activate Courier'}
                          >
                            {courier.status === 'Active' ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleOpenEdit('couriers', courier)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Edit Courier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete('couriers', courier.id, courier.name)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-300 transition-colors cursor-pointer"
                            title="Delete Courier"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. USERS & RBAC ACCESS CONTROL MASTER */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <h3 className="font-bold text-white text-sm">Role-Based Access Control (RBAC) & Approved Modules</h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Manage team accounts and assign specific approved tabs. When a user logs in, they will only see their approved tabs.
              </p>
            </div>
            <button
              onClick={handleOpenAdd}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create User & Configure Access
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Emp ID</th>
                    <th className="px-4 py-3">Team Member</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Approved Navigation Tabs</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Access Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {users
                    .filter(u => {
                      if (statusFilter !== 'ALL' && u.status !== statusFilter) return false;
                      if (searchQuery) {
                        const q = searchQuery.toLowerCase();
                        return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
                      }
                      return true;
                    })
                    .map(user => {
                      const badge = getRoleBadgeConfig(user.role);
                      // Calculate which tabs this user can view
                      const perms = user.permissions || ROLE_DEFAULT_PERMISSIONS[user.role] || {};
                      const approvedTabs = ALL_SYSTEM_MODULES.filter(m => {
                        if (user.role === 'Super Admin') return true;
                        return !!perms[m.id]?.view;
                      });

                      return (
                        <tr key={user.id} className="hover:bg-slate-800/50">
                          <td className="px-4 py-3 font-mono font-bold text-indigo-400">{user.empId || 'EMP-000'}</td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-white">{user.name}</div>
                            <div className="text-[11px] text-slate-400">{user.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400">{user.department || 'Operations'}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1 max-w-[280px]">
                              {approvedTabs.map(tab => (
                                <span key={tab.id} className="px-1.5 py-0.2 rounded bg-slate-800 font-medium text-slate-300 border border-slate-700 text-[10px]">
                                  {tab.label.split(' ')[0]}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3">{getStatusBadge(user.status)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEdit('users', user)}
                                className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                title="Edit User & Permissions Matrix"
                              >
                                <Lock className="w-3.5 h-3.5" /> Edit Access
                              </button>
                              <button
                                onClick={() => handleDelete('users', user.id, user.name)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-300 transition-colors cursor-pointer"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. SKUS TABLE */}
      {activeTab === 'skus' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">SKU Code</th>
                  <th className="px-4 py-3">EAN Barcode</th>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">Brand / Client</th>
                  <th className="px-4 py-3">Price (₹)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {skus
                  .filter(s => {
                    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
                    if (searchQuery) {
                      const q = searchQuery.toLowerCase();
                      return s.skuCode.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || (s.eanBarcode || '').includes(q);
                    }
                    return true;
                  })
                  .map(sku => {
                    const client = clients.find(c => c.id === sku.clientId);
                    return (
                      <tr key={sku.id} className="hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-mono font-bold text-indigo-400">{sku.skuCode}</td>
                        <td className="px-4 py-3 font-mono text-emerald-400 font-bold">{sku.eanBarcode}</td>
                        <td className="px-4 py-3 font-semibold text-white">{sku.name}</td>
                        <td className="px-4 py-3 text-slate-400">{client?.name || sku.clientId}</td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-200">₹{sku.unitPrice || 0}</td>
                        <td className="px-4 py-3">{getStatusBadge(sku.status)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit('skus', sku)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete('skus', sku.id, sku.name)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-300 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. WAREHOUSES TABLE */}
      {activeTab === 'warehouses' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">Facility Code</th>
                  <th className="px-4 py-3">Warehouse Name</th>
                  <th className="px-4 py-3">City / Hub</th>
                  <th className="px-4 py-3">Docks</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {warehouses
                  .filter(w => {
                    if (statusFilter !== 'ALL' && w.status !== statusFilter) return false;
                    if (searchQuery) {
                      const q = searchQuery.toLowerCase();
                      return w.name.toLowerCase().includes(q) || w.code.toLowerCase().includes(q) || w.city.toLowerCase().includes(q);
                    }
                    return true;
                  })
                  .map(wh => (
                    <tr key={wh.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-mono font-bold text-cyan-400">{wh.code}</td>
                      <td className="px-4 py-3 font-bold text-white">{wh.name}</td>
                      <td className="px-4 py-3 text-slate-300">{wh.city}</td>
                      <td className="px-4 py-3 font-bold text-amber-400">{wh.totalDocks || 10} Docks</td>
                      <td className="px-4 py-3">{getStatusBadge(wh.status)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit('warehouses', wh)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete('warehouses', wh.id, wh.name)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-300 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. RETURN CONDITIONS TABLE */}
      {activeTab === 'return_reasons' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">Condition Code</th>
                  <th className="px-4 py-3">Condition Label</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Require Photo QC</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {returnReasons.map(rr => (
                  <tr key={rr.id} className="hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-mono font-bold text-amber-400">{rr.code}</td>
                    <td className="px-4 py-3 font-bold text-white">{rr.label}</td>
                    <td className="px-4 py-3 text-slate-400">{rr.category}</td>
                    <td className="px-4 py-3">
                      {rr.requirePhoto ? (
                        <span className="text-rose-400 font-bold">Yes (Camera)</span>
                      ) : (
                        <span className="text-slate-500">Optional</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(rr.status)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenEdit('return_reasons', rr)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. COMPANIES / 8. DRIVERS / 9. VEHICLE TYPES TABLES */}
      {activeTab === 'companies' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">Company Code</th>
                  <th className="px-4 py-3">Company Name</th>
                  <th className="px-4 py-3">GSTIN / Tax ID</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {companies.map(c => (
                  <tr key={c.id} className="hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-mono font-bold text-blue-400">{c.code}</td>
                    <td className="px-4 py-3 font-bold text-white">{c.name}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{c.gstNumber || '-'}</td>
                    <td className="px-4 py-3">{getStatusBadge(c.status)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenEdit('companies', c)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'drivers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">Driver Name</th>
                  <th className="px-4 py-3">Mobile #</th>
                  <th className="px-4 py-3">Driving License</th>
                  <th className="px-4 py-3">Transporter / Fleet</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {drivers.map(d => (
                  <tr key={d.id} className="hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-bold text-white">{d.name}</td>
                    <td className="px-4 py-3 font-mono text-slate-300">{d.mobile}</td>
                    <td className="px-4 py-3 font-mono text-indigo-400">{d.licenseNumber}</td>
                    <td className="px-4 py-3 text-slate-400">{d.transporterName}</td>
                    <td className="px-4 py-3">{getStatusBadge(d.status)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenEdit('drivers', d)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'vehicle_types' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">Vehicle Type</th>
                  <th className="px-4 py-3">Payload Capacity (Tons)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {vehicleTypes.map(vt => (
                  <tr key={vt.id} className="hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-bold text-white">{vt.typeName}</td>
                    <td className="px-4 py-3 font-bold text-emerald-400">{vt.capacityTons} Tons</td>
                    <td className="px-4 py-3">{getStatusBadge(vt.status)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenEdit('vehicle_types', vt)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD MODAL (CATEGORY AWARE) */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" /> Add New {masterCategories.find(c => c.id === activeTab)?.label.split('. ')[1]}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-4 text-xs">
              {/* CLIENT ADD */}
              {activeTab === 'clients' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Client Code *</label>
                      <input
                        type="text"
                        required
                        value={formData.code || ''}
                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700 font-mono focus:border-blue-500 focus:outline-none"
                        placeholder="CLI-BRAND"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Brand / Client Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
                        placeholder="e.g. Bella Vita Organic"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Category / Vertical</label>
                      <input
                        type="text"
                        value={formData.category || ''}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
                        placeholder="e.g. Personal Care / D2C / Cosmetics"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Contact Email</label>
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
                        placeholder="ops@brand.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Helpline Phone</label>
                      <input
                        type="text"
                        value={formData.phone || ''}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
                        placeholder="+91 22 4000 0000"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Status</label>
                      <select
                        value={formData.status || 'Active'}
                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="Active">Active</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* COURIER ADD */}
              {activeTab === 'couriers' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Courier Code *</label>
                      <input
                        type="text"
                        required
                        value={formData.code || ''}
                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700 font-mono focus:border-blue-500 focus:outline-none"
                        placeholder="DELHIVERY / BLUEDART / SFX"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Logistics Partner Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
                        placeholder="e.g. Delhivery Surface & Express"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">AWB Tracking Format Pattern</label>
                      <input
                        type="text"
                        value={formData.trackingFormatPattern || ''}
                        onChange={e => setFormData({ ...formData, trackingFormatPattern: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700 font-mono focus:border-blue-500 focus:outline-none"
                        placeholder="14 DIGITS / SFX+10 DIGITS"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Helpline Phone</label>
                      <input
                        type="text"
                        value={formData.contactNumber || ''}
                        onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
                        placeholder="1800-XXX-XXXX"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* USER ADD & RBAC ACCESS CONFIG */}
              {activeTab === 'users' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Employee ID *</label>
                      <input
                        type="text"
                        required
                        value={formData.empId || ''}
                        onChange={e => setFormData({ ...formData, empId: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700 font-mono focus:border-blue-500 focus:outline-none"
                        placeholder="EMP-1008"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
                        placeholder="e.g. Ramesh Sharma"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={formData.email || ''}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
                        placeholder="ramesh.s@emiza.com"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Initial Password</label>
                      <input
                        type="text"
                        value={formData.password || 'password123'}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700 font-mono focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">System Role *</label>
                      <select
                        value={formData.role || 'Supervisor'}
                        onChange={e => {
                          const newRole = e.target.value as UserRole;
                          setFormData({ ...formData, role: newRole });
                          applyRolePreset(newRole);
                        }}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="Super Admin">Super Admin (All Facilities & Settings)</option>
                        <option value="Admin">Admin</option>
                        <option value="Warehouse Manager">Warehouse Manager</option>
                        <option value="Supervisor">Supervisor</option>
                        <option value="Security Officer">Security Officer (Gate Inward)</option>
                        <option value="RTO Operator">RTO Operator (Returns Scanning)</option>
                        <option value="GRN Operator">GRN Operator</option>
                        <option value="Auditor">Auditor (Cycle Count / Scanner)</option>
                        <option value="Operator">Operator</option>
                        <option value="Read Only">Read Only (Viewer)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Department</label>
                      <input
                        type="text"
                        value={formData.department || 'Operations Management'}
                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Approved Navigation Tabs & Permissions Matrix */}
                  <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-indigo-400" /> Approved Tabs & Module Permissions
                      </span>
                      <span className="text-[11px] text-slate-400">User will only see checked tabs</span>
                    </div>

                    <div className="space-y-2">
                      {ALL_SYSTEM_MODULES.map(mod => {
                        const isViewAllowed = !!userPermissions[mod.id]?.view || formData.role === 'Super Admin';
                        const modPerm = userPermissions[mod.id] || { view: false };

                        return (
                          <div key={mod.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isViewAllowed}
                                  onChange={() => togglePermission(mod.id, 'view')}
                                  className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                                />
                                <div>
                                  <div className="font-bold text-white text-xs">{mod.label}</div>
                                  <div className="text-[10px] text-slate-400">{mod.description}</div>
                                </div>
                              </label>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isViewAllowed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                {isViewAllowed ? 'Tab Visible' : 'Hidden'}
                              </span>
                            </div>

                            {/* Granular Actions */}
                            {isViewAllowed && (
                              <div className="flex flex-wrap gap-3 pt-1 border-t border-slate-800/60 text-[11px] text-slate-300">
                                {(['create', 'edit', 'delete', 'scan', 'export', 'closeBatch'] as const).map(act => (
                                  <label key={act} className="flex items-center gap-1 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={!!modPerm[act] || formData.role === 'Super Admin'}
                                      onChange={() => togglePermission(mod.id, act)}
                                      className="w-3.5 h-3.5 rounded text-indigo-600 cursor-pointer"
                                    />
                                    <span className="capitalize">{act.replace(/([A-Z])/g, ' $1')}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* SKU ADD */}
              {activeTab === 'skus' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Brand / Client *</label>
                      <select
                        value={formData.clientId || clients[0]?.id}
                        onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700"
                      >
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">SKU Code *</label>
                      <input
                        type="text"
                        required
                        value={formData.skuCode || ''}
                        onChange={e => setFormData({ ...formData, skuCode: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700 font-mono"
                        placeholder="BV-PERF-100ML"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">EAN Barcode *</label>
                      <input
                        type="text"
                        required
                        value={formData.eanBarcode || ''}
                        onChange={e => setFormData({ ...formData, eanBarcode: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700 font-mono text-emerald-400"
                        placeholder="8906105610014"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">MRP Price (₹)</label>
                      <input
                        type="number"
                        value={formData.unitPrice || 499}
                        onChange={e => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Product Description / Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700"
                      placeholder="e.g. Bella Vita Luxury Man Perfume 100ml"
                    />
                  </div>
                </>
              )}

              {/* WAREHOUSE / RETURN CONDITIONS / DRIVERS / VEHICLES */}
              {activeTab === 'warehouses' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Warehouse Code *</label>
                      <input
                        type="text"
                        required
                        value={formData.code || ''}
                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700 font-mono"
                        placeholder="WH-04"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Facility Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700"
                        placeholder="EMIZA Hyderabad Logistics Hub"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">City / Region *</label>
                      <input
                        type="text"
                        required
                        value={formData.city || ''}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700"
                        placeholder="Hyderabad"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Total Dock Doors</label>
                      <input
                        type="number"
                        value={formData.totalDocks || 10}
                        onChange={e => setFormData({ ...formData, totalDocks: Number(e.target.value) })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT MODAL (CATEGORY AWARE) */}
      {/* ========================================================================= */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-400" /> Edit {editingRecord.category.toUpperCase()} Record
              </h3>
              <button onClick={() => setEditingRecord(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              {/* CLIENT EDIT */}
              {editingRecord.category === 'clients' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Client Code</label>
                      <input
                        type="text"
                        required
                        value={formData.code || ''}
                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Brand Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Category / Vertical</label>
                      <input
                        type="text"
                        value={formData.category || ''}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Phone</label>
                      <input
                        type="text"
                        value={formData.phone || ''}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Status</label>
                      <select
                        value={formData.status || 'Active'}
                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700"
                      >
                        <option value="Active">Active</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* COURIER EDIT */}
              {editingRecord.category === 'couriers' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Courier Code</label>
                      <input
                        type="text"
                        required
                        value={formData.code || ''}
                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Courier Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Tracking Pattern</label>
                      <input
                        type="text"
                        value={formData.trackingFormatPattern || ''}
                        onChange={e => setFormData({ ...formData, trackingFormatPattern: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Helpline Phone</label>
                      <input
                        type="text"
                        value={formData.contactNumber || ''}
                        onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Status</label>
                    <select
                      value={formData.status || 'Active'}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700"
                    >
                      <option value="Active">Active</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </>
              )}

              {/* USER EDIT & RBAC PERMISSIONS */}
              {editingRecord.category === 'users' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Emp ID</label>
                      <input
                        type="text"
                        value={formData.empId || ''}
                        onChange={e => setFormData({ ...formData, empId: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Email</label>
                      <input
                        type="email"
                        required
                        value={formData.email || ''}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Role</label>
                      <select
                        value={formData.role || 'Supervisor'}
                        onChange={e => {
                          const newRole = e.target.value as UserRole;
                          setFormData({ ...formData, role: newRole });
                        }}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700"
                      >
                        <option value="Super Admin">Super Admin</option>
                        <option value="Admin">Admin</option>
                        <option value="Warehouse Manager">Warehouse Manager</option>
                        <option value="Supervisor">Supervisor</option>
                        <option value="Security Officer">Security Officer</option>
                        <option value="RTO Operator">RTO Operator</option>
                        <option value="GRN Operator">GRN Operator</option>
                        <option value="Auditor">Auditor</option>
                        <option value="Operator">Operator</option>
                        <option value="Read Only">Read Only</option>
                      </select>
                    </div>
                  </div>

                  {/* Approved Tabs Matrix */}
                  <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-amber-400" /> Edit Approved Navigation Tabs & Permissions
                      </span>
                      <button
                        type="button"
                        onClick={() => applyRolePreset(formData.role)}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer"
                      >
                        Reset to Role Defaults
                      </button>
                    </div>

                    <div className="space-y-2">
                      {ALL_SYSTEM_MODULES.map(mod => {
                        const isViewAllowed = !!userPermissions[mod.id]?.view || formData.role === 'Super Admin';
                        const modPerm = userPermissions[mod.id] || { view: false };

                        return (
                          <div key={mod.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isViewAllowed}
                                  onChange={() => togglePermission(mod.id, 'view')}
                                  className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                                />
                                <div>
                                  <div className="font-bold text-white text-xs">{mod.label}</div>
                                  <div className="text-[10px] text-slate-400">{mod.description}</div>
                                </div>
                              </label>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isViewAllowed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                {isViewAllowed ? 'Approved' : 'Hidden'}
                              </span>
                            </div>

                            {/* Granular Actions */}
                            {isViewAllowed && (
                              <div className="flex flex-wrap gap-3 pt-1 border-t border-slate-800/60 text-[11px] text-slate-300">
                                {(['create', 'edit', 'delete', 'scan', 'export', 'closeBatch'] as const).map(act => (
                                  <label key={act} className="flex items-center gap-1 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={!!modPerm[act] || formData.role === 'Super Admin'}
                                      onChange={() => togglePermission(mod.id, act)}
                                      className="w-3.5 h-3.5 rounded text-indigo-600 cursor-pointer"
                                    />
                                    <span className="capitalize">{act.replace(/([A-Z])/g, ' $1')}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* SKU / WAREHOUSE / OTHER EDITS */}
              {editingRecord.category === 'skus' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">SKU Code</label>
                      <input
                        type="text"
                        required
                        value={formData.skuCode || ''}
                        onChange={e => setFormData({ ...formData, skuCode: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">EAN Barcode</label>
                      <input
                        type="text"
                        required
                        value={formData.eanBarcode || ''}
                        onChange={e => setFormData({ ...formData, eanBarcode: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700 font-mono text-emerald-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Product Title</label>
                    <input
                      type="text"
                      required
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Price (₹)</label>
                      <input
                        type="number"
                        value={formData.unitPrice || 0}
                        onChange={e => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Status</label>
                      <select
                        value={formData.status || 'Active'}
                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700"
                      >
                        <option value="Active">Active</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {editingRecord.category === 'warehouses' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Code</label>
                      <input
                        type="text"
                        value={formData.code || ''}
                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Name</label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">City</label>
                      <input
                        type="text"
                        value={formData.city || ''}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Docks</label>
                      <input
                        type="number"
                        value={formData.totalDocks || 10}
                        onChange={e => setFormData({ ...formData, totalDocks: Number(e.target.value) })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-lg shadow-amber-600/30 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
