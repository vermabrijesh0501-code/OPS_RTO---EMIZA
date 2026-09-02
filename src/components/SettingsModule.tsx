import React, { useState, useEffect } from 'react';
import {
  Database,
  Cloud,
  Copy,
  Check,
  Terminal,
  RefreshCw,
  Server,
  ShieldCheck,
  Zap,
  Globe,
  HardDrive,
  Trash2,
} from 'lucide-react';
import { SupabaseConfig } from '../types';
import { generateSupabaseDDL } from '../services/storage';
import { isSupabaseConfigured, SUPABASE_URL, SUPABASE_ANON_KEY } from '../services/supabase';
import { OfflineQueue, QueueItem } from '../services/offlineQueue';

interface SettingsModuleProps {
  config: SupabaseConfig;
  onSaveConfig: (config: SupabaseConfig) => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  config,
  onSaveConfig,
}) => {
  const [supabaseUrl, setSupabaseUrl] = useState(config.supabaseUrl || SUPABASE_URL);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(config.supabaseAnonKey || SUPABASE_ANON_KEY);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(config.autoSyncEnabled ?? true);
  const [copied, setCopied] = useState(false);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [isFlushing, setIsFlushing] = useState(false);
  const [flushStatus, setFlushStatus] = useState<string | null>(null);

  const configured = isSupabaseConfigured();
  const ddlSql = generateSupabaseDDL();

  useEffect(() => {
    setQueueItems(OfflineQueue.getAll());
    const interval = setInterval(() => {
      setQueueItems(OfflineQueue.getAll());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCopySQL = () => {
    navigator.clipboard.writeText(ddlSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim(),
      autoSyncEnabled,
      connectedStatus: supabaseUrl && supabaseAnonKey ? 'Connected' : 'Disconnected',
    });
    alert('Settings saved. Refresh the application to apply updated database connection credentials.');
  };

  const handleFlushQueue = async () => {
    setIsFlushing(true);
    setFlushStatus(null);
    try {
      const result = await OfflineQueue.flush();
      setFlushStatus(`Flushed: ${result.succeeded} synced, ${result.dropped} dropped, ${result.failed} failed.`);
      setQueueItems(OfflineQueue.getAll());
    } catch (err: any) {
      setFlushStatus(`Error flushing queue: ${err?.message || err}`);
    } finally {
      setIsFlushing(false);
    }
  };

  const handleClearQueue = () => {
    if (window.confirm('Are you sure you want to clear the offline sync queue? Any pending offline changes will be discarded.')) {
      OfflineQueue.clear();
      setQueueItems([]);
      setFlushStatus('Queue cleared.');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 text-[#1E293B] dark:text-[#F8FAFC] theme-transition">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1E293B] dark:text-[#F8FAFC] flex items-center gap-2.5">
            <Cloud className="w-6 h-6 text-[#8B5CF6]" /> Production Database & Cloudflare Settings
          </h1>
          <p className="text-xs text-secondary mt-1">
            Manage your live Supabase connection, Cloudflare Pages deployment environment, and offline sync queue.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${
              configured
                ? 'bg-[#ECFDF5] text-[#10B981] border-[#10B981]/30'
                : 'bg-[#FEF2F2] text-[#EF4444] border-[#EF4444]/30'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${configured ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`} />
            {configured ? 'Supabase Connected' : 'Supabase Not Configured'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Box 1: Supabase Configuration */}
        <div className="bg-card border border-theme rounded-[20px] p-6 shadow-[0_4px_24px_rgba(148,163,184,0.08)] space-y-5">
          <div className="flex items-center justify-between border-b border-theme pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-[#8B5CF6]" />
              <h2 className="text-base font-bold text-[#1E293B] dark:text-[#F8FAFC]">1. Supabase Database Connection</h2>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block text-secondary font-semibold mb-1">
                Supabase Project URL
              </label>
              <input
                type="url"
                required
                placeholder="https://your-project.supabase.co"
                value={supabaseUrl}
                onChange={e => setSupabaseUrl(e.target.value)}
                className="w-full bg-[#F8FAFC] dark:bg-[#152238] p-3 rounded-xl border border-theme font-mono focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>

            <div>
              <label className="block text-secondary font-semibold mb-1">
                Supabase Anon / Public API Key
              </label>
              <textarea
                rows={3}
                required
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseAnonKey}
                onChange={e => setSupabaseAnonKey(e.target.value)}
                className="w-full bg-[#F8FAFC] dark:bg-[#152238] p-3 rounded-xl border border-theme font-mono focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-[#F8FAFC] dark:bg-[#152238] rounded-xl border border-theme">
              <div>
                <div className="font-bold text-[#1E293B] dark:text-[#F8FAFC]">Auto-Sync Local Operations</div>
                <div className="text-[11px] text-secondary">Syncs Gate Passes, Scans, and Batches in real-time.</div>
              </div>
              <input
                type="checkbox"
                checked={autoSyncEnabled}
                onChange={e => setAutoSyncEnabled(e.target.checked)}
                className="w-4 h-4 accent-[#8B5CF6] rounded cursor-pointer"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              Save Credentials Locally
            </button>
          </form>
        </div>

        {/* Box 2: Cloudflare Pages Deployment & Offline Queue */}
        <div className="space-y-6">
          <div className="bg-card border border-theme rounded-[20px] p-6 shadow-[0_4px_24px_rgba(148,163,184,0.08)] space-y-4">
            <div className="flex items-center gap-2 border-b border-theme pb-3">
              <Globe className="w-5 h-5 text-[#06B6D4]" />
              <h2 className="text-base font-bold text-[#1E293B] dark:text-[#F8FAFC]">2. Cloudflare Pages Deployment Settings</h2>
            </div>

            <p className="text-xs text-secondary leading-relaxed">
              This app is configured for <strong className="text-primary font-semibold">Cloudflare Pages</strong>. In production, set your environment variables as encrypted variables in Cloudflare Dashboard:
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-[#F8FAFC] dark:bg-[#152238] rounded-xl border border-theme space-y-1 font-mono text-[11px]">
                <div className="text-secondary">Build Command: <span className="text-[#8B5CF6] font-semibold">npm run build</span></div>
                <div className="text-secondary">Build Output Directory: <span className="text-[#8B5CF6] font-semibold">dist</span></div>
                <div className="text-secondary">Framework Preset: <span className="text-[#8B5CF6] font-semibold">Vite</span></div>
              </div>

              <div className="p-3 bg-[#F8FAFC] dark:bg-[#152238] rounded-xl border border-theme space-y-1 font-mono text-[11px]">
                <div className="text-[#8B5CF6] font-bold">Cloudflare Pages Environment Variables:</div>
                <div className="text-secondary">VITE_SUPABASE_URL = <span className="text-primary font-medium">{supabaseUrl || 'https://xyz.supabase.co'}</span></div>
                <div className="text-secondary">VITE_SUPABASE_ANON_KEY = <span className="text-primary font-medium">{supabaseAnonKey ? `${supabaseAnonKey.slice(0, 15)}...` : 'your_anon_key'}</span></div>
              </div>
            </div>
          </div>

          {/* Box 3: Offline Queue Monitor */}
          <div className="bg-card border border-theme rounded-[20px] p-6 shadow-[0_4px_24px_rgba(148,163,184,0.08)] space-y-4">
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-[#F59E0B]" />
                <h2 className="text-base font-bold text-[#1E293B] dark:text-[#F8FAFC]">3. Offline Sync Queue ({queueItems.length})</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFlushQueue}
                  disabled={isFlushing || queueItems.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F3E8FF] dark:bg-[#3B2D54] hover:bg-[#E9D5FF] text-[#8B5CF6] border border-[#8B5CF6]/30 text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isFlushing ? 'animate-spin' : ''}`} />
                  <span>{isFlushing ? 'Flushing...' : 'Flush Queue'}</span>
                </button>
                {queueItems.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearQueue}
                    className="p-1.5 rounded-lg bg-[#FEF2F2] hover:bg-rose-100 text-[#EF4444] border border-[#EF4444]/30 text-xs transition-all cursor-pointer"
                    title="Clear queue"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {flushStatus && (
              <div className="p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#152238] border border-theme text-[11px] text-[#06B6D4]">
                {flushStatus}
              </div>
            )}

            {queueItems.length === 0 ? (
              <p className="text-xs text-secondary">
                All operations are synced. No offline operations currently queued.
              </p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {queueItems.map(item => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#152238] border border-theme text-[11px] flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-primary uppercase">{item.operation}</span>{' '}
                      <span className="text-[#8B5CF6] font-mono">{item.table}</span>
                      <div className="text-[10px] text-secondary">
                        Attempts: {item.attempts} &bull; {new Date(item.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    {item.lastError && (
                      <span className="text-[10px] text-rose-500 max-w-[150px] truncate" title={item.lastError}>
                        {item.lastError}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SQL DDL Schema Generator Box */}
      <div className="bg-card border border-theme rounded-[20px] p-6 shadow-[0_4px_24px_rgba(148,163,184,0.08)] space-y-4">
        <div className="flex items-center justify-between border-b border-theme pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[#F59E0B]" />
            <h2 className="text-base font-bold text-[#1E293B] dark:text-[#F8FAFC]">
              4. Supabase SQL DDL Schema & RLS Generator (14+ Tables & Policies)
            </h2>
          </div>

          <button
            onClick={handleCopySQL}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#FFFBEB] dark:bg-[#78350F]/30 hover:bg-[#FEF3C7] text-[#F59E0B] border border-[#F59E0B]/30 text-xs font-bold transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-[#10B981]" /> : <Copy className="w-4 h-4 text-[#F59E0B]" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL Schema'}</span>
          </button>
        </div>

        <p className="text-xs text-secondary">
          Copy and paste this SQL script into your <strong className="text-primary font-semibold">Supabase Project → SQL Editor</strong> to create all tables (Companies, Warehouses, Clients, Couriers, SKUs, Gate Entries, Return Batches, Scanned Items, Active Devices, Activity Logs, and Users).
        </p>

        <div className="bg-[#F8FAFC] dark:bg-[#0B1120] p-4 rounded-xl border border-theme max-h-80 overflow-y-auto font-mono text-[11px] text-[#8B5CF6] dark:text-[#A78BFA] whitespace-pre">
          {ddlSql}
        </div>
      </div>
    </div>
  );
};
