import React, { useState } from 'react';
import { FinityHeader, FinityTab } from './FinityHeader';
import { TotalBalanceCard } from './TotalBalanceCard';
import { TransactionsChart } from './TransactionsChart';
import { CardsSection } from './CardsSection';
import { DailyLimitCard } from './DailyLimitCard';
import { FinancialGoalsCard } from './FinancialGoalsCard';
import { ExpensesDonutChart } from './ExpensesDonutChart';
import { RecentTransactions } from './RecentTransactions';
import { TransferModal } from './TransferModal';
import { DepositModal } from './DepositModal';
import { AddCardModal } from './AddCardModal';
import { ActivityTab } from './ActivityTab';
import { ManageTab } from './ManageTab';
import { CardsTab } from './CardsTab';
import { AccountTab } from './AccountTab';
import {
  initialTransactions,
  initialGoals,
  initialCards,
  initialExpenses,
} from '../../data/finityData';
import { FinityTransaction, FinityCard, FinityGoal } from '../../types/finity';
import { useTheme } from '../../context/ThemeContext';

export const FinityDashboard: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';

  const [activeTab, setActiveTab] = useState<FinityTab>('Overview');

  // Balances
  const [mainBalance, setMainBalance] = useState(73300);
  const [creditBalance, setCreditBalance] = useState(5000);
  const totalBalance = mainBalance + creditBalance;

  // Transactions & Cards State
  const [transactions, setTransactions] = useState<FinityTransaction[]>(initialTransactions);
  const [goals, setGoals] = useState<FinityGoal[]>(initialGoals);
  const [cards, setCards] = useState<FinityCard[]>(initialCards);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [dailySpent, setDailySpent] = useState(10000);
  const [dailyLimit, setDailyLimit] = useState(12000);

  // Modals state
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);

  // Handlers
  const handleTransferSuccess = (newTx: FinityTransaction) => {
    setTransactions(prev => [newTx, ...prev]);
    setMainBalance(prev => Math.max(0, prev - newTx.amount));
    setDailySpent(prev => prev + newTx.amount);
  };

  const handleDepositSuccess = (amount: number, newTx: FinityTransaction) => {
    setTransactions(prev => [newTx, ...prev]);
    setMainBalance(prev => prev + amount);
  };

  const handleAddCard = (newCard: FinityCard) => {
    setCards(prev => [newCard, ...prev]);
  };

  const handleToggleFreezeCard = (cardId: string) => {
    setCards(prev =>
      prev.map(c => (c.id === cardId ? { ...c, isFrozen: !c.isFrozen } : c))
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#0E131F] text-black dark:text-white transition-colors duration-200 flex flex-col font-sans">
      {/* Finity Navigation Header */}
      <FinityHeader
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {activeTab === 'Overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Row: Total Balance + Transactions Overview + Your Cards */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
              {/* Left Column: Total Balance (~280px) */}
              <div className="md:col-span-12 lg:col-span-4 xl:col-span-3 flex flex-col">
                <TotalBalanceCard
                  totalBalance={totalBalance}
                  mainBalance={mainBalance}
                  creditBalance={creditBalance}
                  trendPercentage={3.2}
                  onOpenDeposit={() => setIsDepositOpen(true)}
                  onOpenTransfer={() => setIsTransferOpen(true)}
                />
              </div>

              {/* Middle Column: Transactions Overview (~500px) */}
              <div className="md:col-span-12 lg:col-span-8 xl:col-span-6 flex flex-col">
                <TransactionsChart isDarkMode={isDarkMode} />
              </div>

              {/* Right Column: Your Cards (~320px) */}
              <div className="md:col-span-12 lg:col-span-12 xl:col-span-3 flex flex-col">
                <CardsSection
                  cards={cards}
                  onOpenAddCard={() => setIsAddCardOpen(true)}
                />
              </div>
            </div>

            {/* Bottom Row: Daily Limit + Goals + Expenses + Recent Transactions */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
              {/* Left 1: Daily Limit Card & Financial Goals Card */}
              <div className="md:col-span-6 xl:col-span-3 space-y-6 flex flex-col">
                <DailyLimitCard
                  spent={dailySpent}
                  limit={dailyLimit}
                  onOpenManageLimit={() => setActiveTab('Manage')}
                />
                <div className="flex-1">
                  <FinancialGoalsCard
                    goals={goals}
                    onOpenAddGoal={() => setActiveTab('Manage')}
                  />
                </div>
              </div>

              {/* Middle: All Expenses Donut Chart */}
              <div className="md:col-span-6 xl:col-span-4 flex flex-col">
                <ExpensesDonutChart
                  expenses={expenses}
                  totalExpenses={expenses.reduce((acc, curr) => acc + curr.amount, 0)}
                />
              </div>

              {/* Right: Recent Transactions List */}
              <div className="md:col-span-12 xl:col-span-5 flex flex-col">
                <RecentTransactions
                  transactions={transactions}
                  onViewAll={() => setActiveTab('Activity')}
                  onSelectTransaction={() => setActiveTab('Activity')}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Activity History */}
        {activeTab === 'Activity' && (
          <div className="animate-in fade-in duration-200">
            <ActivityTab
              transactions={transactions}
              onOpenTransfer={() => setIsTransferOpen(true)}
            />
          </div>
        )}

        {/* Tab 3: Manage Limits & Automation */}
        {activeTab === 'Manage' && (
          <div className="animate-in fade-in duration-200">
            <ManageTab
              dailyLimit={dailyLimit}
              onUpdateDailyLimit={setDailyLimit}
            />
          </div>
        )}

        {/* Tab 4: Cards Management */}
        {activeTab === 'Card' && (
          <div className="animate-in fade-in duration-200">
            <CardsTab
              cards={cards}
              onOpenAddCard={() => setIsAddCardOpen(true)}
              onToggleFreeze={handleToggleFreezeCard}
            />
          </div>
        )}

        {/* Tab 5: Account & Profile */}
        {activeTab === 'Account' && (
          <div className="animate-in fade-in duration-200">
            <AccountTab />
          </div>
        )}
      </main>

      {/* Modals */}
      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        cards={cards}
        currentBalance={mainBalance}
        onTransferSuccess={handleTransferSuccess}
      />

      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onDepositSuccess={handleDepositSuccess}
      />

      <AddCardModal
        isOpen={isAddCardOpen}
        onClose={() => setIsAddCardOpen(false)}
        onAddCard={handleAddCard}
      />
    </div>
  );
};
