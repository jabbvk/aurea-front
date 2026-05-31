import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { ToastService } from '../shared/toast/toast.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './forgot-password.html'
})
export class ForgotPassword {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly apiService = inject(ApiService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  forgotForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  onSubmit() {
    if (this.forgotForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = this.forgotForm.getRawValue();

    this.apiService.post<any>('/auth/forgot-password', payload)
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'Si el correo existe, te hemos enviado un enlace para restablecer tu contraseña.';
          this.toastService.success('Enlace de recuperación enviado.');
          this.forgotForm.reset();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isLoading = false;
          if (err.error && err.error.message) {
            this.errorMessage = err.error.message;
          } else {
            this.errorMessage = 'No se pudo enviar el correo de recuperación. Por favor, intenta de nuevo.';
          }
          this.toastService.error(this.errorMessage);
          console.error('Error in forgot-password:', err);
          this.cdr.markForCheck();
        }
      });
  }
}
