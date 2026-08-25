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
} from 'lucide-react';

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
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  openBatchCount,
  pendingGateEntriesCount,
  auditCount = 15,
}) => {
  const navItems = [
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
      badgeColor: 'bg-[#D97706]/20 text-[#F59E0B] border border-[#D97706]/40',
    },
    {
      id: 'returns_rto' as ActiveTab,
      label: 'RTO / B2C Returns',
      icon: RotateCcw,
      badge: openBatchCount > 0 ? `${openBatchCount} Open` : null,
      badgeColor: 'bg-[#1D4ED8]/25 text-[#60A5FA] border border-[#1D4ED8]/40',
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
      badgeColor: 'bg-[#7C3AED]/20 text-[#C084FC] border border-[#7C3AED]/40',
    },
    {
      id: 'masters' as ActiveTab,
      label: 'Master Data',
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
      badge: 'Deploy',
      badgeColor: 'bg-[#059669]/20 text-[#34D399] border border-[#059669]/40',
    },
  ];

  return (
    <aside
      id="left-sidebar-navigation"
      className="w-64 bg-[#0B141E] border-r border-[#1E2C3D] flex flex-col justify-between py-5 px-3 select-none shrink-0 h-[calc(100vh-61px)]"
    >
      <div className="space-y-4">
        {/* Section Header */}
        <div className="px-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8FA0B5]">
            WAREHOUSE OPERATIONS
          </span>
        </div>

        {/* Navigation Items List */}
        <nav className="space-y-1.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[12px] text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#1D70F5] text-white shadow-sm shadow-[#1D70F5]/30 font-bold'
                    : 'text-[#8FA0B5] hover:text-white hover:bg-[#121E2B]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-[#8FA0B5]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badgeColor
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
    </aside>
  );
};


