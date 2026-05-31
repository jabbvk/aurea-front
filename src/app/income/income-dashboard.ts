import { Component, inject, OnInit, signal, computed, DestroyRef, effect } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Sidebar } from '../shared/sidebar/sidebar';
import { ActionButton } from '../shared/action-button/action-button';
import { RollingNumber } from '../shared/rolling-number/rolling-number';
import { RegisterMovementModalService } from '../shared/register-movement-modal/register-movement-modal.service';
import { AppSelect, SelectOption } from '../shared/app-select/app-select';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { IncomeService } from './services/income.service';
import { EditRecurringModalService } from './components/edit-recurring-modal/edit-recurring-modal.service';
import { EditRecurringModal } from './components/edit-recurring-modal/edit-recurring-modal';
import { IncomeSummaryResponse, RecurringIncomeResponse, IncomeResponse } from './models/income.model';
import { ToastService } from '../shared/toast/toast.service';

@Component({
  selector: 'app-income-dashboard',
  standalone: true,
  imports: [CommonModule, Sidebar, ActionButton, RollingNumber, AppSelect, CurrencyPipe, DatePipe, EditRecurringModal],
  templateUrl: './income-dashboard.html',
  styleUrl: './income-dashboard.css'
})
export class IncomeDashboard implements OnInit {
  readonly modalService = inject(RegisterMovementModalService);
  readonly editRecurringModalService = inject(EditRecurringModalService);
  private readonly incomeService = inject(IncomeService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  // Loading state
  readonly isLoading = signal(true);
  readonly isLoadingHistory = signal(false);

  // Month navigation
  readonly monthsList = [
    { value: 0, label: 'Enero' },
    { value: 1, label: 'Febrero' },
    { value: 2, label: 'Marzo' },
    { value: 3, label: 'Abril' },
    { value: 4, label: 'Mayo' },
    { value: 5, label: 'Junio' },
    { value: 6, label: 'Julio' },
    { value: 7, label: 'Agosto' },
    { value: 8, label: 'Septiembre' },
    { value: 9, label: 'Octubre' },
    { value: 10, label: 'Noviembre' },
    { value: 11, label: 'Diciembre' }
  ];

  readonly activeMonth = signal(4); // Mayo (0-indexed: 4)
  readonly activeYear = signal(2026);

  // Max range is current date
  readonly maxMonth = 4;
  readonly maxYear = 2026;

  // Search subjects/queries
  readonly searchRecurringQuery = signal('');
  readonly searchHistoryQuery = signal('');
  private readonly searchRecurringSubject = new Subject<string>();
  private readonly searchHistorySubject = new Subject<string>();

  // Pagination page indexes
  readonly currentPageRecurring = signal(0);
  readonly currentPageHistory = signal(0);
  readonly pageSize = 4;

  // Backend Data
  readonly summary = signal<IncomeSummaryResponse>({
    collectedAmount: 0,
    pendingRecurringAmount: 0,
    totalAmount: 0,
    percentCollected: 0
  });

  readonly allRecurringIncomes = signal<RecurringIncomeResponse[]>([]);
  readonly historyIncomes = signal<IncomeResponse[]>([]);
  readonly totalPagesHistory = signal(1);
  readonly totalHistoryElements = signal(0);

  // Computed navigation states
  readonly activeMonthName = computed(() => this.monthsList[this.activeMonth()].label);
  readonly isMaxMonth = computed(() => this.activeMonth() === this.maxMonth && this.activeYear() === this.maxYear);

  readonly availableMonths = computed(() => {
    if (this.activeYear() === this.maxYear) {
      return this.monthsList.filter(m => m.value <= this.maxMonth);
    }
    return this.monthsList;
  });

  readonly monthSelectOptions = computed<SelectOption[]>(() => {
    return this.availableMonths().map(m => ({
      label: `${m.label} ${this.activeYear()}`,
      value: m.value
    }));
  });

  // Computed filter logic for Recurring Incomes (Frontend pagination/filtering for recurring)
  readonly filteredRecurringIncomes = computed(() => {
    const query = this.searchRecurringQuery().toLowerCase().trim();
    const list = this.allRecurringIncomes();
    if (!query) return list;
    return list.filter(item =>
      item.source.toLowerCase().includes(query) ||
      this.getCategoryLabel(item.category).toLowerCase().includes(query)
    );
  });

  readonly totalPagesRecurring = computed(() =>
    Math.ceil(this.filteredRecurringIncomes().length / this.pageSize) || 1
  );

  readonly paginatedRecurringIncomes = computed(() => {
    const start = this.currentPageRecurring() * this.pageSize;
    return this.filteredRecurringIncomes().slice(start, start + this.pageSize);
  });

  // For history, it's already paginated from backend
  readonly paginatedHistoryIncomes = computed(() => this.historyIncomes());

  // Extracted values for UI
  readonly collectedAmount = computed(() => this.summary().collectedAmount);
  readonly pendingRecurringAmount = computed(() => this.summary().pendingRecurringAmount);
  readonly totalIncomes = computed(() => this.summary().totalAmount);
  readonly percentCollected = computed(() => this.summary().percentCollected);

  constructor() {
    // Empty constructor
  }

  ngOnInit(): void {
    this.fetchSummary();
    this.fetchHistory();
    this.fetchRecurring();

    // Setup search debouncing
    this.searchRecurringSubject.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(query => {
      this.searchRecurringQuery.set(query);
      this.currentPageRecurring.set(0);
    });

    this.searchHistorySubject.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(query => {
      this.searchHistoryQuery.set(query);
      this.currentPageHistory.set(0);
      this.fetchHistory();
    });

    // Listen to new incomes created via register modal
    this.modalService.movementRegistered$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.fetchSummary();
        this.fetchHistory();
        this.fetchRecurring();
      });

    // Listen to edited recurring incomes
    this.editRecurringModalService.incomeUpdated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.fetchRecurring();
        this.fetchSummary();
      });
  }

  fetchSummary() {
    this.isLoading.set(true);
    // Backend month is 1-12, frontend is 0-11
    this.incomeService.getSummary(this.activeMonth() + 1, this.activeYear()).subscribe({
      next: (res) => {
        this.summary.set(res);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching summary:', err);
        this.isLoading.set(false);
      }
    });
  }

  fetchHistory() {
    this.isLoadingHistory.set(true);
    const m = this.activeMonth() + 1;
    const y = this.activeYear();
    const q = this.searchHistoryQuery();
    
    this.incomeService.getHistory(this.currentPageHistory(), this.pageSize, q, m, y).subscribe({
      next: (res) => {
        this.historyIncomes.set(res.content);
        this.totalPagesHistory.set(res.totalPages || 1);
        this.totalHistoryElements.set(res.totalElements || 0);
        this.isLoadingHistory.set(false);
      },
      error: (err) => {
        console.error('Error fetching history:', err);
        this.isLoadingHistory.set(false);
      }
    });
  }

  fetchRecurring() {
    this.incomeService.getRecurring().subscribe({
      next: (res) => {
        this.allRecurringIncomes.set(res);
      },
      error: (err) => {
        console.error('Error fetching recurring:', err);
      }
    });
  }

  // Interactivity: Force collect pending income
  cobrarIngresoRecurrente(id: string): void {
    this.incomeService.forceCollectRecurring(id).subscribe({
      next: () => {
        this.toastService.success('Cobro recurrente forzado con éxito.');
        this.fetchSummary();
        this.fetchHistory();
        this.fetchRecurring();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Error al forzar el cobro recurrente.');
      }
    });
  }

  openEditRecurringModal(income: RecurringIncomeResponse): void {
    this.editRecurringModalService.open(income);
  }

  // Navigations
  prevMonth(): void {
    if (this.activeMonth() === 0) {
      this.activeMonth.set(11);
      this.activeYear.update(y => y - 1);
    } else {
      this.activeMonth.update(m => m - 1);
    }
    this.resetPagination();
    this.fetchSummary();
    this.fetchHistory();
  }

  nextMonth(): void {
    if (this.isMaxMonth()) return;
    if (this.activeMonth() === 11) {
      this.activeMonth.set(0);
      this.activeYear.update(y => y + 1);
    } else {
      this.activeMonth.update(m => m + 1);
    }
    this.resetPagination();
    this.fetchSummary();
    this.fetchHistory();
  }

  onMonthSelectValueChange(val: number): void {
    this.activeMonth.set(val);
    this.resetPagination();
    this.fetchSummary();
    this.fetchHistory();
  }

  private resetPagination(): void {
    this.currentPageHistory.set(0);
    // Recurring pagination doesn't strictly depend on activeMonth visually in this design
  }

  // Searching
  onSearchRecurring(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchRecurringSubject.next(val);
  }

  onSearchHistory(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchHistorySubject.next(val);
  }

  // Pagination Change Handlers
  changePageRecurring(page: number): void {
    if (page >= 0 && page < this.totalPagesRecurring()) {
      this.currentPageRecurring.set(page);
    }
  }

  changePageHistory(page: number): void {
    if (page >= 0 && page < this.totalPagesHistory()) {
      this.currentPageHistory.set(page);
      this.fetchHistory(); // trigger backend fetch
    }
  }

  // Dictionaries
  getCategoryBadge(category: string): { label: string; icon: string; bgClass: string; textClass: string } {
    switch (category) {
      case 'SALARY': return { label: 'Salario', icon: 'payments', bgClass: 'bg-emerald-50', textClass: 'text-emerald-700' };
      case 'FREELANCE': return { label: 'Freelance', icon: 'work', bgClass: 'bg-blue-50', textClass: 'text-blue-700' };
      case 'DIVIDENDS': return { label: 'Dividendos', icon: 'monitoring', bgClass: 'bg-purple-50', textClass: 'text-purple-700' };
      case 'RENTAL': return { label: 'Alquiler', icon: 'home', bgClass: 'bg-amber-50', textClass: 'text-amber-700' };
      case 'INTEREST': return { label: 'Intereses', icon: 'account_balance', bgClass: 'bg-cyan-50', textClass: 'text-cyan-700' };
      case 'GIFT': return { label: 'Regalo', icon: 'card_giftcard', bgClass: 'bg-pink-50', textClass: 'text-pink-700' };
      case 'REFUND': return { label: 'Reembolso', icon: 'undo', bgClass: 'bg-indigo-50', textClass: 'text-indigo-700' };
      default: return { label: 'Otro', icon: 'more_horiz', bgClass: 'bg-slate-50', textClass: 'text-slate-700' };
    }
  }

  getCategoryLabel(category: string): string {
    return this.getCategoryBadge(category).label;
  }

  getFrequencyLabel(freq: string): string {
    switch (freq) {
      case 'DAILY': return 'Diario';
      case 'WEEKLY': return 'Semanal';
      case 'BIWEEKLY': return 'Quincenal';
      case 'MONTHLY': return 'Mensual';
      case 'QUARTERLY': return 'Trimestral';
      case 'YEARLY': return 'Anual';
      default: return 'Puntual';
    }
  }
}
