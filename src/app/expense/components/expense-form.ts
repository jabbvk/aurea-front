import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { CashService, CashAccount } from '../../cash/services/cash.service';
import { AppSelect, SelectOption } from '../../shared/app-select/app-select';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppSelect],
  providers: [CurrencyPipe],
  template: `
    <form [formGroup]="form" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Importe -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1" for="expense-amount">
            Importe
          </label>
          <div class="relative group">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span class="text-slate-400 font-black text-sm group-focus-within:text-primary transition-colors">€</span>
            </div>
            <input formControlName="amount" id="expense-amount" type="number" step="0.01" placeholder="0.00"
              class="block w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all outline-none shadow-sm hover:border-primary/30"
              [class.border-red-400]="form.get('amount')?.invalid && form.get('amount')?.touched" />
          </div>
          @if (form.get('amount')?.hasError('min') && form.get('amount')?.touched) {
            <p class="text-[10px] text-red-500 font-bold ml-1">El importe debe ser mayor a 0.</p>
          }
        </div>

        <!-- Categoría -->
        <app-select 
          label="Categoría"
          [options]="categoryOptions"
          [value]="form.get('category')?.value"
          (valueChange)="form.patchValue({category: $event})"
          defaultIcon="category">
        </app-select>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Frecuencia -->
        <app-select 
          label="Frecuencia"
          [options]="frequencyOptions"
          [value]="form.get('frequency')?.value"
          (valueChange)="form.patchValue({frequency: $event})"
          defaultIcon="event_repeat">
        </app-select>

        <!-- Descripción -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1" for="expense-description">
            Descripción <span class="text-slate-400 font-normal lowercase">(opcional)</span>
          </label>
          <input formControlName="description" id="expense-description" type="text" placeholder="Ej. MacBook Pro"
            class="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all outline-none shadow-sm hover:border-primary/30" />
        </div>
      </div>

      <!-- Origen del Pago -->
      <div class="space-y-3">
        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
          Origen del pago
        </label>
        <div class="grid grid-cols-2 gap-3">
          <label class="relative flex cursor-pointer rounded-2xl border p-4 focus:outline-none transition-all duration-300"
            [ngClass]="form.get('balanceSource')?.value === 'ACCOUNT' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'">
            <input type="radio" formControlName="balanceSource" value="ACCOUNT" class="sr-only">
            <div class="flex flex-col items-center gap-2 w-full">
              <span class="material-symbols-outlined text-[24px]" [class.text-primary]="form.get('balanceSource')?.value === 'ACCOUNT'">payments</span>
              <span class="text-xs font-black uppercase tracking-widest" [class.text-primary]="form.get('balanceSource')?.value === 'ACCOUNT'">Efectivo</span>
            </div>
          </label>
          <label class="relative flex cursor-pointer rounded-2xl border p-4 focus:outline-none transition-all duration-300"
            [ngClass]="form.get('balanceSource')?.value === 'EXTERNAL' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'">
            <input type="radio" formControlName="balanceSource" value="EXTERNAL" class="sr-only">
            <div class="flex flex-col items-center gap-2 w-full">
              <span class="material-symbols-outlined text-[24px]" [class.text-primary]="form.get('balanceSource')?.value === 'EXTERNAL'">public</span>
              <span class="text-xs font-black uppercase tracking-widest" [class.text-primary]="form.get('balanceSource')?.value === 'EXTERNAL'">Externo</span>
            </div>
          </label>
        </div>
      </div>

      <!-- Selección de Cuenta (Solo si origen es ACCOUNT) -->
      @if (form.get('balanceSource')?.value === 'ACCOUNT') {
        <div class="animate-in fade-in slide-in-from-top-2 duration-300">
          <app-select 
            label="Seleccionar Cuenta"
            placeholder="Elegir cuenta de pago"
            [options]="accountOptions()"
            [value]="form.get('cashAccountId')?.value"
            (valueChange)="form.patchValue({cashAccountId: $event})"
            defaultIcon="account_balance">
          </app-select>
        </div>
      }
    </form>
  `,
})
export class ExpenseForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly cashService = inject(CashService);
  private readonly currencyPipe = inject(CurrencyPipe);

  readonly accounts = signal<CashAccount[]>([]);

  readonly categoryOptions: SelectOption[] = [
    { value: 'HOUSING', label: 'Vivienda', icon: 'home' },
    { value: 'FOOD', label: 'Alimentación', icon: 'restaurant' },
    { value: 'TRANSPORT', label: 'Transporte', icon: 'directions_car' },
    { value: 'ENTERTAINMENT', label: 'Ocio', icon: 'celebration' },
    { value: 'HEALTH', label: 'Salud', icon: 'medical_services' },
    { value: 'EDUCATION', label: 'Educación', icon: 'school' },
    { value: 'CLOTHING', label: 'Ropa', icon: 'checkroom' },
    { value: 'SUBSCRIPTIONS', label: 'Suscripciones', icon: 'subscriptions' },
    { value: 'UTILITIES', label: 'Suministros', icon: 'bolt' },
    { value: 'INSURANCE', label: 'Seguros', icon: 'security' },
    { value: 'PERSONAL_CARE', label: 'Cuidado Personal', icon: 'face' },
    { value: 'GIFTS', label: 'Regalos', icon: 'redeem' },
    { value: 'TRAVEL', label: 'Viajes', icon: 'flight' },
    { value: 'OTHER', label: 'Otro', icon: 'more_horiz' },
  ];

  readonly frequencyOptions: SelectOption[] = [
    { value: 'ONE_TIME', label: 'Puntual', icon: 'event' },
    { value: 'DAILY', label: 'Diario', icon: 'calendar_view_day' },
    { value: 'WEEKLY', label: 'Semanal', icon: 'view_week' },
    { value: 'BIWEEKLY', label: 'Quincenal', icon: 'event_note' },
    { value: 'MONTHLY', label: 'Mensual', icon: 'calendar_month' },
    { value: 'QUARTERLY', label: 'Trimestral', icon: 'calendar_view_month' },
    { value: 'YEARLY', label: 'Anual', icon: 'event_upcoming' },
  ];

  accountOptions = computed(() => {
    return this.accounts().map(acc => ({
      label: acc.name,
      value: acc.id,
      icon: 'account_balance',
      sublabel: `Saldo disponible: ${this.currencyPipe.transform(acc.balance, acc.currency)}`
    }));
  });

  readonly form = this.fb.group({
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    description: [''],
    category: ['FOOD'],
    frequency: ['ONE_TIME'],
    balanceSource: ['ACCOUNT'],
    cashAccountId: [''],
  });

  ngOnInit(): void {
    this.cashService.getAccounts().subscribe(accs => {
      this.accounts.set(accs);
      if (accs.length > 0 && !this.form.get('cashAccountId')?.value) {
        this.form.patchValue({ cashAccountId: accs[0].id });
      }
    });
  }

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
      balanceSource: 'ACCOUNT',
      cashAccountId: this.accounts().length > 0 ? this.accounts()[0].id : '',
    });
  }
}
