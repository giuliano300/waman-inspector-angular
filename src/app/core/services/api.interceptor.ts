import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SESSION_KEY } from './auth.service';
import { API_BASE } from '../api.config';

export const apiInterceptor: HttpInterceptorFn = (request, next) => {
  const router = inject(Router);
  let token = '';
  try { token = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? '{}').token ?? ''; } catch { token = ''; }
  const apiRequest = request.url.startsWith(`${API_BASE}/`) && token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(apiRequest).pipe(catchError((error: HttpErrorResponse) => {
    if (error.status === 401 && !request.url.endsWith('/Inspectors/Login')) {
      sessionStorage.removeItem(SESSION_KEY);
      void router.navigateByUrl('/login');
    }
    return throwError(() => error);
  }));
};
