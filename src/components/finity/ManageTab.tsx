import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Bell,
  Lock,
  Zap,
  TrendingUp,
  CreditCard,
  Layers,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface ManageTabProps {
  dailyLimit: number;
  onUpdateDailyLimit: (newLimit: number) => void;
}

export const ManageTab: React.FC<ManageTabProps> = ({ dailyLimit, onUpdateDailyLimit }) => {
  const [limitInput, setLimitInput] = useState(dailyLimit.toString());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [autoSaveRoundups, setAutoSaveRoundups] = useState(true);
  const [largeTxAlerts, setLargeTxAlerts] = useState(true);
  const [internationalPurchases, setInternationalPurchases] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(limitInput);
    if (!isNaN(val) && val > 0) {
      onUpdateDailyLimit(val);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#161D2D] rounded-[12px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-[#E0E0E0]/60 dark:border-[#28354D]">
        <h2 className="text-xl font-bold text-black dark:text-white">Manage Limits & Rules</h2>
        <p className="text-xs text-[#666666] dark:text-gray-400 mt-1">
          Configure real-time security ceilings, automated savings triggers, and transaction monitoring policies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Limits Control */}
        <div className="bg-white dark:bg-[#161D2D] rounded-[12px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-[#E0E0E0]/60 dark:border-[#28354D] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#F3E8FF] dark:bg-[#8D6CE6]/20 text-[#8D6CE6] flex items-center justify-center">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <h3 className="text-[15px] font-bold text-black dark:text-white">Daily Spending Ceiling</h3>
            </div>
            <p className="text-xs text-[#666666] dark:text-gray-400 mb-5">
              Set maximum daily transaction volume across all virtual & physical cards combined.
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#333333] dark:text-gray-300 block mb-1">
                  Daily Limit ($ USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-[#888888]">$</span>
                  <input
                    type="number"
                    min="500"
                    step="500"
                    value={limitInput}
                    onChange={e => setLimitInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm font-bold font-mono bg-[#F5F5F5] dark:bg-[#20293D] border border-[#E0E0E0] dark:border-[#2A364F] rounded-lg text-black dark:text-white focus:border-[#8D6CE6] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                {['5000', '10000', '12000', '25000'].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setLimitInput(amt)}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-[#F5F5F5] dark:bg-[#20293D] hover:bg-[#E8E8E8] text-[#333333] dark:text-gray-300 border border-[#E0E0E0] dark:border-[#2A364F]"
                  >
                    ${parseInt(amt).toLocaleString()}
                  </button>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-between">
                {savedSuccess && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Limit updated!
                  </span>
                )}
                <button
                  type="submit"
                  className="ml-auto px-5 py-2 rounded-[8px] bg-[#8D6CE6] hover:bg-[#7C5AC2] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-98"
                >
                  Save Limit Changes
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Security & Automation Switches */}
        <div className="bg-white dark:bg-[#161D2D] rounded-[12px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-[#E0E0E0]/60 dark:border-[#28354D] space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#F3E8FF] dark:bg-[#8D6CE6]/20 text-[#8D6CE6] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-[15px] font-bold text-black dark:text-white">Smart Automations</h3>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-lg bg-[#FAFAFA] dark:bg-[#1A2234] border border-[#E0E0E0] dark:border-[#28354D] flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-black dark:text-white">Auto-Save Roundups</div>
                <div className="text-[11px] text-[#888888]">Round up purchases to the nearest dollar into Emergency Reserve</div>
              </div>
              <input
                type="checkbox"
                checked={autoSaveRoundups}
                onChange={e => setAutoSaveRoundups(e.target.checked)}
                className="w-4 h-4 accent-[#8D6CE6] cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-lg bg-[#FAFAFA] dark:bg-[#1A2234] border border-[#E0E0E0] dark:border-[#28354D] flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-black dark:text-white">High Value Instant Push Alerts</div>
                <div className="text-[11px] text-[#888888]">Instant SMS + Push for transactions exceeding $1,000</div>
              </div>
              <input
                type="checkbox"
                checked={largeTxAlerts}
                onChange={e => setLargeTxAlerts(e.target.checked)}
                className="w-4 h-4 accent-[#8D6CE6] cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-lg bg-[#FAFAFA] dark:bg-[#1A2234] border border-[#E0E0E0] dark:border-[#28354D] flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-black dark:text-white">International POS & Online Payments</div>
                <div className="text-[11px] text-[#888888]">Enable zero-FX markup foreign currency settlements</div>
              </div>
              <input
                type="checkbox"
                checked={internationalPurchases}
                onChange={e => setInternationalPurchases(e.target.checked)}
                className="w-4 h-4 accent-[#8D6CE6] cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
