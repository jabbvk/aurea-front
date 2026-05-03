import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sidebar } from '../shared/sidebar/sidebar';
import { ActionButton } from '../shared/action-button/action-button';
import { RegisterMovementModalService } from '../shared/register-movement-modal/register-movement-modal.service';
import { CashService, CashSummary } from './services/cash.service';
import { finalize } from 'rxjs';

import { ErrorState } from '../shared/error-state/error-state';

@Component({
  selector: 'app-cash-dashboard',
  standalone: true,
  imports: [CommonModule, Sidebar, ActionButton, ErrorState],
  template: `
    <div class="bg-background-light text-slate-900 dark:bg-background-dark dark:text-slate-100 font-display transition-colors duration-200 no-scroll-layout flex h-screen w-full overflow-hidden">
      <app-sidebar></app-sidebar>

      <main class="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark relative">
        <header class="sticky top-0 z-20 flex items-center justify-between px-8 py-6 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm">
          <div class="flex items-center gap-4">
            <h2 class="text-xl font-bold text-slate-900 dark:text-white">Efectivo y Liquidez</h2>
          </div>
          <div class="flex items-center gap-4">
            <app-action-button label="Gestionar Efectivo" (action)="modalService.open('cash', true)"></app-action-button>
          </div>
        </header>

        <div class="px-8 pb-12 flex flex-col gap-6 w-full">
          @if (isLoading()) {
            <div class="flex flex-col items-center justify-center py-20">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p class="mt-4 text-slate-500 font-medium">Cargando información de efectivo...</p>
            </div>
          } @else if (hasError()) {
            <div class="flex flex-col items-center justify-center py-20">
              <app-error-state 
                title="Error al cargar los datos" 
                message="No se ha podido cargar la información de liquidez. Por favor, comprueba tu conexión e inténtalo de nuevo."
                (retry)="fetchSummary()">
              </app-error-state>
            </div>
          } @else if (summary(); as s) {
            <!-- Resumen Principal -->
            <div class="bg-white dark:bg-[#2a1a1a] rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
              <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div class="flex flex-col">
                  <p class="text-slate-500 dark:text-slate-400 text-[12px] font-medium">Total Liquidez Disponible</p>
                  <h3 class="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {{ s.totalLiquidCash | currency:'EUR':'symbol':'1.2-2' }}
                  </h3>
                  <div class="flex items-center gap-2 mt-2">
                    <span [ngClass]="s.monthlyChange >= 0 ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-red-600 bg-red-50 dark:bg-red-900/20'" 
                      class="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold">
                      <span class="material-symbols-outlined text-[14px]">
                        {{ s.monthlyChange >= 0 ? 'trending_up' : 'trending_down' }}
                      </span>
                      {{ s.monthlyChange >= 0 ? '+' : '' }}{{ s.monthlyChangePercentage }}%
                    </span>
                    <span class="text-slate-400 text-[11px] font-medium">este mes</span>
                  </div>
                </div>
                
                <div class="bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800 flex gap-1 shadow-inner self-start md:self-center">
                  <button class="px-3 py-1.5 text-[11px] font-bold rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all">1D</button>
                  <button class="px-3 py-1.5 text-[11px] font-bold rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all">1S</button>
                  <button class="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-700 text-primary dark:text-white shadow-md transform scale-105">1M</button>
                  <button class="px-3 py-1.5 text-[11px] font-bold rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all">6M</button>
                  <button class="px-3 py-1.5 text-[11px] font-bold rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all">1A</button>
                  <button class="px-3 py-1.5 text-[11px] font-bold rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all">Todo</button>
                </div>
              </div>
            </div>

            <!-- Listado de Cuentas (Full Width) -->
            <div class="flex flex-col gap-4">
              <!-- Cuenta Principal -->
              <div class="bg-white dark:bg-[#2a1a1a] rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 transition-all">
                <div class="flex justify-between items-start">
                  <div class="flex items-center gap-3">
                    <div class="size-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                      <span class="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                    </div>
                    <div>
                      <p class="text-slate-500 dark:text-slate-400 text-[12px] font-medium">Cuenta Efectivo (Wallet)</p>
                      <h4 class="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {{ s.walletBalance | currency:'EUR':'symbol':'1.2-2' }}
                      </h4>
                    </div>
                  </div>
                  <span class="material-symbols-outlined text-slate-300 dark:text-slate-700">more_vert</span>
                </div>
              </div>

              <!-- Futura integración -->
              <div class="bg-slate-50/50 dark:bg-white/2 rounded-xl p-6 border border-dashed border-slate-300 dark:border-slate-800 flex flex-col md:flex-row items-center gap-6 transition-all">
                <div class="size-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                  <span class="material-symbols-outlined text-slate-400 dark:text-slate-500 text-3xl">account_balance</span>
                </div>
                <div class="text-center md:text-left flex-1">
                  <h5 class="text-slate-900 dark:text-white font-bold flex items-center justify-center md:justify-start gap-2">
                    Multicuenta Bancaria
                    <span class="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[9px] uppercase tracking-wider text-slate-500">Próximamente</span>
                  </h5>
                  <p class="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-xl leading-relaxed">
                    Estamos preparando la integración directa con tus entidades bancarias (Santander, BBVA, Revolut...). 
                    Podrás visualizar y sincronizar automáticamente tus saldos reales, cada uno con su propia configuración de ahorro y objetivos.
                  </p>
                </div>
                <button disabled
                  class="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-xs font-bold transition-all whitespace-nowrap opacity-50 cursor-not-allowed">
                  Vincular ahora (Pronto)
                </button>
              </div>
            </div>

            <!-- Footer: Analytics placeholder -->
            <div class="mt-4 bg-white dark:bg-[#2a1a1a] rounded-xl p-8 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
              <div class="size-16 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-4">
                <span class="material-symbols-outlined text-slate-300 dark:text-slate-700 text-3xl">analytics</span>
              </div>
              <h5 class="text-slate-900 dark:text-white font-bold">Historial de Flujo de Caja</h5>
              <p class="text-slate-500 dark:text-slate-400 text-xs max-w-xs mt-2 leading-relaxed">
                Próximamente podrás visualizar el gráfico de evolución de tu liquidez y tus flujos de entrada/salida aquí.
              </p>
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

  readonly summary = signal<CashSummary | null>(null);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);

  ngOnInit(): void {
    this.fetchSummary();
  }

  fetchSummary(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.cashService.getCashSummary()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => this.summary.set(data),
        error: (err) => {
          console.error('Error fetching cash summary:', err);
          this.hasError.set(true);
        }
      });
  }
}
