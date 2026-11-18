import { Component, computed } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { InspectionService } from '../../core/services/inspection.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent {
  readonly hasTodayInspections = computed(() => this.inspections.inspections().length > 0);

  constructor(readonly auth: AuthService, private inspections: InspectionService) {
    void inspections.loadToday().catch(() => undefined);
  }
}
