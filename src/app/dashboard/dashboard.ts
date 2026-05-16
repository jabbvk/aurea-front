import { Component, inject, OnInit, OnDestroy, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { Subject, takeUntil, finalize } from 'rxjs';
import { Sidebar } from '../shared/sidebar/sidebar';
import { DashboardService } from './services/dashboard.service';
import { RouterLink } from '@angular/router';
import {
  DashboardData,
  DashboardPeriod,
  PERIOD_OPTIONS,
} from './models/dashboard.model';

import { ErrorState } from '../shared/error-state/error-state';
import { RollingNumber } from '../shared/rolling-number/rolling-number';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [Sidebar, CommonModule, CurrencyPipe, DecimalPipe, RouterLink, ErrorState, RollingNumber],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  private readonly dashboardService = inject(DashboardService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly destroy$ = new Subject<void>();

  // ── State signals ──
  readonly data = signal<DashboardData | null>(null);
  readonly selectedPeriod = signal<DashboardPeriod>(DashboardPeriod.LAST_MONTH);
  readonly isLoading = signal(false);
  readonly hasError = signal(false);

  // ── UI constants ──
  readonly periodOptions = PERIOD_OPTIONS;

  // ── Derived state ──
  readonly netWorthChange = computed(() => {
    const d = this.data();
    if (!d) return 0;
    return d.netWorthChangePercent;
  });

  readonly isPositiveChange = computed(() => this.netWorthChange() >= 0);

  readonly periodLabel = computed(() => {
    const labels: Record<DashboardPeriod, string> = {
      [DashboardPeriod.LAST_MONTH]: 'este mes',
      [DashboardPeriod.LAST_3_MONTHS]: 'últimos 3 meses',
      [DashboardPeriod.CURRENT_YEAR]: 'este año',
      [DashboardPeriod.LAST_YEAR]: 'último año',
      [DashboardPeriod.ALL_TIME]: 'histórico',
    };
    return labels[this.selectedPeriod()];
  });

  ngOnInit(): void {
    this.loadDashboard();

    // Nuevo Stream específico para el Dashboard (Agrupaciones)
    this.dashboardService.getDashboardStream()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (update) => this.handleDashboardUpdate(update),
        error: (err) => console.warn('Dashboard stream error:', err)
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectPeriod(period: DashboardPeriod): void {
    if (period === this.selectedPeriod()) return;
    this.selectedPeriod.set(period);
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.dashboardService
      .getDashboard(this.selectedPeriod())
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.data.set(response);
        },
        error: (err) => {
          console.error('Error fetching dashboard:', err);
          this.hasError.set(true);
        },
      });
  }

  private handleDashboardUpdate(update: any): void {
    this.data.update(currentData => {
      if (!currentData) return currentData;

      // Actualizar el desglose de la categoría afectada
      const newAssetBreakdown = currentData.assetBreakdown.map(b => {
        if (b.type === update.type) {
          return {
            ...b,
            value: update.newValue,
            percentage: update.newTotalAssets > 0 ? (update.newValue / update.newTotalAssets) * 100 : 0
          };
        }
        // Actualizar porcentaje de las demás categorías porque el total ha cambiado
        return {
          ...b,
          percentage: update.newTotalAssets > 0 ? (b.value / update.newTotalAssets) * 100 : 0
        };
      });

      return {
        ...currentData,
        netWorth: update.newNetWorth,
        totalAssets: update.newTotalAssets,
        assetBreakdown: newAssetBreakdown
      };
    });
  }

  formatAssetType(type: string): string {
    const types: Record<string, string> = {
      'STOCK': 'Acciones / ETFs',
      'CRYPTO': 'Criptomonedas',
      'REAL_ESTATE': 'Inmuebles',
      'OTROS': 'Otros'
    };
    return types[type] || type;
  }
}
