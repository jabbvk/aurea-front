import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { ComingSoonService } from '../shared/coming-soon-modal/coming-soon-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.html'
})
export class Login {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly comingSoonService = inject(ComingSoonService);

  loginForm = this.fb.group({
    email: ['javiertarancon777@gmail.com', [Validators.required, Validators.email]],
    password: ['asdasdfj34723JDF·$·$', [Validators.required]]
  });

  isLoading = false;
  errorMessage = '';
  showPassword = false;

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.post<{ token: string }>('/auth/login', this.loginForm.getRawValue())
      .subscribe({
        next: (response) => {
          if (response.token) {
            localStorage.setItem('access_token', response.token);
            this.router.navigate(['/dashboard']);
          } else {
            // Failsafe condition
            this.isLoading = false;
            this.errorMessage = 'El servidor no devolvió el token de acceso.';
          }
        },
        error: (err) => {
          this.isLoading = false;
          // Capture the 'message' from the backend error payload
          if (err.error && err.error.message) {
            this.errorMessage = err.error.message;
          } else {
            this.errorMessage = 'Correo o contraseña incorrectos. Por favor, intenta de nuevo.';
          }
          console.error('Error in login:', err);
          this.cdr.markForCheck();
        }
      });
  }
}
