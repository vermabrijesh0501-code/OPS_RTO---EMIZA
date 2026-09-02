import React from 'react';
import {
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  Smartphone,
  Layers,
  Palette,
  Globe,
  DollarSign,
  ShoppingBag,
  Tv,
  Music,
} from 'lucide-react';
import { FinityTransaction } from '../../types/finity';

interface RecentTransactionsProps {
  transactions: FinityTransaction[];
  onViewAll?: () => void;
  onSelectTransaction?: (tx: FinityTransaction) => void;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  onViewAll,
  onSelectTransaction,
}) => {
  const getBrandIcon = (iconType: string, company: string) => {
    switch (iconType) {
      case 'apple':
        return (
          <div className="w-8 h-8 rounded-full bg-[#000000] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <span className="text-[14px]"></span>
          </div>
        );
      case 'figma':
        return (
          <div className="w-8 h-8 rounded-full bg-[#0ACF83] text-white flex items-center justify-center shadow-xs">
            <Layers className="w-4 h-4 text-white" />
          </div>
        );
      case 'dribbble':
        return (
          <div className="w-8 h-8 rounded-full bg-[#EA4C89] text-white flex items-center justify-center shadow-xs">
            <Palette className="w-4 h-4 text-white" />
          </div>
        );
      case 'google':
        return (
          <div className="w-8 h-8 rounded-full bg-[#4285F4] text-white flex items-center justify-center shadow-xs">
            <Globe className="w-4 h-4 text-white" />
          </div>
        );
      case 'stripe':
        return (
          <div className="w-8 h-8 rounded-full bg-[#635BFF] text-white flex items-center justify-center shadow-xs">
            <DollarSign className="w-4 h-4 text-white" />
          </div>
        );
      case 'amazon':
        return (
          <div className="w-8 h-8 rounded-full bg-[#FF9900] text-white flex items-center justify-center shadow-xs">
            <ShoppingBag className="w-4 h-4 text-white" />
          </div>
        );
      case 'netflix':
        return (
          <div className="w-8 h-8 rounded-full bg-[#E50914] text-white flex items-center justify-center shadow-xs">
            <Tv className="w-4 h-4 text-white" />
          </div>
        );
      case 'spotify':
        return (
          <div className="w-8 h-8 rounded-full bg-[#1DB954] text-white flex items-center justify-center shadow-xs">
            <Music className="w-4 h-4 text-white" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-[#8D6CE6] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {company.slice(0, 1)}
          </div>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-[#161D2D] rounded-[12px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-[#E0E0E0]/60 dark:border-[#28354D] flex flex-col justify-between transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-semibold text-black dark:text-white">
          Recent Transaction
        </h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-[12px] font-semibold text-[#8D6CE6] hover:text-[#7C5AC2] transition-colors cursor-pointer group"
          >
            <span>View all</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* Transaction Items */}
      <div className="space-y-3.5">
        {transactions.slice(0, 5).map(tx => (
          <div
            key={tx.id}
            onClick={() => onSelectTransaction?.(tx)}
            className="flex items-center justify-between p-2 rounded-[8px] hover:bg-[#F5F5F5] dark:hover:bg-[#1A2234] transition-colors cursor-pointer group"
          >
            {/* Left: Icon & Info */}
            <div className="flex items-center gap-3 min-w-0">
              {getBrandIcon(tx.iconType, tx.company)}
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-black dark:text-white truncate group-hover:text-[#8D6CE6] transition-colors">
                  {tx.company}
                </div>
                <div className="text-[11px] text-[#888888] dark:text-gray-400">
                  {tx.time}
                </div>
              </div>
            </div>

            {/* Right: Amount & Category */}
            <div className="text-right shrink-0">
              <div
                className={`text-[13px] font-bold ${
                  tx.type === 'credit'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-black dark:text-white'
                }`}
              >
                {tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}
              </div>
              <div className="text-[11px] text-[#888888] dark:text-gray-400">
                {tx.category}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
