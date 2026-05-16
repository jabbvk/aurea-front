import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly router = inject(Router);
  private readonly TOKEN_KEY = 'access_token';

  /**
   * Checks if the user is authenticated based on the presence of a token.
   * In a real production app, you might also validate the token expiration (JWT).
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    return !!token;
  }

  /**
   * Saves the access token to local storage.
   */
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Removes the token and redirects to login.
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.router.navigate(['/']);
  }

  /**
   * Helper to get the token if needed for interceptors.
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
}
