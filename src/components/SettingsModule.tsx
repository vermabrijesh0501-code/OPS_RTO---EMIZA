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
    <div className="p-6 space-y-6 bg-primary text-primary min-h-screen theme-transition">
      {/* Title */}
      <div className="border-b border-theme pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-primary flex items-center gap-2">
            <Cloud className="w-6 h-6 text-[var(--accent-cyan)]" /> Production Database & Cloudflare Settings
          </h1>
          <p className="text-xs text-secondary mt-1">
            Manage your live Supabase connection, Cloudflare Pages deployment environment, and offline sync queue.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
              configured
                ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-500 border-rose-500/30'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${configured ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            {configured ? 'Supabase Connected' : 'Supabase Not Configured'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Box 1: Supabase Configuration */}
        <div className="bg-surface border border-theme rounded-[12px] p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-theme pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-[var(--accent-cyan)]" />
              <h2 className="text-sm font-extrabold text-primary">1. Supabase Database Connection</h2>
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
                className="w-full theme-input p-2.5 rounded-[10px] border border-theme font-mono focus:outline-none focus:border-blue-500"
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
                className="w-full theme-input p-2.5 rounded-[10px] border border-theme font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-elevated rounded-[10px] border border-theme">
              <div>
                <div className="font-bold text-primary">Auto-Sync Local Operations</div>
                <div className="text-[10px] text-secondary">Syncs Gate Passes, Scans, and Batches in real-time.</div>
              </div>
              <input
                type="checkbox"
                checked={autoSyncEnabled}
                onChange={e => setAutoSyncEnabled(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-[10px] bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/30 transition-all cursor-pointer"
            >
              Save Credentials Locally
            </button>
          </form>
        </div>

        {/* Box 2: Cloudflare Pages Deployment & Offline Queue */}
        <div className="space-y-6">
          <div className="bg-surface border border-theme rounded-[12px] p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-theme pb-3">
              <Globe className="w-5 h-5 text-[var(--accent-cyan)]" />
              <h2 className="text-sm font-extrabold text-primary">2. Cloudflare Pages Deployment Settings</h2>
            </div>

            <p className="text-xs text-secondary leading-relaxed">
              This app is configured for <strong className="text-primary">Cloudflare Pages</strong>. In production, set your environment variables as encrypted variables in Cloudflare Dashboard:
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-elevated rounded-[10px] border border-theme space-y-1 font-mono text-[11px]">
                <div className="text-secondary">Build Command: <span className="text-[var(--accent-cyan)]">npm run build</span></div>
                <div className="text-secondary">Build Output Directory: <span className="text-[var(--accent-cyan)]">dist</span></div>
                <div className="text-secondary">Framework Preset: <span className="text-[var(--accent-cyan)]">Vite</span></div>
              </div>

              <div className="p-3 bg-elevated rounded-[10px] border border-theme space-y-1 font-mono text-[11px]">
                <div className="text-blue-500 font-bold">Cloudflare Pages Environment Variables:</div>
                <div className="text-secondary">VITE_SUPABASE_URL = <span className="text-primary">{supabaseUrl || 'https://xyz.supabase.co'}</span></div>
                <div className="text-secondary">VITE_SUPABASE_ANON_KEY = <span className="text-primary">{supabaseAnonKey ? `${supabaseAnonKey.slice(0, 15)}...` : 'your_anon_key'}</span></div>
              </div>
            </div>
          </div>

          {/* Box 3: Offline Queue Monitor */}
          <div className="bg-surface border border-theme rounded-[12px] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-extrabold text-primary">3. Offline Sync Queue ({queueItems.length})</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFlushQueue}
                  disabled={isFlushing || queueItems.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-blue-600/15 hover:bg-blue-600/25 text-blue-500 border border-blue-500/30 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isFlushing ? 'animate-spin' : ''}`} />
                  <span>{isFlushing ? 'Flushing...' : 'Flush Queue'}</span>
                </button>
                {queueItems.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearQueue}
                    className="p-1.5 rounded-[8px] bg-rose-500/20 hover:bg-rose-500/30 text-rose-500 border border-rose-500/40 text-xs transition-all cursor-pointer"
                    title="Clear queue"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {flushStatus && (
              <div className="p-2.5 rounded-[8px] bg-elevated border border-theme text-[11px] text-[var(--accent-cyan)]">
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
                    className="p-2.5 rounded-[8px] bg-elevated border border-theme text-[11px] flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-primary uppercase">{item.operation}</span>{' '}
                      <span className="text-[var(--accent-cyan)] font-mono">{item.table}</span>
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
      <div className="bg-surface border border-theme rounded-[12px] p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-theme pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-extrabold text-primary">
              4. Supabase SQL DDL Schema & RLS Generator (14+ Tables & Policies)
            </h2>
          </div>

          <button
            onClick={handleCopySQL}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-[10px] bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL Schema'}</span>
          </button>
        </div>

        <p className="text-xs text-secondary">
          Copy and paste this SQL script into your <strong className="text-primary">Supabase Project → SQL Editor</strong> to create all tables (Companies, Warehouses, Clients, Couriers, SKUs, Gate Entries, Return Batches, Scanned Items, Active Devices, Activity Logs, and Users).
        </p>

        <div className="bg-primary p-4 rounded-[10px] border border-theme max-h-80 overflow-y-auto font-mono text-[11px] text-[var(--accent-cyan)] whitespace-pre">
          {ddlSql}
        </div>
      </div>
    </div>
  );
};
