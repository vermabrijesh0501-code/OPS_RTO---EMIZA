import React, { useState } from 'react';
import {
  LayoutDashboard,
  Truck,
  FileCheck2,
  RotateCcw,
  Boxes,
  Layers,
  BarChart3,
  Scan,
  Database,
  Building2,
  Warehouse as WarehouseIcon,
  Users,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  X,
  Search,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { User, ModuleId } from '../types';
import { hasModulePermission, getRoleBadgeConfig } from '../utils/rbac';

export type ActiveTab =
  | 'dashboard'
  | 'inward'
  | 'grn'
  | 'returns_rto'
  | 'returns_b2b'
  | 'inventory'
  | 'audit'
  | 'clients'
  | 'couriers'
  | 'locations'
  | 'reports'
  | 'notifications'
  | 'masters'
  | 'user_management'
  | 'supabase_hub'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  openBatchCount: number;
  pendingGateEntriesCount: number;
  auditCount?: number;
  activeWarehouseCode?: string;
  activeWarehouseName?: string;
  currentUser?: User;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onLogout?: () => void;
  onOpenUniversalSearch?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  openBatchCount,
  pendingGateEntriesCount,
  auditCount = 0,
  activeWarehouseCode = 'WH-MAIN-01',
  activeWarehouseName = 'Bhiwandi Central Hub',
  currentUser,
  isMobileOpen = false,
  onCloseMobile,
  onLogout,
  onOpenUniversalSearch,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Grouped Navigation Items matching user specifications
  const navSections = [
    {
      title: 'Operations',
      items: [
        {
          id: 'dashboard' as ActiveTab,
          label: 'Dashboard',
          icon: LayoutDashboard,
          badge: null,
          badgeColor: '',
        },
        {
          id: 'inward' as ActiveTab,
          label: 'Inward',
          icon: Truck,
          badge: pendingGateEntriesCount > 0 ? String(pendingGateEntriesCount) : null,
          badgeColor: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700/50',
        },
        {
          id: 'grn' as ActiveTab,
          label: 'GRN',
          icon: FileCheck2,
          badge: null,
          badgeColor: '',
        },
        {
          id: 'returns_rto' as ActiveTab,
          label: 'RTO',
          icon: RotateCcw,
          badge: openBatchCount > 0 ? `${openBatchCount} Open` : null,
          badgeColor: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700/50',
        },
        {
          id: 'inventory' as ActiveTab,
          label: 'Inventory',
          icon: Scan,
          badge: auditCount > 0 ? `${auditCount} Guns` : null,
          badgeColor: 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-700/50',
        },
      ],
    },
    {
      title: 'Management',
      items: [
        {
          id: 'clients' as ActiveTab,
          label: 'Clients',
          icon: Building2,
          badge: null,
          badgeColor: '',
        },
        {
          id: 'couriers' as ActiveTab,
          label: 'Couriers',
          icon: Boxes,
          badge: null,
          badgeColor: '',
        },
        {
          id: 'locations' as ActiveTab,
          label: 'Locations',
          icon: WarehouseIcon,
          badge: null,
          badgeColor: '',
        },
        {
          id: 'reports' as ActiveTab,
          label: 'Reports',
          icon: BarChart3,
          badge: null,
          badgeColor: '',
        },
      ],
    },
    {
      title: 'System',
      items: [
        {
          id: 'notifications' as ActiveTab,
          label: 'Notifications',
          icon: Bell,
          badge: null,
          badgeColor: '',
        },
        {
          id: 'user_management' as ActiveTab,
          label: 'User Management',
          icon: Users,
          badge: null,
          badgeColor: '',
        },
        {
          id: 'settings' as ActiveTab,
          label: 'Settings',
          icon: Settings,
          badge: null,
          badgeColor: '',
        },
      ],
    },
  ];

  // RBAC Permission filter
  const filterSectionItems = (items: typeof navSections[0]['items']) => {
    return items.filter(item => {
      // Permission check based on user role
      const hasPerm = hasModulePermission(currentUser, item.id as ModuleId, 'view');
      if (!hasPerm) return false;

      // Local search filter
      if (searchTerm.trim()) {
        return item.label.toLowerCase().includes(searchTerm.toLowerCase().trim());
      }
      return true;
    });
  };

  // Normalized active tab matcher
  const isItemActive = (itemId: ActiveTab): boolean => {
    if (activeTab === itemId) return true;
    if (activeTab === 'inward' && itemId === 'grn') return false;
    if (activeTab === 'audit' && itemId === 'inventory') return true;
    if (activeTab === 'masters' && (itemId === 'user_management' || itemId === 'clients' || itemId === 'couriers' || itemId === 'locations')) return activeTab === itemId;
    if (activeTab === 'supabase_hub' && itemId === 'settings') return true;
    return false;
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-fixed-sidebar"
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-white dark:bg-[#111D2C] border-r border-slate-200/90 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0 select-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header: Brand & Warehouse */}
        <div>
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#123B5D] dark:bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <WarehouseIcon className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <span className="text-sm font-extrabold text-[#123B5D] dark:text-blue-400 tracking-wide block">
                  EMIZA-WOP
                </span>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Logistics Platform
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            {onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 md:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Current Warehouse Code Badge */}
          <div className="px-4 pt-3 pb-2">
            <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                  {activeWarehouseName}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0 ml-1">
                {activeWarehouseCode}
              </span>
            </div>
          </div>

          {/* Global Search Input */}
          <div className="px-4 py-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search menu... (Ctrl+K)"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 text-xs rounded-lg pl-8 pr-3 py-2 focus:bg-white dark:focus:bg-slate-900 focus:border-[#123B5D] dark:focus:border-blue-500 focus:outline-none transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Middle: Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
          {navSections.map(section => {
            const visibleItems = filterSectionItems(section.items);
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1">
                <div className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  {section.title}
                </div>
                {visibleItems.map(item => {
                  const active = isItemActive(item.id);
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      id={`nav-item-${item.id}`}
                      type="button"
                      onClick={() => {
                        onSelectTab(item.id);
                        if (onCloseMobile) onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
                        active
                          ? 'bg-[#123B5D] dark:bg-blue-600 text-white shadow-sm font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            active ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                            active ? 'bg-white/20 text-white border-white/30' : item.badgeColor
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Bottom Area: Help/Support & User Profile */}
        <div className="p-3 border-t border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
          {/* Help / Support Button */}
          <button
            type="button"
            onClick={() => setIsHelpOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <span>Help & Support</span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">v2.4</span>
          </button>

          {/* User Profile Card */}
          {currentUser && (
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#162232] border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#123B5D] dark:bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 leading-tight">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-medium">
                    {currentUser.role}
                  </div>
                </div>
              </div>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Quick Help Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#162232] rounded-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-[#123B5D] dark:text-blue-400 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  EMIZA-WOP Support & Guide
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700">
                <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Warehouse Workflow Summary:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                  <li><strong>Inward:</strong> Register vehicle gate passes and assign unloading dock bays.</li>
                  <li><strong>GRN & Unloading:</strong> Verify box counts and inspect inbound materials.</li>
                  <li><strong>RTO / Returns:</strong> Scan AWB barcodes with gun verification and 7-point condition checks.</li>
                  <li><strong>Inventory & Audit:</strong> Conduct cycle counts with wireless audit guns.</li>
                </ul>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                For operational support or custom credentials, reach out to warehouse admin at{' '}
                <span className="font-mono text-[#123B5D] dark:text-blue-400">support@emiza.com</span>.
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#123B5D] dark:bg-blue-600 hover:bg-[#0D2E49] dark:hover:bg-blue-700 text-white text-xs font-semibold"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
