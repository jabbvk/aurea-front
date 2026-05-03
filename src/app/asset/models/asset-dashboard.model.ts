export interface AssetDashboardSummary {
  totalValue: number;
  totalChangeValue: number;
  totalChangePercent: number;
  investedAmount: number;
}

export interface PerformancePoint {
  date: string;
  value: number;
}

export interface DistributionItem {
  name: string;
  value: number;
  percentage?: number;
  color: string;
}

export interface AssetListItem {
  id: string;
  name: string;
  subtitle: string;
  iconType: string;
  value: number;
  portfolioPercentage: number;
  performance: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface AssetDashboardResponse {
  summary: AssetDashboardSummary;
  performanceHistory: PerformancePoint[];
  distribution: {
    byCategory: DistributionItem[];
    byAsset: DistributionItem[];
  };
}

export interface AssetPageResponse {
  content: AssetListItem[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
