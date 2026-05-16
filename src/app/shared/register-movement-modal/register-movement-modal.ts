import { Component, inject, ViewChild, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegisterMovementModalService, MOVEMENT_TABS, MovementTab } from './register-movement-modal.service';
import { IncomeForm } from '../../income/components/income-form';
import { ExpenseForm } from '../../expense/components/expense-form';
import { AssetForm } from '../../asset/components/asset-form';
import { DebtForm } from '../../debt/components/debt-form';
import { CashForm } from './cash-form';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../toast/toast.service';
import { CashService, CashTransferRequest } from '../../cash/services/cash.service';

@Component({
  selector: 'app-register-movement-modal',
  imports: [CommonModule, IncomeForm, ExpenseForm, AssetForm, DebtForm, CashForm],
  templateUrl: './register-movement-modal.html',
  styleUrl: './register-movement-modal.css',
})
export class RegisterMovementModal {
  readonly modalService = inject(RegisterMovementModalService);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly cashService = inject(CashService);

  readonly tabs = MOVEMENT_TABS;
  isSubmitting = signal(false);

  @ViewChild(IncomeForm) incomeForm?: IncomeForm;
  @ViewChild(ExpenseForm) expenseForm?: ExpenseForm;
  @ViewChild(AssetForm) assetForm?: AssetForm;
  @ViewChild(DebtForm) debtForm?: DebtForm;
  @ViewChild(CashForm) cashForm?: CashForm;

  @HostListener('window:keydown.escape')
  onEscape(): void {
    if (this.modalService.isOpen()) {
      this.close();
    }
  }

  close(): void {
    this.modalService.close();
    this.resetForms();
  }

  selectTab(tab: MovementTab): void {
    this.modalService.setTab(tab);
  }

  onConfirm(): void {
    const tab = this.modalService.activeTab();

    switch (tab) {
      case 'income':
        if (this.incomeForm?.isValid()) {
          this.submitIncome(this.incomeForm.getFormData());
        } else {
          this.toast.error('El importe debe ser mayor a 0.');
        }
        break;
      case 'expense':
        if (this.expenseForm?.isValid()) {
          this.submitExpense(this.expenseForm.getFormData());
        } else {
          this.toast.error('El importe debe ser mayor a 0.');
        }
        break;
      case 'asset':
        if (this.assetForm?.isValid()) {
          this.submitAsset(this.assetForm.getFormData());
        } else {
          this.toast.error('Completa los campos obligatorios.');
        }
        break;
      case 'debt':
        if (this.debtForm?.isValid()) {
          this.toast.info('Próximamente.');
        }
        break;
      case 'cash':
        if (this.cashForm?.isValid()) {
          this.submitCashMovement(this.cashForm.getFormData());
        } else {
          this.toast.error('El importe debe ser mayor a 0.');
        }
        break;
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close();
    }
  }

  private submitIncome(data: any): void {
    this.isSubmitting.set(true);
    this.api.post('/aurea/incomes', {
      amount: data.amount,
      source: data.source,
      description: data.description,
      category: data.category,
      frequency: data.frequency,
      balanceSource: data.balanceSource,
      cashAccountId: data.cashAccountId || null
    }).subscribe({
      next: () => {
        this.toast.success('Ingreso registrado correctamente.');
        this.isSubmitting.set(false);
        this.modalService.notifyMovementRegistered();
        this.close();
      },
      error: (err) => {
        const errorMsg = err.error?.message || 'Error al registrar el ingreso.';
        this.toast.error(errorMsg);
        this.isSubmitting.set(false);
      },
    });
  }

  private submitExpense(data: any): void {
    this.isSubmitting.set(true);
    this.api.post('/aurea/expenses', {
      amount: data.amount,
      description: data.description,
      category: data.category,
      frequency: data.frequency,
      balanceSource: data.balanceSource,
      cashAccountId: data.cashAccountId || null
    }).subscribe({
      next: () => {
        this.toast.success('Gasto registrado correctamente.');
        this.isSubmitting.set(false);
        this.modalService.notifyMovementRegistered();
        this.close();
      },
      error: (err) => {
        const errorMsg = err.error?.message || 'Error al registrar el gasto.';
        this.toast.error(errorMsg);
        this.isSubmitting.set(false);
      },
    });
  }

  private submitAsset(data: any): void {
    this.isSubmitting.set(true);
    const payload: any = {
      name: data.name,
      type: data.assetClass,
      purchasePrice: data.purchasePrice,
      quantity: data.quantity,
      balanceSource: data.balanceSource,
      cashAccountId: data.cashAccountId || null
    };
    if (data.ticker) {
      payload.ticker = data.ticker;
    }
    this.api.post('/aurea/assets', payload).subscribe({
      next: () => {
        this.toast.success('Activo registrado correctamente.');
        this.isSubmitting.set(false);
        this.modalService.notifyMovementRegistered();
        this.close();
      },
      error: (err) => {
        const errorMsg = err.error?.message || 'Error al registrar el activo.';
        this.toast.error(errorMsg);
        this.isSubmitting.set(false);
      },
    });
  }


  private submitCashMovement(data: CashTransferRequest): void {
    this.isSubmitting.set(true);
    
    this.cashService.transfer(data).subscribe({
      next: () => {
        this.toast.success('Traspaso realizado correctamente.');
        this.isSubmitting.set(false);
        this.modalService.notifyMovementRegistered();
        this.close();
      },
      error: (err) => {
        const errorMsg = err.error?.message || 'Error al realizar el traspaso.';
        this.toast.error(errorMsg);
        this.isSubmitting.set(false);
      },
    });
  }

  private resetForms(): void {
    this.incomeForm?.reset();
    this.expenseForm?.reset();
    this.assetForm?.reset();
    this.debtForm?.reset();
    this.cashForm?.reset();
  }
}
