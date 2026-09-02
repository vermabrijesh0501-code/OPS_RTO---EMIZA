import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { ChevronDown, TrendingUp } from 'lucide-react';
import { chartYearlyData, chartSixMonthData, chartMonthData } from '../../data/finityData';

interface TransactionsChartProps {
  isDarkMode?: boolean;
}

export const TransactionsChart: React.FC<TransactionsChartProps> = ({ isDarkMode = false }) => {
  const [timeRange, setTimeRange] = useState<'This Year' | 'Last 6 Months' | 'This Month'>('This Year');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const data =
    timeRange === 'This Year'
      ? chartYearlyData
      : timeRange === 'Last 6 Months'
      ? chartSixMonthData
      : chartMonthData;

  const totalEarning = data.reduce((acc, curr) => acc + curr.earning, 0);
  const totalSpending = data.reduce((acc, curr) => acc + curr.spending, 0);

  return (
    <div className="bg-white dark:bg-[#161D2D] rounded-[12px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-[#E0E0E0]/60 dark:border-[#28354D] flex flex-col justify-between transition-all duration-200">
      {/* Header with Title, Legend & Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-semibold text-black dark:text-white">
              Transactions Overview
            </h3>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-full border border-purple-200/60 dark:border-purple-800/40">
              <TrendingUp className="w-3 h-3 text-[#8D6CE6]" /> +14.8% growth
            </span>
          </div>
          <p className="text-[12px] text-[#888888] dark:text-gray-400 mt-0.5">
            Compare monthly earnings versus operational expenditures
          </p>
        </div>

        {/* Legend & Filter Dropdown */}
        <div className="flex items-center gap-4">
          {/* Legend */}
          <div className="flex items-center gap-3 text-[12px] font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8D6CE6]" />
              <span className="text-[#333333] dark:text-gray-300">Earning</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7ECED4]" />
              <span className="text-[#333333] dark:text-gray-300">Spending</span>
            </div>
          </div>

          {/* Time Range Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(prev => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-[8px] bg-[#F5F5F5] dark:bg-[#20293D] hover:bg-[#E8E8E8] dark:hover:bg-[#2A364F] text-[#333333] dark:text-gray-200 border border-[#E0E0E0] dark:border-[#2E3C57] transition-all cursor-pointer"
            >
              <span>{timeRange}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#888888]" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-36 bg-white dark:bg-[#1A2234] border border-[#E0E0E0] dark:border-[#2E3C57] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] py-1 z-30 animate-in fade-in duration-150">
                {(['This Year', 'Last 6 Months', 'This Month'] as const).map(option => (
                  <button
                    key={option}
                    onClick={() => {
                      setTimeRange(option);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                      timeRange === option
                        ? 'bg-[#F3E8FF] dark:bg-[#8D6CE6]/20 text-[#8D6CE6] font-semibold'
                        : 'text-[#333333] dark:text-gray-300 hover:bg-[#F5F5F5] dark:hover:bg-[#20293D]'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="w-full h-[230px] sm:h-[250px] mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorEarning" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8D6CE6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#8D6CE6" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7ECED4" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#7ECED4" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDarkMode ? '#232E42' : '#F0F0F0'}
              vertical={false}
            />

            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: isDarkMode ? '#94A3B8' : '#888888' }}
              dy={8}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: isDarkMode ? '#94A3B8' : '#888888' }}
              tickFormatter={value => `${value / 1000}k`}
              domain={[0, 35000]}
              ticks={[0, 5000, 10000, 20000, 30000]}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white dark:bg-[#161D2D] border border-[#E0E0E0] dark:border-[#28354D] p-3 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.15)] text-xs">
                      <div className="font-bold text-black dark:text-white mb-1.5 pb-1 border-b border-[#F0F0F0] dark:border-[#28354D]">
                        {label} Overview
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-4 text-[#8D6CE6] font-semibold">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-[#8D6CE6]" /> Earning:
                          </span>
                          <span>${payload[0]?.value?.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-[#0EA5E9] dark:text-[#7ECED4] font-semibold">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-[#7ECED4]" /> Spending:
                          </span>
                          <span>${payload[1]?.value?.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Area
              type="monotone"
              dataKey="earning"
              stroke="#8D6CE6"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorEarning)"
              dot={{ r: 3, fill: '#8D6CE6', strokeWidth: 1, stroke: '#FFFFFF' }}
              activeDot={{ r: 6, fill: '#8D6CE6', strokeWidth: 2, stroke: '#FFFFFF' }}
            />

            <Area
              type="monotone"
              dataKey="spending"
              stroke="#7ECED4"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorSpending)"
              dot={{ r: 3, fill: '#7ECED4', strokeWidth: 1, stroke: '#FFFFFF' }}
              activeDot={{ r: 6, fill: '#7ECED4', strokeWidth: 2, stroke: '#FFFFFF' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Mini Summary Bottom Bar */}
      <div className="flex items-center justify-between pt-3 mt-1 border-t border-[#F0F0F0] dark:border-[#28354D] text-[12px]">
        <div className="text-[#666666] dark:text-gray-400">
          Period Earnings:{' '}
          <strong className="text-black dark:text-white font-bold">
            ${totalEarning.toLocaleString()}
          </strong>
        </div>
        <div className="text-[#666666] dark:text-gray-400">
          Period Expenses:{' '}
          <strong className="text-black dark:text-white font-bold">
            ${totalSpending.toLocaleString()}
          </strong>
        </div>
      </div>
    </div>
  );
};
