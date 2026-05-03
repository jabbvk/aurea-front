import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type CashAction = 'deposit' | 'withdraw' | 'transfer';
export type CashBucket = 'wallet' | 'emergency-fund';

@Component({
  selector: 'app-cash-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Tipo de Operación -->
      <div class="space-y-1">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Tipo de Operación</label>
        <div class="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
          <button (click)="action.set('deposit')"
            class="py-2 text-xs font-bold rounded-md transition-all"
            [class.bg-white]="action() === 'deposit'" [class.dark:bg-[#2a1a1a]]="action() === 'deposit'"
            [class.text-primary]="action() === 'deposit'" [class.shadow-sm]="action() === 'deposit'"
            [class.text-slate-500]="action() !== 'deposit'">Ingresar</button>
          <button (click)="action.set('withdraw')"
            class="py-2 text-xs font-bold rounded-md transition-all"
            [class.bg-white]="action() === 'withdraw'" [class.dark:bg-[#2a1a1a]]="action() === 'withdraw'"
            [class.text-primary]="action() === 'withdraw'" [class.shadow-sm]="action() === 'withdraw'"
            [class.text-slate-500]="action() !== 'withdraw'">Retirar</button>
          <button (click)="action.set('transfer')"
            class="py-2 text-xs font-bold rounded-md transition-all"
            [class.bg-white]="action() === 'transfer'" [class.dark:bg-[#2a1a1a]]="action() === 'transfer'"
            [class.text-primary]="action() === 'transfer'" [class.shadow-sm]="action() === 'transfer'"
            [class.text-slate-500]="action() !== 'transfer'">Traspasar</button>
        </div>
      </div>

      <!-- Destino/Origen -->
      <div class="space-y-1">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {{ action() === 'transfer' ? 'Desde' : (action() === 'deposit' ? 'Destino' : 'Origen') }}
        </label>
        <select [(ngModel)]="source" 
          class="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white bg-slate-50 dark:bg-[#2a1a1a] focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm font-semibold transition-colors outline-none appearance-none">
          <option value="wallet">Cuenta en Efectivo</option>
          <option value="emergency-fund">Fondo de Emergencia</option>
        </select>
      </div>

      @if (action() === 'transfer') {
      <div class="space-y-1">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Hacia</label>
        <div class="px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 sm:text-sm font-semibold">
          {{ source() === 'wallet' ? 'Fondo de Emergencia' : 'Cuenta en Efectivo' }}
        </div>
      </div>
      }

      <!-- Importe -->
      <div class="space-y-1">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Importe</label>
        <div class="relative group">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span class="text-slate-500 font-semibold text-sm">€</span>
          </div>
          <input type="number" [(ngModel)]="amount" step="0.01" placeholder="0.00"
            class="block w-full pl-8 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white bg-slate-50 dark:bg-[#2a1a1a] focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm font-semibold transition-colors outline-none">
        </div>
      </div>

      <!-- Descripción -->
      <div class="space-y-1">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Descripción <span class="text-slate-400 font-normal">(opcional)</span></label>
        <input type="text" [(ngModel)]="description" placeholder="Ej: Ajuste de saldo"
          class="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white bg-slate-50 dark:bg-[#2a1a1a] focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-colors outline-none">
      </div>
    </div>
  `
})
export class CashForm {
  action = signal<CashAction>('deposit');
  source = signal<CashBucket>('wallet');
  amount = signal<number | null>(null);
  description = signal<string>('');

  isValid(): boolean {
    return (this.amount() || 0) > 0;
  }

  getFormData() {
    const destination = this.action() === 'transfer' 
      ? (this.source() === 'wallet' ? 'emergency-fund' : 'wallet')
      : null;
      
    return {
      action: this.action(),
      source: this.source(),
      destination,
      amount: this.amount(),
      description: this.description()
    };
  }

  reset() {
    this.action.set('deposit');
    this.source.set('wallet');
    this.amount.set(null);
    this.description.set('');
  }
}
