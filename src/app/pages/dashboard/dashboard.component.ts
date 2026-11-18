import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { InspectionService } from '../../core/services/inspection.service';
import { DataLoaderComponent } from '../../shared/data-loader/data-loader.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DataLoaderComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  readonly inspections = this.data.inspections;
  readonly loading = this.data.loading;
  readonly todayLabel = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date());
  readonly greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  constructor(readonly auth: AuthService, private data: InspectionService) { void data.loadToday().catch(() => undefined); }

  formatDate(date: string): string {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }
}
