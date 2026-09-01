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
  const { theme, toggleTheme } = useTheme();

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
    <header className="theme-sidebar bg-[var(--bg-surface)] border-b border-[var(--border-color)] sticky top-0 z-30 px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3 sm:gap-4 select-none w-full shadow-md text-[var(--text-primary)] theme-transition">
      {/* Left: Brand Logo + Warehouse Selector */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {onToggleMobileMenu && (
          <button
            id="btn-mobile-hamburger"
            type="button"
            onClick={onToggleMobileMenu}
            aria-label="Toggle Navigation Menu"
            className="md:hidden w-8 h-8 rounded-lg bg-[var(--bg-elevated)] hover:opacity-90 text-[var(--text-primary)] flex items-center justify-center transition-colors shrink-0 border border-[var(--border-color)]"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        )}

        {/* E OPS Brand Badge */}
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center shadow-sm">
            E
          </div>
          <span className="bg-[var(--bg-elevated)] text-[var(--accent-cyan)] font-bold text-[10px] px-1.5 py-0.5 rounded border border-[var(--border-color)] font-mono tracking-wider">
            OPS
          </span>
        </div>

        {/* Warehouse Selector Dropdown */}
        <div className="relative" ref={warehouseMenuRef}>
          <button
            type="button"
            onClick={() => setIsWarehouseMenuOpen(!isWarehouseMenuOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--bg-elevated)] hover:opacity-90 border border-[var(--border-color)] text-xs font-semibold text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <WarehouseIcon className="w-3.5 h-3.5 text-[var(--accent-cyan)] shrink-0" />
            <span className="hidden sm:inline truncate max-w-[160px]">
              {activeWarehouse?.name || 'Bhiwandi / Mumbai Hub'}
            </span>
            <span className="sm:hidden font-mono text-[11px]">
              {activeWarehouse?.code?.replace('WH-', '') || 'WH'}
            </span>
            <ChevronDown className="w-3 h-3 text-[var(--text-secondary)] shrink-0" />
          </button>

          {isWarehouseMenuOpen && (
            <div className="absolute left-0 mt-1.5 w-64 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in-50 duration-100">
              <div className="px-3 py-1.5 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border-color)]">
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
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[var(--bg-elevated)] transition-colors ${
                    w.id === activeWarehouseId
                      ? 'bg-blue-900/30 text-[var(--accent-cyan)] font-bold'
                      : 'text-[var(--text-primary)]'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-[var(--text-primary)]">{w.name}</div>
                    <div className="text-[10px] text-[var(--text-secondary)]">
                      {w.city} • {w.totalDocks} Docks
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                    {w.code}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Middle: Universal Search Bar (Ctrl+K) */}
      <div className="flex-1 max-w-xl mx-2 hidden md:block">
        <button
          type="button"
          onClick={onOpenUniversalSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-lg bg-[var(--bg-elevated)] hover:opacity-90 border border-[var(--border-color)] text-xs text-[var(--text-secondary)] transition-all cursor-pointer shadow-inner"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Search className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" />
            <span className="truncate">Universal Search: AWB, Gate Pass, Vehicle, Batch, Client...</span>
          </div>
          <kbd className="text-[10px] font-mono bg-[var(--bg-surface)] text-[var(--text-secondary)] px-1.5 py-0.5 rounded border border-[var(--border-color)] shrink-0 ml-2">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right: Theme Toggle, Search Mobile Icon, Role Pill & User Avatar */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Dark / Light Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] transition-all active:scale-95 cursor-pointer shadow-sm"
          title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun size={18} className="text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon size={18} className="text-slate-700 hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* Mobile Search Icon */}
        <button
          type="button"
          onClick={onOpenUniversalSearch}
          className="md:hidden w-8 h-8 rounded-lg bg-[var(--bg-elevated)] hover:opacity-90 text-[var(--text-secondary)] flex items-center justify-center border border-[var(--border-color)] cursor-pointer"
          title="Search (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5" />
        </button>

        {/* Role Display & Switcher (Dropdown only for Super Admin) */}
        {currentUser.role === 'Super Admin' ? (
          <div className="relative" ref={roleMenuRef}>
            <button
              type="button"
              onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/60 text-purple-300 dark:text-purple-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Shield className="w-3 h-3 text-purple-400 shrink-0" />
              <span className="text-[11px]">Role: {currentUser.role}</span>
              <ChevronDown className="w-2.5 h-2.5 text-purple-400 shrink-0" />
            </button>

            {isRoleMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-52 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in-50 duration-100">
                <div className="px-3 py-1.5 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border-color)]">
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
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-[var(--bg-elevated)] transition-colors ${
                      r === currentUser.role
                        ? 'bg-purple-900/30 text-purple-300 font-bold'
                        : 'text-[var(--text-primary)]'
                    }`}
                  >
                    <span>{r}</span>
                    {r === currentUser.role && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-950/40 border border-purple-800/40 text-purple-300 dark:text-purple-200 text-xs font-semibold select-none">
            <Shield className="w-3 h-3 text-purple-400 shrink-0" />
            <span className="text-[11px]">Role: {currentUser.role}</span>
          </div>
        )}

        {/* User Profile Avatar Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="w-8 h-8 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center border border-amber-400/50 transition-all cursor-pointer shadow-sm"
            title={`${currentUser.name} (${currentUser.role})`}
          >
            {currentUser.name.charAt(0).toUpperCase()}
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-60 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl shadow-2xl py-2 z-50 animate-in fade-in-50 duration-100">
              <div className="px-3 py-2 border-b border-[var(--border-color)]">
                <div className="font-bold text-[var(--text-primary)] text-xs truncate">{currentUser.name}</div>
                <div className="text-[11px] text-[var(--text-secondary)] truncate">{currentUser.email}</div>
                <div className="text-[10px] text-purple-400 font-semibold mt-1">
                  {currentUser.role} • {activeWarehouse?.code}
                </div>
              </div>

              {onLogout && (
                <div className="p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-rose-500 hover:bg-rose-950/30 dark:hover:bg-rose-950/40 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out of Session</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
