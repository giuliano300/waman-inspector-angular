import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Inspection } from '../../core/models/inspector.models';
import { InspectionService } from '../../core/services/inspection.service';
import { DataLoaderComponent } from '../../shared/data-loader/data-loader.component';

@Component({ selector: 'app-report', standalone: true, imports: [RouterLink, DataLoaderComponent], templateUrl: './report.component.html', styleUrl: './report.component.scss' })
export class ReportComponent implements OnInit {
  readonly id = Number(this.route.snapshot.paramMap.get('id'));
  readonly loading = this.data.loading;
  inspection?: Inspection;
  error = '';

  constructor(private route: ActivatedRoute, private data: InspectionService) {}

  async ngOnInit(): Promise<void> {
    try { this.inspection = await this.data.loadInspection(this.id, true); }
    catch { this.error = 'Inspection report could not be loaded.'; }
  }

  formatDate(date: string): string {
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(date + 'T00:00:00Z')).toLowerCase();
  }
}
