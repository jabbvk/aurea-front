import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Sidebar } from '../shared/sidebar/sidebar';
import { RegisterMovementModalService } from '../shared/register-movement-modal/register-movement-modal.service';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { AssetService } from './services/asset.service';
import { Asset, AssetClass, AssetDashboardResponse, AssetPageResponse } from './models/asset.model';
import { finalize, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ActionButton } from '../shared/action-button/action-button';
import { ErrorState } from '../shared/error-state/error-state';
import { RollingNumber } from '../shared/rolling-number/rolling-number';
import { MarketStreamService, PriceUpdate } from './services/market-stream.service';

@Component({
  selector: 'app-asset-dashboard',
  standalone: true,
  imports: [CommonModule, Sidebar, NgxEchartsDirective, ReactiveFormsModule, ActionButton, ErrorState, RollingNumber],
  templateUrl: './asset-dashboard.html',
  styleUrl: './asset-dashboard.css',
})
export class AssetDashboard implements OnInit {
  private readonly assetService = inject(AssetService);
  private readonly destroyRef = inject(DestroyRef);
  readonly modalService = inject(RegisterMovementModalService);
  private readonly marketStream = inject(MarketStreamService);
  private readonly flashTimers = new Map<string, any>();

  // Expose enum to template
  readonly AssetClass = AssetClass;

  // Selected category filter for distribution charts (ALL, STOCK, CRYPTO, REAL_ESTATE)
  readonly selectedCategoryFilter = signal<string>('ALL');

  // Computed totals based on filter
  readonly filteredTotalValue = computed(() => {
    const data = this.dashboardData();
    if (!data) return 0;
    
    const filter = this.selectedCategoryFilter();
    if (filter === 'ALL') return data.summary.totalValue;
    
    return data.distribution.byCategory
      .find(c => c.name === filter)?.value || 0;
  });

  readonly filteredTotalPercentage = computed(() => {
    const data = this.dashboardData();
    if (!data) return 0;
    
    const filter = this.selectedCategoryFilter();
    if (filter === 'ALL') return 100;
    
    return data.distribution.byCategory
      .find(c => c.name === filter)?.percentage || 0;
  });

  // Aggregated Dashboard Data (Charts/Summary)
  readonly dashboardData = signal<AssetDashboardResponse>({
    summary: { totalValue: 0, totalChangeValue: 0, totalChangePercent: 0, investedAmount: 0 },
    performanceHistory: [],
    distribution: { byCategory: [], byAsset: [] }
  });
  readonly isDashboardLoading = signal(true);
  readonly hasDashboardError = signal(false);

  // Paginated Assets List Data
  readonly assetsPage = signal<AssetPageResponse | null>(null);
  readonly isAssetsLoading = signal(true);
  readonly hasAssetsError = signal(false);

  // Search & Pagination State
  readonly searchControl = new FormControl('');
  readonly currentPage = signal(0);
  readonly pageSize = signal(10);

  ngOnInit(): void {
    this.fetchDashboard();
    this.fetchAssets();

    // Setup reactive search
    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.currentPage.set(0); // Reset to first page on search
      this.fetchAssets();
    });

    // Listen for real-time price updates via SSE
    this.marketStream.getPriceUpdates()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(update => this.handlePriceUpdate(update));

    // Listen for new movements
    this.modalService.movementRegistered$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.fetchDashboard();
        this.fetchAssets();
      });
  }

  fetchDashboard(): void {
    this.isDashboardLoading.set(true);
    this.hasDashboardError.set(false);
    this.assetService.getDashboard()
      .pipe(finalize(() => this.isDashboardLoading.set(false)))
      .subscribe({
        next: (response) => {
          if (response) {
            // Asignar colores a la distribución por activo
            response.distribution.byAsset = response.distribution.byAsset.map(a => {
              // Intentar extraer el ticker del nombre "Nombre (TICKER)" o usar el nombre
              const tickerMatch = a.name.match(/\((.*?)\)/);
              const ticker = tickerMatch ? tickerMatch[1] : a.name;
              return { ...a, color: this.assetService.getAssetColor(ticker) };
            });
            this.dashboardData.set(response);
          } else {
            this.dashboardData.set({
              summary: { totalValue: 0, totalChangeValue: 0, totalChangePercent: 0, investedAmount: 0 },
              performanceHistory: [],
              distribution: { byCategory: [], byAsset: [] }
            });
          }
        },
        error: (err) => {
          console.error('Error fetching asset dashboard:', err);
          this.hasDashboardError.set(true);
        }
      });
  }

  fetchAssets(): void {
    this.isAssetsLoading.set(true);
    this.hasAssetsError.set(false);

    this.assetService.getAssetsPage(
      this.currentPage(),
      this.pageSize(),
      this.searchControl.value || ''
    )
      .pipe(finalize(() => this.isAssetsLoading.set(false)))
      .subscribe({
        next: (response) => {
          if (response) {
            // Asignar colores a cada activo en la lista
            response.content = response.content.map(asset => ({
              ...asset,
              color: this.assetService.getAssetColor(asset.subtitle || asset.name)
            }));
            this.assetsPage.set(response);
          } else {
            this.assetsPage.set({
              content: [],
              totalElements: 0,
              totalPages: 0,
              size: 10,
              number: 0
            });
          }
        },
        error: (err) => {
          console.error('Error fetching assets list:', err);
          this.hasAssetsError.set(true);
        }
      });
  }

  private handlePriceUpdate(update: PriceUpdate): void {
    // 1. Update the assets in the current page
    this.assetsPage.update(page => {
      if (!page) return null;

      let deltaValue = 0;
      const newContent = page.content.map(asset => {
        // Clean matching based on ticker/symbol
        const assetTicker = (asset.subtitle || '').toUpperCase();
        const updateSymbol = (update.symbol || '').toUpperCase();

        if (assetTicker === updateSymbol) {
          const oldTotalValue = asset.value;
          const newTotalValue = asset.quantity * update.price;
          deltaValue += (newTotalValue - oldTotalValue);

          // Determine flash color
          const flashDirection = update.price > (asset.currentPrice || 0) ? 'up' : 'down';

          // Create updated asset
          const updatedAsset: Asset = {
            ...asset,
            currentPrice: update.price,
            value: newTotalValue,
            justUpdated: flashDirection
          };

          // Clear any existing timer for this asset
          if (this.flashTimers.has(updatedAsset.id)) {
            clearTimeout(this.flashTimers.get(updatedAsset.id));
          }

          // Clear flash after 100ms for a high-performance feel
          const timer = setTimeout(() => {
            this.clearAssetFlash(updatedAsset.id);
            this.flashTimers.delete(updatedAsset.id);
          }, 100);

          this.flashTimers.set(updatedAsset.id, timer);

          return updatedAsset;
        }
        return asset;
      });

      // 2. Update Dashboard Summary and Distribution if there's a delta
      if (deltaValue !== 0) {
        this.dashboardData.update(data => {
          if (!data) return data;

          const newTotalValue = data.summary.totalValue + deltaValue;
          const newTotalChangeValue = data.summary.totalChangeValue + deltaValue;
          const newTotalChangePercent = data.summary.investedAmount > 0
            ? (newTotalChangeValue / data.summary.investedAmount) * 100
            : 0;

          // Update byAsset distribution
          const newByAsset = data.distribution.byAsset.map(da => {
            // Find if this distribution entry matches the updated symbol
            // Note: in byAsset, name is "Asset Name (Ticker)" or just "Ticker"
            // We need a robust way to match here too.
            // For now, let's assume we can match by checking if the symbol is in the name
            if (da.name.includes(`(${update.symbol})`) || da.name === update.symbol) {
              return { ...da, value: da.value + deltaValue };
            }
            return da;
          });

          // Update byCategory distribution (we need to know the category of the asset)
          // Since we don't have the category easily here without looking it up in the content
          // let's find the category from the updated asset in newContent
          const matchingAsset = newContent.find(a => a.subtitle === update.symbol);
          const newByCategory = data.distribution.byCategory.map(dc => {
            if (matchingAsset && dc.name === matchingAsset.iconType) {
              const newValue = dc.value + deltaValue;
              const newPercentage = newTotalValue > 0 ? (newValue / newTotalValue) * 100 : 0;
              return { ...dc, value: newValue, percentage: newPercentage };
            }
            // Update percentage for other categories too because totalValue changed
            const newPercentage = newTotalValue > 0 ? (dc.value / newTotalValue) * 100 : 0;
            return { ...dc, percentage: newPercentage };
          });

          return {
            ...data,
            summary: {
              ...data.summary,
              totalValue: newTotalValue,
              totalChangeValue: newTotalChangeValue,
              totalChangePercent: newTotalChangePercent
            },
            distribution: {
              byAsset: newByAsset,
              byCategory: newByCategory
            }
          };
        });
      }

      return { ...page, content: newContent };
    });
  }

  private clearAssetFlash(assetId: string): void {
    this.assetsPage.update(page => {
      if (!page) return null;
      const newContent = page.content.map(a =>
        a.id === assetId ? { ...a, justUpdated: null } : a
      );
      return { ...page, content: newContent };
    });
  }

  nextPage(): void {
    const totalPages = this.assetsPage()?.totalPages || 0;
    if (this.currentPage() < totalPages - 1) {
      this.currentPage.update(p => p + 1);
      this.fetchAssets();
    }
  }

  prevPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.update(p => p - 1);
      this.fetchAssets();
    }
  }

  setCategoryFilter(category: string): void {
    this.selectedCategoryFilter.set(category);
  }

  onDonutClick(event: any): void {
    // Only allow clicking to filter when in 'ALL' mode
    if (this.selectedCategoryFilter() === 'ALL' && event.data) {
      const nameToKey: Record<string, string> = {
        'Acciones / ETFs': AssetClass.STOCK,
        'Criptomonedas': AssetClass.CRYPTO,
        'Inmuebles': AssetClass.REAL_ESTATE,
        [AssetClass.STOCK]: AssetClass.STOCK,
        [AssetClass.CRYPTO]: AssetClass.CRYPTO,
        [AssetClass.REAL_ESTATE]: AssetClass.REAL_ESTATE
      };

      const key = nameToKey[event.name];
      if (key) {
        this.setCategoryFilter(key);
      }
    }
  }

  // Portfolio Distribution Donut Chart
  donutChartOption = computed<EChartsOption>(() => {
    const data = this.dashboardData();
    if (!data) return {};

    const isAll = this.selectedCategoryFilter() === 'ALL';
    let chartData: any[] = [];

    if (isAll) {
      // General view: By Category
      chartData = data.distribution.byCategory.map(c => ({
        name: this.formatAssetType(c.name),
        value: c.value,
        itemStyle: { color: c.color }
      }));
    } else {
      // Filtered view: By Assets
      chartData = data.distribution.byAsset
        .filter(a => a.type === this.selectedCategoryFilter())
        .map(a => ({
          name: a.name,
          value: a.value,
          itemStyle: { color: a.color }
        }));
    }

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const val = params.value;
          return `${params.name}<br/><b>${val.toLocaleString()}€</b> (${params.percent}%)`;
        },
        backgroundColor: '#1e293b',
        borderColor: '#1e293b',
        textStyle: { color: '#fff' }
      },
      legend: {
        show: false
      },
      series: [
        {
          name: isAll ? 'Categorías' : 'Activos',
          type: 'pie',
          radius: ['70%', '90%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: false
            }
          },
          labelLine: {
            show: false
          },
          data: chartData
        }
      ]
    };
  });

  // Portfolio Performance History Chart
  historyChartOption = computed<EChartsOption>(() => {
    const history = this.dashboardData()?.performanceHistory || [];
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#1e293b',
        borderColor: '#1e293b',
        textStyle: { color: '#fff' },
        formatter: (params: any) => {
          const p = params[0];
          return `${p.name}<br/><b>${p.value.toLocaleString()}€</b>`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: history.map(p => p.date),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#94a3b8', fontSize: 10 }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
        axisLabel: { color: '#94a3b8', fontSize: 10 }
      },
      series: [{
        data: history.map(p => p.value),
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 3, color: '#3b82f6' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.2)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0)' }
            ]
          }
        }
      }]
    };
  });

  // Assets TreeMap Chart
  treemapChartOption = computed<EChartsOption>(() => {
    const data = this.dashboardData();
    if (!data) return {};

    const filter = this.selectedCategoryFilter();
    const assets = data.distribution.byAsset
      .filter(a => filter === 'ALL' || a.type === filter);

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const val = params.value;
          return `${params.name}<br/><b>${val.toLocaleString()}€</b>`;
        },
        backgroundColor: '#1e293b',
        borderColor: '#1e293b',
        textStyle: { color: '#fff' }
      },
      series: [{
        name: 'Activos',
        type: 'treemap',
        roam: false,
        nodeClick: false,
        visibleMin: 300,
        label: {
          show: true,
          formatter: '{b}',
          fontSize: 10,
          fontWeight: 'bold',
          color: '#fff'
        },
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2,
          gapWidth: 4
        },
        breadcrumb: {
          show: false
        },
        data: assets.map(asset => ({
          name: asset.name,
          value: asset.value,
          itemStyle: { color: asset.color || '#3b82f6' }
        }))
      }]
    };
  });

  private adjustColor(hex: string, amount: number): string {
    return '#' + hex.replace(/^#/, '').replace(/../g, hex => 
      ('0' + Math.min(255, Math.max(0, parseInt(hex, 16) + amount)).toString(16)).slice(-2));
  }

  formatAssetType(type: string): string {
    const types: Record<string, string> = {
      [AssetClass.STOCK]: 'Acciones / ETFs',
      [AssetClass.CRYPTO]: 'Criptomonedas',
      [AssetClass.REAL_ESTATE]: 'Inmuebles',
    };
    return types[type] || type;
  }

  getAssetIcon(type: string): string {
    const icons: Record<string, string> = {
      [AssetClass.STOCK]: 'show_chart',
      [AssetClass.CRYPTO]: 'currency_bitcoin',
      [AssetClass.REAL_ESTATE]: 'home',
    };
    return icons[type] || 'category';
  }
}
