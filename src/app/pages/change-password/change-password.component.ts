import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { InspectionService } from '../../core/services/inspection.service';

@Component({ selector: 'app-change-password', standalone: true, imports: [FormsModule, RouterLink], templateUrl: './change-password.component.html', styleUrl: './change-password.component.scss' })
export class ChangePasswordComponent {
  password = '';
  confirmation = '';
  message = '';
  busy = false;
  private readonly guid = this.route.snapshot.queryParamMap.get('u') ?? '';

  constructor(private route: ActivatedRoute, private data: InspectionService) {}

  async submit(): Promise<void> {
    const valid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(this.password);
    if (!valid) { this.message = 'Use at least 8 characters, one uppercase, one lowercase and one number.'; return; }
    if (this.password !== this.confirmation) { this.message = 'The passwords do not match.'; return; }
    if (!this.guid) { this.message = 'This password reset link is invalid or expired.'; return; }

    this.busy = true;
    try {
      const success = await this.data.changePassword(this.guid, this.password);
      this.message = success ? 'The password has been successfully changed.' : 'There was an error sending the request. Please try again!';
      if (success) { this.password = ''; this.confirmation = ''; }
    } catch { this.message = 'There was an error sending the request. Please try again!'; }
    finally { this.busy = false; }
  }
}
