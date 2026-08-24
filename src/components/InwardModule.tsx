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
  const [invoiceValue, setInvoiceValue] = useState<number>(100000);
  const [expectedBoxCount, setExpectedBoxCount] = useState<number>(50);
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
      invoiceValue,
      expectedBoxCount,
      receivedBoxCount: expectedBoxCount,
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
    <div className="p-6 space-y-6">
      {/* Module Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-400" /> Inward Gate Entry & Dock Control
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Register incoming transport, allocate unloading docks, and verify received cartons at {activeWarehouse.name}.
          </p>
        </div>

        <button
          onClick={onCloseCreateModal} // toggles modal if already closed, passed from parent
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" /> Create Gate Pass
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Gate Pass #, Vehicle #, Driver Name, Invoice..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 text-slate-200 pl-9 pr-3 py-1.5 rounded-lg text-xs border border-slate-700/80 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {['ALL', 'Gate In', 'Dock Allocated', 'Unloading', 'Verified', 'Completed'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Gate Entries Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-bold text-[10px] border-b border-slate-700/80">
              <tr>
                <th className="px-4 py-3">Gate Pass #</th>
                <th className="px-4 py-3">Vehicle Details</th>
                <th className="px-4 py-3">Driver Info</th>
                <th className="px-4 py-3">Client & Courier</th>
                <th className="px-4 py-3">Invoice / Boxes</th>
                <th className="px-4 py-3">Dock Assigned</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No inward gate entries match the filter.
                  </td>
                </tr>
              ) : (
                filteredEntries.map(entry => {
                  const client = clients.find(c => c.id === entry.clientId);
                  const courier = couriers.find(cr => cr.id === entry.courierId);
                  const vt = vehicleTypes.find(v => v.id === entry.vehicleTypeId);

                  return (
                    <tr key={entry.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-white">
                        <div>{entry.gatePassNumber}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {new Date(entry.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-extrabold text-white text-xs">{entry.vehicleNumber}</div>
                        <div className="text-[10px] text-slate-400">{vt ? vt.typeName : 'Commercial Vehicle'}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-200">{entry.driverName}</div>
                        <div className="text-[10px] text-slate-400">{entry.driverMobile}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-200">{client ? client.name : 'Nykaa'}</div>
                        <div className="text-[10px] text-slate-400">{courier ? courier.name : 'Delhivery'}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-bold text-blue-400">{entry.expectedBoxCount} Cartons</div>
                        <div className="text-[10px] text-slate-400">
                          {entry.invoiceChallanNumber || 'No Inv'} • ₹{entry.invoiceValue.toLocaleString()}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-bold text-amber-400">
                        {entry.dockNumber ? (
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                            {entry.dockNumber}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            entry.status === 'Completed'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : entry.status === 'Unloading'
                              ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse'
                              : entry.status === 'Dock Allocated'
                              ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {entry.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right space-x-2">
                        {/* Status workflow triggers */}
                        {entry.status === 'Gate In' && (
                          <button
                            onClick={() => setDockingEntry(entry)}
                            className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px]"
                          >
                            Assign Dock
                          </button>
                        )}

                        {entry.status === 'Dock Allocated' && (
                          <button
                            onClick={() => onUpdateGateStatus(entry.id, 'Unloading')}
                            className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px]"
                          >
                            Start Unloading
                          </button>
                        )}

                        {entry.status === 'Unloading' && (
                          <button
                            onClick={() => onUpdateGateStatus(entry.id, 'Verified')}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]"
                          >
                            Verify & Complete
                          </button>
                        )}

                        {/* Download PDF Pass */}
                        <button
                          onClick={() => generateGatePassPDF(entry, activeWarehouse, client, courier)}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Download Gate Pass PDF"
                        >
                          <Download className="w-4 h-4" />
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
