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
  portfolioPercentage: number;
  performance: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  color?: string;
  justUpdated?: 'up' | 'down' | null;
}

export interface PerformancePoint {
  date: string;
  value: number;
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
