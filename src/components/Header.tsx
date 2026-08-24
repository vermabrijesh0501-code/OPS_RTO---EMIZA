import React from 'react';
import {
  Building2,
  Search,
  Bell,
  ShieldCheck,
  ChevronDown,
  Warehouse as WarehouseIcon,
  Database,
  User as UserIcon,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { User, UserRole, Warehouse } from '../types';

interface HeaderProps {
  currentUser: User;
  onSwitchUserRole: (role: UserRole) => void;
  warehouses: Warehouse[];
  activeWarehouseId: string;
  onSelectWarehouse: (id: string) => void;
  onOpenUniversalSearch: () => void;
  onOpenSupabaseHub: () => void;
  supabaseStatus: 'Connected' | 'Disconnected' | 'Pending';
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSwitchUserRole,
  warehouses,
  activeWarehouseId,
  onSelectWarehouse,
  onOpenUniversalSearch,
  onOpenSupabaseHub,
  supabaseStatus,
}) => {
  const activeWarehouse = warehouses.find(w => w.id === activeWarehouseId) || warehouses[0];

  const roles: UserRole[] = [
    'Super Admin',
    'Admin',
    'Warehouse Manager',
    'Supervisor',
    'Operator',
    'Read Only',
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 py-2.5 flex items-center justify-between shadow-md">
      {/* Left: Brand & Warehouse Selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-500/20">
            E
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base tracking-tight">EMIZA-WOP</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-wider">
                Phase 1
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">Warehouse Operations Platform</p>
          </div>
        </div>

        {/* Active Single Warehouse Badge */}
        <div className="h-6 w-px bg-slate-800 hidden md:block" />

        <div className="hidden sm:flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200">
          <WarehouseIcon className="w-4 h-4 text-blue-400 shrink-0" />
          <div className="text-left">
            <div className="text-[10px] text-slate-400 leading-none">Operating Facility</div>
            <div className="font-bold text-white leading-tight">
              {activeWarehouse ? `${activeWarehouse.name} (${activeWarehouse.code})` : 'EMIZA Central WH'}
            </div>
          </div>
        </div>
      </div>

      {/* Center: Universal Search Button */}
      <div className="flex-1 max-w-md mx-4 hidden lg:block">
        <button
          onClick={onOpenUniversalSearch}
          className="w-full bg-slate-800/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/80 rounded-lg px-3.5 py-1.5 text-xs flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
            <span>Search AWB #, Order #, Gate Pass, Client, Courier...</span>
          </div>
          <kbd className="bg-slate-900 px-2 py-0.5 rounded text-[10px] text-slate-400 border border-slate-700 font-mono">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right: Quick Demo Role Switcher, Supabase Status & Profile */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenUniversalSearch}
          className="p-2 text-slate-400 hover:text-white lg:hidden rounded-lg hover:bg-slate-800"
          title="Universal Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Supabase Hub Button */}
        <button
          onClick={onOpenSupabaseHub}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            supabaseStatus === 'Connected'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
          }`}
          title="Supabase & Netlify Deployment Setup"
        >
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Supabase</span>
          <span
            className={`w-2 h-2 rounded-full ${
              supabaseStatus === 'Connected' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
            }`}
          />
        </button>

        {/* Demo Quick Role Switcher */}
        <div className="relative group">
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 text-xs font-semibold transition-all">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Role: {currentUser.role}</span>
            <ChevronDown className="w-3 h-3 text-indigo-400" />
          </button>

          <div className="absolute top-full right-0 mt-1 w-52 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 hidden group-hover:block z-50">
            <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/50 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Switch Role Demo
            </div>
            {roles.map(role => (
              <button
                key={role}
                onClick={() => onSwitchUserRole(role)}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-700/60 ${
                  currentUser.role === role ? 'text-indigo-400 font-bold bg-indigo-500/10' : 'text-slate-300'
                }`}
              >
                <span>{role}</span>
                {currentUser.role === role && <span className="text-[10px] text-indigo-400">Active</span>}
              </button>
            ))}
          </div>
        </div>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-white font-bold text-xs">
            {currentUser.name.charAt(0)}
          </div>
          <div className="hidden xl:block text-left leading-tight">
            <div className="text-xs font-bold text-slate-200">{currentUser.name}</div>
            <div className="text-[10px] text-slate-400">{currentUser.email}</div>
          </div>
        </div>
      </div>
    </header>
  );
};
