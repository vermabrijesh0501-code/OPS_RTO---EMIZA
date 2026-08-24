import React, { useState } from 'react';
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
  Smartphone,
  ShieldCheck,
  Tag,
  Building2,
  Check,
  ChevronRight,
  PieChart as PieChartIcon,
  Users,
} from 'lucide-react';
import {
  InwardGateEntry,
  ReturnBatch,
  ScannedReturnItem,
  ActivityLog,
  Warehouse,
  Client,
  AuditorDevice,
  AuditRecord,
} from '../types';

interface DashboardViewProps {
  warehouse: Warehouse;
  clients: Client[];
  gateEntries: InwardGateEntry[];
  batches: ReturnBatch[];
  scannedItems: ScannedReturnItem[];
  auditorDevices: AuditorDevice[];
  auditRecords: AuditRecord[];
  logs: ActivityLog[];
  onNavigateTab: (tab: 'inward' | 'returns_rto' | 'returns_b2b' | 'audit' | 'reports') => void;
  onOpenNewGateEntryModal: () => void;
  onOpenNewBatchModal: () => void;
}

// 7 Return Conditions Configuration matching user's matrix & theme
const RETURN_CONDITIONS = [
  { key: 'Good', label: '1. Good', color: '#10b981', bgClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { key: 'Damage', label: '2. Damage', color: '#ef4444', bgClass: 'bg-red-500/10 text-red-400 border-red-500/30' },
  { key: 'Open Box', label: '3. Open Box', color: '#f59e0b', bgClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  { key: 'Wrong Product', label: '4. Wrong Prod', color: '#6366f1', bgClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
  { key: 'Short Qty', label: '5. Short Qty', color: '#f97316', bgClass: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  { key: 'Missing Product', label: '6. Missing', color: '#f43f5e', bgClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  { key: 'Others', label: '7. Others', color: '#8b5cf6', bgClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
];

// Client Colors for Pie Chart Slices
const CLIENT_COLORS = [
  '#3b82f6', // Blue (Bella Vita)
  '#ec4899', // Pink (Nykaa)
  '#10b981', // Emerald (Honasa Mamaearth)
  '#f59e0b', // Amber (boAt)
  '#8b5cf6', // Purple (SUGAR)
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  warehouse,
  clients,
  gateEntries,
  batches,
  scannedItems,
  auditorDevices,
  auditRecords,
  logs,
  onNavigateTab,
  onOpenNewGateEntryModal,
  onOpenNewBatchModal,
}) => {
  // Selected client from dropdown (Default: 'ALL' for whole count)
  const [selectedClientId, setSelectedClientId] = useState<string>('ALL');
  const [hoveredSliceKey, setHoveredSliceKey] = useState<string | null>(null);

  // Compute stats per client
  const clientReturnMap = clients.map((client, idx) => {
    const clientBatches = batches.filter(b => b.clientId === client.id);
    const totalReturns = clientBatches.reduce((acc, b) => acc + (b.totalScanned || 0), 0);

    const conditions: Record<string, number> = {
      'Good': 0,
      'Damage': 0,
      'Open Box': 0,
      'Wrong Product': 0,
      'Short Qty': 0,
      'Missing Product': 0,
      'Others': 0,
    };

    clientBatches.forEach(b => {
      if (b.remarksBreakdown) {
        Object.entries(b.remarksBreakdown).forEach(([k, v]) => {
          const num = typeof v === 'number' ? v : Number(v) || 0;
          if (conditions[k] !== undefined) {
            conditions[k] += num;
          } else {
            conditions['Others'] += num;
          }
        });
      }
    });

    const goodCount = conditions['Good'] || 0;
    const defectCount = totalReturns - goodCount;
    const goodPercent = totalReturns > 0 ? Math.round((goodCount / totalReturns) * 100) : 0;
    const color = CLIENT_COLORS[idx % CLIENT_COLORS.length];

    return {
      client,
      color,
      totalReturns,
      conditions,
      goodCount,
      defectCount,
      goodPercent,
    };
  });

  // Calculate Consolidated Total across all accounts
  const consolidatedTotalReturns = clientReturnMap.reduce((acc, c) => acc + c.totalReturns, 0);
  const consolidatedConditions: Record<string, number> = {
    'Good': 0,
    'Damage': 0,
    'Open Box': 0,
    'Wrong Product': 0,
    'Short Qty': 0,
    'Missing Product': 0,
    'Others': 0,
  };

  clientReturnMap.forEach(c => {
    Object.entries(c.conditions).forEach(([k, v]) => {
      const num = typeof v === 'number' ? v : Number(v) || 0;
      consolidatedConditions[k] = (consolidatedConditions[k] || 0) + num;
    });
  });

  const consolidatedGoodCount = consolidatedConditions['Good'] || 0;
  const consolidatedDefectCount = consolidatedTotalReturns - consolidatedGoodCount;
  const consolidatedGoodPercent =
    consolidatedTotalReturns > 0
      ? Math.round((consolidatedGoodCount / consolidatedTotalReturns) * 100)
      : 0;

  // Active Selected Account Data for Live Details & Top 8px Indicators
  const activeSelectedData =
    selectedClientId === 'ALL'
      ? {
          id: 'ALL',
          name: 'All Accounts',
          fullName: 'All Accounts (Consolidated Whole Count)',
          code: 'ALL',
          color: '#3b82f6',
          totalReturns: consolidatedTotalReturns,
          conditions: consolidatedConditions,
          goodCount: consolidatedGoodCount,
          defectCount: consolidatedDefectCount,
          goodPercent: consolidatedGoodPercent,
        }
      : (() => {
          const found = clientReturnMap.find(c => c.client.id === selectedClientId);
          if (found) {
            return {
              id: found.client.id,
              name: found.client.name.split(' ')[0],
              fullName: found.client.name,
              code: found.client.code,
              color: found.color,
              totalReturns: found.totalReturns,
              conditions: found.conditions,
              goodCount: found.goodCount,
              defectCount: found.defectCount,
              goodPercent: found.goodPercent,
            };
          }
          return {
            id: 'ALL',
            name: 'All Accounts',
            fullName: 'All Accounts (Consolidated Whole Count)',
            code: 'ALL',
            color: '#3b82f6',
            totalReturns: consolidatedTotalReturns,
            conditions: consolidatedConditions,
            goodCount: consolidatedGoodCount,
            defectCount: consolidatedDefectCount,
            goodPercent: consolidatedGoodPercent,
          };
        })();

  // 1. DEFAULT MODE: Whole Count across all accounts (Pie Slices = Accounts)
  let cumulativeAccountPercent = 0;
  const accountWholeSlices = clientReturnMap.map(c => {
    const percent = consolidatedTotalReturns > 0 ? c.totalReturns / consolidatedTotalReturns : 0;
    const startPercent = cumulativeAccountPercent;
    cumulativeAccountPercent += percent;
    const endPercent = cumulativeAccountPercent;

    return {
      key: c.client.id,
      label: c.client.name,
      shortLabel: c.client.name.split(' ')[0],
      code: c.client.code,
      color: c.color,
      count: c.totalReturns,
      percent: consolidatedTotalReturns > 0 ? Math.round(percent * 100) : 0,
      startPercent,
      endPercent: Math.min(endPercent, 0.99999),
      goodCount: c.goodCount,
      defectCount: c.defectCount,
      conditions: c.conditions,
    };
  });

  // 2. ACCOUNT SELECTED MODE: 7 Conditions for that selected account (Pie Slices = 7 Conditions)
  let cumulativeCondPercent = 0;
  const selectedAccountConditionSlices = RETURN_CONDITIONS.map(cond => {
    const count = activeSelectedData.conditions[cond.key] || 0;
    const percent = activeSelectedData.totalReturns > 0 ? count / activeSelectedData.totalReturns : 0;
    const startPercent = cumulativeCondPercent;
    cumulativeCondPercent += percent;
    const endPercent = cumulativeCondPercent;

    return {
      key: cond.key,
      label: cond.label,
      shortLabel: cond.label,
      code: cond.key,
      color: cond.color,
      count,
      percent: activeSelectedData.totalReturns > 0 ? Math.round(percent * 100) : 0,
      startPercent,
      endPercent: Math.min(endPercent, 0.99999),
      goodCount: cond.key === 'Good' ? count : 0,
      defectCount: cond.key !== 'Good' ? count : 0,
      conditions: {},
    };
  });

  // Dynamic Chart Slices: If 'ALL', show Whole Account Share; if specific account selected, show its 7 Conditions!
  const isAllAccounts = selectedClientId === 'ALL';
  const activeChartSlices = isAllAccounts ? accountWholeSlices : selectedAccountConditionSlices;

  // SVG Arc Generator for Donut Chart
  const getCoordinatesForPercent = (percent: number, radius: number, cx: number, cy: number) => {
    const x = cx + radius * Math.cos(2 * Math.PI * percent - Math.PI / 2);
    const y = cy + radius * Math.sin(2 * Math.PI * percent - Math.PI / 2);
    return [x, y];
  };

  const describeDonutSlice = (
    startPercent: number,
    endPercent: number,
    cx: number,
    cy: number,
    outerR: number,
    innerR: number
  ) => {
    if (endPercent - startPercent >= 0.999) {
      endPercent = 0.9999;
    }
    const [startX, startY] = getCoordinatesForPercent(startPercent, outerR, cx, cy);
    const [endX, endY] = getCoordinatesForPercent(endPercent, outerR, cx, cy);
    const [innerStartX, innerStartY] = getCoordinatesForPercent(startPercent, innerR, cx, cy);
    const [innerEndX, innerEndY] = getCoordinatesForPercent(endPercent, innerR, cx, cy);

    const largeArcFlag = endPercent - startPercent > 0.5 ? 1 : 0;

    return [
      `M ${startX} ${startY}`,
      `A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
      `L ${innerEndX} ${innerEndY}`,
      `A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${innerStartX} ${innerStartY}`,
      'Z',
    ].join(' ');
  };

  // Vehicles summary
  const totalVehicles = gateEntries.length;
  const totalReceivedBoxes = gateEntries.reduce((acc, g) => acc + (g.receivedBoxCount || 0), 0);

  // Operator / Auditor count stats
  const operatorAuditCounts: Record<string, number> = {};
  auditRecords.forEach(r => {
    const op = r.auditorName || r.auditorDeviceId;
    operatorAuditCounts[op] = (operatorAuditCounts[op] || 0) + r.quantity;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-black text-white tracking-tight">
              Warehouse Operations Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              {warehouse.name}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time returns summary, account-wise live condition distribution pie chart & vehicle box inward.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenNewBatchModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <QrCode className="w-4 h-4" /> Start Return Batch
          </button>
          <button
            onClick={onOpenNewGateEntryModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all"
          >
            <Plus className="w-4 h-4 text-emerald-400" /> Inward Gate Entry
          </button>
          <button
            onClick={() => onNavigateTab('audit')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Scan className="w-4 h-4" /> Audit Guns (15)
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div
          onClick={() => onNavigateTab('returns_rto')}
          className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 p-4 rounded-xl cursor-pointer transition-all hover:shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Total B2C Returns</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {consolidatedTotalReturns} <span className="text-xs font-normal text-slate-400">Units</span>
          </div>
          <div className="text-[11px] text-emerald-400 font-bold mt-1">
            {consolidatedGoodCount} Good ({consolidatedGoodPercent}%) • {consolidatedDefectCount} Defects
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('inward')}
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-xl cursor-pointer transition-all hover:shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Gate Inward</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {totalVehicles} <span className="text-xs font-normal text-slate-400">Vehicles</span>
          </div>
          <div className="text-[11px] text-emerald-400 font-bold mt-1">
            {totalReceivedBoxes} Total Boxes Unloaded
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('audit')}
          className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 p-4 rounded-xl cursor-pointer transition-all hover:shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Cycle Count & Audit</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <Scan className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {auditRecords.reduce((a, b) => a + b.quantity, 0)}{' '}
            <span className="text-xs font-normal text-slate-400">Scans</span>
          </div>
          <div className="text-[11px] text-purple-400 font-bold mt-1">
            {auditRecords.length} Bin Entries Recorded
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('audit')}
          className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-4 rounded-xl cursor-pointer transition-all hover:shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Auditor Scanner Guns</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {auditorDevices.length} <span className="text-xs font-normal text-slate-400">Guns</span>
          </div>
          <div className="text-[11px] text-emerald-400 font-bold mt-1">
            {auditorDevices.filter(d => d.status === 'Active').length} Active on Floor
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. B2C RETURN - STREAMLINED UNIFIED SECTION (DROPDOWN + LIVE COND + CHART) */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        {/* Header with Clean Account Dropdown Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight">
                B2C Returns Live Operations & Conditions
              </h2>
              <p className="text-xs text-slate-400">
                {isAllAccounts
                  ? 'Default view: Whole count chart across all accounts. Select account to view 7-condition chart.'
                  : `Focused view: Live 7 conditions distribution chart for ${activeSelectedData.fullName}`}
              </p>
            </div>
          </div>

          {/* Account Dropdown Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 whitespace-nowrap">Select Account:</span>
            <select
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white font-bold text-xs rounded-xl px-3 py-2 outline-none focus:border-blue-500 transition-all cursor-pointer shadow-inner"
            >
              <option value="ALL">All Accounts (Whole Count — {consolidatedTotalReturns} Units)</option>
              {clients.map(c => {
                const count = clientReturnMap.find(item => item.client.id === c.id)?.totalReturns || 0;
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} ({count} Units)
                  </option>
                );
              })}
            </select>
            {selectedClientId !== 'ALL' && (
              <button
                onClick={() => setSelectedClientId('ALL')}
                className="px-2.5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-xl border border-slate-700 transition-all"
                title="Reset to Whole Count"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Top Live Return Conditions Bar (Compact & Sleek Single Strip) */}
        <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-xl space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-extrabold uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-400" />
              Live Return Conditions ({activeSelectedData.name}):
            </span>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                {activeSelectedData.goodCount} Good ({activeSelectedData.goodPercent}% Restockable)
              </span>
              <span className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
                {activeSelectedData.defectCount} Defective
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
            {RETURN_CONDITIONS.map(cond => {
              const count = activeSelectedData.conditions[cond.key] || 0;
              const pct =
                activeSelectedData.totalReturns > 0
                  ? Math.round((count / activeSelectedData.totalReturns) * 100)
                  : 0;
              const isHovered = hoveredSliceKey === cond.key;

              return (
                <div
                  key={cond.key}
                  onMouseEnter={() => setHoveredSliceKey(cond.key)}
                  onMouseLeave={() => setHoveredSliceKey(null)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center justify-between gap-1.5 transition-all cursor-pointer ${
                    cond.bgClass
                  } ${isHovered ? 'ring-2 ring-white scale-[1.03] shadow-md' : 'hover:bg-slate-800/60'}`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: cond.color }}
                    />
                    <span className="truncate text-[11px] font-extrabold uppercase">{cond.label}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 font-mono">
                    <span className="text-white font-black bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-700/80 text-[11px]">
                      {count}
                    </span>
                    <span className="opacity-75 text-[10px]">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Point B: Dynamic Morphing Single Chart & Compact Legend */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3 mb-4">
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <PieChartIcon className="w-3.5 h-3.5 text-blue-400" />
                {isAllAccounts
                  ? 'Whole Return Distribution (All Accounts Share)'
                  : `${activeSelectedData.fullName} — 7 Conditions Breakdown Chart`}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isAllAccounts
                  ? 'Showing live units share across all warehouse accounts'
                  : 'Chart transformed to show the 7 return conditions for selected account'}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-emerald-400">
                {activeSelectedData.goodCount} Good ({activeSelectedData.goodPercent}%) • {activeSelectedData.defectCount} Defective
              </span>
            </div>
          </div>

          {/* Chart + Legend Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Donut Chart (6 Cols) */}
            <div className="md:col-span-6 flex flex-col items-center justify-center">
              <div className="relative w-60 h-60 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                  {activeSelectedData.totalReturns === 0 ? (
                    <circle
                      cx="100"
                      cy="100"
                      r="72"
                      fill="transparent"
                      stroke="#334155"
                      strokeWidth="28"
                      strokeDasharray="4 4"
                    />
                  ) : (
                    activeChartSlices.map(slice => {
                      if (slice.count === 0) return null;
                      const path = describeDonutSlice(
                        slice.startPercent,
                        slice.endPercent,
                        100,
                        100,
                        86,
                        52
                      );
                      const isHovered = hoveredSliceKey === slice.key;

                      return (
                        <path
                          key={slice.key}
                          d={path}
                          fill={slice.color}
                          stroke="#0f172a"
                          strokeWidth="2"
                          className="transition-all duration-300 cursor-pointer hover:opacity-90"
                          style={{
                            transformOrigin: 'center',
                            filter: isHovered
                              ? 'brightness(1.25) drop-shadow(0 0 6px rgba(255,255,255,0.4))'
                              : 'none',
                          }}
                          onMouseEnter={() => setHoveredSliceKey(slice.key)}
                          onMouseLeave={() => setHoveredSliceKey(null)}
                          onClick={() => {
                            if (isAllAccounts) {
                              setSelectedClientId(slice.key);
                            }
                          }}
                        />
                      );
                    })
                  )}
                </svg>

                {/* Center Donut Dynamic Metric */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                  <span className="text-[9px] uppercase font-extrabold text-blue-400 tracking-wider truncate max-w-[120px]">
                    {hoveredSliceKey
                      ? activeChartSlices.find(s => s.key === hoveredSliceKey)?.shortLabel
                      : activeSelectedData.name}
                  </span>
                  <span className="text-2xl font-black text-white my-0.5">
                    {hoveredSliceKey
                      ? activeChartSlices.find(s => s.key === hoveredSliceKey)?.count
                      : activeSelectedData.totalReturns}
                  </span>
                  <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    {hoveredSliceKey && isAllAccounts
                      ? `${activeChartSlices.find(s => s.key === hoveredSliceKey)?.goodCount} Good`
                      : `${activeSelectedData.goodCount} Good (${activeSelectedData.goodPercent}%)`}
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 font-medium text-center mt-2">
                {isAllAccounts
                  ? 'Click any slice or select from dropdown to switch to 7-conditions chart'
                  : 'Hover slices to highlight condition details'}
              </div>
            </div>

            {/* Compact Legend Grid (6 Cols) */}
            <div className="md:col-span-6 space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
              <div className="text-xs font-black text-slate-400 uppercase tracking-wider px-1 pb-1">
                {isAllAccounts ? 'Accounts Breakdown' : '7 Return Conditions'}
              </div>
              {activeChartSlices.map(slice => {
                const isHovered = hoveredSliceKey === slice.key;
                return (
                  <div
                    key={slice.key}
                    onMouseEnter={() => setHoveredSliceKey(slice.key)}
                    onMouseLeave={() => setHoveredSliceKey(null)}
                    onClick={() => {
                      if (isAllAccounts) {
                        setSelectedClientId(slice.key);
                      }
                    }}
                    className={`p-2.5 rounded-xl border transition-all flex items-center justify-between text-xs cursor-pointer ${
                      isHovered
                        ? 'bg-slate-800 border-slate-600 scale-[1.01] shadow-md'
                        : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-md shrink-0 shadow-sm"
                        style={{ backgroundColor: slice.color }}
                      />
                      <span className="font-extrabold text-slate-200">{slice.label}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-slate-400 text-[11px]">
                        {slice.percent}%
                      </span>
                      <span className="font-black text-white text-xs bg-slate-800 px-2 py-0.5 rounded border border-slate-700 min-w-[38px] text-center">
                        {slice.count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. INWARD VEHICLES SUMMARY & AUDITOR OPERATOR COUNTS (CLEAN NO HEAVY ROWS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Inward Vehicles by Account */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-black text-white">Inward Vehicles & Boxes by Account</h3>
            </div>
            <button
              onClick={() => onNavigateTab('inward')}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300"
            >
              Full Register →
            </button>
          </div>

          <div className="space-y-2">
            {clients.map(c => {
              const entries = gateEntries.filter(g => g.clientId === c.id);
              const vCount = entries.length;
              const boxCount = entries.reduce((acc, g) => acc + (g.receivedBoxCount || 0), 0);

              return (
                <div
                  key={c.id}
                  className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between text-xs"
                >
                  <div className="font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    {c.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-800 font-mono text-emerald-300 font-bold border border-slate-700">
                      {vCount} {vCount === 1 ? 'Vehicle' : 'Vehicles'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded bg-slate-900 font-mono text-white font-black border border-slate-700">
                      {boxCount} Boxes
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Operator & Auditor Gun Scan Counts */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-black text-white">Operator & Gun Scan Counts</h3>
            </div>
            <button
              onClick={() => onNavigateTab('audit')}
              className="text-xs font-bold text-purple-400 hover:text-purple-300"
            >
              Open Audit Console →
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-[190px] overflow-y-auto pr-1">
            {auditorDevices.slice(0, 8).map(dev => {
              const count = operatorAuditCounts[dev.assignedPerson] || operatorAuditCounts[dev.id] || 0;
              return (
                <div
                  key={dev.id}
                  onClick={() => onNavigateTab('audit')}
                  className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60 hover:border-purple-500/50 cursor-pointer transition-all flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-mono font-bold text-indigo-400 text-[11px]">{dev.id}</div>
                    <div className="text-white font-semibold truncate max-w-[100px] text-[11px]">
                      {dev.assignedPerson}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-white text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                      {count}
                    </span>
                    <div className="text-[9px] text-slate-400">Scans</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
