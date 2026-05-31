// Tipos de activos disponibles (Sincronizado con Backend AssetClass.java)
export enum AssetClass {
  STOCK = 'STOCK',
  CRYPTO = 'CRYPTO',
  REAL_ESTATE = 'REAL_ESTATE'
}

export interface Asset {
  id: string;
  name: string;
  subtitle: string;
  iconType: string;
  value: number;
  quantity: number;
  currentPrice: number;
  purchasePrice?: number;
  portfolioPercentage: number;
  performance: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  color?: string;
  justUpdated?: 'up' | 'down' | null;
}

export interface PerformancePoint {
  date: string;
  value: number;
  invested?: number;
  nominalReturn?: number;
  percentageReturn?: number;
}

export interface AssetPageResponse {
  content: Asset[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// Para el dashboard de activos (resumen superior)
export interface AssetDashboardResponse {
  summary: {
    totalValue: number;
    totalChangeValue: number;
    totalChangePercent: number;
    investedAmount: number;
  };
  performanceHistory: PerformancePoint[];
  distribution: {
    byCategory: AssetAllocation[];
    byAsset: AssetDistributionItem[];
  };
}

export interface AssetAllocation {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface AssetDistributionItem {
  name: string;
  value: number;
  color: string;
  type: string; // AssetClass
}

export enum PortfolioPeriod {
  ONE_DAY = '1d',
  ONE_WEEK = '1w',
  ONE_MONTH = '1m',
  SIX_MONTHS = '6m',
  ONE_YEAR = '1y',
  YEAR_TO_DATE = 'ytd',
  ALL = 'all'
}

export interface PeriodOption {
  label: string;
  value: PortfolioPeriod;
}

export const PERIOD_OPTIONS: PeriodOption[] = [
  { label: '1D', value: PortfolioPeriod.ONE_DAY },
  { label: '1S', value: PortfolioPeriod.ONE_WEEK },
  { label: '1M', value: PortfolioPeriod.ONE_MONTH },
  { label: '6M', value: PortfolioPeriod.SIX_MONTHS },
  { label: '1A', value: PortfolioPeriod.ONE_YEAR },
  { label: 'YTD', value: PortfolioPeriod.YEAR_TO_DATE },
  { label: 'Todo', value: PortfolioPeriod.ALL }
];

export interface SellAssetRequest {
  cashAccountId?: string | null;
  quantity?: number | null;
  sellPrice?: number | null;
}

export interface AssetResponse {
  id: string;
  name: string;
  type: 'STOCK' | 'CRYPTO' | 'REAL_ESTATE';
  ticker?: string;
  isin?: string;
  purchasePrice: number;
  quantity: number;
  value: number;
  purchaseDate: string;
  sold: boolean;
  soldDate?: string;
  sellPrice?: number;
  realizedPnl?: number;
}
