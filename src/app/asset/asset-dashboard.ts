import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Sidebar } from '../shared/sidebar/sidebar';
import { RegisterMovementModalService } from '../shared/register-movement-modal/register-movement-modal.service';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { AssetService } from './services/asset.service';
import { AssetDashboardResponse, AssetPageResponse } from './models/asset-dashboard.model';
import { finalize, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-asset-dashboard',
  imports: [CommonModule, Sidebar, NgxEchartsDirective, ReactiveFormsModule],
  templateUrl: './asset-dashboard.html',
})
export class AssetDashboard implements OnInit {
  private readonly assetService = inject(AssetService);
  private readonly destroyRef = inject(DestroyRef);
  readonly modalService = inject(RegisterMovementModalService);

  // Aggregated Dashboard Data (Charts/Summary)
  readonly dashboardData = signal<AssetDashboardResponse | null>(null);
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
  readonly sort = signal('value,desc');

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
  }

  fetchDashboard(): void {
    this.isDashboardLoading.set(true);
    this.hasDashboardError.set(false);
    this.assetService.getAssetsDashboard()
      .pipe(finalize(() => this.isDashboardLoading.set(false)))
      .subscribe({
        next: (response) => this.dashboardData.set(response),
        error: (err) => {
          console.error('Error fetching asset dashboard:', err);
          this.hasDashboardError.set(true);
        }
      });
  }

  fetchAssets(): void {
    this.isAssetsLoading.set(true);
    this.hasAssetsError.set(false);
    
    this.assetService.getAssets(
      this.searchControl.value || '',
      this.currentPage(),
      this.pageSize(),
      this.sort()
    )
    .pipe(finalize(() => this.isAssetsLoading.set(false)))
    .subscribe({
      next: (response) => this.assetsPage.set(response),
      error: (err) => {
        console.error('Error fetching assets list:', err);
        this.hasAssetsError.set(true);
      }
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

  // Main Performance Line Chart
  lineChartOption = computed<EChartsOption>(() => {
    const history = this.dashboardData()?.performanceHistory || [];
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#1e293b',
        borderColor: '#1e293b',
        textStyle: { color: '#fff' },
        formatter: (params: any) => {
          const date = params[0].name;
          const val = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(params[0].value);
          return `<div style="font-weight:bold">${val}</div><div style="font-size:10px;color:#cbd5e1;text-align:center">${date}</div>`;
        }
      },
      grid: { left: '0%', right: '0%', bottom: '0%', top: '5%', containLabel: false },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: history.map(p => p.date),
        show: false
      },
      yAxis: {
        type: 'value',
        show: false,
        min: 'dataMin',
        max: 'dataMax'
      },
      series: [
        {
          data: history.map(p => p.value),
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          showSymbol: false,
          itemStyle: { color: '#3b82f6', borderColor: '#fff', borderWidth: 2 },
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
        }
      ]
    };
  });

  // Portfolio Distribution Donut Chart
  donutChartOption = computed<EChartsOption>(() => {
    const byCategory = this.dashboardData()?.distribution.byCategory || [];
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {d}%' },
      series: [
        {
          name: 'Distribución',
          type: 'pie',
          radius: ['65%', '90%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 5,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: { show: false },
          data: byCategory.map(item => ({
            value: item.value,
            name: item.name,
            itemStyle: { color: item.color }
          }))
        }
      ]
    };
  });

  // Detailed Treemap Chart
  treemapOption = computed<EChartsOption>(() => {
    const byAsset = this.dashboardData()?.distribution.byAsset || [];
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}%'
      },
      series: [
        {
          type: 'treemap',
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          label: {
            show: true,
            formatter: '{b}\n{c}%',
            fontSize: 11,
            fontWeight: 'bold'
          },
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 2,
            borderRadius: 4
          },
          data: byAsset.map(item => ({
            name: item.name,
            value: item.value,
            itemStyle: { color: item.color }
          }))
        }
      ]
    };
  });
}
