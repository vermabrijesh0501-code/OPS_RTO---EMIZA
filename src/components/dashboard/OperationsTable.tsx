import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  Truck,
  RotateCcw,
  Boxes,
  Scan,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Filter,
  RefreshCw,
  X,
  Building2,
  Calendar,
  User as UserIcon,
} from 'lucide-react';
import { OperationRecord, OperationStatus, OperationPriority, OperationProcessType } from '../../types';

export interface OperationsTableProps {
  records: OperationRecord[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onSelectRecord?: (record: OperationRecord) => void;
  onQuickStatusChange?: (recordId: string, newStatus: OperationStatus) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  title?: string;
  subtitle?: string;
}

type SortField = 'referenceNo' | 'process' | 'clientName' | 'warehouseName' | 'status' | 'priority' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export const OperationsTable: React.FC<OperationsTableProps> = ({
  records,
  isLoading = false,
  isError = false,
  onRetry,
  onSelectRecord,
  searchQuery = '',
  onSearchChange,
  title = 'Active Operations Log',
  subtitle = 'Real-time feed of gate passes, GRN receipts, RTO returns, and audits',
}) => {
  // Local state for internal search if not provided externally
  const [internalSearch, setInternalSearch] = useState('');
  const [processFilter, setProcessFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Selected item for quick detail modal
  const [selectedRecord, setSelectedRecord] = useState<OperationRecord | null>(null);

  const activeSearch = onSearchChange ? searchQuery : internalSearch;
  const handleSearchChange = (val: string) => {
    if (onSearchChange) {
      onSearchChange(val);
    } else {
      setInternalSearch(val);
    }
    setCurrentPage(1);
  };

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Filtered and Sorted Records
  const processedRecords = useMemo(() => {
    let list = [...records];

    // Search filter
    if (activeSearch.trim()) {
      const q = activeSearch.toLowerCase().trim();
      list = list.filter(
        r =>
          r.referenceNo.toLowerCase().includes(q) ||
          r.clientName.toLowerCase().includes(q) ||
          r.warehouseName.toLowerCase().includes(q) ||
          r.process.toLowerCase().includes(q) ||
          r.assignedToName.toLowerCase().includes(q) ||
          (r.vehicleNumber && r.vehicleNumber.toLowerCase().includes(q)) ||
          (r.dockNumber && r.dockNumber.toLowerCase().includes(q))
      );
    }

    // Process filter
    if (processFilter !== 'all') {
      list = list.filter(r => r.process === processFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter(r => r.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      list = list.filter(r => r.priority === priorityFilter);
    }

    // Sorting
    list.sort((a, b) => {
      let aVal: any = a[sortField] || '';
      let bVal: any = b[sortField] || '';

      if (sortField === 'createdAt') {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      }

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return list;
  }, [records, activeSearch, processFilter, statusFilter, priorityFilter, sortField, sortOrder]);

  // Pagination calculation
  const totalItems = processedRecords.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRecords = processedRecords.slice(startIndex, startIndex + pageSize);

  // Status Badge Config
  const getStatusBadge = (status: OperationStatus) => {
    switch (status) {
      case 'Completed':
      case 'Verified':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/50';
      case 'Dock Allocated':
      case 'Under Inspection':
      case 'In Progress':
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/50';
      case 'GRN Pending':
      case 'Gate In':
      case 'Unloading':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/50';
      case 'Arrived':
      case 'Open':
        return 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700/50';
      case 'On Hold':
        return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700/50';
      default:
        return 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  // Priority Badge Config
  const getPriorityBadge = (priority: OperationPriority) => {
    switch (priority) {
      case 'Critical':
        return {
          dot: 'bg-rose-500',
          badge: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700/50',
        };
      case 'High':
        return {
          dot: 'bg-amber-500',
          badge: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/50',
        };
      case 'Medium':
        return {
          dot: 'bg-blue-500',
          badge: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/50',
        };
      case 'Low':
      default:
        return {
          dot: 'bg-slate-400',
          badge: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        };
    }
  };

  // Process Icon Config
  const getProcessIcon = (process: OperationProcessType) => {
    switch (process) {
      case 'Inward':
      case 'GRN':
        return <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
      case 'RTO Return':
        return <RotateCcw className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />;
      case 'B2B Return':
        return <Boxes className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      case 'Inventory Audit':
        return <Scan className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />;
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-theme shadow-sm overflow-hidden flex flex-col transition-colors">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-theme flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-primary tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-secondary mt-0.5">{subtitle}</p>
        </div>

        {/* Search & Quick Process Tabs */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative min-w-[220px] sm:min-w-[260px]">
            <Search className="w-4 h-4 text-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search reference, client, vehicle..."
              value={activeSearch}
              onChange={e => handleSearchChange(e.target.value)}
              className="w-full bg-elevated border border-theme text-primary text-xs rounded-lg pl-9 pr-8 py-2 focus:border-blue-500 focus:outline-none transition-all placeholder:text-muted"
            />
            {activeSearch && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Process Filter Dropdown */}
          <select
            value={processFilter}
            onChange={e => {
              setProcessFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-elevated border border-theme text-primary text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">All Processes</option>
            <option value="Inward">Inward Gate</option>
            <option value="GRN">GRN Receipt</option>
            <option value="RTO Return">RTO Return</option>
            <option value="B2B Return">B2B Return</option>
            <option value="Inventory Audit">Inventory Audit</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="p-12 flex flex-col items-center justify-center text-center">
          <RefreshCw className="w-8 h-8 text-[#123B5D] dark:text-blue-400 animate-spin mb-3" />
          <p className="text-sm font-semibold text-primary">
            Loading Operations Data...
          </p>
          <p className="text-xs text-secondary mt-1">
            Fetching latest warehouse logs from storage.
          </p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && isError && (
        <div className="p-10 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-primary">
            Failed to Load Operational Records
          </h4>
          <p className="text-xs text-secondary max-w-sm mt-1 mb-4">
            An unexpected error occurred while synchronizing records. Please try again.
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-4 py-2 bg-[#123B5D] dark:bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-[#0D2E49] dark:hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Retry Sync
            </button>
          )}
        </div>
      )}

      {/* Main Table Content */}
      {!isLoading && !isError && (
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-elevated border-b border-theme text-[11px] font-semibold text-secondary uppercase tracking-wider">
                <th
                  onClick={() => handleSort('referenceNo')}
                  className="py-3 px-4 cursor-pointer hover:bg-surface transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Reference No</span>
                    <ArrowUpDown className="w-3 h-3 text-muted" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('process')}
                  className="py-3 px-4 cursor-pointer hover:bg-surface transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Process</span>
                    <ArrowUpDown className="w-3 h-3 text-muted" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('clientName')}
                  className="py-3 px-4 cursor-pointer hover:bg-surface transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Client</span>
                    <ArrowUpDown className="w-3 h-3 text-muted" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('warehouseName')}
                  className="py-3 px-4 cursor-pointer hover:bg-surface transition-colors hidden md:table-cell"
                >
                  <div className="flex items-center gap-1">
                    <span>Warehouse</span>
                    <ArrowUpDown className="w-3 h-3 text-muted" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="py-3 px-4 cursor-pointer hover:bg-surface transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3 text-muted" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('priority')}
                  className="py-3 px-4 cursor-pointer hover:bg-surface transition-colors hidden sm:table-cell"
                >
                  <div className="flex items-center gap-1">
                    <span>Priority</span>
                    <ArrowUpDown className="w-3 h-3 text-muted" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('createdAt')}
                  className="py-3 px-4 cursor-pointer hover:bg-surface transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Created At</span>
                    <ArrowUpDown className="w-3 h-3 text-muted" />
                  </div>
                </th>
                <th className="py-3 px-4 hidden lg:table-cell text-secondary">Assigned To</th>
                <th className="py-3 px-4 text-right text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme">
              {paginatedRecords.length === 0 ? (
                /* Empty State */
                <tr>
                  <td colSpan={9} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-elevated flex items-center justify-center text-secondary mb-3">
                        <Search className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-bold text-primary">
                        No operational records found
                      </p>
                      <p className="text-xs text-secondary max-w-xs mt-1">
                        Try adjusting your search criteria or changing selected filters.
                      </p>
                      {(activeSearch || processFilter !== 'all' || statusFilter !== 'all' || priorityFilter !== 'all') && (
                        <button
                          type="button"
                          onClick={() => {
                            handleSearchChange('');
                            setProcessFilter('all');
                            setStatusFilter('all');
                            setPriorityFilter('all');
                          }}
                          className="mt-3 text-xs font-semibold text-[#123B5D] dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map(record => {
                  const priorityConfig = getPriorityBadge(record.priority);
                  return (
                    <tr
                      key={record.id}
                      onClick={() => {
                        setSelectedRecord(record);
                        if (onSelectRecord) onSelectRecord(record);
                      }}
                      className="hover:bg-elevated/70 cursor-pointer transition-colors group"
                    >
                      {/* 1. Reference No */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-primary text-xs">
                        <div className="flex items-center gap-2">
                          <span className="group-hover:text-blue-500 transition-colors">
                            {record.referenceNo}
                          </span>
                          {record.vehicleNumber && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-elevated text-secondary border border-theme hidden xl:inline">
                              {record.vehicleNumber}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. Process */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-md bg-elevated flex items-center justify-center shrink-0 border border-theme">
                            {getProcessIcon(record.process)}
                          </div>
                          <span className="font-medium text-primary">
                            {record.process}
                          </span>
                        </div>
                      </td>

                      {/* 3. Client */}
                      <td className="py-3.5 px-4 font-medium text-primary">
                        {record.clientName}
                      </td>

                      {/* 4. Warehouse */}
                      <td className="py-3.5 px-4 text-secondary hidden md:table-cell">
                        {record.warehouseName}
                      </td>

                      {/* 5. Status Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(
                            record.status
                          )}`}
                        >
                          {record.status}
                        </span>
                      </td>

                      {/* 6. Priority Badge */}
                      <td className="py-3.5 px-4 hidden sm:table-cell">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium border ${priorityConfig.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${priorityConfig.dot}`} />
                          {record.priority}
                        </span>
                      </td>

                      {/* 7. Created At */}
                      <td className="py-3.5 px-4 text-secondary font-mono text-[11px] whitespace-nowrap">
                        {new Date(record.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* 8. Assigned To */}
                      <td className="py-3.5 px-4 text-secondary hidden lg:table-cell">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-elevated text-secondary border border-theme flex items-center justify-center text-[10px] font-bold">
                            {record.assignedToName.charAt(0)}
                          </div>
                          <span className="truncate max-w-[120px]">
                            {record.assignedToName}
                          </span>
                        </div>
                      </td>

                      {/* 9. Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRecord(record);
                              if (onSelectRecord) onSelectRecord(record);
                            }}
                            className="p-1 rounded-md text-secondary hover:text-primary hover:bg-elevated transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Table Pagination Footer */}
      {!isLoading && !isError && totalItems > 0 && (
        <div className="p-3.5 sm:p-4 border-t border-theme bg-surface flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-secondary">
          <div className="flex items-center gap-2">
            <span>
              Showing{' '}
              <strong className="font-semibold text-primary">
                {startIndex + 1}
              </strong>{' '}
              to{' '}
              <strong className="font-semibold text-primary">
                {Math.min(startIndex + pageSize, totalItems)}
              </strong>{' '}
              of{' '}
              <strong className="font-semibold text-primary">
                {totalItems}
              </strong>{' '}
              entries
            </span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="ml-2 bg-elevated border border-theme rounded px-2 py-1 text-xs text-primary focus:outline-none cursor-pointer"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md border border-theme bg-elevated hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-primary" />
            </button>
            <span className="px-2.5 py-1 text-xs font-semibold text-primary">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md border border-theme bg-elevated hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-primary" />
            </button>
          </div>
        </div>
      )}

      {/* Row Details Modal Drawer */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-theme max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150 relative">
            <button
              type="button"
              onClick={() => setSelectedRecord(null)}
              className="absolute right-4 top-4 text-secondary hover:text-primary p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-[#123B5D] dark:text-blue-400 flex items-center justify-center">
                {getProcessIcon(selectedRecord.process)}
              </div>
              <div>
                <h3 className="text-base font-bold text-primary">
                  {selectedRecord.referenceNo}
                </h3>
                <p className="text-xs text-secondary">
                  {selectedRecord.process} Details & Workflow Status
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 py-3 border-y border-theme text-xs">
              <div>
                <span className="text-secondary block text-[11px]">Client</span>
                <span className="font-semibold text-primary">
                  {selectedRecord.clientName}
                </span>
              </div>
              <div>
                <span className="text-secondary block text-[11px]">Warehouse</span>
                <span className="font-semibold text-primary">
                  {selectedRecord.warehouseName}
                </span>
              </div>
              <div>
                <span className="text-secondary block text-[11px]">Status</span>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border mt-0.5 ${getStatusBadge(selectedRecord.status)}`}>
                  {selectedRecord.status}
                </span>
              </div>
              <div>
                <span className="text-secondary block text-[11px]">Priority</span>
                <span className="font-semibold text-primary">
                  {selectedRecord.priority}
                </span>
              </div>
              {selectedRecord.vehicleNumber && (
                <div>
                  <span className="text-secondary block text-[11px]">Vehicle No</span>
                  <span className="font-mono font-semibold text-primary">
                    {selectedRecord.vehicleNumber}
                  </span>
                </div>
              )}
              {selectedRecord.dockNumber && (
                <div>
                  <span className="text-secondary block text-[11px]">Dock Bay</span>
                  <span className="font-semibold text-primary">
                    {selectedRecord.dockNumber}
                  </span>
                </div>
              )}
              <div>
                <span className="text-secondary block text-[11px]">Assigned Operator</span>
                <span className="font-semibold text-primary">
                  {selectedRecord.assignedToName}
                </span>
              </div>
              <div>
                <span className="text-secondary block text-[11px]">Created At</span>
                <span className="font-mono text-secondary">
                  {new Date(selectedRecord.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {selectedRecord.notes && (
              <div className="mt-3 p-3 bg-elevated rounded-lg text-xs text-secondary border border-theme">
                <span className="font-semibold text-primary block mb-0.5">Notes:</span>
                {selectedRecord.notes}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 rounded-lg bg-elevated hover:bg-surface border border-theme text-primary text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
