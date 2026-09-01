import React from 'react';
import { AlertCircle, ArrowRight, X, Sparkles, Bell } from 'lucide-react';

export interface ActivityAlertBannerProps {
  id?: string;
  title: string;
  description: string;
  badgeText?: string;
  onViewDetails?: () => void;
  onDismiss?: () => void;
  actionText?: string;
}

export const ActivityAlertBanner: React.FC<ActivityAlertBannerProps> = ({
  id = 'operations-alert-banner',
  title,
  description,
  badgeText = 'Action Required',
  onViewDetails,
  onDismiss,
  actionText = 'View Details',
}) => {
  return (
    <div
      id={id}
      className="w-full rounded-xl bg-surface border border-theme p-4 sm:p-4.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-all"
    >
      {/* Left: Icon & Description */}
      <div className="flex items-start sm:items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#123B5D] dark:bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
          <Bell className="w-4 h-4 text-blue-100" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-primary tracking-wide">
              {title}
            </span>
            {badgeText && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100/80 dark:bg-blue-900/50 text-[#123B5D] dark:text-blue-300 border border-blue-200 dark:border-blue-700/50">
                {badgeText}
              </span>
            )}
          </div>
          <p className="text-xs text-secondary mt-0.5 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        {onViewDetails && (
          <button
            type="button"
            onClick={onViewDetails}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#123B5D] dark:bg-blue-600 hover:bg-[#0E2E49] dark:hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <span>{actionText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss Alert"
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
