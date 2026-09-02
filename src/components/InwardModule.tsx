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
  ShieldCheck,
  Package,
  Layers,
  ArrowRight,
  Eye,
  Building2,
  CheckSquare,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import {
  InwardGateEntry,
  Warehouse,
  Client,
  Courier,
  VehicleType,
  User,
  Driver,
  Phase1SecurityData,
  Phase2UnloadingData,
  Phase3HandoverData,
} from '../types';
import { generateGatePassPDF } from '../utils/pdfGenerator';
import { Phase1SecurityModal } from './inward/Phase1SecurityModal';
import { Phase2DockQCModal } from './inward/Phase2DockQCModal';
import { Phase3HandoverModal } from './inward/Phase3HandoverModal';
import { GateEntryDetailsModal } from './inward/GateEntryDetailsModal';

interface InwardModuleProps {
  currentUser: User;
  activeWarehouse: Warehouse;
  gateEntries: InwardGateEntry[];
  clients: Client[];
  couriers: Courier[];
  vehicleTypes: VehicleType[];
  drivers?: Driver[];
  onAddGateEntry: (entry: Omit<InwardGateEntry, 'id' | 'gatePassNumber' | 'entryTime'> & { phase1Data?: Phase1SecurityData }) => void;
  onUpdateGateStatus: (id: string, status: InwardGateEntry['status'], dockNumber?: string) => void;
  onUpdateGateEntryPhase2?: (id: string, phase2Data: Phase2UnloadingData) => void;
  onUpdateGateEntryPhase3?: (id: string, phase3Data: Phase3HandoverData) => void;
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
  drivers = [],
  onAddGateEntry,
  onUpdateGateStatus,
  onUpdateGateEntryPhase2,
  onUpdateGateEntryPhase3,
  isOpenCreateModal,
  onCloseCreateModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [phaseFilter, setPhaseFilter] = useState<string>('ALL');
  const [accountFilter, setAccountFilter] = useState<string>('ALL');

  // Modals state
  const [phase2TargetEntry, setPhase2TargetEntry] = useState<InwardGateEntry | null>(null);
  const [phase3TargetEntry, setPhase3TargetEntry] = useState<InwardGateEntry | null>(null);
  const [detailsTargetEntry, setDetailsTargetEntry] = useState<InwardGateEntry | null>(null);

  // Filter gate entries for current warehouse
  const warehouseEntries = gateEntries.filter(e => e.warehouseId === activeWarehouse.id);

  // Filtered entries based on search and phase tabs
  const filteredEntries = warehouseEntries.filter(entry => {
    // Phase filtering
    if (phaseFilter === 'PHASE_1') {
      if (entry.status === 'Handover Completed' || entry.status === 'Completed' || entry.phase2 || entry.status === 'QC Completed') return false;
    } else if (phaseFilter === 'PHASE_2') {
      if (entry.status === 'Handover Completed' || entry.status === 'Completed' || entry.phase3) return false;
      if (!entry.phase2 && entry.status !== 'Gate In' && entry.status !== 'Dock Allocated' && entry.status !== 'Unloading') return false;
    } else if (phaseFilter === 'PHASE_3_PENDING') {
      if (entry.status === 'Handover Completed' || entry.status === 'Completed' || entry.phase3) return false;
      if (!entry.phase2 && entry.status !== 'QC Completed') return false;
    } else if (phaseFilter === 'COMPLETED') {
      if (entry.status !== 'Handover Completed' && entry.status !== 'Completed' && !entry.phase3) return false;
    }

    // Account filtering
    if (accountFilter !== 'ALL' && entry.clientId !== accountFilter) {
      return false;
    }

    // Search query
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const client = clients.find(c => c.id === entry.clientId);
    const courier = couriers.find(cr => cr.id === entry.courierId);
    const dockets = entry.phase2?.dockets || [];
    const hasDocketMatch = dockets.some(d =>
      d.docketNumber.toLowerCase().includes(q) ||
      d.invoices.some(i => i.invoiceNumber.toLowerCase().includes(q))
    );

    return (
      entry.gatePassNumber.toLowerCase().includes(q) ||
      entry.vehicleNumber.toLowerCase().includes(q) ||
      entry.driverName.toLowerCase().includes(q) ||
      entry.driverMobile.includes(q) ||
      (client && client.name.toLowerCase().includes(q)) ||
      (courier && courier.name.toLowerCase().includes(q)) ||
      (entry.dockNumber && entry.dockNumber.toLowerCase().includes(q)) ||
      hasDocketMatch
    );
  });

  // KPI Metrics
  const totalEntriesCount = warehouseEntries.length;
  const phase1Count = warehouseEntries.filter(e => !e.phase2 && e.status !== 'Handover Completed' && e.status !== 'Completed').length;
  const phase2Count = warehouseEntries.filter(e => (!e.phase3 && (e.phase2 || e.status === 'QC Completed' || e.status === 'Unloading'))).length;
  const phase3CompletedCount = warehouseEntries.filter(e => e.phase3 || e.status === 'Handover Completed' || e.status === 'Completed').length;
  const totalBoxesSum = warehouseEntries.reduce((sum, e) => {
    if (e.phase3) return sum + (e.phase3.receivedBoxesConfirmed || 0);
    if (e.phase2) return sum + (e.phase2.totalBoxesCount || 0);
    return sum + (e.expectedBoxCount || 0);
  }, 0);

  // Submit Phase 1
  const handlePhase1Submit = (entryData: any) => {
    onAddGateEntry(entryData);
  };

  // Submit Phase 2
  const handlePhase2Submit = (gateEntryId: string, phase2Data: Phase2UnloadingData) => {
    if (onUpdateGateEntryPhase2) {
      onUpdateGateEntryPhase2(gateEntryId, phase2Data);
    } else {
      // Fallback
      onUpdateGateStatus(gateEntryId, 'QC Completed', phase2Data.dockConfirmed);
    }
  };

  // Submit Phase 3
  const handlePhase3Submit = (gateEntryId: string, phase3Data: Phase3HandoverData) => {
    if (onUpdateGateEntryPhase3) {
      onUpdateGateEntryPhase3(gateEntryId, phase3Data);
    } else {
      // Fallback
      onUpdateGateStatus(gateEntryId, 'Handover Completed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-theme pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Truck className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-extrabold text-primary">
              Inward Gate Entry & 3-Phase Workflow
            </h1>
          </div>
          <p className="text-xs text-secondary mt-1">
            Linked 1 Vehicle = 1 Gate Entry ID workflow across <strong>Security Check-In</strong>, <strong>Dock QC</strong>, and <strong>Account Handover</strong> at <strong className="text-primary">{activeWarehouse.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onCloseCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#123B5D] hover:bg-[#0D2E49] dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Gate Entry (Phase 01)</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-surface border border-theme shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-muted block uppercase font-bold tracking-wider">Total Inward Entries</span>
            <span className="text-lg font-extrabold text-primary font-mono">{totalEntriesCount} Vehicles</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-theme shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-muted block uppercase font-bold tracking-wider">Phase 01 (Security)</span>
            <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">{phase1Count} At Gate</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-theme shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-muted block uppercase font-bold tracking-wider">Phase 02 (Dock QC)</span>
            <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400 font-mono">{phase2Count} In Progress</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-theme shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-muted block uppercase font-bold tracking-wider">Phase 03 (Completed)</span>
            <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{phase3CompletedCount} Handover Done</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-theme shadow-xs flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-200 dark:border-purple-800">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-muted block uppercase font-bold tracking-wider">Total Cartons / Boxes</span>
            <span className="text-lg font-extrabold text-primary font-mono">{totalBoxesSum} Received</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-surface border border-theme p-4 rounded-xl shadow-xs transition-colors">
        {/* Search */}
        <div className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Gate Entry ID, Vehicle No, Driver, Docket No, Invoice..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-elevated border border-theme text-xs text-primary placeholder:text-muted rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>

        {/* Dynamic Account Filter + Phase Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Account Filter */}
          <div className="flex items-center gap-1.5 bg-elevated border border-theme px-3 py-1.5 rounded-xl text-xs">
            <Building2 className="w-3.5 h-3.5 text-muted" />
            <select
              value={accountFilter}
              onChange={e => setAccountFilter(e.target.value)}
              className="bg-transparent text-primary font-bold text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Accounts</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Phase Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { label: 'All Phases', value: 'ALL' },
              { label: 'Phase 01: Security', value: 'PHASE_1' },
              { label: 'Phase 02: Dock QC', value: 'PHASE_2' },
              { label: 'Phase 03: Pending', value: 'PHASE_3_PENDING' },
              { label: 'Handover Completed', value: 'COMPLETED' },
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setPhaseFilter(tab.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                  phaseFilter === tab.value
                    ? 'bg-[#123B5D] dark:bg-blue-600 text-white border-[#123B5D] dark:border-blue-500 shadow-xs'
                    : 'bg-elevated text-secondary hover:text-primary border-theme hover:bg-elevated/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Linked Workflow Entries Table */}
      <div className="bg-surface border border-theme rounded-xl overflow-hidden shadow-xs transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-theme bg-elevated/60 text-secondary text-[11px] font-extrabold uppercase tracking-wider">
                <th className="py-3.5 px-4">Gate Entry ID & Time</th>
                <th className="py-3.5 px-4">Vehicle & Driver</th>
                <th className="py-3.5 px-4">Account (Client) & Courier</th>
                <th className="py-3.5 px-4">Dock & Volume</th>
                <th className="py-3.5 px-4">Linked Phase Status</th>
                <th className="py-3.5 px-4">Phase QC Breakdown</th>
                <th className="py-3.5 px-4 text-right">Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme text-xs">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted font-mono text-xs">
                    No inward gate entries match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredEntries.map(entry => {
                  const client = clients.find(c => c.id === entry.clientId);
                  const courier = couriers.find(cr => cr.id === entry.courierId);
                  const vehicleType = vehicleTypes.find(vt => vt.id === entry.vehicleTypeId);

                  const isPhase1Only = !entry.phase2 && entry.status !== 'Handover Completed' && entry.status !== 'Completed';
                  const isPhase2Done = !!entry.phase2;
                  const isPhase3Done = !!entry.phase3 || entry.status === 'Handover Completed' || entry.status === 'Completed';

                  return (
                    <tr key={entry.id} className="hover:bg-elevated/40 transition-colors">
                      {/* Gate Entry ID */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-extrabold text-blue-600 dark:text-blue-400 text-xs">
                          {entry.gatePassNumber}
                        </div>
                        <div className="text-[10px] text-muted font-mono mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{entry.phase1?.gateEntryDateTime || new Date(entry.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>

                      {/* Vehicle & Driver */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-primary flex items-center gap-1.5 font-mono">
                          {entry.vehicleNumber}
                          <span className="text-[10px] font-sans font-normal text-muted">
                            ({vehicleType?.typeName || 'Truck'})
                          </span>
                        </div>
                        <div className="text-[11px] text-secondary mt-0.5">
                          {entry.driverName} <span className="text-muted font-mono">({entry.driverMobile})</span>
                        </div>
                      </td>

                      {/* Account & Courier */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-primary flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span>{client ? client.name : 'Account'}</span>
                        </div>
                        <div className="text-[11px] text-secondary mt-0.5">
                          {courier ? courier.name : 'Courier Partner'}
                        </div>
                      </td>

                      {/* Dock & Volume */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">
                          {entry.dockNumber || 'Dock 01'}
                        </div>
                        <div className="text-[11px] text-secondary font-mono mt-0.5">
                          {entry.phase2 ? `${entry.phase2.totalBoxesCount} Boxes` : `${entry.expectedBoxCount || 0} Declared`}
                        </div>
                      </td>

                      {/* Linked Phase Status */}
                      <td className="py-3.5 px-4">
                        {isPhase3Done ? (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" /> Phase 03: Completed
                          </span>
                        ) : isPhase2Done ? (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1 w-fit">
                            <Package className="w-3 h-3" /> Phase 02: QC Done
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 w-fit">
                            <ShieldCheck className="w-3 h-3" /> Phase 01: Security Done
                          </span>
                        )}
                      </td>

                      {/* QC Breakdown */}
                      <td className="py-3.5 px-4">
                        {entry.phase2 ? (
                          <div className="text-[10px] font-mono space-y-0.5">
                            <div className="text-secondary">
                              <strong>{entry.phase2.totalDocketsCount}</strong> Dkts | <strong>{entry.phase2.totalInvoicesCount}</strong> Invs
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-emerald-600 font-bold">{entry.phase2.goodCount} Good</span>
                              {(entry.phase2.damageCount > 0 || entry.phase2.openBoxesCount > 0 || entry.phase2.missingBoxesCount > 0) && (
                                <span className="text-rose-600 font-bold">
                                  {(entry.phase2.damageCount || 0) + (entry.phase2.openBoxesCount || 0) + (entry.phase2.missingBoxesCount || 0)} Issue
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted italic">Awaiting Dock QC</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {/* Phase Action: Open Phase 2 if Phase 1 */}
                        {isPhase1Only && (
                          <button
                            onClick={() => setPhase2TargetEntry(entry)}
                            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <span>Phase 02: Dock QC</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        {/* Phase Action: Open Phase 3 if Phase 2 is completed but Phase 3 is pending */}
                        {isPhase2Done && !isPhase3Done && (
                          <button
                            onClick={() => setPhase3TargetEntry(entry)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <span>Phase 03: Handover</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        {/* View Full Timeline Modal */}
                        <button
                          onClick={() => setDetailsTargetEntry(entry)}
                          className="p-1.5 rounded-lg bg-elevated hover:bg-elevated/80 text-secondary border border-theme inline-flex items-center justify-center transition-colors cursor-pointer"
                          title="View 3-Phase Linked Record"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Download 3-Phase PDF Pass */}
                        <button
                          onClick={() => generateGatePassPDF(entry, activeWarehouse, client, courier)}
                          className="p-1.5 rounded-lg bg-elevated hover:bg-elevated/80 text-secondary border border-theme inline-flex items-center justify-center transition-colors cursor-pointer"
                          title="Download 3-Phase Gate Pass PDF"
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

      {/* Phase 01 Modal (Security Check-In) */}
      <Phase1SecurityModal
        isOpen={isOpenCreateModal}
        onClose={onCloseCreateModal}
        currentUser={currentUser}
        activeWarehouse={activeWarehouse}
        clients={clients}
        couriers={couriers}
        vehicleTypes={vehicleTypes}
        drivers={drivers}
        onSubmitPhase1={handlePhase1Submit}
      />

      {/* Phase 02 Modal (Unloading & Dock QC) */}
      <Phase2DockQCModal
        isOpen={!!phase2TargetEntry}
        entry={phase2TargetEntry}
        onClose={() => setPhase2TargetEntry(null)}
        currentUser={currentUser}
        activeWarehouse={activeWarehouse}
        clients={clients}
        couriers={couriers}
        onSubmitPhase2={handlePhase2Submit}
      />

      {/* Phase 03 Modal (Handover Taken) */}
      <Phase3HandoverModal
        isOpen={!!phase3TargetEntry}
        entry={phase3TargetEntry}
        onClose={() => setPhase3TargetEntry(null)}
        currentUser={currentUser}
        activeWarehouse={activeWarehouse}
        clients={clients}
        onSubmitPhase3={handlePhase3Submit}
      />

      {/* 3-Phase Comprehensive Details Modal */}
      <GateEntryDetailsModal
        isOpen={!!detailsTargetEntry}
        entry={detailsTargetEntry}
        onClose={() => setDetailsTargetEntry(null)}
        warehouse={activeWarehouse}
        clients={clients}
        couriers={couriers}
        vehicleTypes={vehicleTypes}
        onOpenPhase2={entry => {
          setPhase2TargetEntry(entry);
        }}
        onOpenPhase3={entry => {
          setPhase3TargetEntry(entry);
        }}
      />
    </div>
  );
};
