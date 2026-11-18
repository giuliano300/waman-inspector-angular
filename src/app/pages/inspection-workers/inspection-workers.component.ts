import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Inspection, Worker } from '../../core/models/inspector.models';
import { InspectionService } from '../../core/services/inspection.service';
import { SignatureDialogComponent } from '../../shared/signature-dialog/signature-dialog.component';
import { DataLoaderComponent } from '../../shared/data-loader/data-loader.component';

@Component({ selector: 'app-inspection-workers', standalone: true, imports: [FormsModule, RouterLink, SignatureDialogComponent, DataLoaderComponent], templateUrl: './inspection-workers.component.html', styleUrl: './inspection-workers.component.scss' })
export class InspectionWorkersComponent implements OnInit {
  readonly id = Number(this.route.snapshot.paramMap.get('id'));
  readonly loading = this.data.loading;
  inspection?: Inspection;
  signatureOpen = false;
  selectedWorker?: Worker;
  error = '';

  constructor(private route: ActivatedRoute, private router: Router, private data: InspectionService) {}

  async ngOnInit(): Promise<void> {
    try { this.inspection = await this.data.loadInspection(this.id, true); }
    catch { this.error = 'Inspection details could not be loaded.'; }
  }

  openSignature(worker: Worker): void { this.selectedWorker = worker; this.signatureOpen = true; }
  confirmSignature(value: string): void { if (this.selectedWorker) this.selectedWorker.signature = value; this.signatureOpen = false; }

  async continue(): Promise<void> {
    if (!this.inspection) return;
    this.error = '';
    try {
      await this.data.saveStep1(this.inspection);
      await this.router.navigate(['/inspection', this.id, 'declaration']);
    } catch { this.error = 'The inspection could not be saved. Check the connection and try again.'; }
  }

  formatDate(date: string): string {
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(date + 'T00:00:00Z')).toLowerCase();
  }
}
