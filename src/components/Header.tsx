import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Warehouse as WarehouseIcon,
  LogOut,
  ChevronDown,
  Bell,
  Plus,
  Building2,
  Menu,
  X,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCcw,
  Sparkles,
  Shield,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import { User, UserRole, Warehouse } from '../types';
import { getRoleBadgeConfig } from '../utils/rbac';
import { ActiveTab } from './Sidebar';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  currentUser: User;
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
  onOpenSupabaseHub,
  supabaseStatus = 'Connected',
  onLogout,
  onToggleMobileMenu,
  isMobileMenuOpen = false,
  activeTab = 'dashboard',
  onPrimaryAction,
}) => {
  const { mode: themeMode, resolvedTheme, setMode: setThemeMode } = useTheme();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isWarehouseMenuOpen, setIsWarehouseMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const roleMenuRef = useRef<HTMLDivElement>(null);
  const warehouseMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  const activeWarehouse = warehouses.find(w => w.id === activeWarehouseId) || warehouses[0];

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

  // Close menus on outside click
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
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Title & Breadcrumb mapper based on activeTab
  const getPageMeta = (tab?: ActiveTab | string) => {
    switch (tab) {
      case 'inward':
        return { title: 'Inward Gate Pass & Entry', section: 'Operations' };
      case 'grn':
        return { title: 'GRN Processing & Verification', section: 'Operations' };
      case 'returns_rto':
        return { title: 'RTO / B2C Returns', section: 'Operations' };
      case 'returns_b2b':
        return { title: 'B2B Returns Processing', section: 'Operations' };
      case 'inventory':
      case 'audit':
        return { title: 'Inventory & Physical Audit', section: 'Operations' };
      case 'clients':
        return { title: 'Client Master Accounts', section: 'Management' };
      case 'couriers':
        return { title: 'Courier & 3PL Logistics', section: 'Management' };
      case 'locations':
        return { title: 'Warehouse Locations & Docks', section: 'Management' };
      case 'reports':
        return { title: 'Reports & Analytics', section: 'Management' };
      case 'notifications':
        return { title: 'Activity Notifications & Logs', section: 'System' };
      case 'user_management':
      case 'masters':
        return { title: 'User Management & RBAC', section: 'System' };
      case 'settings':
      case 'supabase_hub':
        return { title: 'Settings & Cloud Sync', section: 'System' };
      case 'dashboard':
      default:
        return { title: 'Operations Overview', section: 'Dashboard' };
    }
  };

  const pageMeta = getPageMeta(activeTab);

  // Primary Action Button text config
  const getActionButtonText = (tab?: ActiveTab | string) => {
    switch (tab) {
      case 'inward':
        return '+ New Gate Entry';
      case 'grn':
        return '+ Inward Entry';
      case 'returns_rto':
        return '+ New Return Batch';
      case 'returns_b2b':
        return '+ Create B2B Batch';
      case 'inventory':
      case 'audit':
        return 'Scan Barcode';
      default:
        return '+ New Gate Entry';
    }
  };

  const recentNotifications = [
    {
      id: 'notif-1',
      title: 'GRN Inspection Pending',
      message: '12 inward items at Dock 03 require supervisor quality check.',
      time: '5m ago',
      type: 'warning',
    },
    {
      id: 'notif-2',
      title: 'RTO Batch Reconciled',
      message: 'Batch 26-BV-0101 closed with 148 verified units.',
      time: '24m ago',
      type: 'success',
    },
    {
      id: 'notif-3',
      title: 'Gate Pass GP-20260826-004',
      message: 'Vehicle MH-04-AB-2391 allocated to Dock 02.',
      time: '1h ago',
      type: 'info',
    },
  ];

  return (
    <header className="bg-white dark:bg-[#111D2C] border-b border-slate-200/90 dark:border-slate-800 sticky top-0 z-30 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 select-none w-full shadow-2xs transition-colors">
      {/* Left: Mobile Toggle & Page Title with Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        {onToggleMobileMenu && (
          <button
            id="btn-mobile-hamburger"
            type="button"
            onClick={onToggleMobileMenu}
            aria-label="Toggle Navigation Menu"
            className="md:hidden w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors shrink-0"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        )}

        <div className="min-w-0 leading-tight">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
            <span>{pageMeta.section}</span>
            <span>/</span>
            <span className="text-slate-600 dark:text-slate-300 font-semibold">{pageMeta.title}</span>
          </div>
          <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight truncate mt-0.5">
            {pageMeta.title}
          </h1>
        </div>
      </div>

      {/* Right: Actions, Theme Toggle, & Profile Menu */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Global Search Shortcut Button */}
        <button
          type="button"
          onClick={onOpenUniversalSearch}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <span>Quick Search</span>
          <kbd className="text-[10px] font-mono bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-400 shadow-2xs">
            Ctrl+K
          </kbd>
        </button>

        {/* Theme Mode Switcher (Light / Dark / System) */}
        <div className="relative" ref={themeMenuRef}>
          <button
            type="button"
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            aria-label="Theme Selector"
            title={`Current Theme: ${themeMode} (${resolvedTheme})`}
            className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            {resolvedTheme === 'dark' ? (
              <Moon className="w-4 h-4 text-indigo-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
          </button>

          {isThemeMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-[#162232] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in-50 duration-100">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                Display Theme
              </div>
              <button
                type="button"
                onClick={() => {
                  setThemeMode('light');
                  setIsThemeMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors ${
                  themeMode === 'light'
                    ? 'bg-blue-50/70 dark:bg-blue-900/30 text-[#123B5D] dark:text-blue-400 font-bold'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Light</span>
                </div>
                {themeMode === 'light' && <CheckCircle2 className="w-3.5 h-3.5 text-[#123B5D] dark:text-blue-400" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setThemeMode('dark');
                  setIsThemeMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors ${
                  themeMode === 'dark'
                    ? 'bg-blue-50/70 dark:bg-blue-900/30 text-[#123B5D] dark:text-blue-400 font-bold'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Dark</span>
                </div>
                {themeMode === 'dark' && <CheckCircle2 className="w-3.5 h-3.5 text-[#123B5D] dark:text-blue-400" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setThemeMode('system');
                  setIsThemeMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors ${
                  themeMode === 'system'
                    ? 'bg-blue-50/70 dark:bg-blue-900/30 text-[#123B5D] dark:text-blue-400 font-bold'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Laptop className="w-3.5 h-3.5 text-slate-400" />
                  <span>System Auto</span>
                </div>
                {themeMode === 'system' && <CheckCircle2 className="w-3.5 h-3.5 text-[#123B5D] dark:text-blue-400" />}
              </button>
            </div>
          )}
        </div>

        {/* Warehouse Selector Dropdown */}
        <div className="relative" ref={warehouseMenuRef}>
          <button
            type="button"
            onClick={() => setIsWarehouseMenuOpen(!isWarehouseMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <WarehouseIcon className="w-3.5 h-3.5 text-[#123B5D] dark:text-blue-400" />
            <span className="hidden sm:inline truncate max-w-[130px]">
              {activeWarehouse?.name || 'Warehouse'}
            </span>
            <span className="sm:hidden font-mono">
              {activeWarehouse?.code?.replace('WH-', '') || 'WH'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
          </button>

          {isWarehouseMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-64 bg-white dark:bg-[#162232] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in-50 duration-100">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                Select Operating Warehouse
              </div>
              {warehouses.map(w => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => {
                    onSelectWarehouse(w.id);
                    setIsWarehouseMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors ${
                    w.id === activeWarehouseId
                      ? 'bg-blue-50/70 dark:bg-blue-900/30 text-[#123B5D] dark:text-blue-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-semibold">{w.name}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">
                      {w.city} • {w.totalDocks} Docks
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {w.code}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Bell Dropdown */}
        <div className="relative" ref={notifMenuRef}>
          <button
            type="button"
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors relative cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5" />
          </button>

          {isNotificationOpen && (
            <div className="absolute right-0 mt-1.5 w-80 bg-white dark:bg-[#162232] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 z-50 animate-in fade-in-50 duration-100">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  Operations Notifications
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/40 text-[#123B5D] dark:text-blue-300">
                  3 New
                </span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentNotifications.map(n => (
                  <div
                    key={n.id}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors text-xs"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                      <span>{n.title}</span>
                      <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">
                        {n.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      {n.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Role Persona Switcher Button & Menu */}
        <div className="relative hidden md:block" ref={roleMenuRef}>
          <button
            type="button"
            onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="truncate max-w-[100px]">{currentUser.role}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
          </button>

          {isRoleMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-[#162232] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in-50 duration-100">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                Switch Role Persona
              </div>
              {roles.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    onSwitchUserRole(r);
                    setIsRoleMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors ${
                    r === currentUser.role
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-[#123B5D] dark:text-blue-300 font-bold'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>{r}</span>
                  {r === currentUser.role && <CheckCircle2 className="w-3.5 h-3.5 text-[#123B5D] dark:text-blue-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Profile Avatar Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="w-8 h-8 rounded-full bg-[#123B5D] dark:bg-blue-600 text-white flex items-center justify-center text-xs font-bold hover:ring-2 hover:ring-blue-300 dark:hover:ring-blue-500 transition-all cursor-pointer"
          >
            {currentUser.name.charAt(0).toUpperCase()}
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-56 bg-white dark:bg-[#162232] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2 z-50 animate-in fade-in-50 duration-100">
              <div className="p-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
                <div className="mt-1">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {currentUser.role}
                  </span>
                </div>
              </div>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Primary Action Button based on active module */}
        {onPrimaryAction && (
          <button
            type="button"
            onClick={onPrimaryAction}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#123B5D] hover:bg-[#0D2E49] dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-bold shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <span>{getActionButtonText(activeTab)}</span>
          </button>
        )}
      </div>
    </header>
  );
};
