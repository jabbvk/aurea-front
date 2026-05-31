import { Component, inject, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EditRecurringModalService } from './edit-recurring-modal.service';
import { IncomeService } from '../../services/income.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { AppSelect, SelectOption } from '../../../shared/app-select/app-select';
import { IncomeCategory, Frequency, IncomeRequest } from '../../models/income.model';

@Component({
  selector: 'app-edit-recurring-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppSelect],
  templateUrl: './edit-recurring-modal.html',
  styles: [`
    .modal-backdrop {
      @apply fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-all duration-300;
      animation: fadeIn 0.2s ease-out;
    }
    .modal-panel {
      @apply w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden;
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
  `]
})
export class EditRecurringModal {
  readonly modalService = inject(EditRecurringModalService);
  private readonly incomeService = inject(IncomeService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  isSubmitting = false;

  readonly categoryOptions: SelectOption[] = [
    { value: IncomeCategory.SALARY, label: 'Salario', icon: 'payments' },
    { value: IncomeCategory.FREELANCE, label: 'Freelance', icon: 'work' },
    { value: IncomeCategory.DIVIDENDS, label: 'Dividendos', icon: 'monitoring' },
    { value: IncomeCategory.RENTAL, label: 'Alquiler', icon: 'home' },
    { value: IncomeCategory.INTEREST, label: 'Intereses', icon: 'account_balance' },
    { value: IncomeCategory.GIFT, label: 'Regalo', icon: 'card_giftcard' },
    { value: IncomeCategory.REFUND, label: 'Reembolso', icon: 'undo' },
    { value: IncomeCategory.OTHER, label: 'Otro', icon: 'more_horiz' },
  ];

  readonly frequencyOptions: SelectOption[] = [
    { value: Frequency.DAILY, label: 'Diario', icon: 'calendar_view_day' },
    { value: Frequency.WEEKLY, label: 'Semanal', icon: 'view_week' },
    { value: Frequency.BIWEEKLY, label: 'Quincenal', icon: 'event_note' },
    { value: Frequency.MONTHLY, label: 'Mensual', icon: 'calendar_month' },
    { value: Frequency.QUARTERLY, label: 'Trimestral', icon: 'calendar_view_month' },
    { value: Frequency.YEARLY, label: 'Anual', icon: 'event_upcoming' },
  ];

  editForm = this.fb.nonNullable.group({
    amount: [0, [Validators.required, Validators.min(0.01)]],
    source: ['', [Validators.required]],
    description: [''],
    category: [IncomeCategory.SALARY],
    frequency: [Frequency.MONTHLY]
  });

  constructor() {
    effect(() => {
      const income = this.modalService.selectedIncome();
      if (this.modalService.isOpen() && income) {
        this.editForm.patchValue({
          amount: income.amount,
          source: income.source,
          description: income.description || '',
          category: income.category,
          frequency: income.frequency
        });
      }
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close();
    }
  }

  close(): void {
    if (this.isSubmitting) return;
    this.editForm.reset();
    this.modalService.close();
  }

  onSubmit(): void {
    if (this.editForm.invalid || this.isSubmitting) return;
    const income = this.modalService.selectedIncome();
    if (!income) return;

    this.isSubmitting = true;
    const vals = this.editForm.getRawValue();

    const request: IncomeRequest = {
      amount: vals.amount,
      source: vals.source,
      description: vals.description,
      category: vals.category,
      frequency: vals.frequency
    };

    this.incomeService.updateRecurring(income.id, request).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toastService.success(`Ingreso recurrente actualizado con éxito.`);
        this.modalService.notifyIncomeUpdated();
        this.close();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error updating recurring income:', err);
        const msg = err.error?.message || 'Error al actualizar el ingreso.';
        this.toastService.error(msg);
        this.cdr.markForCheck();
      }
    });
  }
}
