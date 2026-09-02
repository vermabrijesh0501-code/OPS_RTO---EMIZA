export interface FinityTransaction {
  id: string;
  company: string;
  category: 'Transfer' | 'Subscription' | 'Shopping' | 'Workspace' | 'Income' | 'Utilities';
  amount: number;
  type: 'debit' | 'credit';
  time: string;
  date: string;
  iconType: 'apple' | 'figma' | 'dribbble' | 'google' | 'stripe' | 'amazon' | 'netflix' | 'spotify' | 'default';
  status: 'Completed' | 'Pending' | 'Failed';
  cardUsed?: string;
  recipient?: string;
}

export interface FinityGoal {
  id: string;
  name: string;
  saved: number;
  goal: number;
  deadline: string;
  categoryColor: 'purple' | 'cyan' | 'pink';
  percentage: number;
  iconName: string;
}

export interface FinityCard {
  id: string;
  cardNumber: string;
  cardHolder: string;
  expiry: string;
  cvv: string;
  type: 'Visa' | 'MasterCard';
  tier: 'PREMIUM' | 'GOLD' | 'BLACK';
  gradient: string;
  balance: number;
  isFrozen: boolean;
  contactless: boolean;
}

export interface FinityExpenseCategory {
  name: string;
  amount: number;
  color: string;
  percentage: number;
}

export interface ChartDataPoint {
  month: string;
  earning: number;
  spending: number;
}
