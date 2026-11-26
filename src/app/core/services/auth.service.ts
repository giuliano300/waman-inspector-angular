import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Inspector } from '../models/inspector.models';
import { InspectionService } from './inspection.service';
import { API_BASE } from '../api.config';

export const SESSION_KEY = 'waman-inspector-session-v2';
const LEGACY_SESSION_KEYS = ['waman-inspector-session'];
export type LoginResult = 'success' | 'invalid-credentials' | 'device-not-authorized';

interface ApiInspector extends Inspector { authToken: string; }
interface StoredSession { inspector: Inspector; token: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly stored = this.readSession();
  readonly currentInspector = signal<Inspector | null>(this.stored?.inspector ?? null);

  constructor(private http: HttpClient, private router: Router, private inspections: InspectionService) {
    for (const key of LEGACY_SESSION_KEYS) sessionStorage.removeItem(key);
  }

  isAuthenticated(): boolean { return !!this.currentInspector() && !!this.token(); }
  token(): string | null { return this.readSession()?.token ?? null; }

  async login(email: string, password: string, deviceId: string): Promise<LoginResult> {
    if (!email.trim() || !password.trim()) return 'invalid-credentials';
    try {
      const response = await firstValueFrom(this.http.post<ApiInspector>(`${API_BASE}/Inspectors/Login`, {
        email: email.trim(),
        pwd: password,
        deviceId
      }));
      if (!response?.id || !response.authToken) return 'invalid-credentials';
      const inspector: Inspector = {
        id: response.id,
        name: response.name,
        lastName: response.lastName,
        email: response.email,
        inspectorCodeId: response.inspectorCodeId
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ inspector, token: response.authToken } satisfies StoredSession));
      this.inspections.reset();
      this.currentInspector.set(inspector);
      return 'success';
    } catch (error: unknown) {
      const status = typeof error === 'object' && error !== null && 'status' in error
        ? Number((error as { status: unknown }).status)
        : 0;
      return status === 403 ? 'device-not-authorized' : 'invalid-credentials';
    }
  }

  async restoreSession(): Promise<boolean> {
    const session = this.readSession();
    if (!session?.token || !session.inspector) return false;
    try {
      await firstValueFrom(this.http.get(`${API_BASE}/Inspectors/${session.inspector.id}`));
      this.currentInspector.set(session.inspector);
      return true;
    } catch {
      this.clearSession();
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.token()) await firstValueFrom(this.http.post(`${API_BASE}/Authentication/Logout`, {}));
    } finally {
      this.clearSession();
      await this.router.navigateByUrl('/login');
    }
  }

  clearSession(): void {
    sessionStorage.removeItem(SESSION_KEY);
    this.currentInspector.set(null);
    this.inspections.reset();
  }

  private readSession(): StoredSession | null {
    try {
      const value = sessionStorage.getItem(SESSION_KEY);
      if (!value) return null;
      const parsed = JSON.parse(value) as StoredSession;
      return parsed?.inspector && parsed?.token ? parsed : null;
    } catch { return null; }
  }
}
