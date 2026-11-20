import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ArchiveResult, Inspection, Notice } from '../models/inspector.models';
import { API_BASE, API_ORIGIN } from '../api.config';

interface LegacyPlanning {
  id: number; inspectorId: number; date: string; time: unknown; closed: boolean; deleted: boolean;
  confirm: boolean; comments?: string; reportFilePath?: string; entityComment?: string;
  signature?: string; inspectorAbsenceComment?: string; sendReportToAdministration: boolean;
}
interface LegacyDetail {
  worker: { id: number; idCardNumber?: string; name?: string; lastName?: string; mobile?: string; jobTypeId: number };
  det: { id: number; timeSheet?: boolean; foundAtWork?: boolean; otherIssues?: string; signature?: string };
  jobTypeName?: string;
}
type LegacyCollection<T> = T[] | { $values?: T[] } | null | undefined;
interface LegacyInspection {
  inspectorPlanning: LegacyPlanning;
  location?: { name?: string; address?: string; entityRapresentative?: string; jobTitle?: string };
  city?: { name?: string };
  details?: LegacyCollection<LegacyDetail>;
  workers?: LegacyCollection<{ workerId: number; jobTypeName?: string }>;
}
interface LegacyNotice { id: number; date: string; name: string; description: string; }
interface LegacyArchiveResponse { items: LegacyCollection<LegacyInspection>; total: number; page: number; pageSize: number; }

@Injectable({ providedIn: 'root' })
export class InspectionService {
  private readonly todayState = signal<Inspection[]>([]);
  private readonly archiveState = signal<Inspection[]>([]);
  private readonly noticeState = signal<Notice[]>([]);
  private readonly cache = new Map<number, Inspection>();
  private todayLoaded = false;
  private todayRequest?: Promise<Inspection[]>;
  private noticesLoaded = false;
  private noticesRequest?: Promise<Notice[]>;
  private readonly archiveCache = new Map<string, ArchiveResult>();
  private archiveEndpointAvailable: boolean | undefined;

  readonly inspections = this.todayState.asReadonly();
  readonly archivedInspections = this.archiveState.asReadonly();
  readonly notices = this.noticeState.asReadonly();
  readonly loading = signal(false);
  readonly error = signal('');
  private pendingRequests = 0;

  constructor(private http: HttpClient) {}

  today(): Inspection[] { return this.todayState(); }
  archive(): Inspection[] { return this.archiveState(); }
  byId(id: number): Inspection | undefined { return this.cache.get(id) ?? this.todayState().find(item => item.id === id) ?? this.archiveState().find(item => item.id === id); }

  reset(): void {
    this.todayState.set([]);
    this.archiveState.set([]);
    this.noticeState.set([]);
    this.cache.clear();
    this.archiveCache.clear();
    this.todayLoaded = false;
    this.noticesLoaded = false;
  }

  async loadToday(force = false): Promise<Inspection[]> {
    if (!force && this.todayLoaded) return this.todayState();
    if (this.todayRequest) return this.todayRequest;
    const request = this.withLoading(async () => {
      const inspectorId = this.inspectorId();
      const now = new Date();
      const params = new HttpParams().set('inspectorId', inspectorId).set('day', now.getDate()).set('month', now.getMonth() + 1).set('year', now.getFullYear());
      const raw = await firstValueFrom(this.http.get<LegacyCollection<LegacyInspection>>(`${API_BASE}/InspectorPlannings`, { params }));
      const items = this.unwrapCollection(raw).map(item => this.mapInspection(item)).filter(item => item.status === 'pending');
      items.forEach(item => this.cache.set(item.id, item));
      this.todayState.set(items);
      this.todayLoaded = true;
      return items;
    });
    this.todayRequest = request;
    try { return await request; }
    finally { this.todayRequest = undefined; }
  }

  async loadArchive(month: number, year: number, locationName = '', page = 0, pageSize = 25): Promise<ArchiveResult> {
    const cacheKey = `${this.inspectorId()}|${month}|${year}|${locationName.toLowerCase()}|${page}|${pageSize}`;
    const cached = this.archiveCache.get(cacheKey);
    if (cached) {
      this.archiveState.set(cached.items);
      return cached;
    }
    return this.withLoading(async () => {
      const common = { inspectorId: this.inspectorId(), month, year, locationName };
      let rawItems: LegacyInspection[] = [];
      let total = 0;

      if (this.archiveEndpointAvailable !== false) {
        try {
          const params = new HttpParams({ fromObject: { ...common, page, pageSize } });
          const response = await firstValueFrom(this.http.get<LegacyArchiveResponse>(`${API_BASE}/InspectorPlannings/Archive`, { params }));
          rawItems = this.unwrapCollection(response?.items);
          total = response?.total ?? 0;
          this.archiveEndpointAvailable = true;
        } catch (error) {
          if (!(error instanceof HttpErrorResponse) || error.status !== 404) throw error;
          this.archiveEndpointAvailable = false;
        }
      }

      if (this.archiveEndpointAvailable === false) {
        const itemParams = new HttpParams({ fromObject: { ...common, pagination: true, page, pagesize: pageSize, closed: true } });
        const countParams = new HttpParams({ fromObject: common });
        [rawItems, total] = await Promise.all([
          firstValueFrom(this.http.get<LegacyCollection<LegacyInspection>>(`${API_BASE}/InspectorPlannings`, { params: itemParams })).then(items => this.unwrapCollection(items)),
          firstValueFrom(this.http.get<number>(`${API_BASE}/InspectorPlannings/TotalItems`, { params: countParams }))
        ]);
      }

      const items = (rawItems ?? []).map(item => this.mapInspection(item));
      items.forEach(item => this.cache.set(item.id, item));
      this.archiveState.set(items);
      const result = { items, total: total ?? items.length, page, pageSize };
      this.archiveCache.set(cacheKey, result);
      return result;
    });
  }

  async loadInspection(id: number, force = false): Promise<Inspection> {
    const cached = this.cache.get(id);
    if (cached && !force && cached.workers.length) return cached;
    return this.withLoading(async () => {
      const raw = await firstValueFrom(this.http.get<LegacyInspection>(`${API_BASE}/InspectorPlannings/${id}`));
      const inspection = this.mapInspection(raw);
      this.cache.set(id, inspection);
      return inspection;
    });
  }

  async loadNotices(): Promise<Notice[]> {
    if (this.noticesLoaded) return this.noticeState();
    if (this.noticesRequest) return this.noticesRequest;
    const request = this.withLoading(async () => {
      const raw = await firstValueFrom(this.http.get<LegacyCollection<LegacyNotice>>(`${API_BASE}/InfoBoxToInspectors`));
      const notices = this.unwrapCollection(raw).map(item => ({ id: item.id, date: this.parseDate(item.date), title: item.name, description: item.description }));
      this.noticeState.set(notices);
      this.noticesLoaded = true;
      return notices;
    });
    this.noticesRequest = request;
    try { return await request; }
    finally { this.noticesRequest = undefined; }
  }

  async saveStep1(inspection: Inspection): Promise<void> {
    await this.withLoading(async () => {
      await Promise.all(inspection.workers.map(worker => firstValueFrom(this.http.post(`${API_BASE}/InspectorPlanningDetails/UpdatePartial/${worker.detailId}`, {
          timeSheet: worker.timesheet,
          foundAtWork: worker.foundAtWork,
          otherIssues: worker.otherIssues,
          signature: this.signatureForSave(worker.signature)
      }))));
      if (inspection.inspectorComments.trim()) {
        await firstValueFrom(this.http.post(`${API_BASE}/InspectorPlannings/UpdateComments/${inspection.id}`, JSON.stringify(inspection.inspectorComments), { headers: { 'Content-Type': 'application/json' } }));
      }
      this.cache.set(inspection.id, inspection);
    });
  }

  async saveEnd(inspection: Inspection): Promise<void> {
    await this.withLoading(async () => {
      await firstValueFrom(this.http.post(`${API_BASE}/InspectorPlannings/SaveInspectionEnd/${inspection.id}`, {
        entityComment: inspection.entityComments,
        signature: this.signatureForSave(inspection.representativeSignature),
        confirm: inspection.confirmation,
        inspectorAbsenceComment: inspection.absenceComment,
        sendReportToAdministration: inspection.sendToAdministration
      }));
      await firstValueFrom(this.http.get(`${API_BASE}/InspectorPlannings/GeneratePdf`, { params: { id: inspection.id } }));
      inspection.status = 'closed';
      this.cache.set(inspection.id, inspection);
      this.todayState.update(items => items.filter(item => item.id !== inspection.id));
      this.archiveState.update(items => [inspection, ...items.filter(item => item.id !== inspection.id)]);
      this.archiveCache.clear();
    });
  }

  async reportUrl(id: number): Promise<string> {
    const response = await firstValueFrom(this.http.get<{ url: string }>(`${API_BASE}/Files/GetSecureUrl/${id}`, { params: { type: 'rept' } }));
    return response.url;
  }

  async requestRecovery(email: string): Promise<boolean> {
    await firstValueFrom(this.http.get(`${API_BASE}/Emails/GetRecoveryPwdInspectors`, { params: { email } }));
    return true;
  }

  async changePassword(guid: string, password: string): Promise<boolean> {
    return await firstValueFrom(this.http.post<boolean>(`${API_BASE}/ChangePwdRequests/ResetInspectorPassword`, { guid, newPwd: password }));
  }

  private mapInspection(raw: LegacyInspection): Inspection {
    const plan = raw.inspectorPlanning;
    return {
      id: plan.id,
      date: this.parseDate(plan.date),
      time: this.formatTime(plan.time),
      location: raw.location?.name ?? '',
      address: raw.location?.address ?? '',
      city: raw.city?.name ?? '',
      representative: raw.location?.entityRapresentative ?? '',
      jobTitle: raw.location?.jobTitle ?? '',
      status: plan.closed ? 'closed' : 'pending',
      inspectorComments: plan.comments ?? '',
      entityComments: plan.entityComment ?? '',
      representativePresent: !plan.inspectorAbsenceComment,
      confirmation: plan.confirm ?? true,
      sendToAdministration: plan.sendReportToAdministration ?? false,
      absenceComment: plan.inspectorAbsenceComment ?? '',
      representativeSignature: this.signatureUrl(plan.signature),
      reportAvailable: !!plan.reportFilePath,
      workers: this.unwrapCollection(raw.details).map(detail => ({
        id: detail.worker.id,
        detailId: detail.det.id,
        jobTypeId: detail.worker.jobTypeId,
        name: detail.worker.name ?? '',
        lastName: detail.worker.lastName ?? '',
        mobile: detail.worker.mobile ?? '',
        idCardNumber: detail.worker.idCardNumber ?? '',
        jobType: detail.jobTypeName ?? this.unwrapCollection(raw.workers).find(item => item.workerId === detail.worker.id)?.jobTypeName ?? '',
        timesheet: detail.det.timeSheet ?? false,
        foundAtWork: detail.det.foundAtWork ?? false,
        otherIssues: detail.det.otherIssues ?? '',
        signature: this.signatureUrl(detail.det.signature)
      }))
    };
  }

  private parseDate(value: string): string {
    if (!value) return '';
    const microsoftDate = /\/Date\((\d+)/.exec(value);
    const date = microsoftDate ? new Date(Number(microsoftDate[1])) : new Date(value);
    if (Number.isNaN(date.getTime())) return value.slice(0, 10);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatTime(value: unknown): string {
    if (typeof value === 'string') return value.slice(0, 5);
    if (typeof value === 'number') {
      const totalMinutes = Math.floor(value / 600000000);
      return `${String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
    }
    if (value && typeof value === 'object') {
      const item = value as Record<string, unknown>;
      const hours = Number(item['hours'] ?? item['Hours'] ?? 0);
      const minutes = Number(item['minutes'] ?? item['Minutes'] ?? 0);
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    return '';
  }

  private unwrapCollection<T>(value: LegacyCollection<T>): T[] {
    if (Array.isArray(value)) return value;
    return value?.$values && Array.isArray(value.$values) ? value.$values : [];
  }

  private signatureUrl(value?: string): string | undefined {
    const signature = value?.trim();
    if (!signature) return undefined;
    if (/^(data:|blob:|https?:\/\/)/i.test(signature)) return signature;
    const origin = API_BASE.startsWith('/') ? window.location.origin : API_ORIGIN;
    return `${origin}/${signature.replace(/^~?\/+/, '')}`;
  }

  private signatureForSave(value?: string): string {
    const signature = value?.trim();
    if (!signature) return '';
    // The legacy endpoints only accept a new data URI. An existing file URL
    // must be omitted so the API keeps the signature already stored in DB.
    if (/^https?:\/\//i.test(signature)) return '';
    return signature;
  }

  private inspectorId(): number {
    try { return Number(JSON.parse(sessionStorage.getItem('waman-inspector-session') ?? '{}')?.inspector?.id ?? 0); }
    catch { return 0; }
  }

  private async withLoading<T>(operation: () => Promise<T>): Promise<T> {
    this.pendingRequests++;
    this.loading.set(true);
    this.error.set('');
    try { return await operation(); }
    catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to contact Waman.');
      throw error;
    } finally {
      this.pendingRequests = Math.max(0, this.pendingRequests - 1);
      this.loading.set(this.pendingRequests > 0);
    }
  }
}
