import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../../shared/toast/toast.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toast = inject(ToastService);

  const token = localStorage.getItem('access_token');

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
      if (error.status === 401) {
        localStorage.removeItem('access_token');
        toast.error('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
        router.navigate(['/']);
      }

      if (error.status === 403) {
        localStorage.removeItem('access_token');
        toast.warning('No tienes permisos para acceder. Se ha cerrado tu sesión.', 5000);
        router.navigate(['/']);
      }

      if (error.status >= 500) {
        router.navigate(['/error']);
      }

      return throwError(() => error);
    }),
  );
};
