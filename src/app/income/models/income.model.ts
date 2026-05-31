export enum IncomeCategory {
  SALARY = 'SALARY',
  FREELANCE = 'FREELANCE',
  DIVIDENDS = 'DIVIDENDS',
  RENTAL = 'RENTAL',
  INTEREST = 'INTEREST',
  GIFT = 'GIFT',
  REFUND = 'REFUND',
  OTHER = 'OTHER'
}

export enum Frequency {
  ONE_TIME = 'ONE_TIME',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY'
}

export interface IncomeResponse {
  id: string;
  amount: number;
  source: string;
  description: string;
  category: IncomeCategory;
  frequency: Frequency;
  date: string;
  createdAt: string;
}

export interface RecurringIncomeResponse {
  id: string;
  amount: number;
  source: string;
  description: string;
  category: IncomeCategory;
  frequency: Frequency;
  nextExecutionDate: string;
  active: boolean;
}

export interface IncomeSummaryResponse {
  collectedAmount: number;
  pendingRecurringAmount: number;
  totalAmount: number;
  percentCollected: number;
}

export interface IncomePageResponse {
  content: IncomeResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface IncomeRequest {
  amount: number;
  source: string;
  category: IncomeCategory;
  frequency?: Frequency;
  description?: string;
  date?: string;
  cashAccountId?: string | null;
}
