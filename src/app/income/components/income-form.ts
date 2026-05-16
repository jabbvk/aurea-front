import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { CashService, CashAccount } from '../../cash/services/cash.service';
import { AppSelect, SelectOption } from '../../shared/app-select/app-select';

@Component({
  selector: 'app-income-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppSelect],
  providers: [CurrencyPipe],
  template: `
    <form [formGroup]="form" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Importe -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1" for="income-amount">
            Importe
          </label>
          <div class="relative group">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span class="text-slate-400 font-black text-sm group-focus-within:text-primary transition-colors">€</span>
            </div>
            <input formControlName="amount" id="income-amount" type="number" step="0.01" placeholder="0.00"
              class="block w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all outline-none shadow-sm hover:border-primary/30"
              [class.border-red-400]="form.get('amount')?.invalid && form.get('amount')?.touched" />
          </div>
          @if (form.get('amount')?.hasError('min') && form.get('amount')?.touched) {
            <p class="text-[10px] text-red-500 font-bold ml-1">El importe debe ser mayor a 0.</p>
          }
        </div>

        <!-- Fuente -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1" for="income-source">
            Fuente
          </label>
          <div class="relative group">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span class="material-symbols-outlined text-slate-400 text-lg group-focus-within:text-primary transition-colors">business</span>
            </div>
            <input formControlName="source" id="income-source" type="text" placeholder="Ej. Empresa XYZ"
              class="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all outline-none shadow-sm hover:border-primary/30"
              [class.border-red-400]="form.get('source')?.invalid && form.get('source')?.touched" />
          </div>
          @if (form.get('source')?.invalid && form.get('source')?.touched) {
            <p class="text-[10px] text-red-500 font-bold ml-1">La fuente es obligatoria.</p>
          }
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Categoría -->
        <app-select 
          label="Categoría"
          [options]="categoryOptions"
          [value]="form.get('category')?.value"
          (valueChange)="form.patchValue({category: $event})"
          defaultIcon="category">
        </app-select>

        <!-- Frecuencia -->
        <app-select 
          label="Frecuencia"
          [options]="frequencyOptions"
          [value]="form.get('frequency')?.value"
          (valueChange)="form.patchValue({frequency: $event})"
          defaultIcon="event_repeat">
        </app-select>
      </div>

      <!-- Destino -->
      <app-select 
        label="Cuenta de destino"
        placeholder="Seleccionar cuenta"
        [options]="accountOptions()"
        [value]="form.get('cashAccountId')?.value"
        (valueChange)="form.patchValue({cashAccountId: $event})"
        defaultIcon="account_balance">
      </app-select>

      <!-- Descripción -->
      <div class="space-y-1.5">
        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1" for="income-description">
          Descripción <span class="text-slate-400 font-normal lowercase">(opcional)</span>
        </label>
        <input formControlName="description" id="income-description" type="text" placeholder="Ej. Nómina mensual"
          class="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all outline-none shadow-sm hover:border-primary/30" />
      </div>
    </form>
  `,
})
export class IncomeForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly cashService = inject(CashService);
  private readonly currencyPipe = inject(CurrencyPipe);

  readonly accounts = signal<CashAccount[]>([]);

  readonly categoryOptions: SelectOption[] = [
    { value: 'SALARY', label: 'Salario', icon: 'payments' },
    { value: 'FREELANCE', label: 'Freelance', icon: 'work' },
    { value: 'DIVIDENDS', label: 'Dividendos', icon: 'monitoring' },
    { value: 'RENTAL', label: 'Alquiler', icon: 'home' },
    { value: 'INTEREST', label: 'Intereses', icon: 'account_balance' },
    { value: 'GIFT', label: 'Regalo', icon: 'card_giftcard' },
    { value: 'REFUND', label: 'Reembolso', icon: 'undo' },
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
      sublabel: `Saldo actual: ${this.currencyPipe.transform(acc.balance, acc.currency)}`
    }));
  });

  readonly form = this.fb.group({
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    source: ['', [Validators.required]],
    description: [''],
    category: ['SALARY'],
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
      source: '',
      description: '',
      category: 'SALARY',
      frequency: 'ONE_TIME',
      balanceSource: 'ACCOUNT',
      cashAccountId: this.accounts().length > 0 ? this.accounts()[0].id : '',
    });
  }
}
