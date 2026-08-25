import React, { useState, useEffect, useRef } from 'react';
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
  ChevronLeft,
  ChevronDown,
  PieChart as PieChartIcon,
  Users,
  Calendar,
  CalendarDays,
  History,
  RefreshCw,
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

// Helper to get local date key in YYYY-MM-DD format
const getTodayKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to normalize any date/ISO string to YYYY-MM-DD local key
const getDateKey = (dateStr?: string | Date): string => {
  if (!dateStr) return '';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to shift a YYYY-MM-DD date key by N days
const shiftDateKey = (currentKey: string, deltaDays: number): string => {
  const parts = currentKey.split('-');
  if (parts.length !== 3) return getTodayKey();
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  d.setDate(d.getDate() + deltaDays);
  return getDateKey(d);
};

// Helper to format a date key for display (e.g., "Tue, Aug 25, 2026")
const formatDisplayDate = (dateKey: string): string => {
  if (!dateKey) return '';
  const parts = dateKey.split('-');
  if (parts.length !== 3) return dateKey;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  if (isNaN(d.getTime())) return dateKey;

  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Flexible parser for user-typed date inputs (supports YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, Aug 25 2026, Tue Aug 25 2026, etc.)
const parseFlexibleDateInput = (input: string): string | null => {
  if (!input || !input.trim()) return null;
  const clean = input.trim();

  // Try standard YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(clean)) {
    const [y, m, d] = clean.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (!isNaN(dateObj.getTime())) return getDateKey(dateObj);
  }

  // Try DD/MM/YYYY or DD-MM-YYYY or MM/DD/YYYY
  const parts = clean.split(/[\/\-.]/);
  if (parts.length === 3) {
    const p0 = parseInt(parts[0], 10);
    const p1 = parseInt(parts[1], 10);
    const p2 = parseInt(parts[2], 10);
    if (p2 > 1000) {
      // If p0 > 12 it's DD/MM/YYYY
      const month = p0 > 12 ? p1 - 1 : p0 - 1;
      const day = p0 > 12 ? p0 : p1;
      const dObj = new Date(p2, month, day);
      if (!isNaN(dObj.getTime())) return getDateKey(dObj);
    }
  }

  // General Date parse (e.g. "Aug 25, 2026" or "Tue, Aug 25, 2026" or "25 Aug 2026")
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1990 && parsed.getFullYear() < 2100) {
    return getDateKey(parsed);
  }

  return null;
};

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
  // Current System Date & User Selected Date for Filter (Format: YYYY-MM-DD)
  const [currentSystemDate, setCurrentSystemDate] = useState<string>(getTodayKey());
  const [selectedDate, setSelectedDate] = useState<string>(getTodayKey());
  const [typedDateText, setTypedDateText] = useState<string>(formatDisplayDate(getTodayKey()));
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [viewYear, setViewYear] = useState<number>(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => new Date().getMonth());
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const nativeDateInputRef = useRef<HTMLInputElement>(null);
  const wasOnTodayRef = useRef<boolean>(true);

  // Keep typed date text in sync with selectedDate when selectedDate changes from calendar
  useEffect(() => {
    setTypedDateText(formatDisplayDate(selectedDate));
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      setViewYear(parseInt(parts[0], 10));
      setViewMonth(parseInt(parts[1], 10) - 1);
    }
  }, [selectedDate]);

  // Close calendar popup on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        calendarContainerRef.current &&
        !calendarContainerRef.current.contains(e.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle user committing their typed date text
  const handleCommitTypedDate = (textToCommit: string) => {
    const parsed = parseFlexibleDateInput(textToCommit);
    if (parsed) {
      setSelectedDate(parsed);
      setTypedDateText(formatDisplayDate(parsed));
    } else {
      // Revert to valid display date
      setTypedDateText(formatDisplayDate(selectedDate));
    }
  };

  // Keep track of whether user was viewing today
  useEffect(() => {
    wasOnTodayRef.current = selectedDate === currentSystemDate;
  }, [selectedDate, currentSystemDate]);

  // Periodic automatic midnight/day change detector:
  // When system day rolls over, auto-refresh dashboard to the new current date
  useEffect(() => {
    const timer = setInterval(() => {
      const freshToday = getTodayKey();
      if (freshToday !== currentSystemDate) {
        setCurrentSystemDate(freshToday);
        if (wasOnTodayRef.current) {
          // Auto-advance dashboard to the new day so only today's data is displayed
          setSelectedDate(freshToday);
          setTypedDateText(formatDisplayDate(freshToday));
        }
      }
    }, 15000); // check every 15 seconds

    return () => clearInterval(timer);
  }, [currentSystemDate]);

  const isToday = selectedDate === currentSystemDate;

  // ---------------------------------------------------------------------------
  // FILTER ALL DATA TO ONLY THE SELECTED DATE
  // ---------------------------------------------------------------------------
  const filteredGateEntries = gateEntries.filter(
    g => getDateKey(g.entryTime) === selectedDate
  );

  const filteredBatches = batches.filter(
    b => getDateKey(b.createdAt) === selectedDate
  );

  const filteredAuditRecords = auditRecords.filter(
    r => getDateKey(r.scannedAt) === selectedDate
  );

  // Active scanning devices for the selected date
  const devicesActiveOnDate = auditorDevices.filter(d => {
    const hasRecordOnDate = filteredAuditRecords.some(r => r.auditorDeviceId === d.id);
    return hasRecordOnDate || (isToday && d.status === 'Active');
  });

  // Selected client from dropdown (Default: 'ALL' for whole count)
  const [selectedClientId, setSelectedClientId] = useState<string>('ALL');
  const [hoveredSliceKey, setHoveredSliceKey] = useState<string | null>(null);

  // Accordion state for mobile registers
  const [isInwardAccordionOpen, setIsInwardAccordionOpen] = useState(true);
  const [isAuditorAccordionOpen, setIsAuditorAccordionOpen] = useState(true);

  // Compute stats per client based on filtered batches
  const clientReturnMap = clients.map((client, idx) => {
    const clientBatches = filteredBatches.filter(b => b.clientId === client.id);
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

  // Calculate Consolidated Total across all accounts for the selected date
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

  // Active Selected Account Data for Live Details
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

  // Vehicles summary for selected date
  const totalVehicles = filteredGateEntries.length;
  const totalReceivedBoxes = filteredGateEntries.reduce((acc, g) => acc + (g.receivedBoxCount || 0), 0);

  // Operator / Auditor count stats for selected date
  const operatorAuditCounts: Record<string, number> = {};
  filteredAuditRecords.forEach(r => {
    const op = r.auditorName || r.auditorDeviceId;
    operatorAuditCounts[op] = (operatorAuditCounts[op] || 0) + r.quantity;
  });

  // Global Keyboard Shortcuts for the 4 Main Warehouse Operations
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      if ((e.altKey && e.key.toLowerCase() === 'b') || (e.shiftKey && e.key.toLowerCase() === 'b')) {
        e.preventDefault();
        onOpenNewBatchModal();
      } else if ((e.altKey && e.key.toLowerCase() === 'i') || (e.shiftKey && e.key.toLowerCase() === 'i')) {
        e.preventDefault();
        onOpenNewGateEntryModal();
      } else if ((e.altKey && e.key.toLowerCase() === 'r') || (e.shiftKey && e.key.toLowerCase() === 'r')) {
        e.preventDefault();
        onNavigateTab('returns_b2b');
      } else if ((e.altKey && e.key.toLowerCase() === 'a') || (e.shiftKey && e.key.toLowerCase() === 'a')) {
        e.preventDefault();
        onNavigateTab('audit');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenNewBatchModal, onOpenNewGateEntryModal, onNavigateTab]);

  return (
    <div className="w-full max-w-[1680px] p-3.5 sm:p-6 space-y-4 sm:space-y-5 mx-auto">
      {/* 1. Top Header with Title, Live Facility Badge & 3 Main Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
              Warehouse Operations Dashboard
            </h1>
            <span className="px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-medium bg-blue-950/80 text-blue-400 border border-blue-500/30">
              EMIZA Central Fulfillment Facility
            </span>
          </div>
        </div>

        {/* 3 Top Action Buttons (Stacked full-width on mobile, flex row on desktop) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full lg:w-auto shrink-0">
          <button
            id="btn-top-start-return-batch"
            onClick={onOpenNewBatchModal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-3.5 py-2.5 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold transition-all shadow-md shadow-blue-600/30 cursor-pointer min-h-[42px] sm:min-h-0"
          >
            <QrCode className="w-4 h-4 shrink-0" />
            <span>Start Return Batch</span>
          </button>

          <button
            id="btn-top-inward-gate-entry"
            onClick={onOpenNewGateEntryModal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-3.5 py-2.5 sm:py-2 rounded-xl bg-slate-900/90 hover:bg-slate-850 active:bg-slate-800 border border-slate-800 text-white text-xs font-semibold transition-all cursor-pointer shadow-sm min-h-[42px] sm:min-h-0"
          >
            <Plus className="w-4 h-4 text-emerald-400 shrink-0" />
            <Truck className="w-4 h-4 text-slate-300 shrink-0" />
            <span>Inward Gate Entry</span>
          </button>

          <button
            id="btn-top-audit-guns"
            onClick={() => onNavigateTab('audit')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-3.5 py-2.5 sm:py-2 rounded-xl bg-purple-950/50 hover:bg-purple-900/60 active:bg-purple-900/80 border border-purple-500/40 text-purple-300 hover:text-purple-200 text-xs font-semibold transition-all cursor-pointer shadow-sm min-h-[42px] sm:min-h-0"
          >
            <Scan className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Audit Guns {devicesActiveOnDate.length > 0 ? `(${devicesActiveOnDate.length})` : ''}</span>
          </button>
        </div>
      </div>

      {/* 2. DATE SELECTION BOX - CLICK TO CHOOSE FROM CALENDAR (DEFAULTS TO TODAY) */}
      <div className="flex items-center" ref={calendarContainerRef}>
        <div className="relative inline-flex items-center">
          {/* Main Clickable Date Button: Click anywhere on the box to open calendar */}
          <button
            id="btn-calendar-trigger"
            type="button"
            onClick={() => setIsCalendarOpen(prev => !prev)}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500 text-white cursor-pointer transition-all shadow-md group select-none hover:bg-slate-800/80 active:scale-[0.98]"
            title="Click to choose a date from calendar"
          >
            <Calendar className="w-4 h-4 text-blue-400 group-hover:text-blue-300 transition-colors shrink-0" />
            <span className="text-sm font-bold text-slate-100 tracking-tight">
              {formatDisplayDate(selectedDate)}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform duration-200 ${isCalendarOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Custom Interactive Calendar Popup */}
          {isCalendarOpen && (
            <div className="absolute top-full left-0 mt-2 z-50 w-72 bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              {/* Calendar Header: Month & Year Navigator */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (viewMonth === 0) {
                      setViewMonth(11);
                      setViewYear(prev => prev - 1);
                    } else {
                      setViewMonth(prev => prev - 1);
                    }
                  }}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="text-xs font-bold text-white tracking-wide">
                  {new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (viewMonth === 11) {
                      setViewMonth(0);
                      setViewYear(prev => prev + 1);
                    } else {
                      setViewMonth(prev => prev + 1);
                    }
                  }}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Day of Week Labels */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-400 mb-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
                  <div key={i} className="py-1">{d}</div>
                ))}
              </div>

              {/* Day Grid */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {/* Empty cells before month start */}
                {Array.from({ length: new Date(viewYear, viewMonth, 1).getDay() }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="h-8" />
                ))}

                {/* Month Days */}
                {Array.from({ length: new Date(viewYear, viewMonth + 1, 0).getDate() }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const monthStr = String(viewMonth + 1).padStart(2, '0');
                  const dayStr = String(dayNum).padStart(2, '0');
                  const thisCellDateKey = `${viewYear}-${monthStr}-${dayStr}`;
                  const isSelected = selectedDate === thisCellDateKey;
                  const isTodayCell = currentSystemDate === thisCellDateKey;

                  return (
                    <button
                      key={`day-${dayNum}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDate(thisCellDateKey);
                        setTypedDateText(formatDisplayDate(thisCellDateKey));
                        setIsCalendarOpen(false);
                      }}
                      className={`h-8 rounded-lg flex items-center justify-center font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/40'
                          : isTodayCell
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>

              {/* Calendar Footer: Quick Jump to Today */}
              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDate(currentSystemDate);
                    setTypedDateText(formatDisplayDate(currentSystemDate));
                    const parts = currentSystemDate.split('-');
                    if (parts.length === 3) {
                      setViewYear(parseInt(parts[0], 10));
                      setViewMonth(parseInt(parts[1], 10) - 1);
                    }
                    setIsCalendarOpen(false);
                  }}
                  className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer py-1 px-2 rounded-lg hover:bg-blue-500/10"
                >
                  Set to Today
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCalendarOpen(false);
                  }}
                  className="text-slate-400 hover:text-white cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Top Summary KPI Cards (Compact 2x2 Grid on Mobile, 4-Cols on Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Total B2C Returns */}
        <div
          onClick={() => onNavigateTab('returns_rto')}
          className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-3.5 sm:p-5 shadow-xl cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400 truncate">B2C Returns</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors shrink-0">
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-bold text-white mt-2 sm:mt-3">
            {consolidatedTotalReturns}{' '}
            <span className="text-xs sm:text-sm font-normal text-slate-400">Units</span>
          </div>
          <div className="text-[10px] sm:text-xs font-medium text-emerald-400 mt-1.5 sm:mt-2 flex flex-wrap items-center gap-1">
            <span>{consolidatedGoodCount} Good ({consolidatedGoodPercent}%)</span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="text-rose-400">{consolidatedDefectCount} Defects</span>
          </div>
        </div>

        {/* Card 2: Gate Inward */}
        <div
          onClick={() => onNavigateTab('inward')}
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-3.5 sm:p-5 shadow-xl cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400 truncate">Gate Inward</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors shrink-0">
              <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-bold text-white mt-2 sm:mt-3">
            {totalVehicles}{' '}
            <span className="text-xs sm:text-sm font-normal text-slate-400">Vehicles</span>
          </div>
          <div className="text-[10px] sm:text-xs font-medium text-emerald-400 mt-1.5 sm:mt-2 truncate">
            {totalReceivedBoxes} Boxes Unloaded
          </div>
        </div>

        {/* Card 3: Cycle Count & Audit */}
        <div
          onClick={() => onNavigateTab('audit')}
          className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-3.5 sm:p-5 shadow-xl cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400 truncate">Cycle Count</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors shrink-0">
              <Scan className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-bold text-white mt-2 sm:mt-3">
            {filteredAuditRecords.reduce((a, b) => a + b.quantity, 0)}{' '}
            <span className="text-xs sm:text-sm font-normal text-slate-400">Scans</span>
          </div>
          <div className="text-[10px] sm:text-xs font-medium text-purple-400 mt-1.5 sm:mt-2 truncate">
            {filteredAuditRecords.length} Bins Audited
          </div>
        </div>

        {/* Card 4: Auditor Scanner Guns */}
        <div
          onClick={() => onNavigateTab('audit')}
          className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-3.5 sm:p-5 shadow-xl cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400 truncate">Scanner Guns</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors shrink-0">
              <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-bold text-white mt-2 sm:mt-3">
            {devicesActiveOnDate.length}{' '}
            <span className="text-xs sm:text-sm font-normal text-slate-400">Guns</span>
          </div>
          <div className="text-[10px] sm:text-xs font-medium text-amber-400 mt-1.5 sm:mt-2 truncate">
            {devicesActiveOnDate.filter(d => d.status === 'Active').length} Active on Floor
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. B2C RETURN - STREAMLINED UNIFIED SECTION (DROPDOWN + LIVE COND + CHART) */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-xl space-y-3 sm:space-y-4">
        {/* Header with Clean Account Dropdown Selector (Stacked on mobile) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight">
                B2C Returns Live Operations
              </h2>
            </div>
          </div>

          {/* Account Dropdown Filter (Full width on mobile) */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
              className="w-full sm:w-auto bg-slate-800 border border-slate-700 text-white font-medium text-xs rounded-xl px-3 py-2.5 sm:py-2 outline-none focus:border-blue-500 transition-all cursor-pointer shadow-inner min-h-[40px] sm:min-h-0"
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
                className="px-2.5 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-xl border border-slate-700 transition-all shrink-0 min-h-[40px] sm:min-h-0 flex items-center justify-center cursor-pointer"
                title="Reset to Whole Count"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Top Live Return Conditions Bar (Compact & Sleek Grid on Mobile) */}
        <div className="bg-slate-950/90 border border-slate-800 p-2.5 sm:p-3 rounded-xl space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
            <span className="font-semibold uppercase text-slate-300 tracking-wider flex items-center gap-1.5 text-[11px] sm:text-xs">
              <Tag className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              Conditions ({activeSelectedData.name}):
            </span>
            <div className="flex items-center gap-1.5 sm:gap-3 text-[10px] sm:text-xs font-medium">
              <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                {activeSelectedData.goodCount} Good ({activeSelectedData.goodPercent}%)
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
                  className={`px-2 sm:px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center justify-between gap-1.5 transition-all cursor-pointer ${
                    cond.bgClass
                  } ${isHovered ? 'ring-2 ring-white scale-[1.03] shadow-md' : 'hover:bg-slate-800/60'}`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: cond.color }}
                    />
                    <span className="truncate text-[10px] sm:text-[11px] font-semibold uppercase">{cond.label}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 font-mono">
                    <span className="text-white font-semibold bg-slate-900/90 px-1 sm:px-1.5 py-0.5 rounded border border-slate-700/80 text-[10px] sm:text-[11px]">
                      {count}
                    </span>
                    <span className="opacity-75 text-[9px] sm:text-[10px]">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Morphing Single Chart & Compact Legend */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3 mb-4">
            <div>
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                <PieChartIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate">
                  {isAllAccounts
                    ? 'Whole Return Distribution'
                    : `${activeSelectedData.fullName} — 7 Conditions`}
                </span>
              </h3>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[11px] sm:text-xs font-medium text-emerald-400">
                {activeSelectedData.goodCount} Good ({activeSelectedData.goodPercent}%) • {activeSelectedData.defectCount} Defective
              </span>
            </div>
          </div>

          {/* Chart + Legend Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-center">
            {/* Donut Chart (6 Cols) */}
            <div className="md:col-span-6 flex flex-col items-center justify-center">
              <div className="relative w-52 h-52 sm:w-60 sm:h-60 shrink-0 flex items-center justify-center">
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
                  <span className="text-[9px] uppercase font-semibold text-blue-400 tracking-wider truncate max-w-[120px]">
                    {hoveredSliceKey
                      ? activeChartSlices.find(s => s.key === hoveredSliceKey)?.shortLabel
                      : activeSelectedData.name}
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-white my-0.5">
                    {hoveredSliceKey
                      ? activeChartSlices.find(s => s.key === hoveredSliceKey)?.count
                      : activeSelectedData.totalReturns}
                  </span>
                  <span className="text-[8px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    {hoveredSliceKey && isAllAccounts
                      ? `${activeChartSlices.find(s => s.key === hoveredSliceKey)?.goodCount} Good`
                      : `${activeSelectedData.goodCount} Good (${activeSelectedData.goodPercent}%)`}
                  </span>
                </div>
              </div>
            </div>

            {/* Compact Legend Grid (6 Cols) */}
            <div className="md:col-span-6 space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 pb-1">
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
                    className={`p-2 sm:p-2.5 rounded-xl border transition-all flex items-center justify-between text-xs cursor-pointer ${
                      isHovered
                        ? 'bg-slate-800 border-slate-600 scale-[1.01] shadow-md'
                        : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div
                        className="w-3 h-3 rounded-md shrink-0 shadow-sm"
                        style={{ backgroundColor: slice.color }}
                      />
                      <span className="font-medium text-slate-200 truncate text-[11px] sm:text-xs">{slice.label}</span>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <span className="font-mono font-medium text-slate-400 text-[10px] sm:text-[11px]">
                        {slice.percent}%
                      </span>
                      <span className="font-semibold text-white text-[11px] sm:text-xs bg-slate-800 px-2 py-0.5 rounded border border-slate-700 min-w-[34px] sm:min-w-[38px] text-center">
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
      {/* 5. INWARD VEHICLES SUMMARY & AUDITOR OPERATOR COUNTS (FILTERED BY DATE) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
        {/* Inward Vehicles by Account with Collapsible Accordion Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <button
              type="button"
              onClick={() => setIsInwardAccordionOpen(prev => !prev)}
              className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity cursor-pointer group"
            >
              <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
              <h3 className="text-xs sm:text-sm font-semibold text-white">Inward Vehicles & Boxes</h3>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isInwardAccordionOpen ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={() => onNavigateTab('inward')}
              className="text-[11px] sm:text-xs font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer shrink-0"
            >
              Full Register →
            </button>
          </div>

          {isInwardAccordionOpen && (
            <div className="space-y-2 animate-in fade-in duration-200">
              {clients.map(c => {
                const entries = filteredGateEntries.filter(g => g.clientId === c.id);
                const vCount = entries.length;
                const boxCount = entries.reduce((acc, g) => acc + (g.receivedBoxCount || 0), 0);

                return (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div className="font-medium text-white flex items-center gap-2 truncate">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${vCount > 0 ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                      <span className="truncate">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded bg-slate-800 font-mono text-emerald-300 font-medium border border-slate-700 text-[11px]">
                        {vCount} {vCount === 1 ? 'Veh.' : 'Veh.'}
                      </span>
                      <span className="px-2 sm:px-2.5 py-0.5 rounded bg-slate-900 font-mono text-white font-semibold border border-slate-700 text-[11px]">
                        {boxCount} Bxs
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Operator & Auditor Gun Scan Counts with Collapsible Accordion Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <button
              type="button"
              onClick={() => setIsAuditorAccordionOpen(prev => !prev)}
              className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity cursor-pointer group"
            >
              <Users className="w-4 h-4 text-purple-400 shrink-0" />
              <h3 className="text-xs sm:text-sm font-semibold text-white">Operator & Gun Scans</h3>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isAuditorAccordionOpen ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={() => onNavigateTab('audit')}
              className="text-[11px] sm:text-xs font-medium text-purple-400 hover:text-purple-300 cursor-pointer shrink-0"
            >
              Audit Console →
            </button>
          </div>

          {isAuditorAccordionOpen && (
            <div className="animate-in fade-in duration-200">
              {devicesActiveOnDate.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60">
                  No scans recorded for {formatDisplayDate(selectedDate)}. Guns will appear here in real time as operators scan on this date.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                  {devicesActiveOnDate.slice(0, 8).map(dev => {
                    const count = operatorAuditCounts[dev.assignedPerson] || operatorAuditCounts[dev.id] || 0;
                    return (
                      <div
                        key={dev.id}
                        onClick={() => onNavigateTab('audit')}
                        className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60 hover:border-purple-500/50 cursor-pointer transition-all flex items-center justify-between text-xs"
                      >
                        <div className="truncate">
                          <div className="font-mono font-medium text-indigo-400 text-[11px]">{dev.id}</div>
                          <div className="text-white font-medium truncate max-w-[120px] text-[11px]">
                            {dev.assignedPerson}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-semibold text-white text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                            {count}
                          </span>
                          <div className="text-[9px] text-slate-400">Scans</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

