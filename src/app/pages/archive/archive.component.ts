import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Inspection } from '../../core/models/inspector.models';
import { InspectionService } from '../../core/services/inspection.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { DataLoaderComponent } from '../../shared/data-loader/data-loader.component';

@Component({
  selector: 'app-archive',
  standalone: true,
  imports: [FormsModule, RouterLink, PageHeaderComponent, DataLoaderComponent],
  templateUrl: './archive.component.html',
  styleUrl: './archive.component.scss'
})
export class ArchiveComponent {
  readonly months = Array.from({ length: 12 }, (_, index) => ({ value: String(index + 1).padStart(2, '0'), label: new Intl.DateTimeFormat('en', { month: 'long' }).format(new Date(2020, index, 1)) }));
  readonly years = Array.from({ length: 4 }, (_, index) => new Date().getFullYear() - index);
  location = '';
  month = String(new Date().getMonth() + 1).padStart(2, '0');
  year = String(new Date().getFullYear());
  readonly results = signal<Inspection[]>([]);
  readonly total = signal(0);
  readonly loading = this.data.loading;
  readonly error = this.data.error;
  page = 0;
  readonly pageSize = 15;

  constructor(private data: InspectionService) { void this.apply(); }

  async apply(resetPage = true): Promise<void> {
    if (resetPage) this.page = 0;
    try {
      const response = await this.data.loadArchive(Number(this.month), Number(this.year), this.location.trim(), this.page, this.pageSize);
      this.results.set(response.items);
      this.total.set(response.total);
    } catch { this.results.set([]); }
  }

  async reset(): Promise<void> {
    const now = new Date();
    this.location = '';
    this.month = String(now.getMonth() + 1).padStart(2, '0');
    this.year = String(now.getFullYear());
    await this.apply();
  }

  async previous(): Promise<void> { if (this.page > 0) { this.page--; await this.apply(false); } }
  async next(): Promise<void> { if ((this.page + 1) * this.pageSize < this.total()) { this.page++; await this.apply(false); } }
  async openReport(id: number): Promise<void> {
    try { window.open(await this.data.reportUrl(id), '_blank', 'noopener'); }
    catch { /* the shared service exposes the error state */ }
  }
  get pageCount(): number { return Math.max(1, Math.ceil(this.total() / this.pageSize)); }

  formatDate(date: string): string { const [year, month, day] = date.split('-'); return `${day}/${month}/${year}`; }
}
