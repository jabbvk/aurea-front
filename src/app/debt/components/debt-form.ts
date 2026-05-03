import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-debt-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './debt-form.html',
})
export class DebtForm {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly form = this.fb.group({
    name: ['', [Validators.required]],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    creditor: [''],
    date: [new Date().toISOString().split('T')[0], [Validators.required]],
    description: [''],
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
      name: '',
      amount: null,
      creditor: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
    });
  }
}
