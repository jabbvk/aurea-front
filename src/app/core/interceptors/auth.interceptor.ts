import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../../shared/toast/toast.service';
import { AuthService } from '../services/auth.service';
import { RegisterMovementModalService } from '../../shared/register-movement-modal/register-movement-modal.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toast = inject(ToastService);
  const authService = inject(AuthService);
  const modalService = inject(RegisterMovementModalService);

  const token = authService.getToken();

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401: Unauthorized (Token invalid or expired)
      if (error.status === 401) {
        modalService.close();
        authService.logout();
        toast.error('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
      }

      // 403: Forbidden (Authenticated but no permissions)
      if (error.status === 403) {
        modalService.close();
        authService.logout();
        toast.warning('No tienes permisos para acceder. Se ha cerrado tu sesión.', 5000);
      }

      // 500+: Server Error
      if (error.status >= 500) {
        router.navigate(['/error']);
      }

      return throwError(() => error);
    }),
  );
};
