import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { MoreHorizontal } from 'lucide-react';
import { FinityExpenseCategory } from '../../types/finity';

interface ExpensesDonutChartProps {
  expenses?: FinityExpenseCategory[];
  totalExpenses?: number;
}

export const ExpensesDonutChart: React.FC<ExpensesDonutChartProps> = ({
  expenses = [
    { name: 'Shopping', amount: 180.00, color: '#8D6CE6', percentage: 56 },
    { name: 'Workspace', amount: 140.90, color: '#7ECED4', percentage: 44 },
  ],
  totalExpenses = 320.90,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const colors = ['#8D6CE6', '#7ECED4', '#D780D6'];

  return (
    <div className="bg-white dark:bg-[#161D2D] rounded-[12px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-[#E0E0E0]/60 dark:border-[#28354D] flex flex-col justify-between transition-all duration-200">
      {/* Header with Title and Three Dots Menu */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[14px] font-semibold text-black dark:text-white">
          All Expenses
        </h3>
        <button
          className="w-7 h-7 rounded-lg text-[#888888] hover:text-black dark:hover:text-white hover:bg-[#F5F5F5] dark:hover:bg-[#20293D] flex items-center justify-center transition-colors cursor-pointer"
          title="More options"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Donut Chart Container */}
      <div className="relative w-full h-[190px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as FinityExpenseCategory;
                  return (
                    <div className="bg-white dark:bg-[#1A2234] border border-[#E0E0E0] dark:border-[#2E3C57] px-3 py-1.5 rounded-lg shadow-lg text-xs">
                      <span className="font-semibold text-black dark:text-white">{data.name}: </span>
                      <span className="font-bold text-[#8D6CE6]">${data.amount.toFixed(2)}</span>
                      <span className="text-[#888888] ml-1">({data.percentage}%)</span>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={expenses}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={78}
              paddingAngle={4}
              dataKey="amount"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              animationDuration={700}
            >
              {expenses.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || colors[index % colors.length]}
                  stroke="none"
                  className="transition-all duration-200 cursor-pointer"
                  style={{
                    filter: activeIndex === index ? 'brightness(1.1) drop-shadow(0 4px 8px rgba(141,108,230,0.3))' : 'none',
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Total Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] uppercase tracking-wider text-[#888888] dark:text-gray-400 font-semibold">
            Total
          </span>
          <span className="text-[16px] font-bold text-black dark:text-white mt-0.5">
            ${totalExpenses.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Legend Below */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#F0F0F0] dark:border-[#28354D]">
        {expenses.map((exp, idx) => (
          <div key={exp.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 truncate">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: exp.color || colors[idx % colors.length] }}
              />
              <span className="text-[#333333] dark:text-gray-300 font-medium truncate">
                {exp.name}
              </span>
            </div>
            <span className="font-bold text-black dark:text-white ml-2">
              ${exp.amount.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
