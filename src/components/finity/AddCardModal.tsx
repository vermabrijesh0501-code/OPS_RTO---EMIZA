import React, { useState } from 'react';
import { X, CreditCard, Shield, Sparkles } from 'lucide-react';
import { FinityCard } from '../../types/finity';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCard: (card: FinityCard) => void;
}

export const AddCardModal: React.FC<AddCardModalProps> = ({ isOpen, onClose, onAddCard }) => {
  const [cardHolder, setCardHolder] = useState('Sesyla Micropeld');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [tier, setTier] = useState<'PREMIUM' | 'GOLD' | 'BLACK'>('PREMIUM');
  const [type, setType] = useState<'Visa' | 'MasterCard'>('Visa');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedNum = cardNumber || '4000 1234 5678 9010';

    const gradients: Record<string, string> = {
      PREMIUM: 'from-[#0B1528] via-[#15233E] to-[#1E3358]',
      GOLD: 'from-[#4D3A16] via-[#795B22] to-[#B88B35]',
      BLACK: 'from-[#111111] via-[#1E1E1E] to-[#2B2B2B]',
    };

    const newCard: FinityCard = {
      id: `card-${Date.now()}`,
      cardNumber: formattedNum,
      cardHolder: cardHolder || 'Sesyla Micropeld',
      expiry: expiry || '12/29',
      cvv: cvv || '888',
      type: type,
      tier: tier,
      gradient: gradients[tier],
      balance: 10000.0,
      isFrozen: false,
      contactless: true,
    };

    onAddCard(newCard);
    onClose();
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

        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-[#F3E8FF] dark:bg-[#8D6CE6]/20 text-[#8D6CE6] flex items-center justify-center">
            <CreditCard className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-bold text-black dark:text-white">Issue / Link New Card</h3>
        </div>
        <p className="text-xs text-[#666666] dark:text-gray-400 mb-5">
          Generate an instant virtual card or link an existing corporate payment card.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-[#333333] dark:text-gray-300 block mb-1">
              Cardholder Name
            </label>
            <input
              type="text"
              required
              value={cardHolder}
              onChange={e => setCardHolder(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#F5F5F5] dark:bg-[#20293D] border border-[#E0E0E0] dark:border-[#2A364F] rounded-lg text-black dark:text-white focus:border-[#8D6CE6] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#333333] dark:text-gray-300 block mb-1">
              Card Number (16 Digits)
            </label>
            <input
              type="text"
              required
              maxLength={19}
              placeholder="4532 8921 7361 2940"
              value={cardNumber}
              onChange={e => setCardNumber(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-[#F5F5F5] dark:bg-[#20293D] border border-[#E0E0E0] dark:border-[#2A364F] rounded-lg text-black dark:text-white focus:border-[#8D6CE6] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#333333] dark:text-gray-300 block mb-1">
                Expiry Date
              </label>
              <input
                type="text"
                placeholder="MM/YY"
                maxLength={5}
                required
                value={expiry}
                onChange={e => setExpiry(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-[#F5F5F5] dark:bg-[#20293D] border border-[#E0E0E0] dark:border-[#2A364F] rounded-lg text-black dark:text-white focus:border-[#8D6CE6] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#333333] dark:text-gray-300 block mb-1">
                CVV / CVC
              </label>
              <input
                type="password"
                placeholder="•••"
                maxLength={4}
                required
                value={cvv}
                onChange={e => setCvv(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-[#F5F5F5] dark:bg-[#20293D] border border-[#E0E0E0] dark:border-[#2A364F] rounded-lg text-black dark:text-white focus:border-[#8D6CE6] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#333333] dark:text-gray-300 block mb-1">
                Card Tier
              </label>
              <select
                value={tier}
                onChange={e => setTier(e.target.value as any)}
                className="w-full px-2.5 py-2 text-xs bg-[#F5F5F5] dark:bg-[#20293D] border border-[#E0E0E0] dark:border-[#2A364F] rounded-lg text-black dark:text-white focus:border-[#8D6CE6] focus:outline-none"
              >
                <option value="PREMIUM">PREMIUM (Navy)</option>
                <option value="GOLD">GOLD (Exclusive)</option>
                <option value="BLACK">BLACK (Centurion)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#333333] dark:text-gray-300 block mb-1">
                Network
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full px-2.5 py-2 text-xs bg-[#F5F5F5] dark:bg-[#20293D] border border-[#E0E0E0] dark:border-[#2A364F] rounded-lg text-black dark:text-white focus:border-[#8D6CE6] focus:outline-none"
              >
                <option value="Visa">Visa Signature</option>
                <option value="MasterCard">MasterCard World</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[8px] bg-[#F5F5F5] dark:bg-[#20293D] text-[#333333] dark:text-gray-200 text-xs font-semibold hover:bg-[#E8E8E8] dark:hover:bg-[#2A364F] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-[8px] bg-[#8D6CE6] hover:bg-[#7C5AC2] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Sparkles className="w-3.5 h-3.5" /> Save & Activate Card
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
