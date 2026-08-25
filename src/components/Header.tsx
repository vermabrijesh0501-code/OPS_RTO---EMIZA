import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Warehouse as WarehouseIcon,
  LogOut,
  Sparkles,
  ChevronDown,
  Shield,
  Database,
  Building2,
  Menu,
  X,
} from 'lucide-react';
import { User, UserRole, Warehouse } from '../types';
import { getRoleBadgeConfig } from '../utils/rbac';

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
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isWarehouseMenuOpen, setIsWarehouseMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const roleMenuRef = useRef<HTMLDivElement>(null);
  const warehouseMenuRef = useRef<HTMLDivElement>(null);

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

  const roleBadge = getRoleBadgeConfig(currentUser.role);

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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-2 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-4 select-none w-full max-w-full">
      {/* Left: Mobile Hamburger & Brand Identity & Warehouse Selector */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
        {/* Mobile Hamburger Button */}
        {onToggleMobileMenu && (
          <button
            id="btn-mobile-hamburger"
            onClick={onToggleMobileMenu}
            aria-label="Toggle Navigation Menu"
            className="md:hidden w-8 h-8 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        )}

        {/* Brand Logo & Name */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-sm shadow-blue-500/30 shrink-0">
            E
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-white text-xs sm:text-sm tracking-tight hidden xs:inline">EMIZA</span>
            <span className="px-1 py-0.2 rounded text-[8px] sm:text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40 uppercase tracking-wider">
              OPS
            </span>
          </div>
        </div>

        {/* Operating Warehouse Selector Dropdown */}
        <div className="relative" ref={warehouseMenuRef}>
          <button
            id="btn-warehouse-select"
            onClick={() => setIsWarehouseMenuOpen(!isWarehouseMenuOpen)}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left transition-all cursor-pointer max-w-[130px] sm:max-w-[220px]"
          >
            <WarehouseIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[7px] sm:text-[8px] text-slate-400 leading-none uppercase tracking-wider font-semibold hidden xs:block">
                Facility
              </div>
              <div className="text-[10px] sm:text-xs font-semibold text-white truncate leading-tight">
                {activeWarehouse?.city || activeWarehouse?.code || 'Facility'}
              </div>
            </div>
            <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400 shrink-0" />
          </button>

          {isWarehouseMenuOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-60 sm:w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in duration-100">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select Operating Facility
              </div>
              {warehouses.map(wh => (
                <button
                  key={wh.id}
                  onClick={() => {
                    onSelectWarehouse(wh.id);
                    setIsWarehouseMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors cursor-pointer ${
                    activeWarehouseId === wh.id
                      ? 'text-cyan-400 font-bold bg-cyan-500/10'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <div>
                    <div className="font-semibold">{wh.name}</div>
                    <div className="text-[10px] text-slate-500">
                      {wh.city} ({wh.code})
                    </div>
                  </div>
                  {activeWarehouseId === wh.id && (
                    <span className="text-[10px] text-cyan-400 font-bold font-mono">Active</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center: Desktop Universal Search Bar */}
      <div className="flex-1 max-w-lg hidden md:block mx-2">
        <div
          id="btn-header-search"
          onClick={onOpenUniversalSearch}
          className="relative flex items-center bg-slate-950 hover:bg-slate-950/80 border border-slate-800 hover:border-blue-500/60 rounded-xl px-3 py-1.5 text-xs text-slate-400 cursor-pointer transition-all group"
        >
          <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-400 mr-2.5 shrink-0" />
          <span className="flex-1 text-slate-400 text-xs truncate">
            Universal Search: AWB, Gate Pass, Vehicle, Batch, Client...
          </span>
          <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-slate-400 border border-slate-800 shrink-0">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Right: Mobile Search Glass Button, Supabase Badge, Role Switcher & User Avatar */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Mobile Dedicated Search Glass Icon Button (< 768px) */}
        <button
          id="btn-mobile-search-glass"
          onClick={onOpenUniversalSearch}
          aria-label="Universal Search"
          className="md:hidden w-8 h-8 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-slate-300" />
        </button>

        {/* Supabase Status Button (Desktop only) */}
        {onOpenSupabaseHub && (
          <button
            id="btn-header-supabase"
            onClick={onOpenSupabaseHub}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Supabase</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        )}

        {/* Role & Working Authority Switcher (Desktop only) */}
        <div className="relative hidden md:block" ref={roleMenuRef}>
          <button
            id="btn-role-switcher"
            onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${roleBadge.bg} ${roleBadge.text} ${roleBadge.border}`}
          >
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Role:</span>
            <span>{currentUser.role}</span>
            <ChevronDown className="w-3 h-3 shrink-0" />
          </button>

          {isRoleMenuOpen && (
            <div className="absolute top-full right-0 mt-1.5 w-60 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in duration-100">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 border-b border-slate-800 mb-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Quick Persona Switcher (Demo)
              </div>
              <div className="max-h-72 overflow-y-auto">
                {roles.map(role => {
                  const b = getRoleBadgeConfig(role);
                  return (
                    <button
                      key={role}
                      onClick={() => {
                        onSwitchUserRole(role);
                        setIsRoleMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors cursor-pointer ${
                        currentUser.role === role ? 'text-blue-400 font-bold bg-blue-500/10' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${b.bg.replace('/20', '')}`} />
                        <span>{role}</span>
                      </div>
                      {currentUser.role === role && (
                        <span className="text-[10px] text-blue-400 font-bold font-mono">Active</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User Corner Avatar Display */}
        <div className="relative" ref={userMenuRef}>
          <button
            id="btn-user-profile-menu"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="w-8 h-8 rounded-lg sm:rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-amber-400 font-bold text-xs transition-all cursor-pointer ring-1 ring-amber-400/30"
            title={`${currentUser.name || 'User'} (${currentUser.role})`}
          >
            {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'B'}
          </button>

          {/* User Profile Dropdown */}
          {isUserMenuOpen && (
            <div className="absolute top-full right-0 mt-1.5 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-2 z-50 animate-in fade-in duration-100">
              <div className="px-3.5 py-2.5 border-b border-slate-800">
                <div className="text-xs font-bold text-white">{currentUser.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{currentUser.email}</div>
                {currentUser.empId && (
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    ID: {currentUser.empId}
                  </div>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${roleBadge.bg} ${roleBadge.text} ${roleBadge.border}`}>
                    {currentUser.role}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-500" />
                    {currentUser.department || 'Operations'}
                  </span>
                </div>
              </div>

              {/* Mobile Role Switcher within User menu */}
              <div className="md:hidden px-3.5 py-2 border-b border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-blue-400" /> Switch Persona
                </div>
                <select
                  value={currentUser.role}
                  onChange={(e) => onSwitchUserRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 outline-none"
                >
                  {roles.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Logout Option */}
              {onLogout && (
                <div className="pt-1 mt-1">
                  <button
                    id="btn-logout"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-rose-400 hover:text-white hover:bg-rose-500/15 flex items-center gap-2 font-semibold transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out from EMIZA-WOP
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

