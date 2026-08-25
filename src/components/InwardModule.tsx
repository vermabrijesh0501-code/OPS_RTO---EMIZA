import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  FileText,
  CheckCircle2,
  Clock,
  MapPin,
  X,
  Download,
  AlertCircle,
  Filter,
} from 'lucide-react';
import {
  InwardGateEntry,
  Warehouse,
  Client,
  Courier,
  VehicleType,
  User,
} from '../types';
import { generateGatePassPDF } from '../utils/pdfGenerator';

interface InwardModuleProps {
  currentUser: User;
  activeWarehouse: Warehouse;
  gateEntries: InwardGateEntry[];
  clients: Client[];
  couriers: Courier[];
  vehicleTypes: VehicleType[];
  onAddGateEntry: (entry: Omit<InwardGateEntry, 'id' | 'gatePassNumber' | 'entryTime'>) => void;
  onUpdateGateStatus: (id: string, status: InwardGateEntry['status'], dockNumber?: string) => void;
  isOpenCreateModal: boolean;
  onCloseCreateModal: () => void;
}

export const InwardModule: React.FC<InwardModuleProps> = ({
  currentUser,
  activeWarehouse,
  gateEntries,
  clients,
  couriers,
  vehicleTypes,
  onAddGateEntry,
  onUpdateGateStatus,
  isOpenCreateModal,
  onCloseCreateModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Form state
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleTypeId, setVehicleTypeId] = useState(vehicleTypes[0]?.id || '');
  const [driverName, setDriverName] = useState('');
  const [driverMobile, setDriverMobile] = useState('');
  const [driverLicense, setDriverLicense] = useState('');
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [courierId, setCourierId] = useState(couriers[0]?.id || '');
  const [invoiceChallanNumber, setInvoiceChallanNumber] = useState('');
  const [invoiceValue, setInvoiceValue] = useState<number | ''>('');
  const [expectedBoxCount, setExpectedBoxCount] = useState<number | ''>('');
  const [remarks, setRemarks] = useState('');

  // Selected vehicle for Dock allocation modal
  const [dockingEntry, setDockingEntry] = useState<InwardGateEntry | null>(null);
  const [selectedDockNumber, setSelectedDockNumber] = useState('Dock 01');

  const filteredEntries = gateEntries.filter(entry => {
    if (entry.warehouseId !== activeWarehouse.id) return false;
    if (statusFilter !== 'ALL' && entry.status !== statusFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      entry.gatePassNumber.toLowerCase().includes(q) ||
      entry.vehicleNumber.toLowerCase().includes(q) ||
      entry.driverName.toLowerCase().includes(q) ||
      entry.invoiceChallanNumber.toLowerCase().includes(q)
    );
  });

  const handleSubmitNewEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNumber || !driverName || !driverMobile) {
      alert('Please fill in Vehicle Number, Driver Name, and Mobile Number');
      return;
    }

    onAddGateEntry({
      warehouseId: activeWarehouse.id,
      companyId: activeWarehouse.companyId,
      clientId,
      courierId,
      vehicleNumber,
      vehicleTypeId,
      driverName,
      driverMobile,
      driverLicense,
      invoiceChallanNumber,
      invoiceValue: Number(invoiceValue) || 0,
      expectedBoxCount: Number(expectedBoxCount) || 0,
      receivedBoxCount: Number(expectedBoxCount) || 0,
      status: 'Gate In',
      remarks,
      createdBy: currentUser.id,
    });

    // Reset
    setVehicleNumber('');
    setDriverName('');
    setDriverMobile('');
    setDriverLicense('');
    setInvoiceChallanNumber('');
    setRemarks('');
    onCloseCreateModal();
  };

  const handleConfirmDockAllocation = () => {
    if (!dockingEntry) return;
    onUpdateGateStatus(dockingEntry.id, 'Dock Allocated', selectedDockNumber);
    setDockingEntry(null);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header Grid */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-emerald-400" /> Inward Gate Entry & Dock Control
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Register incoming transport, allocate unloading docks, and verify received cartons at <strong className="text-slate-200">{activeWarehouse.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onCloseCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Gate Pass</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search gate pass, vehicle, driver, client..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { label: 'All', value: 'ALL' },
            { label: 'Gate In', value: 'Gate In' },
            { label: 'Allocated', value: 'Dock Allocated' },
            { label: 'Unloading', value: 'Unloading' },
            { label: 'Completed', value: 'Completed' },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                statusFilter === tab.value
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[11px] font-extrabold uppercase tracking-wider">
                <th className="py-3.5 px-4">Entry Ref</th>
                <th className="py-3.5 px-4">Vehicle & Staff</th>
                <th className="py-3.5 px-4">Client Detail</th>
                <th className="py-3.5 px-4">Volume</th>
                <th className="py-3.5 px-4">Station</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-mono text-xs">
                    No inward gate entries match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredEntries.map(entry => {
                  const client = clients.find(c => c.id === entry.clientId);
                  const courier = couriers.find(cr => cr.id === entry.courierId);

                  const getStatusBadge = (status: string) => {
                    if (status === 'Unloading') {
                      return <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Unloading</span>;
                    }
                    if (status === 'Dock Allocated') {
                      return <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Dock Allocated</span>;
                    }
                    if (status === 'Completed' || status === 'Verified') {
                      return <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Completed</span>;
                    }
                    return <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">{status}</span>;
                  };

                  return (
                    <tr key={entry.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-white text-xs">{entry.gatePassNumber}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {new Date(entry.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{entry.vehicleNumber}</div>
                        <div className="text-[11px] text-slate-400">{entry.driverName}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{client ? client.name : 'Bella Vita Organic'}</div>
                        <div className="text-[11px] text-slate-400">{courier ? courier.name : 'Delhivery Surface'}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{entry.expectedBoxCount} Cartons</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Val: ₹{entry.invoiceValue.toLocaleString()}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-xs text-white">
                          {entry.dockNumber || <span className="text-slate-500 italic font-normal">DOCK-TBD</span>}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {getStatusBadge(entry.status)}
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-2">
                        {entry.status === 'Gate In' && (
                          <button
                            onClick={() => setDockingEntry(entry)}
                            className="px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 text-xs font-bold hover:bg-blue-600/30 cursor-pointer"
                          >
                            Assign Dock
                          </button>
                        )}

                        {entry.status === 'Dock Allocated' && (
                          <button
                            onClick={() => onUpdateGateStatus(entry.id, 'Unloading')}
                            className="px-2.5 py-1 rounded-lg bg-amber-600/20 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-600/30 cursor-pointer"
                          >
                            Start Unloading
                          </button>
                        )}

                        {entry.status === 'Unloading' && (
                          <button
                            onClick={() => onUpdateGateStatus(entry.id, 'Completed')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-600/30 cursor-pointer"
                          >
                            Complete
                          </button>
                        )}

                        {/* Download Gate Pass PDF */}
                        <button
                          onClick={() => generateGatePassPDF(entry, activeWarehouse, client, courier)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 inline-flex items-center justify-center transition-colors cursor-pointer"
                          title="Download Gate Pass PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE NEW GATE PASS MODAL */}
      {isOpenCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-400" /> New Vehicle Gate Entry Registration
              </h2>
              <button onClick={onCloseCreateModal} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewEntry} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Vehicle Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MH04 JK 8821"
                    value={vehicleNumber}
                    onChange={e => setVehicleNumber(e.target.value.toUpperCase())}
                    className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 uppercase font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Vehicle Type</label>
                  <select
                    value={vehicleTypeId}
                    onChange={e => setVehicleTypeId(e.target.value)}
                    className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
                  >
                    {vehicleTypes.map(vt => (
                      <option key={vt.id} value={vt.id}>
                        {vt.typeName} ({vt.capacityTons} Tons)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Driver Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Driver full name"
                    value={driverName}
                    onChange={e => setDriverName(e.target.value)}
                    className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Driver Mobile Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={driverMobile}
                    onChange={e => setDriverMobile(e.target.value)}
                    className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Driver License Number</label>
                  <input
                    type="text"
                    placeholder="MH04 20180012345"
                    value={driverLicense}
                    onChange={e => setDriverLicense(e.target.value.toUpperCase())}
                    className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Invoice / Challan Number</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-NYK-89211"
                    value={invoiceChallanNumber}
                    onChange={e => setInvoiceChallanNumber(e.target.value)}
                    className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Client Company</label>
                  <select
                    value={clientId}
                    onChange={e => setClientId(e.target.value)}
                    className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Courier Partner</label>
                  <select
                    value={courierId}
                    onChange={e => setCourierId(e.target.value)}
                    className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
                  >
                    {couriers.map(cr => (
                      <option key={cr.id} value={cr.id}>
                        {cr.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Expected Box / Carton Count</label>
                  <input
                    type="number"
                    min={1}
                    value={expectedBoxCount}
                    onChange={e => setExpectedBoxCount(Number(e.target.value))}
                    className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Invoice Value (INR)</label>
                  <input
                    type="number"
                    min={0}
                    value={invoiceValue}
                    onChange={e => setInvoiceValue(Number(e.target.value))}
                    className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Inspection Remarks / Seal Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Container seal unbroken upon entry..."
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onCloseCreateModal}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/30"
                >
                  Issue Gate Entry Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCK ALLOCATION MODAL */}
      {dockingEntry && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white">
                Allocate Dock for {dockingEntry.vehicleNumber}
              </h3>
              <button onClick={() => setDockingEntry(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select available dock door at <strong className="text-slate-200">{activeWarehouse.name}</strong> ({activeWarehouse.totalDocks} total docks).
            </p>

            <div className="grid grid-cols-3 gap-2 py-2">
              {Array.from({ length: activeWarehouse.totalDocks }, (_, i) => `Dock ${String(i + 1).padStart(2, '0')}`).map(
                dock => (
                  <button
                    key={dock}
                    onClick={() => setSelectedDockNumber(dock)}
                    className={`p-3 rounded-xl text-xs font-extrabold border transition-all ${
                      selectedDockNumber === dock
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20 scale-105'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {dock}
                  </button>
                )
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setDockingEntry(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDockAllocation}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
              >
                Confirm Dock Allocation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
