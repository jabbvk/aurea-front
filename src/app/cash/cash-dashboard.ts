import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sidebar } from '../shared/sidebar/sidebar';
import { ActionButton } from '../shared/action-button/action-button';
import { RegisterMovementModalService } from '../shared/register-movement-modal/register-movement-modal.service';
import { CashService, CashAccount, CashMovement } from './services/cash.service';
import { finalize, forkJoin, Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { ErrorState } from '../shared/error-state/error-state';

@Component({
  selector: 'app-cash-dashboard',
  standalone: true,
  imports: [CommonModule, Sidebar, ActionButton, ErrorState],
  template: `
    <div class="bg-background-light text-slate-900 font-display transition-colors duration-200 no-scroll-layout flex h-screen w-full overflow-hidden">
      <app-sidebar></app-sidebar>

      <main class="flex-1 flex flex-col h-full overflow-hidden relative bg-background-light">
        <header class="sticky top-0 z-20 flex items-center justify-between px-8 py-6 bg-background-light/95 backdrop-blur-sm">
          <div class="flex items-center gap-4">
          </div>
          <div class="flex items-center gap-4">
            <app-action-button label="Realizar traspaso" [disabled]="isInitialLoading()" (action)="modalService.open('cash', true, 'cash')"></app-action-button>
          </div>
        </header>

        <div class="flex-1 px-6 pb-6 pt-4 overflow-y-auto overflow-x-hidden flex flex-col gap-4">
          @if (isInitialLoading()) {
            <div class="space-y-8 animate-pulse mt-4">
               <div class="h-32 bg-white rounded-3xl border border-slate-200"></div>
               <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div class="h-64 bg-white rounded-3xl border border-slate-200"></div>
                 <div class="lg:col-span-2 h-64 bg-white rounded-3xl border border-slate-200"></div>
               </div>
            </div>
          } @else if (hasError()) {
            <div class="py-20">
              <app-error-state (retry)="loadData()"></app-error-state>
            </div>
          } @else {
            
            <section class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between transition-all duration-500" [class.opacity-50]="isHistoryLoading()">
              <div class="flex flex-col">
                <p class="text-[13px] font-semibold text-slate-500 mb-0.5">Liquidez Total Disponible</p>
                <div class="flex items-center gap-3">
                  <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {{ totalBalance() | currency:'EUR':'symbol':'1.2-2' }}
                  </h1>
                  <div class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold">
                    <span class="material-symbols-outlined text-[16px]">check_circle</span>
                    Sincronizado
                  </div>
                </div>
                <p class="text-[11px] text-slate-400 mt-1 font-medium italic">Suma total de todas tus cuentas bancarias y efectivo</p>
              </div>
              
              <div class="flex gap-3">
                <div class="bg-white border border-slate-200 rounded-xl px-6 py-3 shadow-sm flex flex-col items-center min-w-[100px] transition-all hover:shadow-md">
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-0.5">Cuentas</span>
                  <span class="text-xl font-extrabold text-primary">{{ accounts().length }}</span>
                </div>
              </div>
            </section>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div class="lg:col-span-1">
                <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm h-full flex flex-col transition-all duration-500" [class.opacity-50]="isHistoryLoading()">
                  <div class="flex justify-between items-start mb-4">
                    <div>
                      <p class="text-slate-500 text-[13px] font-medium">Saldos por cuenta</p>
                    </div>
                    <div class="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                      <span class="material-symbols-outlined text-lg">account_balance</span>
                    </div>
                  </div>
                  
                  <div class="space-y-3 mt-2">
                    @for (account of accounts(); track account.id) {
                      <div class="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-primary/20 hover:shadow-sm transition-all cursor-pointer group">
                        <div class="flex justify-between items-center">
                          <span class="text-[12px] font-semibold text-slate-700 group-hover:text-primary transition-colors">{{ account.name }}</span>
                          <span class="text-[12px] font-bold text-slate-900">{{ account.balance | currency:account.currency:'symbol':'1.2-2' }}</span>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>

              <div class="lg:col-span-2">
                <div class="bg-white rounded-xl border border-slate-200 shadow-sm h-full flex flex-col relative overflow-hidden min-h-[500px]">
                  <!-- Header fixed during search -->
                  <div class="p-5 border-b border-slate-100 bg-white z-10">
                    <div class="flex justify-between items-center">
                      <div>
                        <p class="text-slate-500 text-[13px] font-medium">Historial de movimientos</p>
                      </div>
                      <div class="flex items-center gap-3">
                         <div class="relative group">
                           <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg transition-colors group-focus-within:text-primary">search</span>
                           <input 
                             type="text" 
                             placeholder="Buscar movimiento..." 
                             [value]="searchQuery()"
                             (input)="onSearch($event)"
                             class="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 outline-none transition-all w-48 lg:w-64"
                           />
                         </div>
                         <div class="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                           <span class="material-symbols-outlined text-lg">history</span>
                         </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- History Content -->
                  <div class="flex-1 overflow-y-auto relative min-h-[300px]">
                    @if (isHistoryLoading() && history().length === 0) {
                      <div class="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px] z-20">
                        <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                      </div>
                    }

                    <div class="divide-y divide-slate-50" [class.opacity-40]="isHistoryLoading()">
                      @if (history().length === 0 && !isHistoryLoading()) {
                        <div class="p-20 text-center">
                          <div class="size-20 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-6 transform rotate-6">
                            <span class="material-symbols-outlined text-slate-200 text-5xl">receipt_long</span>
                          </div>
                          <p class="text-slate-900 font-black text-lg tracking-tight">Sin resultados</p>
                          <p class="text-slate-400 text-sm mt-1 max-w-[260px] mx-auto leading-relaxed">No hemos encontrado movimientos que coincidan con tu búsqueda.</p>
                        </div>
                      } @else {
                        @for (move of history(); track move.id) {
                          <div class="px-8 py-3 hover:bg-slate-50 transition-all duration-300 flex items-center justify-between gap-6 group border-b border-slate-50 last:border-0">
                            <div class="flex items-center gap-5">
                              <div>
                                <p class="text-[13px] font-black text-slate-900 leading-tight">{{ move.description }}</p>
                                <div class="flex items-center gap-2 mt-1">
                                  <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">{{ move.accountName }}</span>
                                  <span class="size-1 rounded-full bg-slate-200"></span>
                                  <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">{{ move.date | date:'dd MMM, yyyy' }}</span>
                                </div>
                              </div>
                            </div>
                            <div class="text-right">
                              <p class="text-[17px] font-black tracking-tighter" [ngClass]="move.amount > 0 ? 'text-emerald-500' : 'text-slate-900'">
                                {{ move.amount > 0 ? '+' : '' }}{{ move.amount | currency:'EUR':'symbol':'1.2-2' }}
                              </p>
                            </div>
                          </div>
                        }
                      }
                    </div>
                  </div>

                  <!-- Pagination Footer -->
                  <div class="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {{ totalElements() }} resultados
                    </span>
                    
                    <div class="flex items-center gap-2">
                      <button 
                        (click)="changePage(currentPage() - 1)"
                        [disabled]="currentPage() === 0 || isHistoryLoading()"
                        class="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-primary/30 hover:text-primary transition-all disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <span class="material-symbols-outlined text-lg">chevron_left</span>
                      </button>
                      
                      <div class="px-4 py-2 rounded-lg bg-white border border-slate-200 text-[11px] font-black text-slate-900">
                        Página {{ currentPage() + 1 }} de {{ totalPages() || 1 }}
                      </div>

                      <button 
                        (click)="changePage(currentPage() + 1)"
                        [disabled]="currentPage() >= totalPages() - 1 || isHistoryLoading()"
                        class="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-primary/30 hover:text-primary transition-all disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <span class="material-symbols-outlined text-lg">chevron_right</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; }
    .no-scroll-layout { height: 100vh; overflow: hidden; }
  `]
})
export class CashDashboard implements OnInit {
  private readonly cashService = inject(CashService);
  readonly modalService = inject(RegisterMovementModalService);

  readonly accounts = signal<CashAccount[]>([]);
  readonly history = signal<CashMovement[]>([]);
  readonly searchQuery = signal('');
  private readonly searchSubject = new Subject<string>();
  
  // Loading states
  readonly isInitialLoading = signal(true);
  readonly isHistoryLoading = signal(false);
  readonly hasError = signal(false);

  // Pagination states
  readonly currentPage = signal(0);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);
  readonly pageSize = 10;

  readonly totalBalance = computed(() =>
    this.accounts().reduce((sum, acc) => sum + acc.balance, 0)
  );

  ngOnInit(): void {
    this.loadData();
    
    this.modalService.movementRegistered$.subscribe(() => {
      this.loadData(true); // Refresh without full skeleton
    });

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.currentPage.set(0); // Reset to first page on new search
      this.loadData(true);
    });
  }

  onSearch(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.searchSubject.next(query);
  }

  changePage(page: number): void {
    this.currentPage.set(page);
    this.loadData(true);
  }

  loadData(isPartial = false): void {
    if (!isPartial) this.isInitialLoading.set(true);
    else this.isHistoryLoading.set(true);
    
    this.hasError.set(false);

    forkJoin({
      accounts: this.cashService.getAccounts(),
      history: this.cashService.getHistory(this.currentPage(), this.pageSize, this.searchQuery())
    })
      .pipe(finalize(() => {
        this.isInitialLoading.set(false);
        this.isHistoryLoading.set(false);
      }))
      .subscribe({
        next: (res) => {
          this.accounts.set(res.accounts);
          this.history.set(res.history.content);
          this.totalPages.set(res.history.totalPages);
          this.totalElements.set(res.history.totalElements);
        },
        error: (err) => {
          console.error('Error loading cash data:', err);
          this.hasError.set(true);
        }
      });
  }
}
