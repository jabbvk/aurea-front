import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { Subject, takeUntil, finalize } from 'rxjs';
import { Sidebar } from '../shared/sidebar/sidebar';
import { DashboardService } from './services/dashboard.service';
import { RegisterMovementModalService } from '../shared/register-movement-modal/register-movement-modal.service';
import { RouterLink } from '@angular/router';
import {
  DashboardData,
  DashboardPeriod,
  PERIOD_OPTIONS,
} from './models/dashboard.model';

import { ActionButton } from '../shared/action-button/action-button';
import { ErrorState } from '../shared/error-state/error-state';

@Component({
  selector: 'app-dashboard',
  imports: [Sidebar, CommonModule, CurrencyPipe, DecimalPipe, RouterLink, ActionButton, ErrorState],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  private readonly dashboardService = inject(DashboardService);
  readonly modalService = inject(RegisterMovementModalService);
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

    this.modalService.movementRegistered$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadDashboard());
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
}
