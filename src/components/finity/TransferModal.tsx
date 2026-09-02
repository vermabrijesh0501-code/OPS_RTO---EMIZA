import React, { useState } from 'react';
import { X, Send, User, CreditCard, ArrowRight, CheckCircle2 } from 'lucide-react';
import { FinityCard, FinityTransaction } from '../../types/finity';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: FinityCard[];
  onTransferSuccess: (transaction: FinityTransaction) => void;
  currentBalance: number;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  cards,
  onTransferSuccess,
  currentBalance,
}) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCardId, setSelectedCardId] = useState(cards[0]?.id || '');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<FinityTransaction['category']>('Transfer');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const selectedCard = cards.find(c => c.id === selectedCardId) || cards[0];

    const newTx: FinityTransaction = {
      id: `tx-${Date.now()}`,
      company: recipient || 'External Transfer',
      category: category,
      amount: numAmount,
      type: 'debit',
      time: 'Just now',
      date: new Date().toISOString().slice(0, 10),
      iconType: 'default',
      status: 'Completed',
      recipient: recipient,
      cardUsed: `•••• ${selectedCard?.cardNumber.slice(-4) || '3090'}`,
    };

    setIsSuccess(true);
    setTimeout(() => {
      onTransferSuccess(newTx);
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  const quickRecipients = ['Alex Rivera', 'Emily Chen', 'Marcus Vance', 'Sarah Jenkins'];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#161D2D] border border-[#E0E0E0] dark:border-[#28354D] rounded-[16px] max-w-md w-full p-6 shadow-[0_16px_48px_rgba(0,0,0,0.2)] relative">
        {/* Close Button */}
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
            <h3 className="text-xl font-bold text-black dark:text-white">Transfer Successful!</h3>
            <p className="text-xs text-[#666666] dark:text-gray-400">
              ${parseFloat(amount).toFixed(2)} sent securely to {recipient}.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-[#F3E8FF] dark:bg-[#8D6CE6]/20 text-[#8D6CE6] flex items-center justify-center">
                <Send className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-black dark:text-white">Make a Transfer</h3>
            </div>
            <p className="text-xs text-[#666666] dark:text-gray-400 mb-5">
              Available balance: <strong className="text-black dark:text-white">${currentBalance.toLocaleString()}</strong>
            </p>

            {/* Quick Recipients */}
            <div className="mb-4">
              <label className="text-[11px] font-semibold text-[#888888] dark:text-gray-400 block mb-1.5">
                Quick Contacts
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {quickRecipients.map(name => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setRecipient(name)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#F5F5F5] dark:bg-[#20293D] hover:bg-[#F3E8FF] dark:hover:bg-[#8D6CE6]/30 text-[#333333] dark:text-gray-200 border border-[#E0E0E0] dark:border-[#2A364F] whitespace-nowrap transition-all cursor-pointer"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleTransfer} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#333333] dark:text-gray-300 block mb-1">
                  Recipient Name / Email / IBAN *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={recipient}
                    onChange={e => setRecipient(e.target.value)}
                    placeholder="e.g. Alex Rivera or user@bank.com"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#F5F5F5] dark:bg-[#20293D] border border-[#E0E0E0] dark:border-[#2A364F] rounded-lg text-black dark:text-white focus:border-[#8D6CE6] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#333333] dark:text-gray-300 block mb-1">
                    Amount ($ USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs font-bold font-mono bg-[#F5F5F5] dark:bg-[#20293D] border border-[#E0E0E0] dark:border-[#2A364F] rounded-lg text-black dark:text-white focus:border-[#8D6CE6] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#333333] dark:text-gray-300 block mb-1">
                    Funding Card
                  </label>
                  <select
                    value={selectedCardId}
                    onChange={e => setSelectedCardId(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs bg-[#F5F5F5] dark:bg-[#20293D] border border-[#E0E0E0] dark:border-[#2A364F] rounded-lg text-black dark:text-white focus:border-[#8D6CE6] focus:outline-none cursor-pointer"
                  >
                    {cards.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.tier} (•••• {c.cardNumber.slice(-4)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#333333] dark:text-gray-300 block mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full px-2.5 py-2 text-xs bg-[#F5F5F5] dark:bg-[#20293D] border border-[#E0E0E0] dark:border-[#2A364F] rounded-lg text-black dark:text-white focus:border-[#8D6CE6] focus:outline-none cursor-pointer"
                >
                  <option value="Transfer">Direct Transfer</option>
                  <option value="Shopping">Shopping & Retail</option>
                  <option value="Workspace">Workspace / Business</option>
                  <option value="Subscription">Subscription</option>
                  <option value="Utilities">Utilities & Bills</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#333333] dark:text-gray-300 block mb-1">
                  Note / Reference (Optional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="e.g. Project invoice settlement"
                  className="w-full px-3 py-2 text-xs bg-[#F5F5F5] dark:bg-[#20293D] border border-[#E0E0E0] dark:border-[#2A364F] rounded-lg text-black dark:text-white focus:border-[#8D6CE6] focus:outline-none"
                />
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
                  className="px-5 py-2 rounded-[8px] bg-[#8D6CE6] hover:bg-[#7C5AC2] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-98"
                >
                  Confirm Transfer <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
