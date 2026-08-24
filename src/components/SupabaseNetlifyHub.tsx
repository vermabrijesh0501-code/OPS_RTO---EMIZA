import React, { useState } from 'react';
import {
  Database,
  Cloud,
  Copy,
  Check,
  Terminal,
  Server,
  Globe,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { SupabaseConfig } from '../types';
import { generateSupabaseDDL } from '../services/storage';

interface SupabaseNetlifyHubProps {
  config: SupabaseConfig;
  onSaveConfig: (config: SupabaseConfig) => void;
}

export const SupabaseNetlifyHub: React.FC<SupabaseNetlifyHubProps> = ({
  config,
  onSaveConfig,
}) => {
  const [supabaseUrl, setSupabaseUrl] = useState(config.supabaseUrl);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(config.supabaseAnonKey);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(config.autoSyncEnabled);
  const [copied, setCopied] = useState(false);

  const ddlSql = generateSupabaseDDL();

  const handleCopySQL = () => {
    navigator.clipboard.writeText(ddlSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      supabaseUrl,
      supabaseAnonKey,
      autoSyncEnabled,
      connectedStatus: supabaseUrl && supabaseAnonKey ? 'Connected' : 'Disconnected',
    });
    alert('Supabase settings updated and saved locally!');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Title */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Cloud className="w-6 h-6 text-emerald-400" /> Supabase & Netlify Deployment Hub
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Connect your existing Supabase database project and launch on Netlify as specified in your development roadmap.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Box: Supabase Credentials & Connection */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-extrabold text-white">1. Supabase Connection Credentials</h2>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                config.connectedStatus === 'Connected'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {config.connectedStatus}
            </span>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Supabase Project URL
              </label>
              <input
                type="url"
                required
                placeholder="https://your-project.supabase.co"
                value={supabaseUrl}
                onChange={e => setSupabaseUrl(e.target.value)}
                className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Supabase Anon / Public API Key
              </label>
              <textarea
                rows={3}
                required
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseAnonKey}
                onChange={e => setSupabaseAnonKey(e.target.value)}
                className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <div>
                <div className="font-bold text-slate-200">Auto-Sync Local Operations to Supabase</div>
                <div className="text-[10px] text-slate-400">Syncs Gate Passes and Return Batches in background.</div>
              </div>
              <input
                type="checkbox"
                checked={autoSyncEnabled}
                onChange={e => setAutoSyncEnabled(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all"
            >
              Save & Test Supabase Credentials
            </button>
          </form>
        </div>

        {/* Right Box: Netlify Launch Guide */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Globe className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-extrabold text-white">2. Netlify Deployment Settings</h2>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Your web app is built with <strong className="text-white">Vite + React + Tailwind CSS</strong> and compiles to static bundle files in <code className="bg-slate-800 px-1.5 py-0.5 rounded text-blue-400 font-mono">dist/</code>.
          </p>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
              <div className="font-bold text-blue-400">Netlify Build Settings:</div>
              <div className="text-slate-300 font-mono">Build Command: <span className="text-white">npm run build</span></div>
              <div className="text-slate-300 font-mono">Publish Directory: <span className="text-emerald-400 font-bold">dist</span></div>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
              <div className="font-bold text-indigo-400">Environment Variables to set in Netlify:</div>
              <div className="text-slate-300 font-mono text-[11px]">VITE_SUPABASE_URL = {supabaseUrl || 'https://xyz.supabase.co'}</div>
              <div className="text-slate-300 font-mono text-[11px]">VITE_SUPABASE_ANON_KEY = {supabaseAnonKey ? `${supabaseAnonKey.slice(0, 15)}...` : 'your_key'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* SQL DDL Schema Generator Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-extrabold text-white">
              3. Supabase SQL DDL Schema Generator (13+ Tables)
            </h2>
          </div>

          <button
            onClick={handleCopySQL}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL Schema'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Copy and paste this exact SQL script into your <strong className="text-white">Supabase Project → SQL Editor</strong> to create all tables (Companies, Warehouses, Clients, Couriers, SKUs, Gate Entries, Return Batches, Scanned Items, Logs, and Barcode Indexes).
        </p>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-80 overflow-y-auto font-mono text-[11px] text-emerald-400/90 whitespace-pre">
          {ddlSql}
        </div>
      </div>
    </div>
  );
};
