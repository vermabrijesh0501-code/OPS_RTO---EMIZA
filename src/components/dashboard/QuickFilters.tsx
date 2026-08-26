import React from 'react';
import {
  Calendar,
  Building2,
  Warehouse as WarehouseIcon,
  Users,
  Filter,
  RotateCcw,
  Search,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { Company, Warehouse, Client, DashboardFilterState } from '../../types';

export interface QuickFiltersProps {
  filters: DashboardFilterState;
  onFilterChange: (updates: Partial<DashboardFilterState>) => void;
  onResetFilters: () => void;
  companies: Company[];
  warehouses: Warehouse[];
  clients: Client[];
  activeWarehouseId?: string;
}

export const QuickFilters: React.FC<QuickFiltersProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  companies,
  warehouses,
  clients,
}) => {
  const isFiltered =
    filters.dateRange !== 'all' ||
    filters.companyId !== 'all' ||
    filters.warehouseId !== 'all' ||
    filters.clientId !== 'all' ||
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    Boolean(filters.searchQuery.trim());

  return (
    <div className="bg-white dark:bg-[#111D2C] rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-sm transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <Filter className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Quick Operational Filters
          </span>
          {isFiltered && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-[#123B5D] dark:text-blue-300 border border-blue-200 dark:border-blue-700/50">
              Active Filters
            </span>
          )}
        </div>

        {/* Reset Filter Button */}
        {isFiltered && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors self-start lg:self-auto cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Filter Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
        {/* 1. Date Range */}
        <div className="relative">
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            Date Range
          </label>
          <div className="relative">
            <select
              value={filters.dateRange}
              onChange={e => onFilterChange({ dateRange: e.target.value as any })}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-3 py-2 focus:bg-white dark:focus:bg-slate-900 focus:border-[#123B5D] dark:focus:border-blue-500 focus:outline-none transition-all cursor-pointer"
            >
              <option value="all">All Dates</option>
              <option value="today">Today (Live)</option>
              <option value="yesterday">Yesterday</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="this_month">This Month</option>
            </select>
          </div>
        </div>

        {/* 2. Company */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            Company
          </label>
          <select
            value={filters.companyId}
            onChange={e => onFilterChange({ companyId: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-3 py-2 focus:bg-white dark:focus:bg-slate-900 focus:border-[#123B5D] dark:focus:border-blue-500 focus:outline-none transition-all cursor-pointer"
          >
            <option value="all">All Companies</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>

        {/* 3. Warehouse */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            Warehouse
          </label>
          <select
            value={filters.warehouseId}
            onChange={e => onFilterChange({ warehouseId: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-3 py-2 focus:bg-white dark:focus:bg-slate-900 focus:border-[#123B5D] dark:focus:border-blue-500 focus:outline-none transition-all cursor-pointer"
          >
            <option value="all">All Warehouses</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.city})
              </option>
            ))}
          </select>
        </div>

        {/* 4. Client */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            Client Account
          </label>
          <select
            value={filters.clientId}
            onChange={e => onFilterChange({ clientId: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-3 py-2 focus:bg-white dark:focus:bg-slate-900 focus:border-[#123B5D] dark:focus:border-blue-500 focus:outline-none transition-all cursor-pointer"
          >
            <option value="all">All Clients</option>
            {clients.map(cl => (
              <option key={cl.id} value={cl.id}>
                {cl.name}
              </option>
            ))}
          </select>
        </div>

        {/* 5. Status */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            Stage / Status
          </label>
          <select
            value={filters.status}
            onChange={e => onFilterChange({ status: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-3 py-2 focus:bg-white dark:focus:bg-slate-900 focus:border-[#123B5D] dark:focus:border-blue-500 focus:outline-none transition-all cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Gate In">Gate In</option>
            <option value="Dock Allocated">Dock Allocated</option>
            <option value="Unloading">Unloading</option>
            <option value="Scanned">Scanned</option>
            <option value="Verified">Verified</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {/* 6. Priority */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            Priority Level
          </label>
          <select
            value={filters.priority}
            onChange={e => onFilterChange({ priority: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-3 py-2 focus:bg-white dark:focus:bg-slate-900 focus:border-[#123B5D] dark:focus:border-blue-500 focus:outline-none transition-all cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>
    </div>
  );
};
