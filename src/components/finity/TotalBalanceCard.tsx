import React from 'react';
import { ArrowUpRight, Plus, Send } from 'lucide-react';

interface TotalBalanceCardProps {
  totalBalance: number;
  mainBalance: number;
  creditBalance: number;
  trendPercentage?: number;
  onOpenDeposit: () => void;
  onOpenTransfer: () => void;
}

export const TotalBalanceCard: React.FC<TotalBalanceCardProps> = ({
  totalBalance,
  mainBalance,
  creditBalance,
  trendPercentage = 3.2,
  onOpenDeposit,
  onOpenTransfer,
}) => {
  const mainBalancePercent = Math.round((mainBalance / (mainBalance + creditBalance)) * 100) || 93;
  const creditBalancePercent = Math.round((creditBalance / (mainBalance + creditBalance)) * 100) || 7;

  return (
    <div className="bg-white dark:bg-[#161D2D] rounded-[12px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-[#E0E0E0]/60 dark:border-[#28354D] flex flex-col justify-between transition-all duration-200">
      <div>
        {/* Top Header Label & Trend */}
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-[#666666] dark:text-gray-400">
            Total balance
          </span>
          <span className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
            <ArrowUpRight className="w-3.5 h-3.5" /> {trendPercentage}%
          </span>
        </div>

        {/* Big Amount Number */}
        <div className="mt-2 flex items-baseline gap-2">
          <h2 className="text-[32px] font-bold text-black dark:text-white tracking-tight leading-none font-sans">
            ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </h2>
          <span className="text-[14px] font-medium text-[#888888] dark:text-gray-400">
            USD
          </span>
        </div>

        {/* Buttons: Deposit & Transfer */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            type="button"
            onClick={onOpenDeposit}
            className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-[8px] bg-[#F5F5F5] dark:bg-[#20293D] hover:bg-[#E8E8E8] dark:hover:bg-[#2A364F] text-[#333333] dark:text-gray-200 text-[13px] font-semibold border border-[#E0E0E0] dark:border-[#2E3C57] transition-all cursor-pointer active:scale-98"
          >
            <Plus className="w-3.5 h-3.5 text-[#666666] dark:text-gray-300" />
            Deposit
          </button>

          <button
            type="button"
            onClick={onOpenTransfer}
            className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-[8px] bg-[#8D6CE6] hover:bg-[#7C5AC2] text-white text-[13px] font-semibold shadow-sm hover:shadow-[0_4px_12px_rgba(141,108,230,0.3)] transition-all cursor-pointer active:scale-98"
          >
            <Send className="w-3.5 h-3.5 text-white" />
            Transfer
          </button>
        </div>
      </div>

      {/* Sub-sections (2 columns): Main balance & Credit balance with progress bars */}
      <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-[#E0E0E0] dark:border-[#28354D]">
        {/* Main Balance */}
        <div>
          <div className="text-[11px] font-medium text-[#888888] dark:text-gray-400">
            Main balance
          </div>
          <div className="text-[14px] font-bold text-black dark:text-white mt-0.5">
            ${mainBalance.toLocaleString('en-US')}
          </div>
          <div className="w-full h-[6px] bg-[#E0E0E0] dark:bg-[#28354D] rounded-[3px] overflow-hidden mt-2">
            <div
              className="h-full bg-gradient-to-r from-[#8D6CE6] to-[#A78BFA] rounded-[3px] transition-all duration-500"
              style={{ width: `${mainBalancePercent}%` }}
            />
          </div>
        </div>

        {/* Credit Balance */}
        <div>
          <div className="text-[11px] font-medium text-[#888888] dark:text-gray-400">
            Credit balance
          </div>
          <div className="text-[14px] font-bold text-black dark:text-white mt-0.5">
            ${creditBalance.toLocaleString('en-US')}
          </div>
          <div className="w-full h-[6px] bg-[#E0E0E0] dark:bg-[#28354D] rounded-[3px] overflow-hidden mt-2">
            <div
              className="h-full bg-gradient-to-r from-[#7ECED4] to-[#8D6CE6] rounded-[3px] transition-all duration-500"
              style={{ width: `${creditBalancePercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
