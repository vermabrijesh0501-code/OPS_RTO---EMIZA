import React, { useState } from 'react';
import { Plus, CreditCard, Lock, Unlock, Eye, EyeOff, ShieldCheck, KeyRound, Sparkles } from 'lucide-react';
import { FinityCard } from '../../types/finity';

interface CardsTabProps {
  cards: FinityCard[];
  onOpenAddCard: () => void;
  onToggleFreeze: (cardId: string) => void;
}

export const CardsTab: React.FC<CardsTabProps> = ({ cards, onOpenAddCard, onToggleFreeze }) => {
  const [revealedCardId, setRevealedCardId] = useState<string | null>(null);

  const toggleReveal = (id: string) => {
    setRevealedCardId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#161D2D] rounded-[12px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-[#E0E0E0]/60 dark:border-[#28354D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-black dark:text-white">Cards Management</h2>
          <p className="text-xs text-[#666666] dark:text-gray-400 mt-1">
            Manage your physical and virtual corporate debit cards, freeze on demand, and adjust PINs.
          </p>
        </div>

        <button
          onClick={onOpenAddCard}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-[8px] bg-[#8D6CE6] hover:bg-[#7C5AC2] text-white shadow-sm transition-all cursor-pointer active:scale-98"
        >
          <Plus className="w-4 h-4" /> Issue / Link New Card
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {cards.map(card => {
          const isRevealed = revealedCardId === card.id;

          return (
            <div
              key={card.id}
              className="bg-white dark:bg-[#161D2D] rounded-[12px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-[#E0E0E0]/60 dark:border-[#28354D] flex flex-col justify-between space-y-5"
            >
              {/* Card visual render */}
              <div
                className={`relative w-full aspect-[1.75/1] rounded-[16px] bg-gradient-to-tr ${card.gradient} text-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col justify-between border border-white/10 ${
                  card.isFrozen ? 'opacity-60 grayscale' : ''
                }`}
              >
                {card.isFrozen && (
                  <div className="absolute inset-0 z-20 bg-black/50 backdrop-blur-xs flex items-center justify-center gap-2 text-white font-bold text-sm">
                    <Lock className="w-5 h-5 text-rose-400" /> CARD IS CURRENTLY FROZEN
                  </div>
                )}

                <div className="flex items-center justify-between z-10">
                  <div className="w-10 h-7 rounded-[5px] bg-gradient-to-tr from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] p-0.5 shadow-sm flex items-center justify-center">
                    <div className="w-full h-full border border-black/20 rounded-[4px] opacity-80" />
                  </div>
                  <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-white/20 backdrop-blur-md text-white tracking-wider">
                    {card.tier}
                  </span>
                </div>

                <div className="z-10 my-auto">
                  <div className="font-mono text-[16px] sm:text-[18px] font-bold tracking-[0.15em] text-white drop-shadow">
                    {isRevealed ? card.cardNumber : `•••• •••• •••• ${card.cardNumber.slice(-4)}`}
                  </div>
                </div>

                <div className="flex items-end justify-between z-10 text-white">
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-white/60 font-semibold leading-none">
                      Cardholder
                    </div>
                    <div className="text-[12px] font-medium text-white tracking-wide mt-0.5">
                      {card.cardHolder}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[9px] uppercase tracking-wider text-white/60 font-semibold leading-none">
                      Expires / CVV
                    </div>
                    <div className="text-[12px] font-mono font-medium text-white tracking-wider mt-0.5">
                      {card.expiry} • {isRevealed ? card.cvv : '•••'}
                    </div>
                  </div>

                  <span className="text-[14px] font-extrabold italic text-white">
                    {card.type}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => toggleReveal(card.id)}
                  className="py-2 px-3 rounded-lg bg-[#F5F5F5] dark:bg-[#20293D] hover:bg-[#E8E8E8] dark:hover:bg-[#2A364F] text-[#333333] dark:text-gray-200 text-xs font-semibold border border-[#E0E0E0] dark:border-[#2E3C57] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {isRevealed ? 'Hide Details' : 'View Numbers'}
                </button>

                <button
                  type="button"
                  onClick={() => onToggleFreeze(card.id)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer border transition-colors ${
                    card.isFrozen
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800'
                  }`}
                >
                  {card.isFrozen ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  {card.isFrozen ? 'Unfreeze Card' : 'Freeze Card'}
                </button>

                <button
                  type="button"
                  className="py-2 px-3 rounded-lg bg-[#F5F5F5] dark:bg-[#20293D] hover:bg-[#E8E8E8] dark:hover:bg-[#2A364F] text-[#333333] dark:text-gray-200 text-xs font-semibold border border-[#E0E0E0] dark:border-[#2E3C57] flex items-center justify-center gap-1.5 cursor-pointer col-span-2 sm:col-span-1"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#8D6CE6]" /> Change PIN
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
