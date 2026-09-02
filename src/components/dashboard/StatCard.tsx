import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatCardProps {
  id?: string;
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  progressPercent?: number;
  progressBarColor?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
    label?: string;
  };
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  id,
  title,
  value,
  unit,
  icon: Icon,
  iconColor = '#8B5CF6',
  iconBg = '#F3E8FF',
  progressPercent = 85,
  progressBarColor = '#8B5CF6',
  trend,
  onClick,
}) => {
  return (
    <div
      id={id}
      onClick={onClick}
      className={`bg-card border border-theme rounded-[20px] p-6 shadow-[0_4px_24px_rgba(148,163,184,0.08)] hover:shadow-[0_8px_32px_rgba(148,163,184,0.12)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between select-none ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Top row: Label + Icon Container 40x40px */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
          {title}
        </span>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: iconBg }}
        >
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
      </div>

      {/* Middle: Stat Number */}
      <div className="my-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[32px] font-bold text-black dark:text-white leading-none tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          {unit && (
            <span className="text-sm font-semibold text-[#64748B]">
              {unit}
            </span>
          )}
        </div>

        {/* Trend Indicator */}
        {trend && (
          <div className="flex items-center gap-1 mt-2 text-xs">
            {trend.isNeutral ? (
              <span className="inline-flex items-center gap-0.5 text-[#64748B] font-medium">
                <Minus className="w-3.5 h-3.5" />
                <span>{trend.value}</span>
              </span>
            ) : trend.isPositive ? (
              <span className="inline-flex items-center gap-0.5 text-[#10B981] font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{trend.value}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-[#EF4444] font-semibold">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>{trend.value}</span>
              </span>
            )}
            {trend.label && (
              <span className="text-[#64748B] font-normal">{trend.label}</span>
            )}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] font-semibold text-[#64748B] mb-1.5">
          <span>Progress</span>
          <span>{Math.min(100, Math.max(0, progressPercent))}%</span>
        </div>
        <div className="w-full h-1.5 bg-[#E2E8F0] dark:bg-[#334155] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.max(0, progressPercent))}%`,
              backgroundColor: progressBarColor,
            }}
          />
        </div>
      </div>
    </div>
  );
};
