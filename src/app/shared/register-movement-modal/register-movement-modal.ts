import { Component, inject, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegisterMovementModalService, MOVEMENT_TABS, MovementTab } from './register-movement-modal.service';
import { IncomeForm } from '../../income/components/income-form';
import { ExpenseForm } from '../../expense/components/expense-form';
import { AssetForm } from '../../asset/components/asset-form';
import { DebtForm } from '../../debt/components/debt-form';
import { FundContributionForm } from '../../emergency-fund/components/fund-contribution-form';
import { CashForm } from './cash-form';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../toast/toast.service';

@Component({
  selector: 'app-register-movement-modal',
  imports: [CommonModule, IncomeForm, ExpenseForm, AssetForm, DebtForm, FundContributionForm, CashForm],
  templateUrl: './register-movement-modal.html',
  styleUrl: './register-movement-modal.css',
})
export class RegisterMovementModal {
  readonly modalService = inject(RegisterMovementModalService);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly tabs = MOVEMENT_TABS;
  isSubmitting = false;

  @ViewChild(IncomeForm) incomeForm?: IncomeForm;
  @ViewChild(ExpenseForm) expenseForm?: ExpenseForm;
  @ViewChild(AssetForm) assetForm?: AssetForm;
  @ViewChild(DebtForm) debtForm?: DebtForm;
  @ViewChild(FundContributionForm) fundForm?: FundContributionForm;
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
        }
        break;
      case 'expense':
        if (this.expenseForm?.isValid()) {
          this.submitExpense(this.expenseForm.getFormData());
        }
        break;
      case 'asset':
        if (this.assetForm?.isValid()) {
          this.submitAsset(this.assetForm.getFormData());
        }
        break;
      case 'debt':
        if (this.debtForm?.isValid()) {
          this.toast.info('Registro de deudas próximamente.');
        }
        break;
      case 'emergency-fund':
        if (this.fundForm?.isValid()) {
          this.submitFundContribution(this.fundForm.getFormData());
        }
        break;
      case 'cash':
        if (this.cashForm?.isValid()) {
          this.submitCashMovement(this.cashForm.getFormData());
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
    this.isSubmitting = true;
    this.api.post('/aurea/incomes', {
      amount: data.amount,
      source: data.source,
      description: data.description,
      category: data.category,
      frequency: data.frequency,
    }).subscribe({
      next: () => {
        this.toast.success('Ingreso registrado correctamente.');
        this.isSubmitting = false;
        this.modalService.notifyMovementRegistered();
        this.close();
      },
      error: () => {
        this.toast.error('Error al registrar el ingreso.');
        this.isSubmitting = false;
      },
    });
  }

  private submitExpense(data: any): void {
    this.isSubmitting = true;
    this.api.post('/aurea/expenses', {
      amount: data.amount,
      description: data.description,
      category: data.category,
      frequency: data.frequency,
    }).subscribe({
      next: () => {
        this.toast.success('Gasto registrado correctamente.');
        this.isSubmitting = false;
        this.modalService.notifyMovementRegistered();
        this.close();
      },
      error: () => {
        this.toast.error('Error al registrar el gasto.');
        this.isSubmitting = false;
      },
    });
  }

  private submitAsset(data: any): void {
    this.isSubmitting = true;
    const payload: any = {
      name: data.name,
      assetClass: data.assetClass,
      purchasePrice: data.purchasePrice,
      quantity: data.quantity,
      payFromWallet: data.payFromWallet,
    };
    if (data.ticker) {
      payload.ticker = data.ticker;
    }
    this.api.post('/aurea/assets', payload).subscribe({
      next: () => {
        this.toast.success('Activo registrado correctamente.');
        this.isSubmitting = false;
        this.modalService.notifyMovementRegistered();
        this.close();
      },
      error: () => {
        this.toast.error('Error al registrar el activo.');
        this.isSubmitting = false;
      },
    });
  }

  private submitFundContribution(data: any): void {
    this.isSubmitting = true;
    this.api.post('/aurea/emergency-fund/contributions', {
      amount: data.amount,
      description: data.description,
    }).subscribe({
      next: () => {
        this.toast.success('Aportación registrada correctamente.');
        this.isSubmitting = false;
        this.modalService.notifyMovementRegistered();
        this.close();
      },
      error: () => {
        this.toast.error('Error al registrar la aportación.');
        this.isSubmitting = false;
      },
    });
  }

  private submitCashMovement(data: any): void {
    this.isSubmitting = true;
    this.api.post('/aurea/cash/movements', data).subscribe({
      next: () => {
        this.toast.success('Movimiento de efectivo registrado.');
        this.isSubmitting = false;
        this.modalService.notifyMovementRegistered();
        this.close();
      },
      error: () => {
        this.toast.error('Error al registrar el movimiento.');
        this.isSubmitting = false;
      },
    });
  }

  private resetForms(): void {
    this.incomeForm?.reset();
    this.expenseForm?.reset();
    this.assetForm?.reset();
    this.debtForm?.reset();
    this.fundForm?.reset();
    this.cashForm?.reset();
  }
}
