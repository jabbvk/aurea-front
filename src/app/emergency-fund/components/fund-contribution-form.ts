import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-fund-contribution-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Importe -->
      <div class="space-y-1">
        <label class="block text-sm font-medium text-slate-700">
          Importe a Aportar
        </label>
        <div class="relative group">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span class="text-slate-500 font-semibold text-sm">€</span>
          </div>
          <input 
            type="number" 
            [(ngModel)]="amount"
            step="0.01"
            placeholder="0.00"
            class="block w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm font-semibold transition-colors outline-none"
          >
        </div>
      </div>

      <!-- Descripción -->
      <div class="space-y-1">
        <label class="block text-sm font-medium text-slate-700">
          Descripción <span class="text-slate-400 font-normal">(opcional)</span>
        </label>
        <input 
          type="text"
          [(ngModel)]="description"
          placeholder="Ej: Ahorro mensual"
          class="block w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-colors outline-none"
        >
      </div>

      <div class="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <div class="flex gap-3">
          <span class="material-symbols-outlined text-blue-600 text-[20px]">info</span>
          <p class="text-xs text-blue-800 leading-relaxed">
            Esta aportación se sumará a tu fondo de emergencia actual y actualizará tu progreso automáticamente.
          </p>
        </div>
      </div>
    </div>
  `
})
export class FundContributionForm {
  amount: number | null = null;
  description: string = '';

  isValid(): boolean {
    return (this.amount || 0) > 0;
  }

  getFormData() {
    return {
      amount: this.amount,
      description: this.description
    };
  }

  reset() {
    this.amount = null;
    this.description = '';
  }
}
