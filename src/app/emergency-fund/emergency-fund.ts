import { Component, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { Sidebar } from '../shared/sidebar/sidebar';
import { ActionButton } from '../shared/action-button/action-button';
import { FormsModule } from '@angular/forms';
import { inject } from '@angular/core';
import { RegisterMovementModalService } from '../shared/register-movement-modal/register-movement-modal.service';

@Component({
  selector: 'app-emergency-fund',
  imports: [CommonModule, Sidebar, ActionButton, FormsModule, CurrencyPipe, DecimalPipe],
  templateUrl: './emergency-fund.html',
})
export class EmergencyFund {
  readonly modalService = inject(RegisterMovementModalService);

  // State signals
  readonly calculationMode = signal<'fixed' | 'variable' | 'manual'>('variable');
  readonly desiredMonths = signal<number>(6);
  readonly monthlyExpenses = signal<number>(4166);
  readonly currentSavings = signal<number>(15000);
  readonly isFundActive = signal<boolean>(true);
  readonly showTip = signal<boolean>(true);

  toggleFundActive() {
    this.isFundActive.update(v => !v);
  }

  // Computed properties
  readonly targetAmount = computed(() => this.monthlyExpenses() * this.desiredMonths());
  readonly coverageMonths = computed(() => this.currentSavings() / this.monthlyExpenses());
  readonly progressPercent = computed(() => (this.currentSavings() / this.targetAmount()) * 100);
  readonly remainingAmount = computed(() => Math.max(0, this.targetAmount() - this.currentSavings()));

  setCalculationMode(mode: 'fixed' | 'variable' | 'manual') {
    this.calculationMode.set(mode);
  }

  updateMonths(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.desiredMonths.set(parseInt(value, 10));
  }

  closeTip() {
    this.showTip.set(false);
  }

  onAction() {
    console.log('Registrar movimiento');
  }
}
