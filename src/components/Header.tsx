import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Warehouse as WarehouseIcon,
  LogOut,
  ChevronDown,
  Shield,
  CheckCircle2,
  Wifi,
  Smartphone,
} from 'lucide-react';
import { User, UserRole, Warehouse } from '../types';
import { ActiveTab } from './Sidebar';
import { SyncService, SyncStatus } from '../services/syncService';
import { SyncStatusModal } from './SyncStatusModal';

interface HeaderProps {
  currentUser?: User | null;
  onSwitchUserRole: (role: UserRole) => void;
  warehouses: Warehouse[];
  activeWarehouseId: string;
  onSelectWarehouse: (id: string) => void;
  onOpenUniversalSearch: () => void;
  onOpenSupabaseHub?: () => void;
  supabaseStatus?: 'Connected' | 'Disconnected' | 'Pending';
  onLogout?: () => void;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
  activeTab?: ActiveTab;
  onPrimaryAction?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSwitchUserRole,
  warehouses,
  activeWarehouseId,
  onSelectWarehouse,
  onOpenUniversalSearch,
  onLogout,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isWarehouseMenuOpen, setIsWarehouseMenuOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncService.getSyncStatus());

  useEffect(() => {
    const unsub = SyncService.onSyncStatusChange((status) => {
      setSyncStatus(status);
    });
    return unsub;
  }, []);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const roleMenuRef = useRef<HTMLDivElement>(null);
  const warehouseMenuRef = useRef<HTMLDivElement>(null);

  const activeWarehouse = warehouses.find((w) => w.id === activeWarehouseId) || warehouses[0];

  const roles: UserRole[] = [
    'Super Admin',
    'Admin',
    'Warehouse Manager',
    'Supervisor',
    'Security Officer',
    'RTO Operator',
    'GRN Operator',
    'Auditor',
    'Operator',
    'Read Only',
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target as Node)) {
        setIsRoleMenuOpen(false);
      }
      if (warehouseMenuRef.current && !warehouseMenuRef.current.contains(event.target as Node)) {
        setIsWarehouseMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-card border-b border-theme sticky top-0 z-30 px-4 sm:px-6 lg:pl-[88px] flex items-center justify-between gap-4 select-none w-full transition-colors duration-200">
      {/* Left: Logo + Warehouse Switcher */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black tracking-tight text-white">
            WOP<span className="text-[#8B5CF6]">-Emiza</span>
          </span>
        </div>

        {/* Operating Warehouse Dropdown Pill */}
        <div className="relative" ref={warehouseMenuRef}>
          <button
            type="button"
            onClick={() => setIsWarehouseMenuOpen(!isWarehouseMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-[#152238] border border-slate-200 dark:border-theme text-xs font-semibold text-slate-800 dark:text-white hover:border-slate-400 dark:hover:border-[#8B5CF6]/50 transition-all cursor-pointer shadow-2xs"
          >
            <WarehouseIcon className="w-3.5 h-3.5 text-slate-600 dark:text-[#8B5CF6] shrink-0" />
            <span className="hidden sm:inline truncate max-w-[150px]">
              {activeWarehouse?.name || 'Bhiwandi Central Hub'}
            </span>
            <span className="sm:hidden font-mono text-[11px]">
              {activeWarehouse?.code?.replace('WH-', '') || 'WH'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-500 dark:text-[#64748B] shrink-0" />
          </button>

          {isWarehouseMenuOpen && (
            <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-theme rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in-50 duration-100">
              <div className="px-4 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-100 dark:border-theme">
                Select Facility
              </div>
              {warehouses.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => {
                    onSelectWarehouse(w.id);
                    setIsWarehouseMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#152238] transition-colors ${
                    w.id === activeWarehouseId
                      ? 'bg-purple-50 dark:bg-[#3B2D54] text-purple-700 dark:text-[#8B5CF6] font-bold'
                      : 'text-slate-800 dark:text-white'
                  }`}
                >
                  <div>
                    <div className="font-semibold">{w.name}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {w.city} • {w.totalDocks} Docks
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#1E293B] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-theme">
                    {w.code}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 max-w-lg mx-2 hidden md:block">
        <button
          type="button"
          onClick={onOpenUniversalSearch}
          className="w-full flex items-center justify-between px-4 py-2 rounded-full bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-theme hover:border-[#8B5CF6]/50 text-xs text-slate-600 dark:text-[#64748B] transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Search className="w-4 h-4 text-slate-400 dark:text-[#94A3B8] shrink-0" />
            <span className="truncate">Search AWB, Gate Pass, Vehicle, Batch, Client...</span>
          </div>
          <kbd className="text-[10px] font-mono bg-white dark:bg-card text-slate-600 dark:text-[#64748B] px-2 py-0.5 rounded-full border border-slate-200 dark:border-theme shrink-0 ml-2 shadow-2xs">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right: Sync Status, Search, Role Badge, Profile Avatar */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Live Sync Status Pill */}
        <button
          type="button"
          onClick={() => setIsSyncModalOpen(true)}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-98 ${
            syncStatus.status === 'connected'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800/60'
              : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800/60'
          }`}
          title="Click to view connected devices & synchronization status"
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
          <span className="hidden sm:inline font-medium">
            {syncStatus.status === 'connected' ? 'Live Sync' : 'Syncing...'}
          </span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              syncStatus.status === 'connected'
                ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
            }`}
          >
            {syncStatus.connectedDevicesCount} {syncStatus.connectedDevicesCount === 1 ? 'Device' : 'Devices'}
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenUniversalSearch}
          className="md:hidden w-9 h-9 rounded-full bg-[#0F172A] text-[#94A3B8] flex items-center justify-center border border-theme cursor-pointer"
          title="Search (Ctrl+K)"
        >
          <Search className="w-4 h-4" />
        </button>

        {currentUser?.role === 'Super Admin' ? (
          <div className="relative hidden sm:block" ref={roleMenuRef}>
            <button
              type="button"
              onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 dark:bg-[#3B2D54] border border-purple-200 dark:border-[#8B5CF6]/30 text-purple-700 dark:text-[#A78BFA] text-xs font-semibold hover:opacity-90 transition-all cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-[#8B5CF6] shrink-0" />
              <span>{currentUser?.role || 'Guest'}</span>
              <ChevronDown className="w-3 h-3 text-purple-600 dark:text-[#8B5CF6] shrink-0" />
            </button>

            {isRoleMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-theme rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in-50 duration-100">
                <div className="px-4 py-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-100 dark:border-theme">
                  Switch Role Persona
                </div>
                {roles.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      onSwitchUserRole(r);
                      setIsRoleMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#152238] transition-colors ${
                      r === currentUser?.role
                        ? 'bg-purple-50 dark:bg-[#3B2D54] text-purple-700 dark:text-[#8B5CF6] font-bold'
                        : 'text-slate-800 dark:text-white'
                    }`}
                  >
                    <span>{r}</span>
                    {r === currentUser?.role && <CheckCircle2 className="w-3.5 h-3.5 text-[#8B5CF6]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 dark:bg-[#3B2D54] border border-purple-200 dark:border-[#8B5CF6]/30 text-purple-700 dark:text-[#A78BFA] text-xs font-semibold">
            <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-[#8B5CF6] shrink-0" />
            <span>{currentUser?.role || 'Staff'}</span>
          </div>
        )}

        {/* Profile Avatar & Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#8B5CF6] to-[#EC4899] text-white font-bold text-xs flex items-center justify-center shadow-sm cursor-pointer hover:scale-105 transition-transform"
            title={`${currentUser?.name || 'User'} (${currentUser?.role || 'Staff'})`}
          >
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1E293B] border border-theme rounded-2xl shadow-2xl py-3 z-50 animate-in fade-in-50 duration-100">
              <div className="px-4 py-2 border-b border-theme">
                <div className="font-bold text-black dark:text-white text-sm truncate">{currentUser?.name || 'Warehouse User'}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 truncate">{currentUser?.email || ''}</div>
                <div className="text-[11px] text-[#8B5CF6] font-semibold mt-1">
                  Role: {currentUser?.role || 'Staff'}
                </div>
              </div>

              <div className="pt-2 px-2">
                {onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 font-semibold rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <SyncStatusModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />
    </header>
  );
};
