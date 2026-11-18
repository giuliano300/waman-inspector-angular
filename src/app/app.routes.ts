import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'restore-password', loadComponent: () => import('./pages/restore-password/restore-password.component').then(m => m.RestorePasswordComponent) },
  { path: 'change-password', loadComponent: () => import('./pages/change-password/change-password.component').then(m => m.ChangePasswordComponent) },
  {
    path: '', canActivate: [authGuard], loadComponent: () => import('./layout/shell/shell.component').then(m => m.ShellComponent),
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'inspection-plan', loadComponent: () => import('./pages/inspection-plan/inspection-plan.component').then(m => m.InspectionPlanComponent) },
      { path: 'inspection/:id/workers', loadComponent: () => import('./pages/inspection-workers/inspection-workers.component').then(m => m.InspectionWorkersComponent) },
      { path: 'inspection/:id/declaration', loadComponent: () => import('./pages/inspection-declaration/inspection-declaration.component').then(m => m.InspectionDeclarationComponent) },
      { path: 'archive', loadComponent: () => import('./pages/archive/archive.component').then(m => m.ArchiveComponent) },
      { path: 'inspection/:id/report', loadComponent: () => import('./pages/report/report.component').then(m => m.ReportComponent) },
      { path: 'info-box', loadComponent: () => import('./pages/info-box/info-box.component').then(m => m.InfoBoxComponent) },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' }
    ]
  },
  { path: 'attendance-sheet', loadComponent: () => import('./pages/attendance-sheet/attendance-sheet.component').then(m => m.AttendanceSheetComponent) },
  { path: '**', loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent) }
];
