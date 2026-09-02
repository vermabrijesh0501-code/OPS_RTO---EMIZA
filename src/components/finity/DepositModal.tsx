import React, { useState } from 'react';
import { X, Plus, Building2, Landmark, QrCode, CheckCircle2, Copy, Check } from 'lucide-react';
import { FinityTransaction } from '../../types/finity';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDepositSuccess: (amount: number, tx: FinityTransaction) => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  onDepositSuccess,
}) => {
  const [method, setMethod] = useState<'wire' | 'card' | 'crypto'>('wire');
  const [amount, setAmount] = useState('2500');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleInstantDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const newTx: FinityTransaction = {
      id: `tx-dep-${Date.now()}`,
      company: 'Instant Wire Deposit',
      category: 'Income',
      amount: numAmount,
      type: 'credit',
      time: 'Just now',
      date: new Date().toISOString().slice(0, 10),
      iconType: 'stripe',
      status: 'Completed',
      recipient: 'Main Wallet',
      cardUsed: 'Connected Checking Account',
    };

    setIsSuccess(true);
    setTimeout(() => {
      onDepositSuccess(numAmount, newTx);
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#161D2D] border border-[#E0E0E0] dark:border-[#28354D] rounded-[16px] max-w-md w-full p-6 shadow-[0_16px_48px_rgba(0,0,0,0.2)] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#888888] hover:text-black dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 animate-in zoom-in-50 duration-300" />
            </div>
            <h3 className="text-xl font-bold text-black dark:text-white">Deposit Credited!</h3>
            <p className="text-xs text-[#666666] dark:text-gray-400">
              +${parseFloat(amount).toLocaleString()} has been added to your Main balance.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-black dark:text-white">Deposit Funds</h3>
            </div>
            <p className="text-xs text-[#666666] dark:text-gray-400 mb-4">
              Add funds directly to your verified Finity balance with zero transaction fees.
            </p>

            {/* Method tabs */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { id: 'wire', label: 'ACH / Wire', icon: Landmark },
                { id: 'card', label: 'Debit Card', icon: Building2 },
                { id: 'crypto', label: 'USDC / Pay', icon: QrCode },
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMethod(item.id as any)}
                  className={`py-2 px-2 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    method === item.id
                      ? 'border-[#8D6CE6] bg-[#F3E8FF] dark:bg-[#8D6CE6]/20 text-[#8D6CE6]'
                      : 'border-[#E0E0E0] dark:border-[#28354D] bg-[#F5F5F5] dark:bg-[#20293D] text-[#666666] dark:text-gray-300'
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              ))}
            </div>

            {method === 'wire' && (
              <div className="bg-[#FAFAFA] dark:bg-[#1A2234] border border-[#E0E0E0] dark:border-[#28354D] rounded-xl p-3.5 mb-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#888888]">Routing (ABA):</span>
                  <div className="flex items-center gap-1 font-mono font-bold text-black dark:text-white">
                    021000021
                    <button
                      type="button"
                      onClick={() => copyToClipboard('021000021', 'aba')}
                      className="text-[#888888] hover:text-[#8D6CE6]"
                    >
                      {copiedField === 'aba' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#888888]">Account Number:</span>
                  <div className="flex items-center gap-1 font-mono font-bold text-black dark:text-white">
                    884920194821
                    <button
                      type="button"
                      onClick={() => copyToClipboard('884920194821', 'acc')}
                      className="text-[#888888] hover:text-[#8D6CE6]"
                    >
                      {copiedField === 'acc' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#888888]">Bank Name:</span>
                  <span className="font-semibold text-black dark:text-white">JPMorgan Chase N.A.</span>
                </div>
              </div>
            )}

            <form onSubmit={handleInstantDeposit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#333333] dark:text-gray-300 block mb-1">
                  Deposit Amount ($ USD)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="10"
                    step="1"
                    required
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm font-bold font-mono bg-[#F5F5F5] dark:bg-[#20293D] border border-[#E0E0E0] dark:border-[#2A364F] rounded-lg text-black dark:text-white focus:border-[#8D6CE6] focus:outline-none"
                  />
                  <div className="flex items-center gap-1">
                    {['500', '1000', '5000'].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAmount(val)}
                        className="px-2.5 py-2 text-xs font-semibold rounded-lg bg-[#F5F5F5] dark:bg-[#20293D] hover:bg-[#E8E8E8] text-[#333333] dark:text-gray-300 border border-[#E0E0E0] dark:border-[#2A364F]"
                      >
                        +${val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-[8px] bg-[#F5F5F5] dark:bg-[#20293D] text-[#333333] dark:text-gray-200 text-xs font-semibold hover:bg-[#E8E8E8] dark:hover:bg-[#2A364F] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-[8px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-98"
                >
                  Complete Instant Deposit
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
