import React from 'react';
import {
  LayoutDashboard,
  Truck,
  RotateCcw,
  Boxes,
  Layers,
  BarChart3,
  Scan,
  Database,
  ShieldCheck,
  Building2,
  Lock,
  X,
  Warehouse as WarehouseIcon,
} from 'lucide-react';
import { User, ModuleId } from '../types';
import { hasModulePermission, getRoleBadgeConfig } from '../utils/rbac';

export type ActiveTab =
  | 'dashboard'
  | 'inward'
  | 'returns_rto'
  | 'returns_b2b'
  | 'audit'
  | 'masters'
  | 'reports'
  | 'supabase_hub';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  openBatchCount: number;
  pendingGateEntriesCount: number;
  auditCount?: number;
  activeWarehouseCode?: string;
  currentUser?: User;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  openBatchCount,
  pendingGateEntriesCount,
  auditCount = 15,
  activeWarehouseCode = 'WH-MAIN-01',
  currentUser,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const allNavItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'inward' as ActiveTab,
      label: 'Inward Gate Entry',
      icon: Truck,
      badge: pendingGateEntriesCount > 0 ? String(pendingGateEntriesCount) : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    },
    {
      id: 'returns_rto' as ActiveTab,
      label: 'RTO / B2C Returns',
      icon: RotateCcw,
      badge: openBatchCount > 0 ? `${openBatchCount} Open` : null,
      badgeColor: 'bg-blue-500/25 text-blue-300 border border-blue-500/40',
    },
    {
      id: 'returns_b2b' as ActiveTab,
      label: 'B2B Returns',
      icon: Boxes,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'audit' as ActiveTab,
      label: 'Audit / Cycle Count',
      icon: Scan,
      badge: auditCount && auditCount > 0 ? `${auditCount} Guns` : null,
      badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
    },
    {
      id: 'masters' as ActiveTab,
      label: 'Master Data & RBAC',
      icon: Layers,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Reports & Analytics',
      icon: BarChart3,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'supabase_hub' as ActiveTab,
      label: 'Supabase & Netlify',
      icon: Database,
      badge: 'Live',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    },
  ];

  // Filter accessible tabs based on current user's authority
  const authorizedNavItems = allNavItems.filter(item =>
    hasModulePermission(currentUser, item.id as ModuleId, 'view')
  );

  const roleBadge = currentUser ? getRoleBadgeConfig(currentUser.role) : null;

  const handleNavClick = (id: ActiveTab) => {
    onSelectTab(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navContent = (
    <div className="flex flex-col justify-between h-full">
      <div className="space-y-4">
        {/* Section Header */}
        <div className="px-3 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            WAREHOUSE OPERATIONS
          </span>
          {currentUser && (
            <span className="text-[10px] text-slate-500 font-mono">
              {authorizedNavItems.length} modules
            </span>
          )}
        </div>

        {/* Navigation Items List */}
        <nav className="space-y-1">
          {authorizedNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 sm:py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 active:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                      isActive ? 'bg-white/20 text-white' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Role Authority Mini Panel */}
      {currentUser && roleBadge && (
        <div className="mt-auto pt-3 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Working Authority
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${roleBadge.bg} ${roleBadge.text} ${roleBadge.border}`}>
                {roleBadge.label}
              </span>
            </div>
            <div className="text-xs font-bold text-white truncate">
              {currentUser.name}
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-slate-500" />
              <span>{currentUser.department || 'Operations'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* 1. Desktop Sidebar (hidden on screens < 768px) */}
      <aside
        id="left-sidebar-navigation"
        className="hidden md:flex w-64 bg-slate-950 border-r border-slate-800 flex-col justify-between py-4 px-3 select-none shrink-0 h-[calc(100vh-61px)]"
      >
        {navContent}
      </aside>

      {/* 2. Mobile Slide-Over Drawer (< 768px) */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={onCloseMobile}
          />

          {/* Slide-over Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] bg-slate-950 border-r border-slate-800 p-4 flex flex-col justify-between shadow-2xl z-10 h-full animate-in slide-in-from-left duration-200">
            {/* Drawer Top Bar with Brand & Close Button */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm">
                  E
                </div>
                <div>
                  <div className="text-xs font-bold text-white tracking-tight">EMIZA-WOP</div>
                  <div className="text-[10px] text-cyan-400 font-medium">{activeWarehouseCode}</div>
                </div>
              </div>

              <button
                onClick={onCloseMobile}
                aria-label="Close Menu"
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Content */}
            <div className="flex-1 overflow-y-auto pr-1">
              {navContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

