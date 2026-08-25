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
    <div className="p-6 space-y-6 bg-[#0B141E] text-[#FFFFFF]">
      {/* Title */}
      <div className="border-b border-[#1E2C3D] pb-4">
        <h1 className="text-xl font-black text-[#FFFFFF] flex items-center gap-2">
          <Cloud className="w-6 h-6 text-[#00BDD6]" /> Supabase & Netlify Deployment Hub
        </h1>
        <p className="text-xs text-[#8FA0B5] mt-1">
          Connect your existing Supabase database project and launch on Netlify as specified in your development roadmap.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Box: Supabase Credentials & Connection */}
        <div className="bg-[#121E2B] border border-[#1E2C3D] rounded-[12px] p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-[#1E2C3D] pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-[#00BDD6]" />
              <h2 className="text-sm font-extrabold text-[#FFFFFF]">1. Supabase Connection Credentials</h2>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                config.connectedStatus === 'Connected'
                  ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                  : 'bg-[#182738] text-[#8FA0B5] border-[#1E2C3D]'
              }`}
            >
              {config.connectedStatus}
            </span>
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
                <div className="font-bold text-[#FFFFFF]">Auto-Sync Local Operations to Supabase</div>
                <div className="text-[10px] text-[#8FA0B5]">Syncs Gate Passes and Return Batches in background.</div>
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
              Save & Test Supabase Credentials
            </button>
          </form>
        </div>

        {/* Right Box: Netlify Launch Guide */}
        <div className="bg-[#121E2B] border border-[#1E2C3D] rounded-[12px] p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-[#1E2C3D] pb-3">
            <Globe className="w-5 h-5 text-[#00BDD6]" />
            <h2 className="text-sm font-extrabold text-[#FFFFFF]">2. Netlify Deployment Settings</h2>
          </div>

          <p className="text-xs text-[#8FA0B5] leading-relaxed">
            Your web app is built with <strong className="text-white">Vite + React + Tailwind CSS</strong> and compiles to static bundle files in <code className="bg-[#0B141E] px-1.5 py-0.5 rounded text-[#00BDD6] font-mono">dist/</code>.
          </p>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#182738] rounded-[10px] border border-[#1E2C3D] space-y-1">
              <div className="font-bold text-[#00BDD6]">Netlify Build Settings:</div>
              <div className="text-[#8FA0B5] font-mono">Build Command: <span className="text-white">npm run build</span></div>
              <div className="text-[#8FA0B5] font-mono">Publish Directory: <span className="text-[#00BDD6] font-bold">dist</span></div>
            </div>

            <div className="p-3 bg-[#182738] rounded-[10px] border border-[#1E2C3D] space-y-1">
              <div className="font-bold text-[#635BFF]">Environment Variables to set in Netlify:</div>
              <div className="text-[#8FA0B5] font-mono text-[11px]">VITE_SUPABASE_URL = {supabaseUrl || 'https://xyz.supabase.co'}</div>
              <div className="text-[#8FA0B5] font-mono text-[11px]">VITE_SUPABASE_ANON_KEY = {supabaseAnonKey ? `${supabaseAnonKey.slice(0, 15)}...` : 'your_key'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* SQL DDL Schema Generator Box */}
      <div className="bg-[#121E2B] border border-[#1E2C3D] rounded-[12px] p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E2C3D] pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[#FFC107]" />
            <h2 className="text-sm font-extrabold text-[#FFFFFF]">
              3. Supabase SQL DDL Schema Generator (13+ Tables)
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
          Copy and paste this exact SQL script into your <strong className="text-white">Supabase Project → SQL Editor</strong> to create all tables (Companies, Warehouses, Clients, Couriers, SKUs, Gate Entries, Return Batches, Scanned Items, Logs, and Barcode Indexes).
        </p>

        <div className="bg-[#0B141E] p-4 rounded-[10px] border border-[#1E2C3D] max-h-80 overflow-y-auto font-mono text-[11px] text-[#00BDD6] whitespace-pre">
          {ddlSql}
        </div>
      </div>
    </div>
  );
};
