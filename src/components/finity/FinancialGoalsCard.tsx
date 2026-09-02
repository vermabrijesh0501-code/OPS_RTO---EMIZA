import React from 'react';
import { Plus, Car, Plane, Shield, Target } from 'lucide-react';
import { FinityGoal } from '../../types/finity';

interface FinancialGoalsCardProps {
  goals: FinityGoal[];
  onOpenAddGoal?: () => void;
  onSelectGoal?: (goal: FinityGoal) => void;
}

export const FinancialGoalsCard: React.FC<FinancialGoalsCardProps> = ({
  goals,
  onOpenAddGoal,
  onSelectGoal,
}) => {
  const getCategoryColor = (color: 'purple' | 'cyan' | 'pink') => {
    switch (color) {
      case 'purple':
        return {
          stroke: '#8D6CE6',
          bg: 'bg-[#F3E8FF] dark:bg-[#8D6CE6]/20',
          text: 'text-[#8D6CE6]',
        };
      case 'cyan':
        return {
          stroke: '#7ECED4',
          bg: 'bg-[#CFFAFE] dark:bg-[#7ECED4]/20',
          text: 'text-[#0E7490] dark:text-[#7ECED4]',
        };
      case 'pink':
        return {
          stroke: '#D780D6',
          bg: 'bg-[#FCE7F3] dark:bg-[#D780D6]/20',
          text: 'text-[#BE185D] dark:text-[#D780D6]',
        };
      default:
        return {
          stroke: '#8D6CE6',
          bg: 'bg-[#F3E8FF] dark:bg-[#8D6CE6]/20',
          text: 'text-[#8D6CE6]',
        };
    }
  };

  const getIcon = (name: string) => {
    switch (name) {
      case 'car':
        return <Car className="w-3.5 h-3.5" />;
      case 'plane':
        return <Plane className="w-3.5 h-3.5" />;
      case 'shield':
        return <Shield className="w-3.5 h-3.5" />;
      default:
        return <Target className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="bg-white dark:bg-[#161D2D] rounded-[12px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-[#E0E0E0]/60 dark:border-[#28354D] flex flex-col justify-between transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-semibold text-black dark:text-white">
          Financial goals
        </h3>
        {onOpenAddGoal && (
          <button
            onClick={onOpenAddGoal}
            className="w-7 h-7 rounded-full bg-[#F5F5F5] dark:bg-[#20293D] hover:bg-[#E8E8E8] dark:hover:bg-[#2A364F] text-[#333333] dark:text-gray-200 flex items-center justify-center transition-all cursor-pointer"
            title="Add Financial Goal"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Goal Items List */}
      <div className="space-y-4">
        {goals.map(goal => {
          const colorStyles = getCategoryColor(goal.categoryColor);
          const radius = 18;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - (goal.percentage / 100) * circumference;

          return (
            <div
              key={goal.id}
              onClick={() => onSelectGoal?.(goal)}
              className="p-3.5 rounded-[10px] bg-[#FAFAFA] dark:bg-[#1A2234] hover:bg-[#F3E8FF]/40 dark:hover:bg-[#202B40] border border-[#E0E0E0]/70 dark:border-[#28354D] transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                {/* Circular Percentage Progress Icon */}
                <div className="relative w-11 h-11 shrink-0 flex items-center justify-center">
                  <svg className="w-11 h-11 -rotate-90">
                    <circle
                      cx="22"
                      cy="22"
                      r={radius}
                      className="stroke-[#E0E0E0] dark:stroke-[#2E3C57]"
                      strokeWidth="3.5"
                      fill="transparent"
                    />
                    <circle
                      cx="22"
                      cy="22"
                      r={radius}
                      stroke={colorStyles.stroke}
                      strokeWidth="3.5"
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className={`absolute inset-1.5 rounded-full ${colorStyles.bg} flex items-center justify-center ${colorStyles.text}`}>
                    <span className="text-[10px] font-bold">{goal.percentage}%</span>
                  </div>
                </div>

                {/* Goal Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[13px] font-bold text-black dark:text-white truncate group-hover:text-[#8D6CE6] transition-colors">
                      {goal.name}
                    </h4>
                  </div>
                  <div className="text-[11px] text-[#888888] dark:text-gray-400">
                    Deadline: {goal.deadline}
                  </div>
                </div>
              </div>

              {/* Saved vs Goal Row */}
              <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#EAEAEA] dark:border-[#28354D] text-[12px]">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  Saved up ${goal.saved.toLocaleString()}
                </span>
                <span className="text-[#888888] dark:text-gray-400 font-medium">
                  Goal ${goal.goal.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
