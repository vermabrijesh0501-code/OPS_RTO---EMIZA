import React, { useState } from 'react';
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
  Box,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Client, ReturnBatch, InwardGateEntry } from '../types';

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

  // Quick Stats Calculations
  const activeBatches = batches.filter(b => b.status === 'In Progress' || b.status === 'Open').length;
  const totalScanned = batches.reduce((acc, b) => acc + (b.scannedCount || 0), 0);
  const totalExpected = batches.reduce((acc, b) => acc + (b.expectedCount || 0), 0);
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
      <div className="flex items-center justify-between mb-4 pt-1">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--accent-cyan)] font-bold">
            BHIWANDI HUB 01 • OPERATIONS
          </span>
          <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-primary flex items-center gap-1.5 mt-0.5">
            Warehouse Operations Dashboard
          </h1>
        </div>
      </div>

      {/* 3 Prominent Quick Action Buttons */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {/* Start Return Batch (Blue) */}
        <button
          type="button"
          onClick={() => navigate('/returns')}
          className="action-button flex flex-col items-center justify-center p-2.5 rounded-xl bg-blue-600/90 hover:bg-blue-600 active:scale-95 text-white border border-blue-400/30 shadow-lg shadow-blue-900/40 transition-all cursor-pointer text-center group"
        >
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <RotateCcw className="w-4 h-4 text-blue-100" />
          </div>
          <span className="text-[11px] font-bold leading-tight">Start Return</span>
          <span className="text-[9px] text-blue-200/80 mt-0.5">Batch QC</span>
        </button>

        {/* Inward Entry (Cyan) */}
        <button
          type="button"
          onClick={() => navigate('/inward')}
          className="action-button flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#00A3B8] hover:bg-[#00BDD6] active:scale-95 text-slate-950 border border-cyan-300/40 shadow-lg shadow-cyan-950/40 transition-all cursor-pointer text-center group"
        >
          <div className="w-8 h-8 rounded-lg bg-black/15 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <Truck className="w-4 h-4 text-slate-950" />
          </div>
          <span className="text-[11px] font-bold leading-tight">Inward Entry</span>
          <span className="text-[9px] text-slate-800/90 mt-0.5">Gate Dock</span>
        </button>

        {/* Audit Guns (Purple) */}
        <button
          type="button"
          onClick={() => navigate('/audit')}
          className="action-button flex flex-col items-center justify-center p-2.5 rounded-xl bg-purple-600/90 hover:bg-purple-600 active:scale-95 text-white border border-purple-400/30 shadow-lg shadow-purple-900/40 transition-all cursor-pointer text-center group"
        >
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <Scan className="w-4 h-4 text-purple-100" />
          </div>
          <span className="text-[11px] font-bold leading-tight">Audit Guns</span>
          <span className="text-[9px] text-purple-200/80 mt-0.5">Cycle Count</span>
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

      {/* 4 Stat Cards Grid */}
      <div className="dashboard-stats-grid grid grid-cols-2 gap-2.5 mb-4">
        {/* B2C Returns */}
        <div
          onClick={() => navigate('/returns')}
          className="p-3 rounded-2xl bg-surface border border-theme hover:border-blue-500/40 transition-all cursor-pointer group shadow-md relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-secondary mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider">B2C Returns</span>
            <div className="w-6 h-6 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-500">
              <RotateCcw className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-primary font-mono tracking-tight">
            {totalScanned || '1,103'} <span className="text-xs text-muted font-normal">/ {totalExpected || '1,250'}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-semibold mt-1">
            <TrendingUp className="w-3 h-3" />
            <span>88.2% QC Velocity</span>
          </div>
        </div>

        {/* Gate Inward */}
        <div
          onClick={() => navigate('/inward')}
          className="p-3 rounded-2xl bg-surface border border-theme hover:border-cyan-500/40 transition-all cursor-pointer group shadow-md relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-secondary mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider">Gate Inward</span>
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

        {/* Cycle Count */}
        <div
          onClick={() => navigate('/audit')}
          className="p-3 rounded-2xl bg-surface border border-theme hover:border-purple-500/40 transition-all cursor-pointer group shadow-md relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-secondary mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider">Cycle Count</span>
            <div className="w-6 h-6 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-500">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-primary font-mono tracking-tight">
            99.4% <span className="text-xs text-muted font-normal">Acc.</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-purple-500 font-semibold mt-1">
            <ShieldCheck className="w-3 h-3" />
            <span>4 Aisle Audits Open</span>
          </div>
        </div>

        {/* Scanner Guns */}
        <div
          onClick={() => navigate('/audit')}
          className="p-3 rounded-2xl bg-surface border border-theme hover:border-emerald-500/40 transition-all cursor-pointer group shadow-md relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-secondary mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider">Scanner Guns</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-500">
              <Radio className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-primary font-mono tracking-tight">
            {activeScannerGuns} <span className="text-xs text-muted font-normal">Online</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-semibold mt-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Zero Sync Latency</span>
          </div>
        </div>
      </div>

      {/* B2C Returns Live Operations Card */}
      <div className="p-4 rounded-2xl bg-surface border border-theme shadow-lg mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--accent-cyan)] animate-pulse" />
            <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-primary">
              B2C Returns Live Operations
            </h2>
          </div>
          <span className="text-[10px] font-mono font-bold text-secondary">
            {activeBatches} Active Batches
          </span>
        </div>

        {/* Distribution Progress Bar (44% / 56% style visual) */}
        <div className="space-y-1.5 mb-3.5">
          <div className="flex items-center justify-between text-[11px] font-medium text-secondary">
            <span>Client Distribution</span>
            <span className="font-mono text-[var(--accent-cyan)] font-bold">1,103 Items</span>
          </div>
          <div className="w-full h-3.5 bg-elevated rounded-full overflow-hidden flex shadow-inner">
            <div style={{ width: '44%' }} className="h-full bg-[#00BDD6] transition-all" title="Bella Vita: 44%" />
            <div style={{ width: '29%' }} className="h-full bg-blue-500 transition-all" title="Nykaa: 29%" />
            <div style={{ width: '17%' }} className="h-full bg-purple-500 transition-all" title="Mamaearth: 17%" />
            <div style={{ width: '10%' }} className="h-full bg-emerald-500 transition-all" title="boAt: 10%" />
          </div>
          <div className="flex items-center justify-between text-[9px] text-muted font-mono">
            <span>Bella Vita 44%</span>
            <span>Nykaa 29%</span>
            <span>Mamaearth 17%</span>
            <span>boAt 10%</span>
          </div>
        </div>

        {/* Account Breakdown List with Colored Dots */}
        <div className="divide-y divide-[var(--border-color)]">
          {clientBreakdown.map((cli) => (
            <div
              key={cli.name}
              onClick={() => navigate('/returns')}
              className="py-2 flex items-center justify-between text-xs cursor-pointer hover:bg-elevated px-1 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: cli.color }}
                />
                <span className="font-medium text-primary">{cli.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-primary text-[11px]">{cli.count} pcs</span>
                <span className="text-[10px] font-mono text-muted">({cli.pct}%)</span>
                <ArrowRight className="w-3 h-3 text-secondary" />
              </div>
            </div>
          ))}
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
    </div>
  );
};
