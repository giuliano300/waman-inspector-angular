import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InspectionService } from '../../core/services/inspection.service';

@Component({ selector: 'app-restore-password', standalone: true, imports: [FormsModule, RouterLink], templateUrl: './restore-password.component.html', styleUrl: './restore-password.component.scss' })
export class RestorePasswordComponent {
  email = '';
  sent = false;
  error = '';
  busy = false;

  constructor(private data: InspectionService) {}

  async submit(): Promise<void> {
    if (!this.email.trim()) return;
    this.busy = true;
    this.error = '';
    try { this.sent = await this.data.requestRecovery(this.email.trim()); }
    catch { this.error = 'There was an error sending the request. Please try again!'; }
    finally { this.busy = false; }
  }
}
