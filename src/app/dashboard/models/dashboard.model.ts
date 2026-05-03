export enum DashboardPeriod {
  LAST_MONTH = 'LAST_MONTH',
  LAST_3_MONTHS = 'LAST_3_MONTHS',
  CURRENT_YEAR = 'CURRENT_YEAR',
  LAST_YEAR = 'LAST_YEAR',
  ALL_TIME = 'ALL_TIME',
}

export interface DashboardData {
  netWorth: number;
  netWorthChangePercent: number;
  periodIncome: number;
  periodExpenses: number;
  cashBalance: number;
  emergencyFundBalance: number;
  totalAssets: number;
  totalDebt: number;
  
  recentIncomes: Array<{ id: string; source: string; amount: number; date: string; category: string }>;
  hasMoreIncomes: boolean;
  recentExpenses: Array<{ id: string; description: string; amount: number; date: string; category: string }>;
  hasMoreExpenses: boolean;
  assetBreakdown: Array<{ type: string; value: number; percentage: number; color: string }>;
  activeDebts: Array<{ id: string; name: string; amount: number; creditor: string }>;
  hasMoreDebts: boolean;
}

/** UI mapping for the period selector buttons */
export interface PeriodOption {
  label: string;
  value: DashboardPeriod;
}

export const PERIOD_OPTIONS: PeriodOption[] = [
  { label: '1M', value: DashboardPeriod.LAST_MONTH },
  { label: '3M', value: DashboardPeriod.LAST_3_MONTHS },
  { label: 'YTD', value: DashboardPeriod.CURRENT_YEAR },
  { label: '1A', value: DashboardPeriod.LAST_YEAR },
  { label: 'Todo', value: DashboardPeriod.ALL_TIME },
];
