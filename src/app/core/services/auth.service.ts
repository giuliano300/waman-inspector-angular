import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Inspector } from '../models/inspector.models';
import { InspectionService } from './inspection.service';
import { API_BASE } from '../api.config';
import { DeviceIdentityService } from './device-identity.service';

export const SESSION_KEY = 'waman-inspector-session';

interface ApiInspector extends Inspector { authToken: string; }
interface StoredSession { inspector: Inspector; token: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly stored = this.readSession();
  readonly currentInspector = signal<Inspector | null>(this.stored?.inspector ?? null);
  readonly loginError = signal<'credentials' | 'device' | 'network' | null>(null);

  constructor(private http: HttpClient, private router: Router, private inspections: InspectionService, private device: DeviceIdentityService) {}

  isAuthenticated(): boolean { return !!this.currentInspector() && !!this.token(); }
  token(): string | null { return this.readSession()?.token ?? null; }

  async login(email: string, password: string): Promise<boolean> {
    this.loginError.set(null);
    if (!this.device.deviceId()) { this.loginError.set('device'); return false; }
    if (!email.trim() || !password.trim()) { this.loginError.set('credentials'); return false; }
    try {
      const response = await firstValueFrom(this.http.post<ApiInspector>(`${API_BASE}/Inspectors/Login`, { email: email.trim(), pwd: password, deviceId: this.device.deviceId() }));
      if (!response?.id || !response.authToken) { this.loginError.set('credentials'); return false; }
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
      return true;
    } catch (error) {
      this.loginError.set(error instanceof HttpErrorResponse && error.status === 403 ? 'device' : 'network');
      return false;
    }
  }

  async restoreSession(): Promise<boolean> {
    const session = this.readSession();
    if (!session?.token || !session.inspector || !this.device.deviceId()) return false;
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
