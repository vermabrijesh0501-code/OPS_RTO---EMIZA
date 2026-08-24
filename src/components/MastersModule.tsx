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
} from 'lucide-react';
import {
  Company,
  Warehouse,
  Client,
  Courier,
  SKU,
  User,
  Driver,
  VehicleType,
  ReturnReason,
} from '../types';

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
  
  // Add & Edit Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<{ category: string; data: any } | null>(null);

  // Form State
  const [formData, setFormData] = useState<Record<string, any>>({});

  const masterCategories = [
    { id: 'clients', label: '1. Client / Brand Master', icon: Users, count: clients.length },
    { id: 'skus', label: '2. SKU / Item Master', icon: Package, count: skus.length },
    { id: 'warehouses', label: '3. Warehouse Master', icon: WHIcon, count: warehouses.length },
    { id: 'couriers', label: '4. Courier Master', icon: Truck, count: couriers.length },
    { id: 'return_reasons', label: '5. Return Conditions (7)', icon: Sliders, count: returnReasons.length },
    { id: 'companies', label: '6. Company Master', icon: Building2, count: companies.length },
    { id: 'users', label: '7. User Master', icon: Shield, count: users.length },
    { id: 'drivers', label: '8. Driver Master', icon: Phone, count: drivers.length },
    { id: 'vehicle_types', label: '9. Vehicle Types', icon: Truck, count: vehicleTypes.length },
  ];

  const handleOpenAdd = () => {
    setFormData({
      status: 'Active',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (category: string, item: any) => {
    setEditingRecord({ category, data: item });
    setFormData({ ...item });
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `${activeTab.slice(0, 3)}-${Date.now()}`;
    const newRecord = {
      id,
      ...formData,
      status: formData.status || 'Active',
    };
    onAddMasterRecord(activeTab, newRecord);
    setIsAddModalOpen(false);
    setFormData({});
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    onUpdateMasterRecord(editingRecord.category, editingRecord.data.id, formData);
    setEditingRecord(null);
    setFormData({});
  };

  const handleDelete = (category: string, id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from ${category.toUpperCase()} master?`)) {
      onDeleteMasterRecord(category, id);
    }
  };

  const getStatusBadge = (status: string) => {
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
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1 w-fit">
        <AlertCircle className="w-3 h-3" /> Inactive
      </span>
    );
  };

  const currentCategoryObj = masterCategories.find(c => c.id === activeTab);

  return (
    <div className="p-6 space-y-6">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-400" /> Master Data Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete CRUD Control: Add, Edit, Delete, and Hold / Unhold options across all Master Data repositories.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" /> Add Record to {currentCategoryObj?.label.split('.')[1]}
        </button>
      </div>

      {/* Master Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/80 scrollbar-thin">
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
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3 w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder={`Search ${currentCategoryObj?.label.split('.')[1]}...`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-slate-200 focus:outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 self-end sm:self-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Active
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> On Hold
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Inactive
          </div>
        </div>
      </div>

      {/* MASTER DATA TABLES */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          {/* 1. CLIENTS / BRANDS */}
          {activeTab === 'clients' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">Client Code</th>
                  <th className="px-4 py-3">Brand / Client Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Email & Contact</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions (Edit / Hold / Delete)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {clients
                  .filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.code.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(cli => (
                    <tr key={cli.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-mono font-bold text-indigo-400">{cli.code}</td>
                      <td className="px-4 py-3 font-bold text-white">{cli.name}</td>
                      <td className="px-4 py-3 text-slate-400">{cli.category}</td>
                      <td className="px-4 py-3 text-slate-400">{cli.email} • {cli.phone}</td>
                      <td className="px-4 py-3">{getStatusBadge(cli.status)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit('clients', cli)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors"
                            title="Edit Client"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onToggleHoldMasterRecord('clients', cli.id)}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                              cli.status === 'Active'
                                ? 'bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-black'
                                : 'bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black'
                            }`}
                            title={cli.status === 'Active' ? 'Put on Hold' : 'Unhold / Activate'}
                          >
                            {cli.status === 'Active' ? <PauseCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleDelete('clients', cli.id, cli.name)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                            title="Delete Client"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {/* 2. SKUS */}
          {activeTab === 'skus' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">SKU Code</th>
                  <th className="px-4 py-3">EAN Barcode</th>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">MRP (INR)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {skus
                  .filter(s => !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.skuCode.toLowerCase().includes(searchQuery.toLowerCase()) || s.eanBarcode.includes(searchQuery))
                  .map(sku => (
                    <tr key={sku.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-mono font-bold text-blue-400">{sku.skuCode}</td>
                      <td className="px-4 py-3 font-mono text-emerald-400">{sku.eanBarcode}</td>
                      <td className="px-4 py-3 font-bold text-white">{sku.name}</td>
                      <td className="px-4 py-3 text-slate-400">{sku.category}</td>
                      <td className="px-4 py-3 font-bold text-slate-200">₹{sku.unitPrice}</td>
                      <td className="px-4 py-3">{getStatusBadge(sku.status)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit('skus', sku)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors"
                            title="Edit SKU"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onToggleHoldMasterRecord('skus', sku.id)}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                              sku.status === 'Active'
                                ? 'bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-black'
                                : 'bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black'
                            }`}
                            title={sku.status === 'Active' ? 'Put on Hold' : 'Unhold / Activate'}
                          >
                            {sku.status === 'Active' ? <PauseCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleDelete('skus', sku.id, sku.name)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                            title="Delete SKU"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {/* 3. WAREHOUSES */}
          {activeTab === 'warehouses' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">WH Code</th>
                  <th className="px-4 py-3">Warehouse Name</th>
                  <th className="px-4 py-3">City / Hub</th>
                  <th className="px-4 py-3">Docks</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {warehouses
                  .filter(w => !searchQuery || w.name.toLowerCase().includes(searchQuery.toLowerCase()) || w.code.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(wh => (
                    <tr key={wh.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-mono font-bold text-blue-400">{wh.code}</td>
                      <td className="px-4 py-3 font-bold text-white">{wh.name}</td>
                      <td className="px-4 py-3 text-slate-400">{wh.city}</td>
                      <td className="px-4 py-3 font-bold text-amber-400">{wh.totalDocks} Docks</td>
                      <td className="px-4 py-3 text-slate-300">{wh.contactPerson} ({wh.phone})</td>
                      <td className="px-4 py-3">{getStatusBadge(wh.status)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit('warehouses', wh)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors"
                            title="Edit Warehouse"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onToggleHoldMasterRecord('warehouses', wh.id)}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                              wh.status === 'Active'
                                ? 'bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-black'
                                : 'bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black'
                            }`}
                            title={wh.status === 'Active' ? 'Put on Hold' : 'Unhold / Activate'}
                          >
                            {wh.status === 'Active' ? <PauseCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleDelete('warehouses', wh.id, wh.name)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                            title="Delete Warehouse"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {/* 4. COURIERS */}
          {activeTab === 'couriers' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Courier Name</th>
                  <th className="px-4 py-3">AWB Pattern</th>
                  <th className="px-4 py-3">Helpline</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {couriers
                  .filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.code.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(cr => (
                    <tr key={cr.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-mono font-bold text-purple-400">{cr.code}</td>
                      <td className="px-4 py-3 font-bold text-white">{cr.name}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400">{cr.trackingFormatPattern}</td>
                      <td className="px-4 py-3 text-slate-400">{cr.contactNumber}</td>
                      <td className="px-4 py-3">{getStatusBadge(cr.status)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit('couriers', cr)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors"
                            title="Edit Courier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onToggleHoldMasterRecord('couriers', cr.id)}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                              cr.status === 'Active'
                                ? 'bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-black'
                                : 'bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black'
                            }`}
                            title={cr.status === 'Active' ? 'Put on Hold' : 'Unhold / Activate'}
                          >
                            {cr.status === 'Active' ? <PauseCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleDelete('couriers', cr.id, cr.name)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                            title="Delete Courier"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {/* 5. RETURN CONDITIONS */}
          {activeTab === 'return_reasons' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Condition / Remark</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Photo Mandatory</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {returnReasons
                  .filter(r => !searchQuery || r.label.toLowerCase().includes(searchQuery.toLowerCase()) || r.code.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(rr => (
                    <tr key={rr.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-mono font-bold text-amber-400">{rr.code}</td>
                      <td className="px-4 py-3 font-bold text-white">{rr.label}</td>
                      <td className="px-4 py-3 text-slate-400">{rr.category}</td>
                      <td className="px-4 py-3 font-bold text-slate-300">{rr.requirePhoto ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-3">{getStatusBadge(rr.status)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit('return_reasons', rr)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors"
                            title="Edit Condition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onToggleHoldMasterRecord('return_reasons', rr.id)}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                              rr.status === 'Active'
                                ? 'bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-black'
                                : 'bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black'
                            }`}
                            title={rr.status === 'Active' ? 'Put on Hold' : 'Unhold / Activate'}
                          >
                            {rr.status === 'Active' ? <PauseCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleDelete('return_reasons', rr.id, rr.label)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                            title="Delete Condition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {/* 6. COMPANIES */}
          {activeTab === 'companies' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Company Name</th>
                  <th className="px-4 py-3">GSTIN</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {companies
                  .filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.code.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(c => (
                    <tr key={c.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-mono font-bold text-blue-400">{c.code}</td>
                      <td className="px-4 py-3 font-bold text-white">{c.name}</td>
                      <td className="px-4 py-3 font-mono text-slate-400">{c.gstin}</td>
                      <td className="px-4 py-3 text-slate-400">{c.address}</td>
                      <td className="px-4 py-3">{getStatusBadge(c.status)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit('companies', c)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors"
                            title="Edit Company"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onToggleHoldMasterRecord('companies', c.id)}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                              c.status === 'Active'
                                ? 'bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-black'
                                : 'bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black'
                            }`}
                            title={c.status === 'Active' ? 'Put on Hold' : 'Unhold / Activate'}
                          >
                            {c.status === 'Active' ? <PauseCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleDelete('companies', c.id, c.name)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                            title="Delete Company"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {/* 7. USERS */}
          {activeTab === 'users' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">User Name</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {users
                  .filter(u => !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(u => (
                    <tr key={u.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-bold text-white">{u.name}</td>
                      <td className="px-4 py-3 text-slate-400">{u.email}</td>
                      <td className="px-4 py-3 font-bold text-indigo-400">{u.role}</td>
                      <td className="px-4 py-3">{getStatusBadge(u.status)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit('users', u)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors"
                            title="Edit User"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onToggleHoldMasterRecord('users', u.id)}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                              u.status === 'Active'
                                ? 'bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-black'
                                : 'bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black'
                            }`}
                            title={u.status === 'Active' ? 'Deactivate' : 'Activate'}
                          >
                            {u.status === 'Active' ? <PauseCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleDelete('users', u.id, u.name)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {/* 8. DRIVERS */}
          {activeTab === 'drivers' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">Driver Name</th>
                  <th className="px-4 py-3">Mobile Number</th>
                  <th className="px-4 py-3">License Number</th>
                  <th className="px-4 py-3">Transporter</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {drivers
                  .filter(d => !searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.mobile.includes(searchQuery))
                  .map(d => (
                    <tr key={d.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-bold text-white">{d.name}</td>
                      <td className="px-4 py-3 font-mono text-slate-300">{d.mobile}</td>
                      <td className="px-4 py-3 font-mono text-slate-400">{d.licenseNumber}</td>
                      <td className="px-4 py-3 text-slate-400">{d.transporterName}</td>
                      <td className="px-4 py-3">{getStatusBadge(d.status)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit('drivers', d)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors"
                            title="Edit Driver"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onToggleHoldMasterRecord('drivers', d.id)}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                              d.status === 'Active'
                                ? 'bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-black'
                                : 'bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black'
                            }`}
                            title={d.status === 'Active' ? 'Put on Hold' : 'Unhold / Activate'}
                          >
                            {d.status === 'Active' ? <PauseCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleDelete('drivers', d.id, d.name)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                            title="Delete Driver"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {/* 9. VEHICLE TYPES */}
          {activeTab === 'vehicle_types' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">Vehicle Type Name</th>
                  <th className="px-4 py-3">Capacity (Tons)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {vehicleTypes
                  .filter(v => !searchQuery || v.typeName.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(v => (
                    <tr key={v.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-bold text-white">{v.typeName}</td>
                      <td className="px-4 py-3 font-bold text-amber-400">{v.capacityTons} Tons</td>
                      <td className="px-4 py-3">{getStatusBadge(v.status)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit('vehicle_types', v)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors"
                            title="Edit Vehicle Type"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onToggleHoldMasterRecord('vehicle_types', v.id)}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                              v.status === 'Active'
                                ? 'bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-black'
                                : 'bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black'
                            }`}
                            title={v.status === 'Active' ? 'Put on Hold' : 'Unhold / Activate'}
                          >
                            {v.status === 'Active' ? <PauseCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleDelete('vehicle_types', v.id, v.typeName)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                            title="Delete Vehicle Type"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ADD / CREATE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" /> Add New {currentCategoryObj?.label.split('.')[1]}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-3.5 text-xs">
              {/* Dynamic inputs based on activeTab */}
              {activeTab === 'clients' && (
                <>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Brand / Client Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bella Vita Organic"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Client Code *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. BV"
                        value={formData.code || ''}
                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Category</label>
                      <input
                        type="text"
                        placeholder="e.g. Cosmetics & Beauty"
                        value={formData.category || ''}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Email</label>
                      <input
                        type="email"
                        placeholder="returns@client.com"
                        value={formData.email || ''}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Phone</label>
                      <input
                        type="text"
                        placeholder="+91 98765 43210"
                        value={formData.phone || ''}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'skus' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">SKU Code *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. BV-PERF-100"
                        value={formData.skuCode || ''}
                        onChange={e => setFormData({ ...formData, skuCode: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">EAN Barcode *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 8901234567890"
                        value={formData.eanBarcode || ''}
                        onChange={e => setFormData({ ...formData, eanBarcode: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700 font-mono text-emerald-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Product Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bella Vita Luxury Perfume 100ml"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Category</label>
                      <input
                        type="text"
                        placeholder="Fragrance"
                        value={formData.category || ''}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">MRP Price (₹)</label>
                      <input
                        type="number"
                        placeholder="599"
                        value={formData.unitPrice || ''}
                        onChange={e => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Weight (g)</label>
                      <input
                        type="number"
                        placeholder="250"
                        value={formData.weightGrams || ''}
                        onChange={e => setFormData({ ...formData, weightGrams: Number(e.target.value) })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'warehouses' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">WH Code *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. WH-BHI-01"
                        value={formData.code || ''}
                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">City / Hub *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Bhiwandi (Mumbai)"
                        value={formData.city || ''}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Warehouse Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Emiza Bhiwandi Mega Fulfillment Hub"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Total Docks</label>
                      <input
                        type="number"
                        placeholder="12"
                        value={formData.totalDocks || 8}
                        onChange={e => setFormData({ ...formData, totalDocks: Number(e.target.value) })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700 font-bold"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-slate-300 font-semibold mb-1">Contact Person & Phone</label>
                      <input
                        type="text"
                        placeholder="Sunil R. (+91 98200 11223)"
                        value={formData.contactPerson || ''}
                        onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'couriers' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Courier Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Delhivery Express"
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Code *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. DEL"
                        value={formData.code || ''}
                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700 font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Tracking / AWB Regex Pattern</label>
                    <input
                      type="text"
                      placeholder="e.g. ^(DEL|DL)[0-9]{9,12}$"
                      value={formData.trackingFormatPattern || ''}
                      onChange={e => setFormData({ ...formData, trackingFormatPattern: e.target.value })}
                      className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700 font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Helpline Phone</label>
                    <input
                      type="text"
                      placeholder="1800 102 3355"
                      value={formData.contactNumber || ''}
                      onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
                      className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700"
                    />
                  </div>
                </>
              )}

              {/* Generic fallback for others */}
              {!['clients', 'skus', 'warehouses', 'couriers'].includes(activeTab) && (
                <>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Name / Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter name"
                      value={formData.name || formData.label || formData.typeName || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value, label: e.target.value, typeName: e.target.value })}
                      className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Code / Reference</label>
                      <input
                        type="text"
                        placeholder="e.g. CD-01"
                        value={formData.code || ''}
                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Initial Status</label>
                      <select
                        value={formData.status || 'Active'}
                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700"
                      >
                        <option value="Active">Active</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/30"
                >
                  Add Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" /> Edit Master Record ({editingRecord.category.toUpperCase()})
              </h3>
              <button onClick={() => setEditingRecord(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Name / Title</label>
                <input
                  type="text"
                  required
                  value={formData.name || formData.label || formData.typeName || ''}
                  onChange={e => setFormData({
                    ...formData,
                    name: e.target.value,
                    label: e.target.value,
                    typeName: e.target.value,
                  })}
                  className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {formData.code !== undefined && (
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Code</label>
                    <input
                      type="text"
                      value={formData.code || ''}
                      onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700 font-mono"
                    />
                  </div>
                )}
                {formData.skuCode !== undefined && (
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">SKU Code</label>
                    <input
                      type="text"
                      value={formData.skuCode || ''}
                      onChange={e => setFormData({ ...formData, skuCode: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700 font-mono"
                    />
                  </div>
                )}
                {formData.eanBarcode !== undefined && (
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">EAN Barcode</label>
                    <input
                      type="text"
                      value={formData.eanBarcode || ''}
                      onChange={e => setFormData({ ...formData, eanBarcode: e.target.value })}
                      className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700 font-mono text-emerald-400"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status (Hold / Active)</label>
                  <select
                    value={formData.status || 'Active'}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700"
                  >
                    <option value="Active">Active</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {formData.unitPrice !== undefined && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">MRP Price (₹)</label>
                    <input
                      type="number"
                      value={formData.unitPrice || ''}
                      onChange={e => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                      className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Category</label>
                    <input
                      type="text"
                      value={formData.category || ''}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700"
                    />
                  </div>
                </div>
              )}

              {formData.city !== undefined && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">City / Hub</label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-lg shadow-amber-600/30"
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
