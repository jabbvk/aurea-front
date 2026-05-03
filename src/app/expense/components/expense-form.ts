import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-expense-form',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Importe -->
        <div class="space-y-1">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300" for="expense-amount">
            Importe
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span class="text-slate-500 font-semibold text-sm">€</span>
            </div>
            <input formControlName="amount" id="expense-amount" type="number" step="0.01" placeholder="0.00"
              class="block w-full pl-8 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white bg-slate-50 dark:bg-[#2a1a1a] focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm font-semibold transition-colors"
              [class.border-red-400]="form.get('amount')?.invalid && form.get('amount')?.touched" />
          </div>
          @if (form.get('amount')?.hasError('min') && form.get('amount')?.touched) {
            <p class="text-xs text-red-500 mt-1">El importe debe ser mayor a 0.</p>
          }
        </div>

        <!-- Categoría -->
        <div class="space-y-1">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300" for="expense-category">
            Categoría
          </label>
          <div class="relative">
            <select formControlName="category" id="expense-category"
              class="block w-full pl-3 pr-10 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white bg-slate-50 dark:bg-[#2a1a1a] focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm appearance-none transition-colors">
              @for (cat of categories; track cat.value) {
                <option [value]="cat.value">{{ cat.label }}</option>
              }
            </select>
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span class="material-symbols-outlined text-slate-400">expand_more</span>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Frecuencia -->
        <div class="space-y-1">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300" for="expense-frequency">
            Frecuencia
          </label>
          <div class="relative">
            <select formControlName="frequency" id="expense-frequency"
              class="block w-full pl-3 pr-10 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white bg-slate-50 dark:bg-[#2a1a1a] focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm appearance-none transition-colors">
              @for (freq of frequencies; track freq.value) {
                <option [value]="freq.value">{{ freq.label }}</option>
              }
            </select>
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span class="material-symbols-outlined text-slate-400">expand_more</span>
            </div>
          </div>
        </div>

        <!-- Descripción -->
        <div class="space-y-1">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300" for="expense-description">
            Descripción <span class="text-slate-400 font-normal">(opcional)</span>
          </label>
          <input formControlName="description" id="expense-description" type="text" placeholder="Ej. MacBook Pro"
            class="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white bg-slate-50 dark:bg-[#2a1a1a] focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-colors" />
        </div>
      </div>

      <!-- Origen del Pago -->
      <div class="space-y-1">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Origen del pago
        </label>
        <div class="grid grid-cols-3 gap-2">
          <label class="relative flex cursor-pointer rounded-lg border p-2.5 focus:outline-none transition-all duration-200"
            [ngClass]="form.get('source')?.value === 'wallet' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#2a1a1a] hover:border-slate-300'">
            <input type="radio" formControlName="source" value="wallet" class="sr-only">
            <div class="flex items-center justify-center gap-2 w-full">
              <span class="material-symbols-outlined text-[18px]" [class.text-primary]="form.get('source')?.value === 'wallet'">payments</span>
              <span class="text-xs font-bold" [class.text-primary]="form.get('source')?.value === 'wallet'">Cuenta Efectivo</span>
            </div>
          </label>
          <label class="relative flex cursor-pointer rounded-lg border p-2.5 focus:outline-none transition-all duration-200"
            [ngClass]="form.get('source')?.value === 'emergency-fund' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#2a1a1a] hover:border-slate-300'">
            <input type="radio" formControlName="source" value="emergency-fund" class="sr-only">
            <div class="flex items-center justify-center gap-2 w-full">
              <span class="material-symbols-outlined text-[18px]" [class.text-primary]="form.get('source')?.value === 'emergency-fund'">savings</span>
              <span class="text-xs font-bold" [class.text-primary]="form.get('source')?.value === 'emergency-fund'">Fondo Emergencia</span>
            </div>
          </label>
          <label class="relative flex cursor-pointer rounded-lg border p-2.5 focus:outline-none transition-all duration-200"
            [ngClass]="form.get('source')?.value === 'external' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#2a1a1a] hover:border-slate-300'">
            <input type="radio" formControlName="source" value="external" class="sr-only">
            <div class="flex items-center justify-center gap-2 w-full">
              <span class="material-symbols-outlined text-[18px]" [class.text-primary]="form.get('source')?.value === 'external'">public</span>
              <span class="text-xs font-bold" [class.text-primary]="form.get('source')?.value === 'external'">Externo</span>
            </div>
          </label>
        </div>
      </div>
    </form>
  `,
})
export class ExpenseForm {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly categories = [
    { value: 'HOUSING', label: 'Vivienda' },
    { value: 'FOOD', label: 'Alimentación' },
    { value: 'TRANSPORT', label: 'Transporte' },
    { value: 'ENTERTAINMENT', label: 'Ocio' },
    { value: 'HEALTH', label: 'Salud' },
    { value: 'EDUCATION', label: 'Educación' },
    { value: 'CLOTHING', label: 'Ropa' },
    { value: 'SUBSCRIPTIONS', label: 'Suscripciones' },
    { value: 'UTILITIES', label: 'Suministros' },
    { value: 'INSURANCE', label: 'Seguros' },
    { value: 'PERSONAL_CARE', label: 'Cuidado Personal' },
    { value: 'GIFTS', label: 'Regalos' },
    { value: 'TRAVEL', label: 'Viajes' },
    { value: 'OTHER', label: 'Otro' },
  ];

  readonly frequencies = [
    { value: 'ONE_TIME', label: 'Puntual' },
    { value: 'DAILY', label: 'Diario' },
    { value: 'WEEKLY', label: 'Semanal' },
    { value: 'BIWEEKLY', label: 'Quincenal' },
    { value: 'MONTHLY', label: 'Mensual' },
    { value: 'QUARTERLY', label: 'Trimestral' },
    { value: 'YEARLY', label: 'Anual' },
  ];

  readonly form = this.fb.group({
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    description: [''],
    category: ['FOOD'],
    frequency: ['ONE_TIME'],
    source: ['wallet'],
  });

  isValid(): boolean {
    this.form.markAllAsTouched();
    return this.form.valid;
  }

  getFormData() {
    return this.form.getRawValue();
  }

  reset(): void {
    this.form.reset({
      amount: null,
      description: '',
      category: 'FOOD',
      frequency: 'ONE_TIME',
      source: 'wallet',
    });
  }
}
