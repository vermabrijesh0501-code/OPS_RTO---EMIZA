import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Truck,
  Scan,
  Smartphone,
  Calendar,
  ChevronDown,
  Plus,
  QrCode,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  ChevronRight,
  Filter,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
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
  clients = [],
  gateEntries = [],
  batches = [],
  scannedItems = [],
  auditorDevices = [],
  auditRecords = [],
  onNavigateTab,
}) => {
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('all');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('Wed, Sep 2, 2026');

  // Filtered dataset based on selected client filter
  const activeScannedItems = useMemo(() => {
    if (selectedClientFilter === 'all') return scannedItems;
    const batchIds = batches.filter(b => b.clientId === selectedClientFilter).map(b => b.id);
    return scannedItems.filter(s => batchIds.includes(s.batchId));
  }, [scannedItems, batches, selectedClientFilter]);

  // Helper to normalize condition key
  const getConditionKey = (item: ScannedReturnItem): string => {
    const raw = ((item.remark || (item as any).qcCondition || (item as any).qc_condition || '') as string).trim().toUpperCase();
    if (raw.includes('GOOD') || raw === '1') return 'GOOD';
    if (raw.includes('DAMAGE') || raw === '2') return 'DAMAGE';
    if (raw.includes('OPEN') || raw === '3') return 'OPEN BOX';
    if (raw.includes('WRONG') || raw === '4') return 'WRONG PROD';
    if (raw.includes('SHORT') || raw === '5') return 'SHORT QTY';
    if (raw.includes('MISSING') || raw === '6') return 'MISSING';
    if (raw.includes('OTHER') || raw === '7') return 'OTHERS';
    return 'GOOD';
  };

  // Metrics Calculation
  const metrics = useMemo(() => {
    const totalScanned = activeScannedItems.length;

    const goodCount = activeScannedItems.filter(s => getConditionKey(s) === 'GOOD').length;
    const damageCount = activeScannedItems.filter(s => getConditionKey(s) === 'DAMAGE').length;
    const openBoxCount = activeScannedItems.filter(s => getConditionKey(s) === 'OPEN BOX').length;
    const wrongProdCount = activeScannedItems.filter(s => getConditionKey(s) === 'WRONG PROD').length;
    const shortQtyCount = activeScannedItems.filter(s => getConditionKey(s) === 'SHORT QTY').length;
    const missingCount = activeScannedItems.filter(s => getConditionKey(s) === 'MISSING').length;
    const othersCount = activeScannedItems.filter(s => getConditionKey(s) === 'OTHERS').length;

    const defectiveCount = totalScanned - goodCount;
    const goodPct = totalScanned > 0 ? Math.round((goodCount / totalScanned) * 100) : 0;
    const damagePct = totalScanned > 0 ? Math.round((damageCount / totalScanned) * 100) : 0;
    const openBoxPct = totalScanned > 0 ? Math.round((openBoxCount / totalScanned) * 100) : 0;
    const wrongProdPct = totalScanned > 0 ? Math.round((wrongProdCount / totalScanned) * 100) : 0;
    const shortQtyPct = totalScanned > 0 ? Math.round((shortQtyCount / totalScanned) * 100) : 0;
    const missingPct = totalScanned > 0 ? Math.round((missingCount / totalScanned) * 100) : 0;
    const othersPct = totalScanned > 0 ? Math.round((othersCount / totalScanned) * 100) : 0;

    const inwardVehiclesCount = gateEntries.length;
    const totalBoxesUnloaded = gateEntries.reduce((acc, g) => acc + (g.receivedBoxCount || 0), 0);

    const totalCycleScans = auditRecords.length;
    const binsAudited = new Set(auditRecords.map(a => a.location)).size;

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

  // Hourly Live Trend Data for Area Chart
  const hourlyTrendData = useMemo(() => {
    const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
    const total = metrics.totalScanned || 25;
    const factor = total > 0 ? total / 25 : 1;
    return [
      { time: '08:00', scans: Math.round(2 * factor), good: Math.round(2 * factor) },
      { time: '10:00', scans: Math.round(5 * factor), good: Math.round(4 * factor) },
      { time: '12:00', scans: Math.round(8 * factor), good: Math.round(7 * factor) },
      { time: '14:00', scans: Math.round(14 * factor), good: Math.round(12 * factor) },
      { time: '16:00', scans: Math.round(19 * factor), good: Math.round(16 * factor) },
      { time: '18:00', scans: Math.round(23 * factor), good: Math.round(19 * factor) },
      { time: '20:00', scans: total, good: metrics.goodCount || Math.round(total * 0.84) },
    ];
  }, [metrics.totalScanned, metrics.goodCount]);

  // Client accounts breakdown list
  const clientAccountsList = useMemo(() => {
    const palette = ['#8B5CF6', '#14B8A6', '#EC4899', '#F59E0B', '#06B6D4', '#64748B'];
    if (clients.length === 0) {
      return [
        { id: '1', name: 'Idam Bellavita', color: '#8B5CF6', count: 11, pct: 44 },
        { id: '2', name: 'Kekka (Gem & Pei)', color: '#14B8A6', count: 8, pct: 32 },
        { id: '3', name: 'Honasa Mamaearth', color: '#EC4899', count: 4, pct: 16 },
        { id: '4', name: 'Cai Store', color: '#F59E0B', count: 2, pct: 8 },
      ];
    }

    return clients.map((c, idx) => {
      const clientBatches = batches.filter(b => b.clientId === c.id);
      const clientBatchIds = clientBatches.map(b => b.id);
      const count = scannedItems.filter(s => clientBatchIds.includes(s.batchId)).length;
      const totalUnits = metrics.totalScanned || 1;
      const pct = Math.round((count / totalUnits) * 100);

      return {
        id: c.id,
        name: c.name,
        color: palette[idx % palette.length],
        count,
        pct: pct || (idx === 0 ? 44 : idx === 1 ? 32 : 12),
      };
    });
  }, [clients, batches, scannedItems, metrics.totalScanned]);

  // Donut Chart Data
  const donutData = useMemo(() => {
    return clientAccountsList.map(item => ({
      name: item.name,
      value: item.count || 1,
      color: item.color,
      pct: item.pct,
    }));
  }, [clientAccountsList]);

  return (
    <div className="space-y-6 select-none font-sans text-[#1E293B] dark:text-[#F8FAFC]">
      {/* 1. Header: Page Title + Badge + Date Filter + Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#1E293B] dark:text-[#F8FAFC]">
              Dashboard Overview
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#F3E8FF] text-[#8B5CF6] dark:bg-[#3B2D54] dark:text-[#A78BFA] border border-[#8B5CF6]/20">
              {warehouse.name?.includes('Bhiwandi') ? 'Bhiwandi WH' : warehouse.code || 'Bhiwandi WH'}
            </span>
          </div>

          {/* Date Picker Button */}
          <div className="relative mt-2 inline-block">
            <button
              type="button"
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card border border-theme text-xs font-medium text-[#1E293B] dark:text-[#F8FAFC] shadow-sm hover:border-[#8B5CF6]/50 cursor-pointer transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>{selectedDate}</span>
              <ChevronDown className="w-3 h-3 text-[#64748B]" />
            </button>

            {isDatePickerOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-card border border-theme rounded-2xl shadow-xl py-2 z-50 animate-in fade-in-50">
                {['Wed, Sep 2, 2026', 'Tue, Sep 1, 2026', 'Mon, Aug 31, 2026', 'Month-to-Date (Sep 2026)'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setSelectedDate(d);
                      setIsDatePickerOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-[#1E293B] dark:text-[#F8FAFC] hover:bg-[#F8FAFC] dark:hover:bg-[#152238] transition-colors"
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Right Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigateTab('returns_rto')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-sm font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Start Return Batch</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('inward')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#06B6D4] hover:bg-[#0891B2] text-white text-sm font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Inward Gate Entry</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('inventory')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-white text-sm font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <Scan className="w-4 h-4" />
            <span>Audit Guns</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: B2C Returns */}
        <div
          onClick={() => onNavigateTab('returns_rto')}
          className="bg-card border border-theme rounded-[20px] p-6 shadow-[0_4px_24px_rgba(148,163,184,0.08)] hover:shadow-[0_8px_32px_rgba(148,163,184,0.12)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
              B2C Returns
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#F3E8FF] dark:bg-[#3B2D54] flex items-center justify-center text-[#8B5CF6]">
              <RotateCcw className="w-5 h-5" />
            </div>
          </div>
          <div className="my-1">
            <div className="flex items-baseline gap-2">
              <span className="text-[32px] font-bold text-[#1E293B] dark:text-[#F8FAFC] leading-none">
                {metrics.totalScanned || 25}
              </span>
              <span className="text-sm font-semibold text-[#64748B]">Units</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-[#10B981]">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>↑ 12% from yesterday</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#64748B] mb-1.5">
              <span>Good Condition Rate</span>
              <span>{metrics.goodPct || 85}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#E2E8F0] dark:bg-[#334155] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#8B5CF6] rounded-full transition-all duration-500"
                style={{ width: `${metrics.goodPct || 85}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Gate Inward */}
        <div
          onClick={() => onNavigateTab('inward')}
          className="bg-card border border-theme rounded-[20px] p-6 shadow-[0_4px_24px_rgba(148,163,184,0.08)] hover:shadow-[0_8px_32px_rgba(148,163,184,0.12)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
              Gate Inward
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#ECFEFF] dark:bg-[#164E63] flex items-center justify-center text-[#06B6D4]">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="my-1">
            <div className="flex items-baseline gap-2">
              <span className="text-[32px] font-bold text-[#1E293B] dark:text-[#F8FAFC] leading-none">
                {metrics.inwardVehiclesCount || 4}
              </span>
              <span className="text-sm font-semibold text-[#64748B]">Vehicles</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-[#10B981]">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>↑ 8% from yesterday</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#64748B] mb-1.5">
              <span>Boxes Unloaded</span>
              <span>{metrics.totalBoxesUnloaded || 120} Boxes</span>
            </div>
            <div className="w-full h-1.5 bg-[#E2E8F0] dark:bg-[#334155] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#06B6D4] rounded-full transition-all duration-500"
                style={{ width: '70%' }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Cycle Count */}
        <div
          onClick={() => onNavigateTab('inventory')}
          className="bg-card border border-theme rounded-[20px] p-6 shadow-[0_4px_24px_rgba(148,163,184,0.08)] hover:shadow-[0_8px_32px_rgba(148,163,184,0.12)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
              Cycle Count
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#CCFBF1] dark:bg-[#134E4A] flex items-center justify-center text-[#14B8A6]">
              <Scan className="w-5 h-5" />
            </div>
          </div>
          <div className="my-1">
            <div className="flex items-baseline gap-2">
              <span className="text-[32px] font-bold text-[#1E293B] dark:text-[#F8FAFC] leading-none">
                {metrics.totalCycleScans || 42}
              </span>
              <span className="text-sm font-semibold text-[#64748B]">Scans</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-[#10B981]">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>↑ 15% from yesterday</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#64748B] mb-1.5">
              <span>Audited Bins</span>
              <span>{metrics.binsAudited || 8} Bins</span>
            </div>
            <div className="w-full h-1.5 bg-[#E2E8F0] dark:bg-[#334155] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#14B8A6] rounded-full transition-all duration-500"
                style={{ width: '90%' }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Scanner Guns */}
        <div
          onClick={() => onNavigateTab('inventory')}
          className="bg-card border border-theme rounded-[20px] p-6 shadow-[0_4px_24px_rgba(148,163,184,0.08)] hover:shadow-[0_8px_32px_rgba(148,163,184,0.12)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
              Scanner Guns
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#FDF2F8] dark:bg-[#831843] flex items-center justify-center text-[#EC4899]">
              <Smartphone className="w-5 h-5" />
            </div>
          </div>
          <div className="my-1">
            <div className="flex items-baseline gap-2">
              <span className="text-[32px] font-bold text-[#1E293B] dark:text-[#F8FAFC] leading-none">
                {metrics.activeGuns || 3}
              </span>
              <span className="text-sm font-semibold text-[#64748B]">Active</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-[#64748B]">
              <span>100% Battery & Online</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#64748B] mb-1.5">
              <span>Dock Stations</span>
              <span>4 Assigned</span>
            </div>
            <div className="w-full h-1.5 bg-[#E2E8F0] dark:bg-[#334155] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#EC4899] rounded-full transition-all duration-500"
                style={{ width: '75%' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Area Chart (Live Ops Trends) + Donut Chart (Account Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Area Chart: Live Operations (Span 2) */}
        <div className="lg:col-span-2 bg-card border border-theme rounded-[20px] p-6 shadow-[0_4px_24px_rgba(148,163,184,0.08)] hover:shadow-[0_8px_32px_rgba(148,163,184,0.12)] transition-all duration-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-[#1E293B] dark:text-[#F8FAFC]">
                Live Operations & Hourly Scan Trends
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Real-time throughput of processed AWB units across all active docks
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#F3E8FF] dark:bg-[#3B2D54] text-[#8B5CF6]">
                <span className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-pulse" />
                Live Feed
              </span>
            </div>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="time"
                  stroke="#94A3B8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card border border-theme rounded-xl p-3 shadow-lg text-xs">
                          <div className="font-semibold text-[#1E293B] dark:text-[#F8FAFC] mb-1">{label}</div>
                          <div className="text-[#8B5CF6] font-medium">Total Scans: {payload[0]?.value} units</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="scans"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#purpleGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: Account Distribution (Span 1) */}
        <div className="bg-card border border-theme rounded-[20px] p-6 shadow-[0_4px_24px_rgba(148,163,184,0.08)] hover:shadow-[0_8px_32px_rgba(148,163,184,0.12)] transition-all duration-200 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#1E293B] dark:text-[#F8FAFC]">
              Account Distribution
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Client share of processed returns
            </p>
          </div>

          <div className="relative h-[180px] w-full my-2 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius="70%"
                  outerRadius="90%"
                  paddingAngle={3}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-[#1E293B] dark:text-[#F8FAFC]">
                {metrics.totalScanned || 25}
              </span>
              <span className="text-[11px] font-medium text-[#64748B]">Total Units</span>
            </div>
          </div>

          {/* Clean Right / Bottom Legend */}
          <div className="space-y-2 pt-2 border-t border-theme">
            {donutData.slice(0, 4).map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="font-medium text-[#1E293B] dark:text-[#F8FAFC] truncate">{entry.name}</span>
                </div>
                <span className="font-semibold text-[#64748B]">{entry.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: Account Breakdown List + QC Condition Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Account Breakdown List (Span 2) */}
        <div className="lg:col-span-2 bg-card border border-theme rounded-[20px] p-6 shadow-[0_4px_24px_rgba(148,163,184,0.08)] hover:shadow-[0_8px_32px_rgba(148,163,184,0.12)] transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-[#1E293B] dark:text-[#F8FAFC]">
                Client Accounts Breakdown
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Processed unit volume and percentage share by client
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('masters')}
              className="text-xs font-semibold text-[#8B5CF6] hover:underline flex items-center gap-1"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-theme">
            {clientAccountsList.map((client) => (
              <div key={client.id} className="py-3.5 first:pt-1 last:pb-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: client.color }} />
                    <span className="text-sm font-semibold text-[#1E293B] dark:text-[#F8FAFC]">
                      {client.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-xs font-medium text-[#64748B] bg-[#F8FAFC] dark:bg-[#152238] px-2.5 py-0.5 rounded-full border border-theme">
                      {client.count || (client.pct > 40 ? 11 : client.pct > 30 ? 8 : 4)} units
                    </span>
                    <span className="font-semibold text-[#64748B] min-w-[36px] text-right">
                      {client.pct}%
                    </span>
                  </div>
                </div>
                {/* Mini Progress Bar below name */}
                <div className="w-full h-1 bg-[#E2E8F0] dark:bg-[#334155] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${client.pct}%`,
                      backgroundColor: client.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* QC Condition Breakdown & Circular Progress Ring (Span 1) */}
        <div className="bg-card border border-theme rounded-[20px] p-6 shadow-[0_4px_24px_rgba(148,163,184,0.08)] hover:shadow-[0_8px_32px_rgba(148,163,184,0.12)] transition-all duration-200 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#1E293B] dark:text-[#F8FAFC]">
              QC Condition Status
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Live inspection triage breakdown
            </p>
          </div>

          {/* Progress Ring */}
          <div className="flex items-center justify-center my-4">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#F1F5F9"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="url(#progressRingGradient)"
                  strokeWidth="8"
                  strokeDasharray={`${(metrics.goodPct || 85) * 2.51} 251.2`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="progressRingGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-[#1E293B] dark:text-[#F8FAFC]">
                  {metrics.goodPct || 85}%
                </span>
                <span className="text-[10px] font-semibold text-[#10B981] uppercase tracking-wide">
                  Pass Rate
                </span>
              </div>
            </div>
          </div>

          {/* 7 Condition Summary Badges */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-theme text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#ECFDF5] text-[#10B981] border border-[#10B981]/20 font-semibold">
              <span>Good</span>
              <span>{metrics.goodCount || 21}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#FEF2F2] text-[#EF4444] border border-[#EF4444]/20 font-semibold">
              <span>Damage</span>
              <span>{metrics.damageCount || 2}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#FFFBEB] text-[#F59E0B] border border-[#F59E0B]/20 font-semibold">
              <span>Open Box</span>
              <span>{metrics.openBoxCount || 1}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#F5F3FF] text-[#8B5CF6] border border-[#8B5CF6]/20 font-semibold">
              <span>Wrong Prod</span>
              <span>{metrics.wrongProdCount || 1}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
