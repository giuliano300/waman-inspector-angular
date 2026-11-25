import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE } from '../api.config';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class TrackingService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  async startMission(): Promise<string> {
    const inspector = this.auth.currentInspector();
    if (!inspector) throw new Error('Inspector session not available.');

    await firstValueFrom(this.http.post(`${API_BASE}/TrackInspectorDemo/Start`, {}));
    return `myapp://myapp/startInspection?inspectorId=${encodeURIComponent(inspector.id)}`;
  }

  async stopMission(): Promise<string> {
    const inspector = this.auth.currentInspector();
    if (!inspector) throw new Error('Inspector session not available.');

    await firstValueFrom(this.http.post(`${API_BASE}/TrackInspectorDemo/Stop`, {}));
    return this.stopIntent();
  }

  stopIntent(): string {
    const inspector = this.auth.currentInspector();
    if (!inspector) throw new Error('Inspector session not available.');
    return `myapp://myapp/stopInspection?inspectorId=${encodeURIComponent(inspector.id)}`;
  }
}
