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
    <div className="p-6 space-y-6 bg-[#0B141E] text-[#FFFFFF] min-h-screen">
      {/* Title */}
      <div className="border-b border-[#1E2C3D] pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-[#FFFFFF] flex items-center gap-2">
            <Cloud className="w-6 h-6 text-[#00BDD6]" /> Production Database & Cloudflare Settings
          </h1>
          <p className="text-xs text-[#8FA0B5] mt-1">
            Manage your live Supabase connection, Cloudflare Pages deployment environment, and offline sync queue.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
              configured
                ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                : 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${configured ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`} />
            {configured ? 'Supabase Connected' : 'Supabase Not Configured'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Box 1: Supabase Configuration */}
        <div className="bg-[#121E2B] border border-[#1E2C3D] rounded-[12px] p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-[#1E2C3D] pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-[#00BDD6]" />
              <h2 className="text-sm font-extrabold text-[#FFFFFF]">1. Supabase Database Connection</h2>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block text-[#8FA0B5] font-semibold mb-1">
                Supabase Project URL
              </label>
              <input
                type="url"
                required
                placeholder="https://your-project.supabase.co"
                value={supabaseUrl}
                onChange={e => setSupabaseUrl(e.target.value)}
                className="w-full bg-[#0B141E] text-[#FFFFFF] p-2.5 rounded-[10px] border border-[#1E2C3D] font-mono focus:outline-none focus:border-[#635BFF]"
              />
            </div>

            <div>
              <label className="block text-[#8FA0B5] font-semibold mb-1">
                Supabase Anon / Public API Key
              </label>
              <textarea
                rows={3}
                required
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseAnonKey}
                onChange={e => setSupabaseAnonKey(e.target.value)}
                className="w-full bg-[#0B141E] text-[#FFFFFF] p-2.5 rounded-[10px] border border-[#1E2C3D] font-mono focus:outline-none focus:border-[#635BFF]"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-[#182738] rounded-[10px] border border-[#1E2C3D]">
              <div>
                <div className="font-bold text-[#FFFFFF]">Auto-Sync Local Operations</div>
                <div className="text-[10px] text-[#8FA0B5]">Syncs Gate Passes, Scans, and Batches in real-time.</div>
              </div>
              <input
                type="checkbox"
                checked={autoSyncEnabled}
                onChange={e => setAutoSyncEnabled(e.target.checked)}
                className="w-4 h-4 accent-[#635BFF] rounded"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-[10px] bg-[#635BFF] hover:bg-[#5E48D9] text-white font-bold text-xs shadow-md shadow-[#635BFF]/30 transition-all cursor-pointer"
            >
              Save Credentials Locally
            </button>
          </form>
        </div>

        {/* Box 2: Cloudflare Pages Deployment & Offline Queue */}
        <div className="space-y-6">
          <div className="bg-[#121E2B] border border-[#1E2C3D] rounded-[12px] p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-[#1E2C3D] pb-3">
              <Globe className="w-5 h-5 text-[#00BDD6]" />
              <h2 className="text-sm font-extrabold text-[#FFFFFF]">2. Cloudflare Pages Deployment Settings</h2>
            </div>

            <p className="text-xs text-[#8FA0B5] leading-relaxed">
              This app is configured for <strong className="text-white">Cloudflare Pages</strong>. In production, set your environment variables as encrypted variables in Cloudflare Dashboard:
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-[#182738] rounded-[10px] border border-[#1E2C3D] space-y-1 font-mono text-[11px]">
                <div className="text-[#8FA0B5]">Build Command: <span className="text-[#00BDD6]">npm run build</span></div>
                <div className="text-[#8FA0B5]">Build Output Directory: <span className="text-[#00BDD6]">dist</span></div>
                <div className="text-[#8FA0B5]">Framework Preset: <span className="text-[#00BDD6]">Vite</span></div>
              </div>

              <div className="p-3 bg-[#182738] rounded-[10px] border border-[#1E2C3D] space-y-1 font-mono text-[11px]">
                <div className="text-[#635BFF] font-bold">Cloudflare Pages Environment Variables:</div>
                <div className="text-[#8FA0B5]">VITE_SUPABASE_URL = <span className="text-white">{supabaseUrl || 'https://xyz.supabase.co'}</span></div>
                <div className="text-[#8FA0B5]">VITE_SUPABASE_ANON_KEY = <span className="text-white">{supabaseAnonKey ? `${supabaseAnonKey.slice(0, 15)}...` : 'your_anon_key'}</span></div>
              </div>
            </div>
          </div>

          {/* Box 3: Offline Queue Monitor */}
          <div className="bg-[#121E2B] border border-[#1E2C3D] rounded-[12px] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E2C3D] pb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-[#FFC107]" />
                <h2 className="text-sm font-extrabold text-[#FFFFFF]">3. Offline Sync Queue ({queueItems.length})</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFlushQueue}
                  disabled={isFlushing || queueItems.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#635BFF]/20 hover:bg-[#635BFF]/30 text-[#635BFF] border border-[#635BFF]/40 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isFlushing ? 'animate-spin' : ''}`} />
                  <span>{isFlushing ? 'Flushing...' : 'Flush Queue'}</span>
                </button>
                {queueItems.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearQueue}
                    className="p-1.5 rounded-[8px] bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#EF4444] border border-[#EF4444]/40 text-xs transition-all cursor-pointer"
                    title="Clear queue"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {flushStatus && (
              <div className="p-2.5 rounded-[8px] bg-[#182738] border border-[#1E2C3D] text-[11px] text-[#00BDD6]">
                {flushStatus}
              </div>
            )}

            {queueItems.length === 0 ? (
              <p className="text-xs text-[#8FA0B5]">
                All operations are synced. No offline operations currently queued.
              </p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {queueItems.map(item => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-[8px] bg-[#0B141E] border border-[#1E2C3D] text-[11px] flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-white uppercase">{item.operation}</span>{' '}
                      <span className="text-[#00BDD6] font-mono">{item.table}</span>
                      <div className="text-[10px] text-[#8FA0B5]">
                        Attempts: {item.attempts} &bull; {new Date(item.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    {item.lastError && (
                      <span className="text-[10px] text-[#EF4444] max-w-[150px] truncate" title={item.lastError}>
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
      <div className="bg-[#121E2B] border border-[#1E2C3D] rounded-[12px] p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E2C3D] pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[#FFC107]" />
            <h2 className="text-sm font-extrabold text-[#FFFFFF]">
              4. Supabase SQL DDL Schema & RLS Generator (14+ Tables & Policies)
            </h2>
          </div>

          <button
            onClick={handleCopySQL}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-[10px] bg-[#FFC107]/15 hover:bg-[#FFC107]/25 text-[#FFC107] border border-[#FFC107]/30 text-xs font-bold transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-[#10B981]" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL Schema'}</span>
          </button>
        </div>

        <p className="text-xs text-[#8FA0B5]">
          Copy and paste this SQL script into your <strong className="text-white">Supabase Project → SQL Editor</strong> to create all tables (Companies, Warehouses, Clients, Couriers, SKUs, Gate Entries, Return Batches, Scanned Items, Active Devices, Activity Logs, and Users).
        </p>

        <div className="bg-[#0B141E] p-4 rounded-[10px] border border-[#1E2C3D] max-h-80 overflow-y-auto font-mono text-[11px] text-[#00BDD6] whitespace-pre">
          {ddlSql}
        </div>
      </div>
    </div>
  );
};
