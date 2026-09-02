import React from 'react';
import { SlidersHorizontal, AlertCircle } from 'lucide-react';

interface DailyLimitCardProps {
  spent?: number;
  limit?: number;
  onOpenManageLimit?: () => void;
}

export const DailyLimitCard: React.FC<DailyLimitCardProps> = ({
  spent = 10000,
  limit = 12000,
  onOpenManageLimit,
}) => {
  const percentage = Math.min(100, Math.round((spent / limit) * 100));

  return (
    <div className="bg-white dark:bg-[#161D2D] rounded-[12px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-[#E0E0E0]/60 dark:border-[#28354D] flex flex-col justify-between transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-[#666666] dark:text-gray-400">
          Daily transactions limit
        </span>
        {onOpenManageLimit && (
          <button
            onClick={onOpenManageLimit}
            className="text-[11px] font-medium text-[#8D6CE6] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <SlidersHorizontal className="w-3 h-3" /> Adjust
          </button>
        )}
      </div>

      {/* Progress Bar Container */}
      <div className="mt-4">
        <div className="w-full h-[8px] bg-[#E0E0E0] dark:bg-[#28354D] rounded-[4px] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#8D6CE6] via-[#A78BFA] to-[#7ECED4] rounded-[4px] transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Text Details & Percentage */}
        <div className="flex items-center justify-between mt-2.5">
          <span className="text-[12px] text-[#666666] dark:text-gray-400">
            ${spent.toLocaleString()} spent of ${limit.toLocaleString()}
          </span>
          <span className="text-[14px] font-bold text-black dark:text-white">
            {percentage}%
          </span>
        </div>
      </div>

      {/* Quick notification footer */}
      <div className="mt-3 pt-3 border-t border-[#F0F0F0] dark:border-[#28354D] flex items-center justify-between text-[11px] text-[#888888] dark:text-gray-400">
        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
          <AlertCircle className="w-3 h-3" /> ${(limit - spent).toLocaleString()} remaining
        </span>
        <span>Resets at 00:00 UTC</span>
      </div>
    </div>
  );
};
