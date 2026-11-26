import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SESSION_KEY } from './auth.service';
import { API_BASE } from '../api.config';
import { DeviceIdentityService } from './device-identity.service';

export const apiInterceptor: HttpInterceptorFn = (request, next) => {
  const router = inject(Router);
  const device = inject(DeviceIdentityService);
  let token = '';
  try { token = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? '{}').token ?? ''; } catch { token = ''; }
  const isApiRequest = request.url.startsWith(`${API_BASE}/`);
  const headers: Record<string, string> = {};
  if (device.deviceId()) headers['X-Waman-Device-Id'] = device.deviceId();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const apiRequest = isApiRequest && Object.keys(headers).length ? request.clone({ setHeaders: headers }) : request;

  return next(apiRequest).pipe(catchError((error: HttpErrorResponse) => {
    if (error.status === 401 && !request.url.endsWith('/Inspectors/Login')) {
      sessionStorage.removeItem(SESSION_KEY);
      void router.navigateByUrl('/login');
    }
    return throwError(() => error);
  }));
};
