import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Calendar,
  Layers,
  Palette,
  Globe,
  DollarSign,
  ShoppingBag,
  Tv,
  Music,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { FinityTransaction } from '../../types/finity';

interface ActivityTabProps {
  transactions: FinityTransaction[];
  onOpenTransfer: () => void;
}

export const ActivityTab: React.FC<ActivityTabProps> = ({ transactions, onOpenTransfer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  const filtered = transactions.filter(tx => {
    const matchSearch =
      tx.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = categoryFilter === 'All' || tx.category === categoryFilter;
    const matchType = typeFilter === 'All' || tx.type === typeFilter;
    return matchSearch && matchCategory && matchType;
  });

  const getBrandIcon = (iconType: string, company: string) => {
    switch (iconType) {
      case 'apple':
        return <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs"></div>;
      case 'figma':
        return <div className="w-8 h-8 rounded-full bg-[#0ACF83] text-white flex items-center justify-center"><Layers className="w-4 h-4" /></div>;
      case 'dribbble':
        return <div className="w-8 h-8 rounded-full bg-[#EA4C89] text-white flex items-center justify-center"><Palette className="w-4 h-4" /></div>;
      case 'google':
        return <div className="w-8 h-8 rounded-full bg-[#4285F4] text-white flex items-center justify-center"><Globe className="w-4 h-4" /></div>;
      case 'stripe':
        return <div className="w-8 h-8 rounded-full bg-[#635BFF] text-white flex items-center justify-center"><DollarSign className="w-4 h-4" /></div>;
      case 'amazon':
        return <div className="w-8 h-8 rounded-full bg-[#FF9900] text-white flex items-center justify-center"><ShoppingBag className="w-4 h-4" /></div>;
      case 'netflix':
        return <div className="w-8 h-8 rounded-full bg-[#E50914] text-white flex items-center justify-center"><Tv className="w-4 h-4" /></div>;
      case 'spotify':
        return <div className="w-8 h-8 rounded-full bg-[#1DB954] text-white flex items-center justify-center"><Music className="w-4 h-4" /></div>;
      default:
        return <div className="w-8 h-8 rounded-full bg-[#8D6CE6] text-white flex items-center justify-center font-bold text-xs">{company.slice(0, 1)}</div>;
    }
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Date,Company,Category,Type,Amount,Status,Card']
        .concat(
          filtered.map(
            tx => `${tx.date},"${tx.company}",${tx.category},${tx.type},${tx.amount},${tx.status},"${tx.cardUsed || 'N/A'}"`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `finity_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Stats & Action */}
      <div className="bg-white dark:bg-[#161D2D] rounded-[12px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-[#E0E0E0]/60 dark:border-[#28354D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-black dark:text-white">Activity & Statement</h2>
          <p className="text-xs text-[#666666] dark:text-gray-400 mt-1">
            Real-time feed of all incoming revenue, card payments, and external wire settlements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-[8px] bg-[#F5F5F5] dark:bg-[#20293D] hover:bg-[#E8E8E8] dark:hover:bg-[#2A364F] text-[#333333] dark:text-gray-200 border border-[#E0E0E0] dark:border-[#2E3C57] transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={onOpenTransfer}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-[8px] bg-[#8D6CE6] hover:bg-[#7C5AC2] text-white shadow-sm transition-all cursor-pointer active:scale-98"
          >
            <ArrowUpRight className="w-3.5 h-3.5" /> New Transfer
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-[#161D2D] rounded-[12px] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-[#E0E0E0]/60 dark:border-[#28354D] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by merchant, note, or category..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#F5F5F5] dark:bg-[#20293D] border border-[#E0E0E0] dark:border-[#2A364F] rounded-lg text-black dark:text-white focus:outline-none focus:border-[#8D6CE6]"
          />
        </div>

        {/* Category Pills & Dropdowns */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-lg bg-[#F5F5F5] dark:bg-[#20293D] border border-[#E0E0E0] dark:border-[#2A364F] text-black dark:text-white focus:outline-none"
          >
            <option value="All">All Categories</option>
            <option value="Transfer">Transfer</option>
            <option value="Subscription">Subscription</option>
            <option value="Workspace">Workspace</option>
            <option value="Shopping">Shopping</option>
            <option value="Income">Income</option>
            <option value="Utilities">Utilities</option>
          </select>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-lg bg-[#F5F5F5] dark:bg-[#20293D] border border-[#E0E0E0] dark:border-[#2A364F] text-black dark:text-white focus:outline-none"
          >
            <option value="All">All Types</option>
            <option value="debit">Outgoing (Debit)</option>
            <option value="credit">Incoming (Credit)</option>
          </select>
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="bg-white dark:bg-[#161D2D] rounded-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-[#E0E0E0]/60 dark:border-[#28354D] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E0E0E0] dark:border-[#28354D] bg-[#FAFAFA] dark:bg-[#1A2234] text-[11px] font-semibold text-[#888888] dark:text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4">Merchant / Counterparty</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Card / Account</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F0] dark:divide-[#28354D] text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#888888] dark:text-gray-400">
                    No transactions matched your search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(tx => (
                  <tr
                    key={tx.id}
                    className="hover:bg-[#F5F5F5]/60 dark:hover:bg-[#20293D]/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {getBrandIcon(tx.iconType, tx.company)}
                        <div>
                          <div className="font-bold text-black dark:text-white">{tx.company}</div>
                          {tx.recipient && (
                            <div className="text-[11px] text-[#888888] dark:text-gray-400">{tx.recipient}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F5F5F5] dark:bg-[#20293D] text-[#333333] dark:text-gray-300 border border-[#E0E0E0] dark:border-[#2A364F]">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#666666] dark:text-gray-400">
                      <div>{tx.date}</div>
                      <div className="text-[10px] text-[#888888]">{tx.time}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#666666] dark:text-gray-400">
                      {tx.cardUsed || 'Main Account'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`font-bold font-mono text-[13px] ${
                          tx.type === 'credit'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-black dark:text-white'
                        }`}
                      >
                        {tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
