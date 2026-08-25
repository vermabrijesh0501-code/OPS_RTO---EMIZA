import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Warehouse as WarehouseIcon,
  LogOut,
  Sparkles,
  ChevronDown,
  Shield,
  Database,
  Layers,
  Bell,
} from 'lucide-react';
import { User, UserRole, Warehouse } from '../types';

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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-[#121E2B] border-b border-[#1E2C3D] sticky top-0 z-40 px-4 py-2.5 flex items-center justify-between gap-4 select-none">
      {/* Left: Brand Identity with Purple Accent & Status */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] bg-[#1D70F5] flex items-center justify-center text-white font-black text-lg shadow-sm shadow-[#1D70F5]/30">
            E
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#FFFFFF] text-sm tracking-tight">EMIZA-WOP</span>
              <span className="px-1.5 py-0.5 rounded-[6px] text-[9px] font-bold bg-[#1D70F5]/20 text-[#60A5FA] border border-[#1D70F5]/40 uppercase tracking-wider">
                PHASE 1
              </span>
            </div>
            <div className="text-[11px] text-[#8FA0B5] leading-tight">Warehouse Operations Platform</div>
          </div>
        </div>

        {/* Operating Warehouse Selector Dropdown */}
        <div className="relative ml-2 hidden sm:block" ref={warehouseMenuRef}>
          <button
            id="btn-warehouse-select"
            onClick={() => setIsWarehouseMenuOpen(!isWarehouseMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-[#0B141E] hover:bg-[#182738] border border-[#1E2C3D] text-left transition-all cursor-pointer"
          >
            <WarehouseIcon className="w-3.5 h-3.5 text-[#00BDD6] shrink-0" />
            <div>
              <div className="text-[9px] text-[#8FA0B5] leading-none uppercase tracking-wider font-semibold">Operating Facility</div>
              <div className="text-xs font-semibold text-[#FFFFFF] max-w-[240px] truncate leading-tight mt-0.5">
                {activeWarehouse?.name || 'EMIZA Central Fulfillment Facility'} ({activeWarehouse?.code || 'WH-MAIN-01'})
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-[#8FA0B5] shrink-0 ml-1" />
          </button>

          {isWarehouseMenuOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-60 bg-[#121E2B] border border-[#1E2C3D] rounded-[12px] shadow-xl py-1.5 z-50 animate-in fade-in duration-100">
              <div className="px-3 py-1 text-[10px] font-bold text-[#8FA0B5] uppercase tracking-wider">
                Select Operating Facility
              </div>
              {warehouses.map(wh => (
                <button
                  key={wh.id}
                  onClick={() => {
                    onSelectWarehouse(wh.id);
                    setIsWarehouseMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#182738] transition-colors cursor-pointer ${
                    activeWarehouseId === wh.id ? 'text-[#00BDD6] font-bold bg-[#00BDD6]/10' : 'text-[#8FA0B5] hover:text-[#FFFFFF]'
                  }`}
                >
                  <div>
                    <div className="font-semibold">{wh.name}</div>
                    <div className="text-[10px] text-[#6C7D93]">{wh.city} ({wh.code})</div>
                  </div>
                  {activeWarehouseId === wh.id && (
                    <span className="text-[10px] text-[#00BDD6] font-bold font-mono">Active</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center: Search Box */}
      <div className="flex-1 max-w-lg hidden md:block">
        <div
          id="btn-header-search"
          onClick={onOpenUniversalSearch}
          className="relative flex items-center bg-[#0B141E] hover:bg-[#0B141E]/90 border border-[#1E2C3D] hover:border-[#635BFF]/60 rounded-[10px] px-3 py-1.5 text-xs text-[#8FA0B5] cursor-pointer transition-all group"
        >
          <Search className="w-4 h-4 text-[#8FA0B5] group-hover:text-[#635BFF] mr-2.5 shrink-0" />
          <span className="flex-1 text-[#8FA0B5] text-xs truncate">
            Search AWB #, Order #, Gate Pass, Client, Courier...
          </span>
          <kbd className="px-1.5 py-0.5 rounded-[6px] text-[10px] font-mono font-bold bg-[#182738] text-[#8FA0B5] border border-[#1E2C3D] shrink-0">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Right: Supabase Badge, Role Switcher & User Avatar */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Supabase Status Button */}
        {onOpenSupabaseHub && (
          <button
            id="btn-header-supabase"
            onClick={onOpenSupabaseHub}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[#0B141E] hover:bg-[#182738] border border-[#1E2C3D] text-xs font-semibold text-[#8FA0B5] hover:text-[#FFFFFF] transition-all cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-[#00BDD6]" />
            <span className="hidden sm:inline">Supabase</span>
            <span className="w-2 h-2 rounded-full bg-[#00BDD6] animate-pulse" />
          </button>
        )}

        {/* Role Switcher Pill */}
        <div className="relative" ref={roleMenuRef}>
          <button
            id="btn-role-switcher"
            onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[#635BFF]/15 hover:bg-[#635BFF]/25 border border-[#635BFF]/35 text-[#FFFFFF] text-xs font-semibold transition-all cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-[#635BFF]" />
            <span className="hidden sm:inline">Role:</span>
            <span>{currentUser.role}</span>
            <ChevronDown className="w-3 h-3 text-[#635BFF]" />
          </button>

          {isRoleMenuOpen && (
            <div className="absolute top-full right-0 mt-1.5 w-52 bg-[#121E2B] border border-[#1E2C3D] rounded-[12px] shadow-xl py-1.5 z-50 animate-in fade-in duration-100">
              <div className="px-3 py-1 text-[10px] font-bold text-[#8FA0B5] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#FFC107]" /> Switch Role (Demo)
              </div>
              {roles.map(role => (
                <button
                  key={role}
                  onClick={() => {
                    onSwitchUserRole(role);
                    setIsRoleMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-[#182738] transition-colors cursor-pointer ${
                    currentUser.role === role ? 'text-[#635BFF] font-bold bg-[#635BFF]/10' : 'text-[#8FA0B5] hover:text-[#FFFFFF]'
                  }`}
                >
                  <span>{role}</span>
                  {currentUser.role === role && <span className="text-[10px] text-[#635BFF] font-bold">Active</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Corner Avatar Display with Yellow/Gold Accent */}
        <div className="relative" ref={userMenuRef}>
          <button
            id="btn-user-profile-menu"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="w-9 h-9 rounded-[10px] bg-[#182738] hover:bg-[#1E3147] border border-[#1E2C3D] flex items-center justify-center text-[#FFC107] font-bold text-xs transition-all cursor-pointer ring-1 ring-[#FFC107]/30"
            title={`${currentUser.name || 'User'} (${currentUser.role})`}
          >
            {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'B'}
          </button>

          {/* User Profile Dropdown */}
          {isUserMenuOpen && (
            <div className="absolute top-full right-0 mt-1.5 w-60 bg-[#121E2B] border border-[#1E2C3D] rounded-[12px] shadow-xl py-2 z-50 animate-in fade-in duration-100">
              <div className="px-3.5 py-2 border-b border-[#1E2C3D]">
                <div className="text-xs font-bold text-[#FFFFFF]">{currentUser.name}</div>
                <div className="text-[11px] text-[#8FA0B5] truncate">{currentUser.email}</div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-semibold bg-[#635BFF]/20 text-[#635BFF] border border-[#635BFF]/30">
                    {currentUser.role}
                  </span>
                  <span className="text-[10px] text-[#6C7D93]">{activeWarehouse?.code || 'WH-MAIN-01'}</span>
                </div>
              </div>

              {/* Logout Option with Red Alert Accent */}
              {onLogout && (
                <div className="pt-1 mt-1">
                  <button
                    id="btn-logout"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-[#E05252] hover:text-[#FFFFFF] hover:bg-[#E05252]/15 flex items-center gap-2 font-semibold transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
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
