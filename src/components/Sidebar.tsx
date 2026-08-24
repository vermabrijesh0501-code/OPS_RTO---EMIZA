import React from 'react';
import {
  LayoutDashboard,
  Truck,
  RotateCcw,
  Boxes,
  Database,
  BarChart3,
  Cloud,
  Layers,
  History,
  Shield,
  Scan,
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
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  openBatchCount,
  pendingGateEntriesCount,
  auditCount = 0,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'inward' as ActiveTab,
      label: 'Inward Gate Entry',
      icon: Truck,
      badge: pendingGateEntriesCount > 0 ? pendingGateEntriesCount : null,
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
    {
      id: 'returns_rto' as ActiveTab,
      label: 'RTO / B2C Returns',
      icon: RotateCcw,
      badge: openBatchCount > 0 ? `${openBatchCount} Open` : null,
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    },
    {
      id: 'returns_b2b' as ActiveTab,
      label: 'B2B Returns',
      icon: Boxes,
      badge: null,
    },
    {
      id: 'audit' as ActiveTab,
      label: 'Audit / Cycle Count',
      icon: Scan,
      badge: '15 Guns',
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    },
    {
      id: 'masters' as ActiveTab,
      label: 'Master Data (13)',
      icon: Layers,
      badge: null,
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Reports & Analytics',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'supabase_hub' as ActiveTab,
      label: 'Supabase & Netlify',
      icon: Cloud,
      badge: 'Deploy',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
  ];


  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 hidden md:flex min-h-[calc(100vh-53px)]">
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Warehouse Operations
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    isActive ? 'bg-white/20 text-white border-white/30' : item.badgeColor || 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info Box */}
      <div className="p-3 m-3 bg-slate-800/60 border border-slate-700/60 rounded-xl">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-200 mb-1">
          <Shield className="w-4 h-4 text-emerald-400" /> Multi-Role RBAC Active
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          6 Roles supported: Super Admin, Admin, Manager, Supervisor, Operator & Read-Only.
        </p>
      </div>
    </aside>
  );
};
