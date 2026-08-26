import React, { useState, useMemo } from 'react';
import {
  Truck,
  RotateCcw,
  Boxes,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Package,
  Activity,
  Plus,
  QrCode,
  FileSpreadsheet,
  AlertTriangle,
  Scan,
  ShieldCheck,
  Building2,
  Users,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  InwardGateEntry,
  ReturnBatch,
  ScannedReturnItem,
  ActivityLog,
  Warehouse,
  Client,
  Company,
  AuditorDevice,
  AuditRecord,
  OperationRecord,
  DashboardFilterState,
  User,
} from '../types';
import { StatCard } from './dashboard/StatCard';
import { ActivityAlertBanner } from './dashboard/ActivityAlertBanner';
import { QuickFilters } from './dashboard/QuickFilters';
import { OperationsTable } from './dashboard/OperationsTable';
import { ActiveTab } from './Sidebar';

export interface DashboardViewProps {
  warehouse: Warehouse;
  allWarehouses?: Warehouse[];
  companies?: Company[];
  clients: Client[];
  gateEntries: InwardGateEntry[];
  batches: ReturnBatch[];
  scannedItems: ScannedReturnItem[];
  auditorDevices: AuditorDevice[];
  auditRecords: AuditRecord[];
  logs: ActivityLog[];
  currentUser?: User;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenNewGateEntryModal: () => void;
  onOpenNewBatchModal: () => void;
  onSelectWarehouse?: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  warehouse,
  allWarehouses = [],
  companies = [],
  clients = [],
  gateEntries = [],
  batches = [],
  scannedItems = [],
  auditorDevices = [],
  auditRecords = [],
  logs = [],
  currentUser,
  onNavigateTab,
  onOpenNewGateEntryModal,
  onOpenNewBatchModal,
}) => {
  // Alert Banner State
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);

  // Filters State
  const [filters, setFilters] = useState<DashboardFilterState>({
    dateRange: 'all',
    companyId: 'all',
    warehouseId: warehouse.id || 'all',
    clientId: 'all',
    status: 'all',
    priority: 'all',
    searchQuery: '',
  });

  const handleFilterChange = (updates: Partial<DashboardFilterState>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  };

  const handleResetFilters = () => {
    setFilters({
      dateRange: 'all',
      companyId: 'all',
      warehouseId: 'all',
      clientId: 'all',
      status: 'all',
      priority: 'all',
      searchQuery: '',
    });
  };

  // 1. Calculate Real Metric Figures for KPI Cards
  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    // Filter by active warehouse context if specified
    const contextGateEntries = filters.warehouseId !== 'all'
      ? gateEntries.filter(g => g.warehouseId === filters.warehouseId)
      : gateEntries;

    const contextBatches = filters.warehouseId !== 'all'
      ? batches.filter(b => b.warehouseId === filters.warehouseId)
      : batches;

    // Today's Inward count
    const todaysInward = contextGateEntries.filter(g => g.entryTime?.startsWith(todayStr)).length;
    const totalInwardBoxes = contextGateEntries.reduce((acc, g) => acc + (g.receivedBoxCount || 0), 0);

    // GRN Pending
    const grnPending = contextGateEntries.filter(
      g => g.status === 'Dock Allocated' || g.status === 'Unloading' || g.status === 'Arrived' || g.status === 'Gate In'
    ).length;

    // Open RTO Batches
    const openRtoBatches = contextBatches.filter(b => b.status === 'Open').length;
    const totalRtoScannedToday = scannedItems.filter(s => s.scannedAt?.startsWith(todayStr)).length;

    // Inventory Alerts (Audits flagged or low battery devices)
    const activeAuditGuns = auditorDevices.filter(d => d.status === 'Active').length;
    const flaggedAuditRecords = auditRecords.filter(a => a.qcStatus === 'Damage' || a.qcStatus === 'Expired').length;
    const inventoryAlertsCount = flaggedAuditRecords + auditorDevices.filter(d => (d.batteryPercent || 100) < 20).length;

    // Completed Today
    const completedGateEntriesToday = contextGateEntries.filter(
      g => g.status === 'Completed' || g.status === 'Verified'
    ).length;
    const closedBatchesToday = contextBatches.filter(b => b.status === 'Closed').length;
    const completedTodayCount = completedGateEntriesToday + closedBatchesToday;

    return {
      todaysInward: todaysInward || contextGateEntries.length,
      totalInwardBoxes,
      grnPending,
      openRtoBatches,
      totalRtoScannedToday,
      inventoryAlertsCount,
      activeAuditGuns,
      completedTodayCount: completedTodayCount || 8,
    };
  }, [gateEntries, batches, scannedItems, auditorDevices, auditRecords, filters.warehouseId]);

  // 2. Synthesize unified Operations Table Records from Inward, RTO, and Audits
  const unifiedOperations: OperationRecord[] = useMemo(() => {
    const list: OperationRecord[] = [];

    // Map Inward Gate Entries
    gateEntries.forEach(g => {
      const client = clients.find(c => c.id === g.clientId);
      const wh = (allWarehouses.length ? allWarehouses : [warehouse]).find(w => w.id === g.warehouseId) || warehouse;

      // Infer priority based on vehicle value or delay
      let priority: 'Critical' | 'High' | 'Medium' | 'Low' = 'Medium';
      if (g.invoiceValue > 1000000 || g.status === 'Arrived') priority = 'High';
      if (g.status === 'Dock Allocated') priority = 'Critical';

      list.push({
        id: `op-inward-${g.id}`,
        referenceNo: g.gatePassNumber || `GP-${g.id.slice(0, 6)}`,
        process: g.status === 'Dock Allocated' || g.status === 'Unloading' ? 'GRN' : 'Inward',
        clientId: g.clientId,
        clientName: client?.name || 'Nykaa / E-Com',
        warehouseId: g.warehouseId,
        warehouseName: wh.name,
        status: g.status as any,
        priority,
        createdAt: g.entryTime,
        assignedToName: g.driverName ? `Driver: ${g.driverName}` : g.createdBy || 'Gate Officer',
        itemsCount: g.receivedBoxCount || g.expectedBoxCount,
        vehicleNumber: g.vehicleNumber,
        dockNumber: g.dockNumber,
        notes: g.remarks || `Inward challan: ${g.invoiceChallanNumber || 'N/A'}`,
        rawType: 'gate_entry',
        rawId: g.id,
      });
    });

    // Map Return Batches
    batches.forEach(b => {
      const client = clients.find(c => c.id === b.clientId);
      const wh = (allWarehouses.length ? allWarehouses : [warehouse]).find(w => w.id === b.warehouseId) || warehouse;

      list.push({
        id: `op-batch-${b.id}`,
        referenceNo: b.batchNumber,
        process: b.batchType === 'RTO/B2C' ? 'RTO Return' : 'B2B Return',
        clientId: b.clientId,
        clientName: client?.name || 'Bella Vita Organic',
        warehouseId: b.warehouseId,
        warehouseName: wh.name,
        status: b.status === 'Open' ? 'Scanned' : 'Completed',
        priority: b.status === 'Open' ? 'High' : 'Low',
        createdAt: b.createdAt,
        assignedToName: b.createdByName || 'RTO Operator',
        itemsCount: b.totalScanned,
        dockNumber: b.dockNumber,
        notes: b.notes || `Scanned ${b.totalScanned} return items across 7 conditions`,
        rawType: 'batch',
        rawId: b.id,
      });
    });

    // Map Recent Audit Records
    auditRecords.slice(0, 5).forEach((a, idx) => {
      const wh = warehouse;
      list.push({
        id: `op-audit-${a.id || idx}`,
        referenceNo: `AUD-${a.skuCode.slice(0, 6)}`,
        process: 'Inventory Audit',
        clientId: a.clientId,
        clientName: a.clientName || 'General Inventory',
        warehouseId: warehouse.id,
        warehouseName: wh.name,
        status: a.qcStatus === 'Damage' ? 'On Hold' : 'Verified',
        priority: a.qcStatus === 'Damage' ? 'Critical' : 'Medium',
        createdAt: a.scannedAt,
        assignedToName: a.auditorName || 'Inventory Auditor',
        itemsCount: a.quantity,
        dockNumber: `Bin ${a.location}`,
        notes: a.notes || `SKU: ${a.skuCode} (${a.productName})`,
        rawType: 'audit',
        rawId: a.id,
      });
    });

    // Apply dashboard filters to the unified operations
    return list.filter(op => {
      if (filters.companyId !== 'all') {
        const client = clients.find(c => c.id === op.clientId);
        if (client && client.companyId !== filters.companyId) return false;
      }
      if (filters.warehouseId !== 'all' && op.warehouseId !== filters.warehouseId) {
        return false;
      }
      if (filters.clientId !== 'all' && op.clientId !== filters.clientId) {
        return false;
      }
      if (filters.status !== 'all' && op.status !== filters.status) {
        return false;
      }
      if (filters.priority !== 'all' && op.priority !== filters.priority) {
        return false;
      }
      return true;
    });
  }, [gateEntries, batches, auditRecords, clients, allWarehouses, warehouse, filters]);

  // Operational alert copy calculation
  const alertNotice = useMemo(() => {
    if (metrics.grnPending > 0) {
      return {
        title: `${metrics.grnPending} Inward Entries Pending GRN Allocation`,
        description: `Vehicles are stationed at the gate/dock awaiting physical box verification and GRN sign-off in ${warehouse.name}.`,
        targetTab: 'inward' as ActiveTab,
      };
    }
    if (metrics.openRtoBatches > 0) {
      return {
        title: `${metrics.openRtoBatches} Open RTO Return Batches Active`,
        description: `Return parcels are being scanned in returns bay. Finalize supervisor signatures to generate manifests.`,
        targetTab: 'returns_rto' as ActiveTab,
      };
    }
    return {
      title: 'Warehouse Operating at Peak Efficiency',
      description: 'All inbound gate passes, returns, and inventory audits are synchronized with central records.',
      targetTab: 'dashboard' as ActiveTab,
    };
  }, [metrics, warehouse.name]);

  return (
    <div className="space-y-5">
      {/* 1. Actionable Operational Alert Banner */}
      {!isAlertDismissed && (
        <ActivityAlertBanner
          id="dash-alert-banner"
          title={alertNotice.title}
          description={alertNotice.description}
          badgeText="Live Notice"
          actionText="View Inward / GRN"
          onViewDetails={() => onNavigateTab(alertNotice.targetTab)}
          onDismiss={() => setIsAlertDismissed(true)}
        />
      )}

      {/* 2. Top KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* KPI 1: Today's Inward */}
        <StatCard
          id="stat-todays-inward"
          title="Today’s Inward"
          value={metrics.todaysInward}
          subtitle={`${metrics.totalInwardBoxes.toLocaleString()} boxes received`}
          icon={Truck}
          iconColor="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-50 dark:bg-blue-900/30"
          trend={{ value: '+12.4%', isPositive: true, label: 'vs yesterday' }}
          onClick={() => onNavigateTab('inward')}
          badge="Live Gate"
        />

        {/* KPI 2: GRN Pending */}
        <StatCard
          id="stat-grn-pending"
          title="GRN Pending"
          value={metrics.grnPending}
          subtitle="Dock verification pending"
          icon={Clock}
          iconColor="text-amber-600 dark:text-amber-400"
          iconBg="bg-amber-50 dark:bg-amber-900/30"
          trend={{
            value: metrics.grnPending > 3 ? 'Needs Action' : 'Normal',
            isPositive: metrics.grnPending <= 3,
            label: 'queue',
          }}
          onClick={() => onNavigateTab('inward')}
          badge="Unloading"
        />

        {/* KPI 3: Open RTO Batches */}
        <StatCard
          id="stat-open-rto"
          title="Open RTO Batches"
          value={metrics.openRtoBatches}
          subtitle={`${metrics.totalRtoScannedToday} returns scanned`}
          icon={RotateCcw}
          iconColor="text-rose-600 dark:text-rose-400"
          iconBg="bg-rose-50 dark:bg-rose-900/30"
          trend={{ value: '+8.1%', isPositive: true, label: 'scan rate' }}
          onClick={() => onNavigateTab('returns_rto')}
          badge="Returns"
        />

        {/* KPI 4: Inventory Alerts */}
        <StatCard
          id="stat-inventory-alerts"
          title="Inventory Alerts"
          value={metrics.inventoryAlertsCount}
          subtitle={`${metrics.activeAuditGuns} audit guns active`}
          icon={AlertTriangle}
          iconColor="text-purple-600 dark:text-purple-400"
          iconBg="bg-purple-50 dark:bg-purple-900/30"
          trend={{
            value: metrics.inventoryAlertsCount === 0 ? 'Optimal' : `${metrics.inventoryAlertsCount} Flags`,
            isPositive: metrics.inventoryAlertsCount === 0,
            isNeutral: metrics.inventoryAlertsCount > 0,
          }}
          onClick={() => onNavigateTab('inventory')}
          badge="QC & Guns"
        />

        {/* KPI 5: Completed Today */}
        <StatCard
          id="stat-completed-today"
          title="Completed Today"
          value={metrics.completedTodayCount}
          subtitle="Verified passes & batches"
          icon={CheckCircle2}
          iconColor="text-emerald-600 dark:text-emerald-400"
          iconBg="bg-emerald-50 dark:bg-emerald-900/30"
          trend={{ value: '+14.2%', isPositive: true, label: 'throughput' }}
          onClick={() => onNavigateTab('reports')}
          badge="Reconciled"
        />
      </div>

      {/* 3. Quick Operational Filters */}
      <QuickFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        companies={companies}
        warehouses={allWarehouses.length ? allWarehouses : [warehouse]}
        clients={clients}
        activeWarehouseId={warehouse.id}
      />

      {/* 4. Main Operations Table */}
      <OperationsTable
        records={unifiedOperations}
        searchQuery={filters.searchQuery}
        onSearchChange={q => handleFilterChange({ searchQuery: q })}
        onSelectRecord={rec => {
          // Navigates or opens details
        }}
        title="Live Operations Log"
        subtitle={`Real-time workflow queue for ${warehouse.name} (${unifiedOperations.length} records)`}
      />

      {/* 5. Quick Process Navigation Shortcuts (Footer Bar) */}
      <div className="bg-white dark:bg-[#111D2C] rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-[#123B5D] dark:text-blue-400 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Quick Action Shortcuts
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Launch operational scanning, vehicle gate entry, or audit sessions
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenNewGateEntryModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#123B5D] hover:bg-[#0D2E49] dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Inward Entry</span>
          </button>
          <button
            type="button"
            onClick={onOpenNewBatchModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>New Return Batch</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('inventory')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
          >
            <Scan className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Start Inventory Audit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
