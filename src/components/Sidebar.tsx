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

  // 7 Core Warehouse Operations Navigation Modules matching user screenshot
  const navSections = [
    {
      title: 'Warehouse Operations',
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
          label: 'Inward Gate Entry',
          icon: Truck,
          badge: pendingGateEntriesCount > 0 ? String(pendingGateEntriesCount) : null,
          badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-800/60',
        },
        {
          id: 'returns_rto' as ActiveTab,
          label: 'RTO / B2C Returns',
          icon: RotateCcw,
          badge: openBatchCount > 0 ? `${openBatchCount} Open` : '1 Open',
          badgeColor: 'bg-blue-900/60 text-blue-300 border-blue-700/60',
        },
        {
          id: 'returns_b2b' as ActiveTab,
          label: 'B2B Returns',
          icon: Boxes,
          badge: null,
          badgeColor: '',
        },
        {
          id: 'inventory' as ActiveTab,
          label: 'Audit / Cycle Count',
          icon: Scan,
          badge: auditCount > 0 ? `${auditCount} Guns` : null,
          badgeColor: 'bg-purple-900/60 text-purple-300 border-purple-700/60',
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
          label: 'Reports & Manifest',
          icon: BarChart3,
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
          className="mobile-sidebar-overlay fixed inset-0 z-[9998] bg-black/75 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-fixed-sidebar"
        className={`sidebar fixed md:sticky top-0 left-0 z-[9999] h-screen w-[78vw] max-w-[320px] md:w-64 theme-sidebar bg-[var(--bg-surface)] border-r border-[var(--border-color)] flex flex-col justify-between transition-all duration-200 ease-in-out shrink-0 select-none text-[var(--text-primary)] overflow-y-auto ${
          isMobileOpen ? 'translate-x-0 !block' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header */}
        <div>
          <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black shadow-sm">
                E
              </div>
              <div className="leading-tight">
                <span className="text-sm font-extrabold text-[var(--text-primary)] tracking-wide block">
                  EMIZA-WOP
                </span>
                <span className="text-[9px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Logistics Platform
                </span>
              </div>
            </div>

            {/* Mobile close button (44px touch target, top right) */}
            {onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] md:hidden cursor-pointer"
                aria-label="Close Navigation Menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Section Heading with 7 modules badge */}
          <div className="px-4 pt-3 pb-1 flex items-center justify-between">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Warehouse Operations
            </span>
            <span className="text-[9px] font-semibold bg-[var(--bg-elevated)] text-[var(--text-secondary)] px-1.5 py-0.5 rounded border border-[var(--border-color)] font-mono">
              7 modules
            </span>
          </div>
        </div>

        {/* Middle: Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700">
          {navSections.map(section => {
            const visibleItems = filterSectionItems(section.items);
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1">
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
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
                        active
                          ? 'bg-blue-600 text-white shadow-sm font-bold'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            active ? 'text-white' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
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

        {/* Bottom Area: Working Authority Card */}
        <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-surface)] space-y-2">
          {currentUser && (
            <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Working Authority
                </span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-800/40">
                  {currentUser.role}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)] truncate">
                    {currentUser.role === 'Super Admin' ? 'Central Admin' : activeWarehouseName}
                  </div>
                </div>

                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    title="Sign Out"
                    className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-950/20 transition-colors shrink-0 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Quick Help Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-theme max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-[#123B5D] dark:text-blue-400 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-primary">
                  EMIZA-WOP Support & Guide
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="text-secondary hover:text-primary p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-secondary">
              <div className="p-3 bg-elevated rounded-xl border border-theme">
                <p className="font-semibold text-primary mb-1">
                  Warehouse Workflow Summary:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-secondary">
                  <li><strong>Inward:</strong> Register vehicle gate passes and assign unloading dock bays.</li>
                  <li><strong>GRN & Unloading:</strong> Verify box counts and inspect inbound materials.</li>
                  <li><strong>RTO / Returns:</strong> Scan AWB barcodes with gun verification and 7-point condition checks.</li>
                  <li><strong>Inventory & Audit:</strong> Conduct cycle counts with wireless audit guns.</li>
                </ul>
              </div>

              <div className="text-[11px] text-secondary">
                For operational support or custom credentials, reach out to warehouse admin at{' '}
                <span className="font-mono text-[#123B5D] dark:text-blue-400">support@emiza.com</span>.
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#123B5D] dark:bg-blue-600 hover:bg-[#0D2E49] dark:hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
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
