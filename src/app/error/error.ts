import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ErrorState } from '../shared/error-state/error-state';
import { AuthService } from '../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error',
  imports: [RouterLink, ErrorState, CommonModule],
  templateUrl: './error.html',
  styleUrl: './error.css',
})
export class ErrorPage {
  private readonly authService = inject(AuthService);

  get backLink(): string {
    return this.authService.isAuthenticated() ? '/dashboard' : '/';
  }

  handleReload() {
    window.location.reload();
  }
}
