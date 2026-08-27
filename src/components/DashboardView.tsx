import React, { useState, useMemo } from 'react';
import {
  Truck,
  RotateCcw,
  Boxes,
  Scan,
  Smartphone,
  Calendar,
  ChevronDown,
  Plus,
  QrCode,
  Tag,
  Clock,
  ChevronUp,
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
  User,
} from '../types';
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
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('all');
  const [isClientFilterOpen, setIsClientFilterOpen] = useState(false);
  const [isInwardCollapsed, setIsInwardCollapsed] = useState(false);
  const [isOperatorsCollapsed, setIsOperatorsCollapsed] = useState(false);

  // Formatted display date (e.g. Thu, Aug 27, 2026)
  const currentDateDisplay = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date());
  }, []);

  // Filtered dataset based on selected client filter
  const activeScannedItems = useMemo(() => {
    if (selectedClientFilter === 'all') return scannedItems;
    const batchIds = batches.filter(b => b.clientId === selectedClientFilter).map(b => b.id);
    return scannedItems.filter(s => batchIds.includes(s.batchId));
  }, [scannedItems, batches, selectedClientFilter]);

  // Metrics Calculation
  const metrics = useMemo(() => {
    const totalScanned = activeScannedItems.length;

    // 7 QC Conditions Breakdown
    const goodCount = activeScannedItems.filter(s => s.qcCondition === 'GOOD').length;
    const damageCount = activeScannedItems.filter(s => s.qcCondition === 'DAMAGE').length;
    const openBoxCount = activeScannedItems.filter(s => s.qcCondition === 'OPEN BOX').length;
    const wrongProdCount = activeScannedItems.filter(s => s.qcCondition === 'WRONG PROD').length;
    const shortQtyCount = activeScannedItems.filter(s => s.qcCondition === 'SHORT QTY').length;
    const missingCount = activeScannedItems.filter(s => s.qcCondition === 'MISSING').length;
    const othersCount = activeScannedItems.filter(s => s.qcCondition === 'OTHERS').length;

    const defectiveCount = totalScanned - goodCount;
    const goodPct = totalScanned > 0 ? Math.round((goodCount / totalScanned) * 100) : 0;
    const damagePct = totalScanned > 0 ? Math.round((damageCount / totalScanned) * 100) : 0;
    const openBoxPct = totalScanned > 0 ? Math.round((openBoxCount / totalScanned) * 100) : 0;
    const wrongProdPct = totalScanned > 0 ? Math.round((wrongProdCount / totalScanned) * 100) : 0;
    const shortQtyPct = totalScanned > 0 ? Math.round((shortQtyCount / totalScanned) * 100) : 0;
    const missingPct = totalScanned > 0 ? Math.round((missingCount / totalScanned) * 100) : 0;
    const othersPct = totalScanned > 0 ? Math.round((othersCount / totalScanned) * 100) : 0;

    // Gate Inward
    const inwardVehiclesCount = gateEntries.length;
    const totalBoxesUnloaded = gateEntries.reduce((acc, g) => acc + (g.receivedBoxCount || 0), 0);

    // Cycle Count
    const totalCycleScans = auditRecords.length;
    const binsAudited = new Set(auditRecords.map(a => a.location)).size;

    // Scanner Guns
    const activeGuns = auditorDevices.filter(d => d.status === 'Active').length;

    return {
      totalScanned,
      goodCount,
      goodPct,
      defectiveCount,
      damageCount,
      damagePct,
      openBoxCount,
      openBoxPct,
      wrongProdCount,
      wrongProdPct,
      shortQtyCount,
      shortQtyPct,
      missingCount,
      missingPct,
      othersCount,
      othersPct,
      inwardVehiclesCount,
      totalBoxesUnloaded,
      totalCycleScans,
      binsAudited,
      activeGuns,
    };
  }, [activeScannedItems, gateEntries, auditRecords, auditorDevices]);

  // Client accounts list with color codes
  const clientAccountsList = useMemo(() => {
    const defaultPalette = ['#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#E11D48'];
    return clients.map((c, idx) => {
      const clientBatches = batches.filter(b => b.clientId === c.id);
      const clientBatchIds = clientBatches.map(b => b.id);
      const count = scannedItems.filter(s => clientBatchIds.includes(s.batchId)).length;
      const pct = metrics.totalScanned > 0 ? Math.round((count / metrics.totalScanned) * 100) : 0;

      // Inward entries for this client
      const clientGateEntries = gateEntries.filter(g => g.clientId === c.id);
      const vehCount = clientGateEntries.length;
      const boxCount = clientGateEntries.reduce((acc, g) => acc + (g.receivedBoxCount || 0), 0);

      return {
        id: c.id,
        name: c.name,
        color: defaultPalette[idx % defaultPalette.length],
        count,
        pct,
        vehCount,
        boxCount,
      };
    });
  }, [clients, batches, scannedItems, gateEntries, metrics.totalScanned]);

  // Selected client label for dropdown
  const selectedClientLabel = useMemo(() => {
    if (selectedClientFilter === 'all') {
      return `All Accounts (Whole Count — ${metrics.totalScanned} Units)`;
    }
    const found = clients.find(c => c.id === selectedClientFilter);
    return found ? `${found.name} (${metrics.totalScanned} Units)` : 'Select Account';
  }, [selectedClientFilter, clients, metrics.totalScanned]);

  // Render SVG Radial Tick Gauge
  const renderRadialGauge = () => {
    const totalTicks = 48;
    const radius = 64;
    const innerRadius = 52;
    const center = 80;

    const ticks = [];
    const activeTickCount = metrics.totalScanned > 0 
      ? Math.max(1, Math.round((metrics.goodPct / 100) * totalTicks))
      : 0;

    for (let i = 0; i < totalTicks; i++) {
      const angleDeg = (i / totalTicks) * 360 - 90;
      const angleRad = (angleDeg * Math.PI) / 180;

      const x1 = center + innerRadius * Math.cos(angleRad);
      const y1 = center + innerRadius * Math.sin(angleRad);
      const x2 = center + radius * Math.cos(angleRad);
      const y2 = center + radius * Math.sin(angleRad);

      const isActive = i < activeTickCount;
      const strokeColor = isActive ? '#10B981' : '#1E2D42';

      ticks.push(
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      );
    }

    return (
      <div className="relative flex items-center justify-center w-48 h-48 mx-auto select-none">
        <svg width="160" height="160" viewBox="0 0 160 160" className="w-full h-full">
          {ticks}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
            ALL ACCOUNTS
          </span>
          <span className="text-3xl font-black text-white my-0.5 tracking-tight">
            {metrics.totalScanned}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#062419] text-emerald-400 border border-emerald-700/70 text-[10px] font-bold">
            {metrics.goodCount} Good ({metrics.goodPct}%)
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 text-white">
      {/* 1. Header Row: Title, Facility Pill & Top Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Warehouse Operations Dashboard
          </h1>
          <span className="bg-[#122846] text-[#4F9CF8] border border-[#1E4378] text-xs font-semibold px-2.5 py-0.5 rounded-md">
            {warehouse.name || 'EMIZA Central Fulfillment Facility'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Start Return Batch Button */}
          <button
            type="button"
            id="btn-start-return-batch"
            onClick={onOpenNewBatchModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1864FF] hover:bg-[#1354DB] text-white text-xs font-bold shadow-md hover:shadow-blue-500/20 transition-all cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Start Return Batch</span>
          </button>

          {/* + Inward Gate Entry Button */}
          <button
            type="button"
            id="btn-inward-gate-entry"
            onClick={onOpenNewGateEntryModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#062424] hover:bg-[#093535] text-[#2DD4BF] border border-[#115E59]/70 text-xs font-semibold transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Inward Gate Entry</span>
          </button>

          {/* Audit Guns Button */}
          <button
            type="button"
            id="btn-audit-guns"
            onClick={() => onNavigateTab('inventory')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#241038] hover:bg-[#351752] text-[#C084FC] border border-[#6B21A8]/70 text-xs font-semibold transition-all cursor-pointer"
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Audit Guns</span>
          </button>
        </div>
      </div>

      {/* Date Pill Dropdown Selector */}
      <div className="pt-0.5">
        <button
          type="button"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0B1526] hover:bg-[#101F38] border border-slate-800 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentDateDisplay}</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>
      </div>

      {/* 2. Top 4 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: B2C Returns */}
        <div
          id="kpi-b2c-returns"
          onClick={() => onNavigateTab('returns_rto')}
          className="bg-[#0B1526] border border-slate-800/80 hover:border-slate-700/90 rounded-xl p-4 shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">B2C Returns</span>
            <div className="w-7 h-7 rounded-lg bg-blue-950/70 border border-blue-800/40 text-blue-400 flex items-center justify-center">
              <RotateCcw className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white tracking-tight">
              {metrics.totalScanned}
            </span>
            <span className="text-xs font-semibold text-slate-400">Units</span>
          </div>
          <div className="mt-1 text-xs font-medium text-emerald-400">
            {metrics.goodCount} Good ({metrics.goodPct}%) • {metrics.defectiveCount} Defects
          </div>
        </div>

        {/* KPI 2: Gate Inward */}
        <div
          id="kpi-gate-inward"
          onClick={() => onNavigateTab('inward')}
          className="bg-[#0B1526] border border-slate-800/80 hover:border-slate-700/90 rounded-xl p-4 shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Gate Inward</span>
            <div className="w-7 h-7 rounded-lg bg-teal-950/70 border border-teal-800/40 text-teal-400 flex items-center justify-center">
              <Truck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white tracking-tight">
              {metrics.inwardVehiclesCount}
            </span>
            <span className="text-xs font-semibold text-slate-400">Vehicles</span>
          </div>
          <div className="mt-1 text-xs font-medium text-emerald-400">
            {metrics.totalBoxesUnloaded} Boxes Unloaded
          </div>
        </div>

        {/* KPI 3: Cycle Count */}
        <div
          id="kpi-cycle-count"
          onClick={() => onNavigateTab('inventory')}
          className="bg-[#0B1526] border border-slate-800/80 hover:border-slate-700/90 rounded-xl p-4 shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Cycle Count</span>
            <div className="w-7 h-7 rounded-lg bg-purple-950/70 border border-purple-800/40 text-purple-400 flex items-center justify-center">
              <Scan className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white tracking-tight">
              {metrics.totalCycleScans}
            </span>
            <span className="text-xs font-semibold text-slate-400">Scans</span>
          </div>
          <div className="mt-1 text-xs font-medium text-purple-400">
            {metrics.binsAudited} Bins Audited
          </div>
        </div>

        {/* KPI 4: Scanner Guns */}
        <div
          id="kpi-scanner-guns"
          onClick={() => onNavigateTab('inventory')}
          className="bg-[#0B1526] border border-slate-800/80 hover:border-slate-700/90 rounded-xl p-4 shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Scanner Guns</span>
            <div className="w-7 h-7 rounded-lg bg-amber-950/70 border border-amber-800/40 text-amber-400 flex items-center justify-center">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white tracking-tight">
              {metrics.activeGuns}
            </span>
            <span className="text-xs font-semibold text-slate-400">Guns</span>
          </div>
          <div className="mt-1 text-xs font-medium text-amber-400">
            {metrics.activeGuns} Active on Floor
          </div>
        </div>
      </div>

      {/* 3. B2C Returns Live Operations Main Container */}
      <div className="bg-[#0B1526] border border-slate-800/80 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
        {/* Section Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-950 text-blue-400 flex items-center justify-center">
              <RotateCcw className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              B2C Returns Live Operations
            </h2>
          </div>

          {/* Account Filter Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsClientFilterOpen(!isClientFilterOpen)}
              className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-[#0E1A2E] hover:bg-[#152540] border border-slate-700/80 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
            >
              <span>{selectedClientLabel}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {isClientFilterOpen && (
              <div className="absolute right-0 mt-1.5 w-64 bg-[#0E1A2E] border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in-50 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClientFilter('all');
                    setIsClientFilterOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800/80 transition-colors ${
                    selectedClientFilter === 'all'
                      ? 'bg-blue-900/40 text-blue-300 font-bold'
                      : 'text-slate-300'
                  }`}
                >
                  <span>All Accounts</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {scannedItems.length} Units
                  </span>
                </button>
                {clients.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedClientFilter(c.id);
                      setIsClientFilterOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800/80 transition-colors ${
                      selectedClientFilter === c.id
                        ? 'bg-blue-900/40 text-blue-300 font-bold'
                        : 'text-slate-300'
                    }`}
                  >
                    <span className="truncate">{c.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 7 QC Conditions Bar */}
        <div className="bg-[#080F1D] border border-slate-800/80 rounded-xl p-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <Tag className="w-3 h-3 text-slate-400" />
              <span>CONDITIONS (ALL ACCOUNTS):</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="bg-[#072418] text-emerald-300 border border-emerald-800/80 text-xs px-2.5 py-0.5 rounded font-bold">
                {metrics.goodCount} Good ({metrics.goodPct}%)
              </span>
              <span className="bg-[#280D15] text-rose-300 border border-rose-800/80 text-xs px-2.5 py-0.5 rounded font-bold">
                {metrics.defectiveCount} Defective
              </span>
            </div>
          </div>

          {/* 7 Condition Badges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {/* 1. GOOD */}
            <div className="bg-[#062419] border border-emerald-700/60 text-emerald-400 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="truncate">1. GOOD</span>
              </div>
              <span className="font-mono text-[11px] font-bold shrink-0 ml-1">
                {metrics.goodCount} <span className="text-[10px] font-normal opacity-80">({metrics.goodPct}%)</span>
              </span>
            </div>

            {/* 2. DAMAGE */}
            <div className="bg-[#280D15] border border-rose-700/60 text-rose-400 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                <span className="truncate">2. DAMAGE</span>
              </div>
              <span className="font-mono text-[11px] font-bold shrink-0 ml-1">
                {metrics.damageCount} <span className="text-[10px] font-normal opacity-80">({metrics.damagePct}%)</span>
              </span>
            </div>

            {/* 3. OPEN BOX */}
            <div className="bg-[#2B1B06] border border-amber-700/60 text-amber-400 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span className="truncate">3. OPEN BOX</span>
              </div>
              <span className="font-mono text-[11px] font-bold shrink-0 ml-1">
                {metrics.openBoxCount} <span className="text-[10px] font-normal opacity-80">({metrics.openBoxPct}%)</span>
              </span>
            </div>

            {/* 4. WRONG PROD */}
            <div className="bg-[#0E1A38] border border-indigo-700/60 text-indigo-400 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                <span className="truncate">4. WRONG PROD</span>
              </div>
              <span className="font-mono text-[11px] font-bold shrink-0 ml-1">
                {metrics.wrongProdCount} <span className="text-[10px] font-normal opacity-80">({metrics.wrongProdPct}%)</span>
              </span>
            </div>

            {/* 5. SHORT QTY */}
            <div className="bg-[#2D1606] border border-orange-700/60 text-orange-400 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                <span className="truncate">5. SHORT QTY</span>
              </div>
              <span className="font-mono text-[11px] font-bold shrink-0 ml-1">
                {metrics.shortQtyCount} <span className="text-[10px] font-normal opacity-80">({metrics.shortQtyPct}%)</span>
              </span>
            </div>

            {/* 6. MISSING */}
            <div className="bg-[#2D0A1E] border border-pink-700/60 text-pink-400 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0" />
                <span className="truncate">6. MISSING</span>
              </div>
              <span className="font-mono text-[11px] font-bold shrink-0 ml-1">
                {metrics.missingCount} <span className="text-[10px] font-normal opacity-80">({metrics.missingPct}%)</span>
              </span>
            </div>

            {/* 7. OTHERS */}
            <div className="bg-[#1E0E38] border border-purple-700/60 text-purple-400 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                <span className="truncate">7. OTHERS</span>
              </div>
              <span className="font-mono text-[11px] font-bold shrink-0 ml-1">
                {metrics.othersCount} <span className="text-[10px] font-normal opacity-80">({metrics.othersPct}%)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Whole Return Distribution: Radial Gauge + Accounts Breakdown */}
        <div className="bg-[#080F1D] border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/70 mb-4">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>WHOLE RETURN DISTRIBUTION</span>
            </div>
            <span className="text-xs font-semibold text-emerald-400">
              {metrics.goodCount} Good ({metrics.goodPct}%) • {metrics.defectiveCount} Defective
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left Gauge: Radial Spoke Dial */}
            <div className="md:col-span-5 flex items-center justify-center">
              {renderRadialGauge()}
            </div>

            {/* Right List: Accounts Breakdown */}
            <div className="md:col-span-7 space-y-2.5">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                ACCOUNTS BREAKDOWN
              </div>

              <div className="space-y-2">
                {clientAccountsList.slice(0, 5).map(c => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#0E1A2E]/80 hover:bg-[#13233B] border border-slate-800 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="font-semibold text-slate-200 truncate">{c.name}</span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-slate-400 font-mono text-[11px]">{c.pct}%</span>
                      <span className="bg-slate-900 border border-slate-700 text-slate-200 px-2 py-0.5 rounded text-xs font-mono font-bold">
                        {c.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: Inward Vehicles & Boxes + Operator & Gun Scans */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Inward Vehicles & Boxes */}
        <div className="lg:col-span-5 bg-[#0B1526] border border-slate-800/80 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsInwardCollapsed(!isInwardCollapsed)}
              className="flex items-center gap-2 text-xs font-bold text-white hover:text-slate-200 transition-colors cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 text-teal-400" />
              <span>Inward Vehicles & Boxes</span>
              {isInwardCollapsed ? (
                <ChevronDown className="w-3 h-3 text-slate-400" />
              ) : (
                <ChevronUp className="w-3 h-3 text-slate-400" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('inward')}
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Full Register</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {!isInwardCollapsed && (
            <div className="space-y-2 pt-1">
              {clientAccountsList.slice(0, 2).map(c => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#080F1D] border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />
                    <span className="font-semibold text-slate-200 truncate">{c.name}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] font-mono">
                      {c.vehCount} Veh.
                    </span>
                    <span className="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] font-mono">
                      {c.boxCount} Bxs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Operator & Gun Scans */}
        <div className="lg:col-span-7 bg-[#0B1526] border border-slate-800/80 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsOperatorsCollapsed(!isOperatorsCollapsed)}
              className="flex items-center gap-2 text-xs font-bold text-white hover:text-slate-200 transition-colors cursor-pointer"
            >
              <Scan className="w-3.5 h-3.5 text-purple-400" />
              <span>Operator & Gun Scans</span>
              {isOperatorsCollapsed ? (
                <ChevronDown className="w-3 h-3 text-slate-400" />
              ) : (
                <ChevronUp className="w-3 h-3 text-slate-400" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('inventory')}
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Audit Console</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {!isOperatorsCollapsed && (
            <div className="bg-[#080E1A] border border-slate-800/80 rounded-lg p-6 text-center text-slate-400 text-xs flex items-center justify-center min-h-[95px]">
              No scans recorded for {currentDateDisplay}. Guns will appear here in real time as operators scan on this date.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
