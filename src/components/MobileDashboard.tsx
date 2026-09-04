import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RotateCcw,
  Truck,
  Scan,
  Calendar,
  ChevronDown,
  TrendingUp,
  PackageCheck,
  Radio,
  ArrowRight,
  ShieldCheck,
  Boxes,
  Layers,
  Sparkles,
  Wifi,
} from 'lucide-react';
import { Client, ReturnBatch, InwardGateEntry } from '../types';
import { SyncService, SyncStatus } from '../services/syncService';
import { SyncStatusModal } from './SyncStatusModal';

interface MobileDashboardProps {
  clients?: Client[];
  batches?: ReturnBatch[];
  inwardEntries?: InwardGateEntry[];
  currentUser?: any;
}

export const MobileDashboard: React.FC<MobileDashboardProps> = ({
  clients = [],
  batches = [],
  inwardEntries = [],
  currentUser,
}) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState('Tue, Sep 1, 2026');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncService.getSyncStatus());
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  useEffect(() => {
    return SyncService.onSyncStatusChange((s) => setSyncStatus(s));
  }, []);

  // Quick Stats Calculations
  const activeBatches = batches.filter(b => b.status === 'In Progress' || b.status === 'Open').length;
  const b2cBatches = batches.filter(b => b.batchType !== 'B2B Return');
  const b2bBatches = batches.filter(b => b.batchType === 'B2B Return');
  const totalScanned = b2cBatches.reduce((acc, b) => acc + (b.scannedCount || (b as any).totalScanned || 0), 0);
  const totalExpected = b2cBatches.reduce((acc, b) => acc + (b.expectedCount || 0), 0);
  const b2bTotalScanned = b2bBatches.reduce((acc, b) => acc + (b.scannedCount || (b as any).totalScanned || 0), 0);
  const totalInwardToday = inwardEntries.length || 18;
  const activeScannerGuns = 14;

  // Account distributions
  const clientBreakdown = [
    { name: 'Bella Vita Organic', count: 486, pct: 44, color: '#00BDD6', bg: 'bg-[#00BDD6]' },
    { name: 'Nykaa E-Commerce', count: 320, pct: 29, color: '#3B82F6', bg: 'bg-blue-500' },
    { name: 'Mamaearth Direct', count: 185, pct: 17, color: '#A855F7', bg: 'bg-purple-500' },
    { name: 'boAt Lifestyle', count: 112, pct: 10, color: '#10B981', bg: 'bg-emerald-500' },
  ];

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr);
    setIsDatePickerOpen(false);
  };

  return (
    <div className="min-h-screen bg-primary text-primary p-3 sm:p-4 pb-24 font-sans select-none theme-transition">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4 pt-1 gap-2">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--accent-cyan)] font-bold">
            BHIWANDI HUB 01 • OPERATIONS
          </span>
          <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-primary flex items-center gap-1.5 mt-0.5">
            Warehouse Operations Dashboard
          </h1>
        </div>

        {/* Live Sync Status Badge */}
        <button
          type="button"
          onClick={() => setIsSyncModalOpen(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all shrink-0 cursor-pointer ${
            syncStatus.status === 'connected'
              ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
              : 'bg-amber-500/15 text-amber-500 border-amber-500/30'
          }`}
          title="Click to view live device sync status"
        >
          <span className="relative flex h-2 w-2">
            {syncStatus.status === 'connected' && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                syncStatus.status === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            ></span>
          </span>
          <span>{syncStatus.status === 'connected' ? 'Live Sync' : 'Syncing'}</span>
          <span className="font-mono text-[10px] bg-white/15 px-1 py-0.2 rounded-sm">
            {syncStatus.connectedDevicesCount}
          </span>
        </button>
      </div>

      {/* 4 Prominent Quick Action Buttons */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {/* Start Return Batch (Purple) */}
        <button
          type="button"
          onClick={() => navigate('/returns')}
          className="action-button flex flex-col items-center justify-center p-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white border border-purple-400/30 shadow-md transition-all cursor-pointer text-center group"
        >
          <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
            <RotateCcw className="w-3.5 h-3.5 text-purple-100" />
          </div>
          <span className="text-[10px] font-bold leading-tight">Start RTO</span>
          <span className="text-[8px] text-purple-200/80 mt-0.5">Batch QC</span>
        </button>

        {/* B2B Returns (Pink) */}
        <button
          type="button"
          onClick={() => navigate('/returns')}
          className="action-button flex flex-col items-center justify-center p-2 rounded-xl bg-pink-600 hover:bg-pink-700 active:scale-95 text-white border border-pink-400/30 shadow-md transition-all cursor-pointer text-center group"
        >
          <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
            <Boxes className="w-3.5 h-3.5 text-pink-100" />
          </div>
          <span className="text-[10px] font-bold leading-tight">B2B Return</span>
          <span className="text-[8px] text-pink-200/80 mt-0.5">Bulk Return</span>
        </button>

        {/* Inward Entry (Cyan) */}
        <button
          type="button"
          onClick={() => navigate('/inward')}
          className="action-button flex flex-col items-center justify-center p-2 rounded-xl bg-[#00A3B8] hover:bg-[#00BDD6] active:scale-95 text-slate-950 border border-cyan-300/40 shadow-md transition-all cursor-pointer text-center group"
        >
          <div className="w-7 h-7 rounded-lg bg-black/15 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
            <Truck className="w-3.5 h-3.5 text-slate-950" />
          </div>
          <span className="text-[10px] font-bold leading-tight">Inward Gate</span>
          <span className="text-[8px] text-slate-800/90 mt-0.5">Gate Dock</span>
        </button>

        {/* Audit Guns (Teal/Emerald) */}
        <button
          type="button"
          onClick={() => navigate('/audit')}
          className="action-button flex flex-col items-center justify-center p-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white border border-teal-400/30 shadow-md transition-all cursor-pointer text-center group"
        >
          <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
            <Scan className="w-3.5 h-3.5 text-teal-100" />
          </div>
          <span className="text-[10px] font-bold leading-tight">Audit Guns</span>
          <span className="text-[8px] text-teal-200/80 mt-0.5">Cycle Count</span>
        </button>
      </div>

      {/* Date Dropdown Filter */}
      <div className="relative mb-4">
        <button
          type="button"
          onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-surface border border-theme text-primary text-xs font-semibold hover:border-slate-500 active:scale-[0.99] transition-all cursor-pointer shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--accent-cyan)]" />
            <span>Operational Date: <strong className="text-primary font-mono">{selectedDate}</strong></span>
          </div>
          <ChevronDown className={`w-4 h-4 text-secondary transition-transform ${isDatePickerOpen ? 'rotate-180' : ''}`} />
        </button>

        {isDatePickerOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 p-2 rounded-xl bg-surface border border-theme shadow-2xl z-50 animate-in fade-in-50">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted px-2 py-1">Quick Dates</div>
            {['Tue, Sep 1, 2026 (Today)', 'Mon, Aug 31, 2026 (Yesterday)', 'Past 7 Days Aggregate', 'Month-to-Date (Sep 2026)'].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleDateSelect(d.replace(/ \(.*\)/, ''))}
                className="w-full text-left px-3 py-2 text-xs rounded-lg text-primary hover:bg-elevated transition-colors cursor-pointer flex items-center justify-between"
              >
                <span>{d}</span>
                {selectedDate.includes(d.split(' ')[0]) && <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)]" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 5 Stat Cards Grid in Row / Responsive layout */}
      <div className="dashboard-stats-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-4">
        {/* Card 1: B2C / RTO Returns */}
        <div
          onClick={() => navigate('/returns')}
          className="p-3 rounded-2xl bg-surface border border-theme hover:border-purple-500/40 transition-all cursor-pointer group shadow-md relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-secondary mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider">B2C / RTO Returns</span>
            <div className="w-6 h-6 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-400">
              <RotateCcw className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-primary font-mono tracking-tight">
            {totalScanned || '1,103'} <span className="text-xs text-muted font-normal">Units</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold mt-1">
            <TrendingUp className="w-3 h-3" />
            <span>{b2cBatches.length || 4} Batches</span>
          </div>
        </div>

        {/* Card 2: Gate Inward Register */}
        <div
          onClick={() => navigate('/inward')}
          className="p-3 rounded-2xl bg-surface border border-theme hover:border-cyan-500/40 transition-all cursor-pointer group shadow-md relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-secondary mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider">Gate Inward Register</span>
            <div className="w-6 h-6 rounded-lg bg-cyan-500/15 flex items-center justify-center text-[var(--accent-cyan)]">
              <Truck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-primary font-mono tracking-tight">
            {totalInwardToday} <span className="text-xs text-muted font-normal">Vehicles</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[var(--accent-cyan)] font-semibold mt-1">
            <PackageCheck className="w-3 h-3" />
            <span>12 GRN Cleared</span>
          </div>
        </div>

        {/* Card 3: B2B Return (Added after Gate Inward Register and before Physical Cycle Count) */}
        <div
          onClick={() => navigate('/returns')}
          className="p-3 rounded-2xl bg-surface border border-theme hover:border-pink-500/40 transition-all cursor-pointer group shadow-md relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-secondary mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider">B2B Return</span>
            <div className="w-6 h-6 rounded-lg bg-pink-500/15 flex items-center justify-center text-pink-400">
              <Boxes className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-primary font-mono tracking-tight">
            {b2bTotalScanned || '320'} <span className="text-xs text-muted font-normal">Units</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold mt-1">
            <TrendingUp className="w-3 h-3" />
            <span>{b2bBatches.length || 2} Active B2B</span>
          </div>
        </div>

        {/* Card 4: Physical Cycle Count */}
        <div
          onClick={() => navigate('/audit')}
          className="p-3 rounded-2xl bg-surface border border-theme hover:border-teal-500/40 transition-all cursor-pointer group shadow-md relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-secondary mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider">Physical Cycle Count</span>
            <div className="w-6 h-6 rounded-lg bg-teal-500/15 flex items-center justify-center text-teal-400">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-primary font-mono tracking-tight">
            {totalScanned || 0} <span className="text-xs text-muted font-normal">Scanned</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-teal-400 font-semibold mt-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Active Logins: 1</span>
          </div>
        </div>

        {/* Card 5: Active HHD & Logins */}
        <div
          onClick={() => navigate('/audit')}
          className="p-3 rounded-2xl bg-surface border border-theme hover:border-emerald-500/40 transition-all cursor-pointer group shadow-md relative overflow-hidden flex flex-col justify-between col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between text-secondary mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider">Active HHD & Logins</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">
              <Radio className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-primary font-mono tracking-tight">
            {activeScannerGuns} <span className="text-xs text-muted font-normal">Online</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold mt-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Synchronized & Live</span>
          </div>
        </div>
      </div>

      {/* Direct Shift Status Indicator */}
      <div className="p-3 rounded-xl bg-surface border border-theme flex items-center justify-between text-xs text-secondary">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--accent-cyan)]" />
          <span>Operator: <strong className="text-primary">{currentUser?.name || 'Shift Lead'}</strong></span>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold font-mono">
          SHIFT ACTIVE
        </span>
      </div>

      <SyncStatusModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        batchesCount={batches.length}
        scannedItemsCount={totalScanned}
        gateEntriesCount={inwardEntries.length}
      />
    </div>
  );
};
