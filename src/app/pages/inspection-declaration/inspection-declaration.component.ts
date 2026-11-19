import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Inspection } from '../../core/models/inspector.models';
import { InspectionService } from '../../core/services/inspection.service';
import { SignatureDialogComponent } from '../../shared/signature-dialog/signature-dialog.component';
import { DataLoaderComponent } from '../../shared/data-loader/data-loader.component';

@Component({ selector: 'app-inspection-declaration', standalone: true, imports: [FormsModule, RouterLink, SignatureDialogComponent, DataLoaderComponent], templateUrl: './inspection-declaration.component.html', styleUrl: './inspection-declaration.component.scss' })
export class InspectionDeclarationComponent implements OnInit {
  readonly minimumAbsenceReasonLength = 10;
  readonly id = Number(this.route.snapshot.paramMap.get('id'));
  readonly loading = this.data.loading;
  inspection?: Inspection;
  signatureOpen = false;
  error = '';

  constructor(private route: ActivatedRoute, private router: Router, private data: InspectionService) {}

  async ngOnInit(): Promise<void> {
    try { this.inspection = await this.data.loadInspection(this.id); }
    catch { this.error = 'Inspection details could not be loaded.'; }
  }

  confirm(value: string): void { if (this.inspection) this.inspection.representativeSignature = value; this.signatureOpen = false; }

  get absenceReasonLength(): number { return this.inspection?.absenceComment.trim().length ?? 0; }

  async closeInspection(): Promise<void> {
    if (!this.inspection) return;
    if (this.inspection.representativePresent && !this.inspection.representativeSignature) { this.error = 'Representative signature is required.'; return; }
    if (!this.inspection.representativePresent && this.absenceReasonLength < this.minimumAbsenceReasonLength) {
      this.error = `Please enter at least ${this.minimumAbsenceReasonLength} characters for the representative’s absence. You have entered ${this.absenceReasonLength}.`;
      return;
    }
    this.inspection.absenceComment = this.inspection.absenceComment.trim();
    this.error = '';
    try {
      await this.data.saveEnd(this.inspection);
      await this.router.navigate(['/inspection', this.id, 'report']);
    } catch { this.error = 'The inspection could not be closed. Check the connection and try again.'; }
  }

  formatDate(date: string): string {
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(date + 'T00:00:00Z')).toLowerCase();
  }
}
