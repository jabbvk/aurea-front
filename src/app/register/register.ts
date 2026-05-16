import { Component, inject, ChangeDetectorRef, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './register.html'
})
export class Register {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  // View state: 'register' | 'otp'
  readonly step = signal<'register' | 'otp'>('register');
  
  // Registration Form
  registerForm = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.pattern(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).{8,}$/)]],
    confirmPassword: ['', [Validators.required]]
  }, {
    validators: (group) => {
      const pass = group.get('password')?.value;
      const confirm = group.get('confirmPassword')?.value;
      return pass === confirm ? null : { passwordMismatch: true };
    }
  });

  // OTP Form
  otpForm = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
  });

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;

  onRegister() {
    if (this.registerForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValues = this.registerForm.getRawValue();
    const payload = {
      name: `${formValues.firstName} ${formValues.lastName}`.trim(),
      email: formValues.email,
      password: formValues.password,
      confirmPassword: formValues.confirmPassword
    };

    this.apiService.post<any>('/auth/register', payload)
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.step.set('otp');
          this.successMessage = '¡Registro inicial con éxito! Por favor, introduce el código de 6 dígitos que hemos enviado a tu email.';
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isLoading = false;
          if (err.status === 409) {
            // El usuario ya existe pero quizás no está verificado. Avanzamos al OTP.
            this.step.set('otp');
            this.successMessage = 'Este email ya está registrado. Si aún no has verificado tu cuenta, introduce el código de 6 dígitos.';
          } else {
            this.errorMessage = err.error?.message || 'Error al intentar registrarse. Por favor, intenta de nuevo.';
          }
          this.cdr.markForCheck();
        }
      });
  }

  onVerify() {
    if (this.otpForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const payload = {
      email: this.registerForm.getRawValue().email,
      code: this.otpForm.getRawValue().code
    };

    this.apiService.post<any>('/auth/verify', payload)
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = '¡Cuenta verificada con éxito! Ahora puedes iniciar sesión.';
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 2000);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Código de verificación incorrecto.';
          this.cdr.markForCheck();
        }
      });
  }

  resendCode() {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      email: this.registerForm.getRawValue().email
    };

    this.apiService.post<any>('/auth/otp-resend', payload)
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'Código reenviado correctamente.';
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Error al reenviar el código.';
          this.cdr.markForCheck();
        }
      });
  }
}
