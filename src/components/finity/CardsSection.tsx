import React, { useState } from 'react';
import { Plus, Wifi, Check, Eye, EyeOff } from 'lucide-react';
import { FinityCard } from '../../types/finity';

interface CardsSectionProps {
  cards: FinityCard[];
  onOpenAddCard: () => void;
  onToggleFreezeCard?: (cardId: string) => void;
}

export const CardsSection: React.FC<CardsSectionProps> = ({
  cards,
  onOpenAddCard,
}) => {
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [showFullNumber, setShowFullNumber] = useState(false);

  const activeCard = cards[activeCardIndex] || cards[0];

  const formatCardNumber = (num: string, visible: boolean) => {
    if (visible) return num;
    const parts = num.split(' ');
    if (parts.length === 4) {
      return `•••• •••• •••• ${parts[3]}`;
    }
    return num;
  };

  return (
    <div className="bg-white dark:bg-[#161D2D] rounded-[12px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-[#E0E0E0]/60 dark:border-[#28354D] flex flex-col justify-between transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-[14px] font-semibold text-black dark:text-white">
            Your Cards
          </h3>
          <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-[#8D6CE6] text-white tracking-wider">
            {activeCard?.tier || 'PREMIUM'}
          </span>
        </div>

        {/* Add Card Button */}
        <button
          type="button"
          onClick={onOpenAddCard}
          className="w-8 h-8 rounded-full bg-[#8D6CE6] hover:bg-[#7C5AC2] text-white flex items-center justify-center shadow-sm hover:scale-105 transition-all cursor-pointer"
          title="Add New Card"
          aria-label="Add Card"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Credit Card Display */}
      <div className="relative w-full aspect-[1.75/1] rounded-[16px] bg-gradient-to-tr from-[#0B1528] via-[#15233E] to-[#1E3358] text-white p-5 shadow-[0_8px_24px_rgba(11,21,40,0.4)] overflow-hidden flex flex-col justify-between border border-white/10 group">
        {/* Subtle holographic glare effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

        {/* Top Card Row: Chip & Contactless */}
        <div className="flex items-center justify-between z-10">
          {/* EMV Metallic Chip */}
          <div className="w-10 h-7 rounded-[5px] bg-gradient-to-tr from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] p-0.5 shadow-sm flex items-center justify-center">
            <div className="w-full h-full border border-black/20 rounded-[4px] grid grid-cols-2 gap-0.5 opacity-80">
              <div className="border-r border-b border-black/30" />
              <div className="border-b border-black/30" />
              <div className="border-r border-black/30" />
              <div />
            </div>
          </div>

          {/* Contactless / NFC Icon */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFullNumber(prev => !prev)}
              className="text-white/70 hover:text-white transition-colors cursor-pointer p-1"
              title={showFullNumber ? 'Mask card number' : 'Show full card number'}
            >
              {showFullNumber ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <Wifi className="w-5 h-5 text-white/80 rotate-90" />
          </div>
        </div>

        {/* Middle: Card Number (Monospace) */}
        <div className="z-10 my-auto pt-2">
          <div className="font-mono text-[16px] sm:text-[17px] font-bold tracking-[0.15em] text-white text-shadow-sm drop-shadow">
            {formatCardNumber(activeCard?.cardNumber || '1253 5432 3521 3090', showFullNumber)}
          </div>
        </div>

        {/* Bottom Card Row: Cardholder, Expiry & Card Brand */}
        <div className="flex items-end justify-between z-10 text-white">
          <div>
            <div className="text-[9px] uppercase tracking-wider text-white/60 font-semibold leading-none">
              Cardholder
            </div>
            <div className="text-[12px] font-medium text-white tracking-wide mt-0.5">
              {activeCard?.cardHolder || 'Sesyla Micropeld'}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[9px] uppercase tracking-wider text-white/60 font-semibold leading-none">
              Expires
            </div>
            <div className="text-[12px] font-mono font-medium text-white tracking-wider mt-0.5">
              {activeCard?.expiry || '08/29'}
            </div>
          </div>

          {/* Visa / MasterCard Brand Logo */}
          <div className="flex items-center">
            {activeCard?.type === 'MasterCard' ? (
              <div className="flex items-center -space-x-2">
                <div className="w-6 h-6 rounded-full bg-[#EB001B] opacity-90" />
                <div className="w-6 h-6 rounded-full bg-[#F79E1B] opacity-90" />
              </div>
            ) : (
              <span className="text-[15px] font-extrabold italic tracking-tighter text-white drop-shadow">
                VISA
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Switcher Pagination Dots */}
      {cards.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {cards.map((card, idx) => (
            <button
              key={card.id}
              onClick={() => setActiveCardIndex(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                activeCardIndex === idx
                  ? 'w-6 bg-[#8D6CE6]'
                  : 'w-1.5 bg-[#E0E0E0] dark:bg-[#28354D]'
              }`}
              title={`Card ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
