import { Component, inject, ChangeDetectorRef, OnInit, DestroyRef } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { ToastService } from '../shared/toast/toast.service';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './reset-password.html'
})
export class ResetPassword implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly apiService = inject(ApiService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  token = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  resetForm = this.fb.group({
    password: ['', [
      Validators.required, 
      Validators.pattern(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).{8,}$/)
    ]],
    confirmPassword: ['', [Validators.required]]
  }, {
    validators: (group) => {
      const pass = group.get('password')?.value;
      const confirm = group.get('confirmPassword')?.value;
      return pass === confirm ? null : { passwordMismatch: true };
    }
  });

  ngOnInit() {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (params) => {
          this.token = params['token'] || '';
          if (!this.token) {
            this.errorMessage = 'El token de restablecimiento de contraseña no es válido o no está presente en la URL.';
            this.toastService.error('Token no proporcionado.');
          }
          this.cdr.markForCheck();
        }
      });
  }

  onSubmit() {
    if (this.resetForm.invalid || !this.token) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValues = this.resetForm.getRawValue();
    const payload = {
      token: this.token,
      password: formValues.password,
      confirmPassword: formValues.confirmPassword
    };

    this.apiService.post<any>('/auth/reset-password', payload)
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'Tu contraseña ha sido actualizada correctamente. Serás redirigido al inicio de sesión en unos instantes.';
          this.toastService.success('Contraseña restablecida con éxito.');
          this.cdr.markForCheck();
          
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 3000);
        },
        error: (err) => {
          this.isLoading = false;
          if (err.error && err.error.message) {
            this.errorMessage = err.error.message;
          } else {
            this.errorMessage = 'No se pudo restablecer la contraseña. El enlace puede haber expirado.';
          }
          this.toastService.error(this.errorMessage);
          console.error('Error in reset-password:', err);
          this.cdr.markForCheck();
        }
      });
  }
}
