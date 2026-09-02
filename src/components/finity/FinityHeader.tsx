import React, { useState } from 'react';
import {
  Bell,
  Search,
  Sun,
  Moon,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  User,
  LogOut,
  CreditCard,
  Settings,
  HelpCircle,
} from 'lucide-react';

export type FinityTab = 'Overview' | 'Activity' | 'Manage' | 'Card' | 'Account';

interface FinityHeaderProps {
  activeTab: FinityTab;
  onSelectTab: (tab: FinityTab) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  unreadCount?: number;
  onOpenNotifications?: () => void;
  onOpenSearch?: () => void;
}

export const FinityHeader: React.FC<FinityHeaderProps> = ({
  activeTab,
  onSelectTab,
  isDarkMode,
  onToggleDarkMode,
  unreadCount = 2,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const tabs: FinityTab[] = ['Overview', 'Activity', 'Manage', 'Card', 'Account'];

  return (
    <header className="sticky top-0 z-40 h-16 bg-white dark:bg-[#111726] border-b border-[#E0E0E0] dark:border-[#232D42] shadow-[0_4px_12px_rgba(0,0,0,0.04)] px-4 sm:px-8 flex items-center justify-between transition-colors duration-200">
      {/* Left: Brand Logo & Name */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onSelectTab('Overview')}
          className="flex items-center gap-2.5 focus:outline-none group text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#8D6CE6] to-[#7ECED4] p-0.5 shadow-sm group-hover:scale-105 transition-transform flex items-center justify-center">
            <div className="w-full h-full bg-white dark:bg-[#111726] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#8D6CE6]" />
            </div>
          </div>
          <div>
            <span className="text-xl font-bold text-black dark:text-white tracking-tight flex items-center gap-1.5 font-sans">
              Finity
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-[#F3E8FF] dark:bg-[#8D6CE6]/20 text-[#8D6CE6] dark:text-[#D780D6]">
                Pro
              </span>
            </span>
          </div>
        </button>
      </div>

      {/* Center Section: Navigation Tabs */}
      <nav className="hidden md:flex items-center gap-1 sm:gap-2 h-full">
        {tabs.map(tab => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => onSelectTab(tab)}
              className={`relative h-full px-3.5 sm:px-4 text-[13px] font-medium transition-colors flex items-center cursor-pointer ${
                isActive
                  ? 'text-[#8D6CE6] font-semibold'
                  : 'text-[#666666] dark:text-gray-400 hover:text-[#333333] dark:hover:text-gray-200'
              }`}
            >
              {tab}
              {isActive && (
                <span className="absolute bottom-0 left-2 right-2 h-[3px] bg-[#8D6CE6] rounded-t-full shadow-[0_-2px_6px_rgba(141,108,230,0.4)]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Right Section: Search, Notifications, Theme, User Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Quick Search */}
        <div className="relative hidden lg:block">
          <Search className="w-3.5 h-3.5 text-[#999999] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search payments, cards..."
            className="w-48 xl:w-56 h-9 pl-8 pr-3 text-[12px] bg-[#F5F5F5] dark:bg-[#1A2234] border border-[#E0E0E0] dark:border-[#2A364F] rounded-lg text-[#333333] dark:text-gray-200 placeholder-[#999999] focus:outline-none focus:border-[#8D6CE6] transition-all"
          />
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="w-9 h-9 rounded-lg border border-[#E0E0E0] dark:border-[#2A364F] bg-[#F5F5F5] dark:bg-[#1A2234] hover:bg-[#E8E8E8] dark:hover:bg-[#232D42] text-[#333333] dark:text-gray-200 flex items-center justify-center transition-colors cursor-pointer"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#8D6CE6]" />}
        </button>

        {/* Notifications */}
        <button
          className="relative w-9 h-9 rounded-lg border border-[#E0E0E0] dark:border-[#2A364F] bg-[#F5F5F5] dark:bg-[#1A2234] hover:bg-[#E8E8E8] dark:hover:bg-[#232D42] text-[#333333] dark:text-gray-200 flex items-center justify-center transition-colors cursor-pointer"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#8D6CE6] ring-2 ring-white dark:ring-[#111726]" />
          )}
        </button>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(prev => !prev)}
            className="flex items-center gap-2 p-1 pl-1.5 rounded-lg border border-transparent hover:border-[#E0E0E0] dark:hover:border-[#2A364F] hover:bg-[#F5F5F5] dark:hover:bg-[#1A2234] transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#8D6CE6] to-[#D780D6] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              SM
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-[13px] font-semibold text-black dark:text-white leading-tight">
                Sesyla M.
              </div>
              <div className="text-[11px] text-[#888888] dark:text-gray-400 leading-none">
                Premium Tier
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#888888] hidden sm:block" />
          </button>

          {/* User Dropdown Menu */}
          {isUserMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#161D2D] border border-[#E0E0E0] dark:border-[#28354D] rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.16)] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              onClick={() => setIsUserMenuOpen(false)}
            >
              <div className="px-3.5 py-2 border-b border-[#E0E0E0] dark:border-[#28354D]">
                <div className="font-bold text-xs text-black dark:text-white">Sesyla Micropeld</div>
                <div className="text-[11px] text-[#666666] dark:text-gray-400">sesyla.m@example.com</div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  <ShieldCheck className="w-3 h-3" /> Verified Platinum Account
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => onSelectTab('Account')}
                  className="w-full px-3.5 py-2 text-left text-xs text-[#333333] dark:text-gray-300 hover:bg-[#F3E8FF] dark:hover:bg-[#8D6CE6]/20 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-[#8D6CE6]" /> Profile & Security
                </button>
                <button
                  onClick={() => onSelectTab('Card')}
                  className="w-full px-3.5 py-2 text-left text-xs text-[#333333] dark:text-gray-300 hover:bg-[#F3E8FF] dark:hover:bg-[#8D6CE6]/20 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5 text-[#8D6CE6]" /> Cards & Limits
                </button>
                <button
                  onClick={() => onSelectTab('Manage')}
                  className="w-full px-3.5 py-2 text-left text-xs text-[#333333] dark:text-gray-300 hover:bg-[#F3E8FF] dark:hover:bg-[#8D6CE6]/20 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-[#8D6CE6]" /> Financial Preferences
                </button>
                <button
                  className="w-full px-3.5 py-2 text-left text-xs text-[#333333] dark:text-gray-300 hover:bg-[#F3E8FF] dark:hover:bg-[#8D6CE6]/20 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-[#8D6CE6]" /> Support & Help
                </button>
              </div>

              <div className="pt-1 border-t border-[#E0E0E0] dark:border-[#28354D]">
                <button
                  onClick={() => onSelectTab('Overview')}
                  className="w-full px-3.5 py-1.5 text-left text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 transition-colors cursor-pointer font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
