import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CashService, CashAccount, CashTransferRequest } from '../../cash/services/cash.service';
import { AppSelect, SelectOption } from '../app-select/app-select';
import { RegisterMovementModalService, ModalOrigin } from './register-movement-modal.service';

@Component({
  selector: 'app-cash-form',
  standalone: true,
  imports: [CommonModule, FormsModule, AppSelect],
  providers: [CurrencyPipe],
  template: `
    <div class="space-y-6">
      <!-- Origen -->
      <app-select 
        label="Desde"
        placeholder="Seleccionar origen"
        [options]="sourceOptions()"
        [value]="sourceSelection()"
        (valueChange)="onSourceChange($event)"
        defaultIcon="logout">
      </app-select>

      <!-- Destino -->
      <app-select 
        label="Hacia"
        placeholder="Seleccionar destino"
        [options]="destinationOptions()"
        [value]="destinationSelection()"
        (valueChange)="destinationSelection.set($event)"
        defaultIcon="login">
      </app-select>

      <!-- Importe -->
      <div class="space-y-1.5">
        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Importe</label>
        <div class="relative group">
          <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span class="text-slate-400 font-black text-sm group-focus-within:text-primary transition-colors">€</span>
          </div>
          <input type="number" [(ngModel)]="amount" step="0.01" placeholder="0.00"
            class="block w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all outline-none shadow-sm hover:border-primary/30">
        </div>
      </div>

      <!-- Descripción -->
      <div class="space-y-1.5">
        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Descripción <span class="text-slate-400 font-normal lowercase">(opcional)</span></label>
        <input type="text" [(ngModel)]="description" placeholder="Ej: Traspaso mensual"
          class="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all outline-none shadow-sm hover:border-primary/30">
      </div>
    </div>
  `,
})
export class CashForm implements OnInit {
  private readonly cashService = inject(CashService);
  private readonly currencyPipe = inject(CurrencyPipe);
  private readonly modalService = inject(RegisterMovementModalService);

  accounts = signal<CashAccount[]>([]);
  
  sourceSelection = signal<string>('');
  destinationSelection = signal<string>('');
  amount = signal<number | null>(null);
  description = signal<string>('');

  sourceOptions = computed(() => {
    return this.accounts().map(acc => ({
      label: acc.name,
      value: acc.id,
      icon: 'account_balance',
      sublabel: `Saldo: ${this.currencyPipe.transform(acc.balance, acc.currency)}`
    }));
  });

  destinationOptions = computed(() => {
    return this.sourceOptions().filter(opt => opt.value !== this.sourceSelection());
  });

  ngOnInit() {
    this.cashService.getAccounts().subscribe(accs => {
      this.accounts.set(accs);
      if (accs.length === 0) return;

      const origin = this.modalService.origin();
      
      // Identificar cuenta de fondo (por flag o por nombre)
      let fundAcc = accs.find(a => a.isEmergencyFund);
      if (!fundAcc) {
        fundAcc = accs.find(a => 
          a.name.toLowerCase().includes('fondo') || 
          a.name.toLowerCase().includes('emergencia')
        );
      }

      // Identificar cuenta de efectivo (la primera que no sea el fondo)
      const cashAcc = accs.find(a => a.id !== fundAcc?.id) || accs[0];

      if (origin === 'emergency-fund') {
        // De Fondo a Efectivo
        if (fundAcc) this.sourceSelection.set(fundAcc.id);
        if (cashAcc && cashAcc.id !== fundAcc?.id) {
          this.destinationSelection.set(cashAcc.id);
        } else {
          // Si solo hay una cuenta, buscar otra para el destino
          const other = accs.find(a => a.id !== this.sourceSelection());
          if (other) this.destinationSelection.set(other.id);
        }
      } else if (origin === 'cash') {
        // De Efectivo a Fondo
        if (cashAcc) this.sourceSelection.set(cashAcc.id);
        if (fundAcc && fundAcc.id !== cashAcc.id) {
          this.destinationSelection.set(fundAcc.id);
        } else {
          const other = accs.find(a => a.id !== this.sourceSelection());
          if (other) this.destinationSelection.set(other.id);
        }
      } else {
        // Lógica genérica (pestaña manual)
        if (accs.length > 1) {
          this.sourceSelection.set(accs[0].id);
          this.destinationSelection.set(accs[1].id);
        } else if (accs.length === 1) {
          this.sourceSelection.set(accs[0].id);
        }
      }
    });
  }

  onSourceChange(newValue: string) {
    this.sourceSelection.set(newValue);
    if (this.sourceSelection() === this.destinationSelection()) {
      const nextAvailable = this.destinationOptions()[0];
      if (nextAvailable) {
        this.destinationSelection.set(nextAvailable.value);
      }
    }
  }

  isValid(): boolean {
    return (this.amount() || 0) > 0;
  }

  getFormData(): CashTransferRequest {
    return {
      fromAccountId: this.sourceSelection(),
      toAccountId: this.destinationSelection(),
      amount: this.amount() || 0,
    };
  }

  reset() {
    this.amount.set(null);
    this.description.set('');
  }
}
