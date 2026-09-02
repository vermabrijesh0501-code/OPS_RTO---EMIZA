import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Activity,
  Layers,
  ChevronRight,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Boxes,
  Users,
  Radio,
  Check,
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
  ActiveDeviceSession,
  User,
} from '../types';
import { ActiveTab } from './Sidebar';

export type DateFilterOption = 'today' | 'yesterday' | 'last_7_days' | 'custom';

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
  activeDevices?: ActiveDeviceSession[];
  users?: User[];
  logs: ActivityLog[];
  currentUser?: User;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenNewGateEntryModal: () => void;
  onOpenNewBatchModal: () => void;
  onSelectWarehouse?: (id: string) => void;
}

// Date helpers
function getLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseItemDate(dateVal: string | null | undefined): string | null {
  if (!dateVal) return null;
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return null;
    return getLocalDateString(d);
  } catch {
    return null;
  }
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  warehouse,
  clients = [],
  gateEntries = [],
  batches = [],
  scannedItems = [],
  auditorDevices = [],
  auditRecords = [],
  activeDevices = [],
  users = [],
  logs = [],
  onNavigateTab,
  onOpenNewGateEntryModal,
  onOpenNewBatchModal,
}) => {
  // 1. Date Filter State - DEFAULT TO TODAY ONLY
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('today');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Custom date range bounds
  const todayStr = useMemo(() => getLocalDateString(new Date()), []);
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return getLocalDateString(d);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(todayStr);

  // Close date picker popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute reference date strings
  const { yesterdayStr, sevenDaysAgoStr, thirtyDaysAgoStr, sixtyDaysAgoStr, ninetyDaysAgoStr } = useMemo(() => {
    const now = new Date();

    const y = new Date(now);
    y.setDate(y.getDate() - 1);

    const s7 = new Date(now);
    s7.setDate(s7.getDate() - 6);

    const s30 = new Date(now);
    s30.setDate(s30.getDate() - 29);

    const s60 = new Date(now);
    s60.setDate(s60.getDate() - 59);

    const s90 = new Date(now);
    s90.setDate(s90.getDate() - 89);

    return {
      yesterdayStr: getLocalDateString(y),
      sevenDaysAgoStr: getLocalDateString(s7),
      thirtyDaysAgoStr: getLocalDateString(s30),
      sixtyDaysAgoStr: getLocalDateString(s60),
      ninetyDaysAgoStr: getLocalDateString(s90),
    };
  }, []);

  // Filter predicate: returns true if an item's timestamp is within the active date filter
  const isDateInFilter = useMemo(() => {
    return (dateVal: string | null | undefined): boolean => {
      const itemDateStr = parseItemDate(dateVal);
      if (!itemDateStr) return false;

      if (dateFilter === 'today') {
        return itemDateStr === todayStr;
      }
      if (dateFilter === 'yesterday') {
        return itemDateStr === yesterdayStr;
      }
      if (dateFilter === 'last_7_days') {
        return itemDateStr >= sevenDaysAgoStr && itemDateStr <= todayStr;
      }
      if (dateFilter === 'custom') {
        if (customStartDate && customEndDate) {
          return itemDateStr >= customStartDate && itemDateStr <= customEndDate;
        }
        if (customStartDate) {
          return itemDateStr >= customStartDate;
        }
        if (customEndDate) {
          return itemDateStr <= customEndDate;
        }
        return true;
      }
      return true;
    };
  }, [dateFilter, todayStr, yesterdayStr, sevenDaysAgoStr, customStartDate, customEndDate]);

  // Label text for current date filter button
  const dateFilterLabel = useMemo(() => {
    const now = new Date();
    const formattedToday = now.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    if (dateFilter === 'today') {
      return `Today (${formattedToday})`;
    }
    if (dateFilter === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const formattedYesterday = y.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      return `Yesterday (${formattedYesterday})`;
    }
    if (dateFilter === 'last_7_days') {
      return 'Last 7 Days';
    }
    if (dateFilter === 'custom') {
      if (customStartDate === thirtyDaysAgoStr && customEndDate === todayStr) {
        return 'Last 30 Days (1 Month)';
      }
      if (customStartDate === sixtyDaysAgoStr && customEndDate === todayStr) {
        return 'Last 60 Days (2 Months)';
      }
      if (customStartDate === ninetyDaysAgoStr && customEndDate === todayStr) {
        return 'Last 90 Days (3 Months)';
      }
      return `Custom: ${customStartDate} to ${customEndDate}`;
    }
    return 'Today';
  }, [dateFilter, customStartDate, customEndDate, thirtyDaysAgoStr, sixtyDaysAgoStr, ninetyDaysAgoStr, todayStr]);

  // Warehouse-scoped and Date-Filtered Datasets
  const filteredGateEntries = useMemo(() => {
    return gateEntries.filter(
      g => g.warehouseId === warehouse.id && isDateInFilter(g.entryTime || (g as any).inwardDate || (g as any).createdAt)
    );
  }, [gateEntries, warehouse.id, isDateInFilter]);

  const filteredBatches = useMemo(() => {
    return batches.filter(
      b => b.warehouseId === warehouse.id && isDateInFilter(b.createdAt || (b as any).date)
    );
  }, [batches, warehouse.id, isDateInFilter]);

  const filteredB2CBatches = useMemo(() => {
    return filteredBatches.filter(b => b.batchType !== 'B2B Return');
  }, [filteredBatches]);

  const filteredB2BBatches = useMemo(() => {
    return filteredBatches.filter(b => b.batchType === 'B2B Return');
  }, [filteredBatches]);

  const filteredScannedItems = useMemo(() => {
    const warehouseBatchIds = new Set(batches.filter(b => b.warehouseId === warehouse.id).map(b => b.id));
    return scannedItems.filter(
      s => warehouseBatchIds.has(s.batchId) && isDateInFilter(s.scannedAt || (s as any).createdAt)
    );
  }, [scannedItems, batches, warehouse.id, isDateInFilter]);

  const filteredAuditRecords = useMemo(() => {
    return auditRecords.filter(
      a => isDateInFilter(a.scannedAt || (a as any).timestamp)
    );
  }, [auditRecords, isDateInFilter]);

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

  // Metrics Calculation (Real Data, 0 fallback when empty)
  const metrics = useMemo(() => {
    const totalScanned = filteredScannedItems.length;

    const goodCount = filteredScannedItems.filter(s => getConditionKey(s) === 'GOOD').length;
    const damageCount = filteredScannedItems.filter(s => getConditionKey(s) === 'DAMAGE').length;
    const openBoxCount = filteredScannedItems.filter(s => getConditionKey(s) === 'OPEN BOX').length;
    const wrongProdCount = filteredScannedItems.filter(s => getConditionKey(s) === 'WRONG PROD').length;
    const shortQtyCount = filteredScannedItems.filter(s => getConditionKey(s) === 'SHORT QTY').length;
    const missingCount = filteredScannedItems.filter(s => getConditionKey(s) === 'MISSING').length;
    const othersCount = filteredScannedItems.filter(s => getConditionKey(s) === 'OTHERS').length;

    const defectiveCount = totalScanned - goodCount;
    const goodPct = totalScanned > 0 ? Math.round((goodCount / totalScanned) * 100) : 100;
    const damagePct = totalScanned > 0 ? Math.round((damageCount / totalScanned) * 100) : 0;
    const openBoxPct = totalScanned > 0 ? Math.round((openBoxCount / totalScanned) * 100) : 0;
    const wrongProdPct = totalScanned > 0 ? Math.round((wrongProdCount / totalScanned) * 100) : 0;

    const inwardVehiclesCount = filteredGateEntries.length;
    const totalBoxesUnloaded = filteredGateEntries.reduce((acc, g) => acc + (g.receivedBoxCount || 0), 0);

    // Physical Cycle Count: Total Scanned Count + Active Device Login Count
    const totalCycleScans = filteredAuditRecords.reduce((acc, a) => acc + (a.quantity || 1), 0);
    const activeAuditDeviceCount = auditorDevices.filter(d => d.status === 'Active').length || (filteredAuditRecords.length > 0 ? 1 : 0);

    // Active HHD & Logins status
    const activeHHDCount = auditorDevices.filter(d => d.status === 'Active').length || 1;
    const activeLoginSessions = activeDevices.filter(d => d.status === 'Online').length || users.length || 1;

    // B2B Returns metrics
    const b2bBatchesCount = filteredB2BBatches.length;
    const b2bOpenCount = filteredB2BBatches.filter(b => b.status === 'Open').length;
    const b2bClosedCount = filteredB2BBatches.filter(b => b.status === 'Closed').length;
    const b2bTotalScanned = filteredB2BBatches.reduce((acc, b) => acc + (b.totalScanned || 0), 0);

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
      missingCount,
      othersCount,
      inwardVehiclesCount,
      totalBoxesUnloaded,
      totalCycleScans,
      activeAuditDeviceCount,
      activeHHDCount,
      activeLoginSessions,
      b2bBatchesCount,
      b2bOpenCount,
      b2bClosedCount,
      b2bTotalScanned,
    };
  }, [
    filteredScannedItems,
    filteredGateEntries,
    filteredAuditRecords,
    auditorDevices,
    activeDevices,
    users,
    filteredB2BBatches,
  ]);

  // Hourly Live Trend Data for Area Chart (Grouped from real scans in active date filter)
  const hourlyTrendData = useMemo(() => {
    const buckets: Record<string, { scans: number; good: number }> = {
      '08:00': { scans: 0, good: 0 },
      '10:00': { scans: 0, good: 0 },
      '12:00': { scans: 0, good: 0 },
      '14:00': { scans: 0, good: 0 },
      '16:00': { scans: 0, good: 0 },
      '18:00': { scans: 0, good: 0 },
      '20:00': { scans: 0, good: 0 },
    };

    filteredScannedItems.forEach((item) => {
      if (!item.scannedAt) return;
      try {
        const itemHour = new Date(item.scannedAt).getHours();
        const isGood = getConditionKey(item) === 'GOOD';

        let bucketKey = '08:00';
        if (itemHour < 9) bucketKey = '08:00';
        else if (itemHour < 11) bucketKey = '10:00';
        else if (itemHour < 13) bucketKey = '12:00';
        else if (itemHour < 15) bucketKey = '14:00';
        else if (itemHour < 17) bucketKey = '16:00';
        else if (itemHour < 19) bucketKey = '18:00';
        else bucketKey = '20:00';

        buckets[bucketKey].scans += 1;
        if (isGood) buckets[bucketKey].good += 1;
      } catch {
        // ignore date error
      }
    });

    // Cumulative progression
    let cumulativeScans = 0;
    let cumulativeGood = 0;
    return Object.entries(buckets).map(([time, val]) => {
      cumulativeScans += val.scans;
      cumulativeGood += val.good;
      return {
        time,
        scans: cumulativeScans,
        good: cumulativeGood,
      };
    });
  }, [filteredScannedItems]);

  // Account Distribution by Count
  const clientAccountsList = useMemo(() => {
    const palette = ['#8B5CF6', '#14B8A6', '#EC4899', '#F59E0B', '#06B6D4', '#3B82F6', '#10B981', '#64748B'];
    if (clients.length === 0) return [];

    const totalUnits = metrics.totalScanned;

    return clients.map((c, idx) => {
      const clientBatches = filteredBatches.filter(b => b.clientId === c.id);
      const clientBatchIds = new Set(clientBatches.map(b => b.id));
      const count = filteredScannedItems.filter(s => clientBatchIds.has(s.batchId)).length;
      const pct = totalUnits > 0 ? Math.round((count / totalUnits) * 100) : 0;

      return {
        id: c.id,
        name: c.name,
        code: c.code,
        color: palette[idx % palette.length],
        count,
        pct,
      };
    });
  }, [clients, filteredBatches, filteredScannedItems, metrics.totalScanned]);

  // Donut Chart Data
  const donutData = useMemo(() => {
    const nonZero = clientAccountsList.filter(item => item.count > 0);
    if (nonZero.length === 0) {
      return [
        {
          name: 'No scans in period',
          value: 1,
          color: '#334155',
          pct: 0,
        },
      ];
    }
    return nonZero.map(item => ({
      name: item.name,
      value: item.count,
      color: item.color,
      pct: item.pct,
    }));
  }, [clientAccountsList]);

  // Recent operations activity feed (within filtered dataset)
  const recentActivities = useMemo(() => {
    const items: Array<{
      id: string;
      type: 'inward' | 'return' | 'audit' | 'b2b';
      title: string;
      subtitle: string;
      time: string;
      status: string;
      statusColor: string;
    }> = [];

    // Filtered gate entries
    filteredGateEntries.slice(0, 3).forEach((g) => {
      items.push({
        id: `gate-${g.id}`,
        type: 'inward',
        title: `Gate Pass ${g.gatePassNumber || 'GP-INW'}`,
        subtitle: `${g.vehicleNumber || 'Vehicle'} • ${g.receivedBoxCount || 0} Boxes (${g.driverName || 'Driver'})`,
        time: g.entryTime ? new Date(g.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
        status: g.status || 'Received',
        statusColor: '#06B6D4',
      });
    });

    // Filtered return batches
    filteredBatches.slice(0, 3).forEach((b) => {
      const client = clients.find(c => c.id === b.clientId);
      items.push({
        id: `batch-${b.id}`,
        type: b.batchType === 'B2B Return' ? 'b2b' : 'return',
        title: `${b.batchType === 'B2B Return' ? 'B2B Batch' : 'RTO Batch'} ${b.batchNumber}`,
        subtitle: `${client?.name || 'Client'} • ${b.totalScanned || 0} Items Processed`,
        time: b.createdAt ? new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
        status: b.status === 'Closed' ? 'Closed' : 'Active',
        statusColor: b.batchType === 'B2B Return' ? '#EC4899' : '#8B5CF6',
      });
    });

    return items.slice(0, 6);
  }, [filteredGateEntries, filteredBatches, clients]);

  return (
    <div className="space-y-6 select-none font-sans text-slate-900 dark:text-[#F8FAFC]">
      {/* 1. Header: Page Title + Facility Badge + Date Filter + Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-theme pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              WMS Operations Dashboard
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#3B2D54] text-[#A78BFA] border border-[#8B5CF6]/30">
              {warehouse.name || 'Bhiwandi Hub'}
            </span>
          </div>

          {/* Date Filter Dropdown with Today (Default), Yesterday, Last 7 Days, Custom Calendar */}
          <div className="relative mt-2 inline-block" ref={datePickerRef}>
            <button
              id="dashboard-date-filter-button"
              type="button"
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1E293B] border border-theme text-xs font-medium text-[#F8FAFC] shadow-sm hover:border-[#8B5CF6]/60 cursor-pointer transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span className="font-semibold">{dateFilterLabel}</span>
              <ChevronDown className="w-3 h-3 text-[#64748B]" />
            </button>

            {isDatePickerOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-[#1E293B] border border-theme rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in-50 space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1">
                  Select Date Filter
                </div>

                <div className="space-y-1">
                  {/* Today (Default) */}
                  <button
                    type="button"
                    onClick={() => {
                      setDateFilter('today');
                      setIsDatePickerOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      dateFilter === 'today'
                        ? 'bg-[#3B2D54] text-[#8B5CF6] font-bold border border-[#8B5CF6]/30'
                        : 'text-[#F8FAFC] hover:bg-[#152238]'
                    }`}
                  >
                    <span>Today (Default)</span>
                    {dateFilter === 'today' && <Check className="w-3.5 h-3.5 text-[#8B5CF6]" />}
                  </button>

                  {/* Yesterday */}
                  <button
                    type="button"
                    onClick={() => {
                      setDateFilter('yesterday');
                      setIsDatePickerOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      dateFilter === 'yesterday'
                        ? 'bg-[#3B2D54] text-[#8B5CF6] font-bold border border-[#8B5CF6]/30'
                        : 'text-[#F8FAFC] hover:bg-[#152238]'
                    }`}
                  >
                    <span>Yesterday</span>
                    {dateFilter === 'yesterday' && <Check className="w-3.5 h-3.5 text-[#8B5CF6]" />}
                  </button>

                  {/* Last 7 Days */}
                  <button
                    type="button"
                    onClick={() => {
                      setDateFilter('last_7_days');
                      setIsDatePickerOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      dateFilter === 'last_7_days'
                        ? 'bg-[#3B2D54] text-[#8B5CF6] font-bold border border-[#8B5CF6]/30'
                        : 'text-[#F8FAFC] hover:bg-[#152238]'
                    }`}
                  >
                    <span>Last 7 Days</span>
                    {dateFilter === 'last_7_days' && <Check className="w-3.5 h-3.5 text-[#8B5CF6]" />}
                  </button>

                  {/* Custom Calendar Range Option */}
                  <button
                    type="button"
                    onClick={() => setDateFilter('custom')}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      dateFilter === 'custom'
                        ? 'bg-[#3B2D54] text-[#8B5CF6] font-bold border border-[#8B5CF6]/30'
                        : 'text-[#F8FAFC] hover:bg-[#152238]'
                    }`}
                  >
                    <span>Custom Calendar Range</span>
                    {dateFilter === 'custom' && <Check className="w-3.5 h-3.5 text-[#8B5CF6]" />}
                  </button>
                </div>

                {/* Custom Date Range Picker Container */}
                {dateFilter === 'custom' && (
                  <div className="pt-2 border-t border-theme space-y-2">
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setCustomStartDate(thirtyDaysAgoStr);
                          setCustomEndDate(todayStr);
                        }}
                        className="text-[10px] px-2 py-1 rounded-lg bg-[#152238] hover:bg-[#20304c] text-slate-300 font-semibold text-center cursor-pointer"
                      >
                        1 Month
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomStartDate(sixtyDaysAgoStr);
                          setCustomEndDate(todayStr);
                        }}
                        className="text-[10px] px-2 py-1 rounded-lg bg-[#152238] hover:bg-[#20304c] text-slate-300 font-semibold text-center cursor-pointer"
                      >
                        2 Months
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomStartDate(ninetyDaysAgoStr);
                          setCustomEndDate(todayStr);
                        }}
                        className="text-[10px] px-2 py-1 rounded-lg bg-[#152238] hover:bg-[#20304c] text-slate-300 font-semibold text-center cursor-pointer"
                      >
                        3 Months
                      </button>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Start Date</label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={e => setCustomStartDate(e.target.value)}
                          className="w-full bg-[#152238] border border-theme rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">End Date</label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={e => setCustomEndDate(e.target.value)}
                          className="w-full bg-[#152238] border border-theme rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsDatePickerOpen(false)}
                      className="w-full py-1.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold cursor-pointer transition-colors text-center mt-1"
                    >
                      Apply Range
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Top Right Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigateTab('returns_rto')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-sm font-semibold shadow-xs hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-white" />
            <span>Start Return Batch</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('returns_b2b')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#EC4899] hover:bg-[#DB2777] text-white text-sm font-semibold shadow-xs hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <Boxes className="w-4 h-4 text-white" />
            <span>B2B Returns</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('inward')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#06B6D4] hover:bg-[#0891B2] text-white text-sm font-semibold shadow-xs hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Inward Gate Entry</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('inventory')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#14B8A6] dark:hover:bg-[#0D9488] text-white text-sm font-semibold shadow-xs hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <Scan className="w-4 h-4 text-white" />
            <span>Audit Guns</span>
          </button>
        </div>
      </div>

      {/* 2. Top 5 Stat KPI Cards in One Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: B2C / RTO Returns */}
        <div
          id="kpi-card-rto-returns"
          onClick={() => onNavigateTab('returns_rto')}
          className="bg-card border border-theme rounded-[20px] p-5 shadow-sm hover:border-[#8B5CF6]/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
              B2C / RTO Returns
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#3B2D54] flex items-center justify-center text-[#A78BFA]">
              <RotateCcw className="w-5 h-5" />
            </div>
          </div>
          <div className="my-1">
            <div className="flex items-baseline gap-2">
              <span className="text-[32px] font-bold text-[#F8FAFC] leading-none">
                {metrics.totalScanned}
              </span>
              <span className="text-sm font-semibold text-[#64748B]">Units</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-[#10B981]">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{filteredB2CBatches.length} Active RTO Batches</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#64748B] mb-1.5">
              <span>Good QC Pass Rate</span>
              <span className="text-white font-bold">{metrics.goodPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#334155] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#8B5CF6] rounded-full transition-all duration-500"
                style={{ width: `${metrics.goodPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Gate Inward Register */}
        <div
          id="kpi-card-gate-inward"
          onClick={() => onNavigateTab('inward')}
          className="bg-card border border-theme rounded-[20px] p-5 shadow-sm hover:border-[#06B6D4]/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
              Gate Inward Register
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#164E63] flex items-center justify-center text-[#38BDF8]">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="my-1">
            <div className="flex items-baseline gap-2">
              <span className="text-[32px] font-bold text-[#F8FAFC] leading-none">
                {metrics.inwardVehiclesCount}
              </span>
              <span className="text-sm font-semibold text-[#64748B]">Vehicles</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-[#10B981]">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{metrics.totalBoxesUnloaded} Boxes Received</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#64748B] mb-1.5">
              <span>Boxes Unloaded</span>
              <span className="text-white font-bold">{metrics.totalBoxesUnloaded} Boxes</span>
            </div>
            <div className="w-full h-1.5 bg-[#334155] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#06B6D4] rounded-full transition-all duration-500"
                style={{ width: metrics.inwardVehiclesCount > 0 ? '100%' : '0%' }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: B2B Return */}
        <div
          id="kpi-card-b2b-returns"
          onClick={() => onNavigateTab('returns_b2b')}
          className="bg-card border border-theme rounded-[20px] p-5 shadow-sm hover:border-[#EC4899]/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
              B2B Return
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#501335] flex items-center justify-center text-[#F472B6]">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="my-1">
            <div className="flex items-baseline gap-2">
              <span className="text-[32px] font-bold text-[#F8FAFC] leading-none">
                {metrics.b2bTotalScanned}
              </span>
              <span className="text-sm font-semibold text-[#64748B]">Units</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-[#10B981]">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{filteredB2BBatches.length} Active B2B Batches</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#64748B] mb-1.5">
              <span>Good QC Pass Rate</span>
              <span className="text-white font-bold">{metrics.goodPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#334155] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#EC4899] rounded-full transition-all duration-500"
                style={{ width: `${metrics.goodPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Physical Cycle Count */}
        <div
          id="kpi-card-cycle-count"
          onClick={() => onNavigateTab('inventory')}
          className="bg-card border border-theme rounded-[20px] p-5 shadow-sm hover:border-[#14B8A6]/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
              Physical Cycle Count
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#134E4A] flex items-center justify-center text-[#2DD4BF]">
              <Scan className="w-5 h-5" />
            </div>
          </div>
          <div className="my-1">
            <div className="flex items-baseline gap-2">
              <span className="text-[32px] font-bold text-[#F8FAFC] leading-none">
                {metrics.totalCycleScans}
              </span>
              <span className="text-sm font-semibold text-[#64748B]">Total Scanned Count</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-[#2DD4BF]">
              <Users className="w-3.5 h-3.5" />
              <span>Active Device Login Count: <strong className="text-white font-mono">{metrics.activeAuditDeviceCount}</strong></span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#64748B] mb-1.5">
              <span>Physical Audit Scans</span>
              <span className="text-white font-bold font-mono">{filteredAuditRecords.length} records</span>
            </div>
            <div className="w-full h-1.5 bg-[#334155] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#14B8A6] rounded-full transition-all duration-500"
                style={{ width: metrics.totalCycleScans > 0 ? '100%' : '0%' }}
              />
            </div>
          </div>
        </div>

        {/* Card 5: Active HHD & Logins */}
        <div
          id="kpi-card-active-hhd-logins"
          onClick={() => onNavigateTab('inventory')}
          className="bg-card border border-theme rounded-[20px] p-5 shadow-sm hover:border-[#F472B6]/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
              Active HHD & Logins
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#831843] flex items-center justify-center text-[#F472B6]">
              <Smartphone className="w-5 h-5" />
            </div>
          </div>
          <div className="my-1">
            <div className="flex items-baseline gap-2">
              <span className="text-[32px] font-bold text-[#F8FAFC] leading-none">
                {metrics.activeHHDCount}
              </span>
              <span className="text-sm font-semibold text-[#64748B]">Active HHDs</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-[#10B981]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{metrics.activeLoginSessions} Operator Logins Online</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#64748B] mb-1.5">
              <span>Sync & Connectivity</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-400" /> Synchronized
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#334155] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#EC4899] rounded-full transition-all duration-500"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Middle Section: Area Chart (Live Ops Trends) + Donut Chart (Account Distribution by Count) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Area Chart: Live Operations (Span 2) */}
        <div className="lg:col-span-2 bg-card border border-theme rounded-[20px] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white">
                Live Operations & Hourly Scan Trends
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Real-time throughput of processed AWB units ({dateFilterLabel})
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#3B2D54] text-[#A78BFA] border border-purple-800/40">
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis
                  dataKey="time"
                  stroke="#64748B"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#1E293B] border border-theme rounded-xl p-3 shadow-lg text-xs">
                          <div className="font-semibold text-[#F8FAFC] mb-1">{label}</div>
                          <div className="text-[#8B5CF6] font-semibold">Total Scans: {payload[0]?.value} units</div>
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
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#purpleGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: Account Distribution by Count (Span 1) */}
        <div id="account-distribution-donut" className="bg-card border border-theme rounded-[20px] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white">
              Account Distribution by Count
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Client share of processed returns in period
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
              <span className="text-2xl font-bold text-[#F8FAFC] font-mono">
                {metrics.totalScanned}
              </span>
              <span className="text-[11px] font-semibold text-[#64748B]">Total Units</span>
            </div>
          </div>

          {/* Clean Legend */}
          <div className="space-y-2 pt-2 border-t border-theme">
            {clientAccountsList.slice(0, 4).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="font-semibold text-[#F8FAFC] truncate">{entry.name}</span>
                </div>
                <span className="font-semibold text-slate-400 font-mono">
                  {entry.count} ({entry.pct}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Bottom Section: Account Distribution by Count List + QC Condition Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Account Distribution by Count (Span 2) */}
        <div id="account-distribution-by-count-list" className="lg:col-span-2 bg-card border border-theme rounded-[20px] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">
                Account Distribution by Count
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Processed unit volume and percentage share per registered client account
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('masters')}
              className="text-xs font-semibold text-[#8B5CF6] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Manage Masters <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-theme">
            {clientAccountsList.map((client) => (
              <div key={client.id} className="py-3.5 first:pt-1 last:pb-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: client.color }} />
                    <span className="text-sm font-semibold text-[#F8FAFC]">
                      {client.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      ({client.code})
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-xs font-medium text-slate-300 bg-[#152238] px-2.5 py-0.5 rounded-full border border-theme font-mono">
                      {client.count} units
                    </span>
                    <span className="font-semibold text-[#64748B] min-w-[36px] text-right font-mono">
                      {client.pct}%
                    </span>
                  </div>
                </div>
                {/* Mini Progress Bar below name */}
                <div className="w-full h-1 bg-[#334155] rounded-full overflow-hidden">
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
        <div className="bg-card border border-theme rounded-[20px] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white">
              QC Condition Status
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Live inspection triage breakdown in period
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
                  stroke="#334155"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="url(#progressRingGradient)"
                  strokeWidth="8"
                  strokeDasharray={`${metrics.goodPct * 2.51} 251.2`}
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
                <span className="text-xl font-bold text-[#F8FAFC]">
                  {metrics.goodPct}%
                </span>
                <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-wide">
                  Pass Rate
                </span>
              </div>
            </div>
          </div>

          {/* 4 Condition Summary Badges */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-theme text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 font-bold">
              <span>Good</span>
              <span className="font-mono">{metrics.goodCount}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-950/40 text-rose-300 border border-rose-800/40 font-bold">
              <span>Damage</span>
              <span className="font-mono">{metrics.damageCount}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-950/40 text-amber-300 border border-amber-800/40 font-bold">
              <span>Open Box</span>
              <span className="font-mono">{metrics.openBoxCount}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-950/40 text-purple-300 border border-purple-800/40 font-bold">
              <span>Wrong Prod</span>
              <span className="font-mono">{metrics.wrongProdCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Live Operations Activity Stream (Filtered Feed) */}
      <div className="bg-card border border-theme rounded-[20px] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#3B2D54] flex items-center justify-center text-[#A78BFA]">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Live Operations Feed
              </h2>
              <p className="text-xs text-[#64748B]">
                Recent gate entries, return batches, and warehouse events ({dateFilterLabel})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateTab('reports')}
              className="text-xs font-semibold text-[#A78BFA] hover:text-purple-300 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Full Operational Log <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="divide-y divide-theme">
          {recentActivities.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs">
              No live operations recorded for {dateFilterLabel}.
            </div>
          ) : (
            recentActivities.map((act) => (
              <div key={act.id} className="py-3 flex items-center justify-between gap-4 first:pt-1 last:pb-1">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-transparent bg-slate-800 text-slate-300 shadow-2xs"
                  >
                    {act.type === 'inward' ? (
                      <Truck className="w-4 h-4 text-cyan-400" />
                    ) : act.type === 'b2b' ? (
                      <Boxes className="w-4 h-4 text-pink-400" />
                    ) : act.type === 'return' ? (
                      <RotateCcw className="w-4 h-4 text-purple-400" />
                    ) : (
                      <Scan className="w-4 h-4 text-teal-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {act.title}
                    </div>
                    <div className="text-xs text-[#64748B]">
                      {act.subtitle}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-transparent bg-slate-800 text-slate-300"
                  >
                    {act.status}
                  </span>
                  <span className="text-xs text-[#94A3B8] font-mono hidden sm:inline">
                    {act.time}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
