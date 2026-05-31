import { Component, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { Sidebar } from '../shared/sidebar/sidebar';
import { ActionButton } from '../shared/action-button/action-button';
import { FormsModule } from '@angular/forms';
import { inject, OnInit } from '@angular/core';
import { RegisterMovementModalService } from '../shared/register-movement-modal/register-movement-modal.service';
import { EmergencyFundService, EmergencyFundStatus, CalculationMode } from './services/emergency-fund.service';
import { InfoModalService } from '../shared/info-modal/info-modal.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-emergency-fund',
  imports: [CommonModule, Sidebar, ActionButton, FormsModule, CurrencyPipe, DecimalPipe],
  templateUrl: './emergency-fund.html',
})
export class EmergencyFund implements OnInit {
  readonly modalService = inject(RegisterMovementModalService);
  private readonly fundService = inject(EmergencyFundService);
  private readonly infoModalService = inject(InfoModalService);
  private readonly destroyRef = inject(DestroyRef);

  // State signals
  readonly calculationMode = signal<CalculationMode>('VARIABLE');
  readonly desiredMonths = signal<number>(6);
  readonly monthlyExpenses = signal<number>(0);
  readonly currentSavings = signal<number>(0);
  readonly fundActive = signal<boolean>(true);
  readonly lastMonthChange = signal<number>(0);
  readonly manualMonthlyExpense = signal<number | undefined>(undefined);
  readonly isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadFundStatus();

    // Listen for new movements/transfers and reload the entire view
    this.modalService.movementRegistered$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadFundStatus();
      });
  }

  private loadFundStatus() {
    this.isLoading.set(true);
    this.fundService.getFundStatus().subscribe({
      next: (status) => {
        this.calculationMode.set(status.calculationMode);
        this.desiredMonths.set(status.desiredMonths);
        this.monthlyExpenses.set(status.monthlyExpenses);
        this.currentSavings.set(status.currentSavings);
        this.fundActive.set(status.fundActive);
        this.lastMonthChange.set(status.lastMonthChange);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  toggleFundActive() {
    const newValue = !this.fundActive();
    this.fundActive.set(newValue);
    this.fundService.updateConfig({ fundActive: newValue }).subscribe({
      error: (err) => {
        // Rollback if error
        this.fundActive.set(!newValue);
        
        // Show modal if it's the specific validation error
        if (err.error?.message === "No puedes desactivar el fondo de emergencia porque aún tiene saldo. Por favor, transfiere los fondos a otra cuenta primero.") {
          this.infoModalService.open('Acción no permitida', err.error.message);
        } else {
          this.infoModalService.open('Error', 'Ha ocurrido un error al actualizar la configuración.');
        }
      }
    });
  }

  // Computed properties
  readonly targetAmount = computed(() => this.monthlyExpenses() * this.desiredMonths());
  readonly coverageMonths = computed(() => {
    const exp = this.monthlyExpenses();
    return exp > 0 ? (this.currentSavings() / exp) : 0;
  });
  readonly progressPercent = computed(() => {
    const target = this.targetAmount();
    return target > 0 ? (this.currentSavings() / target) * 100 : 0;
  });
  readonly remainingAmount = computed(() => Math.max(0, this.targetAmount() - this.currentSavings()));

  setCalculationMode(mode: CalculationMode) {
    this.calculationMode.set(mode);
    this.fundService.updateConfig({ calculationMode: mode }).subscribe();
  }

  updateMonths(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    const months = parseInt(value, 10);
    this.desiredMonths.set(months);
    this.fundService.updateConfig({ desiredMonths: months }).subscribe();
  }

  updateManualExpense(value: number) {
    this.monthlyExpenses.set(value);
    this.fundService.updateConfig({
      manualMonthlyExpense: value,
      calculationMode: 'MANUAL'
    }).subscribe();
  }

  onAction() {
    console.log('Registrar movimiento');
  }
}
