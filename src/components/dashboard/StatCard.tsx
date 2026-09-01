import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatCardProps {
  id?: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
    label?: string;
  };
  onClick?: () => void;
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  id,
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-[#123B5D] dark:text-blue-400',
  iconBg = 'bg-blue-50 dark:bg-blue-900/30',
  trend,
  onClick,
  badge,
}) => {
  return (
    <div
      id={id}
      onClick={onClick}
      className={`bg-surface rounded-xl border border-theme p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden ${
        onClick ? 'cursor-pointer hover:border-blue-400' : ''
      }`}
    >
      {/* Top row: Title + Icon */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <span className="text-xs font-semibold text-secondary uppercase tracking-wider block">
            {title}
          </span>
          {badge && (
            <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-elevated text-secondary border border-theme">
              {badge}
            </span>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0 border border-theme`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>

      {/* Middle: Big Metric Value */}
      <div className="mt-1 mb-2">
        <div className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight font-sans">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
      </div>

      {/* Bottom row: Trend indicator & Subtitle */}
      <div className="flex items-center justify-between text-xs text-secondary pt-2 border-t border-theme gap-2">
        {trend && (
          <div className="flex items-center gap-1 font-medium">
            {trend.isNeutral ? (
              <span className="inline-flex items-center gap-0.5 text-secondary">
                <Minus className="w-3.5 h-3.5" />
                <span>{trend.value}</span>
              </span>
            ) : trend.isPositive ? (
              <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{trend.value}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-md">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>{trend.value}</span>
              </span>
            )}
            {trend.label && <span className="text-[11px] text-muted font-normal">{trend.label}</span>}
          </div>
        )}
        {subtitle && (
          <span className="text-[11px] text-muted font-medium truncate ml-auto">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
