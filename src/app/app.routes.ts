import { Routes } from '@angular/router';
import { PERM, guard } from '@core/auth';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./modules/identity/pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./modules/identity/pages/register/register.component').then(m => m.RegisterComponent) },
  {
    path: '', component: ShellComponent, canActivate: [guard()], children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', canActivate: [guard(PERM.dashboardView)], loadComponent: () => import('./modules/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'audit', canActivate: [guard(PERM.auditView)], loadComponent: () => import('./modules/audit/audit.component').then(m => m.AuditComponent) },

      // One line per backend module. A new module (for example payment) adds one line here.
      { path: '', loadChildren: () => import('./modules/catalog/catalog.routes').then(m => m.CATALOG_ROUTES) },
      { path: '', loadChildren: () => import('./modules/trade/trade.routes').then(m => m.TRADE_ROUTES) },
      { path: '', loadChildren: () => import('./modules/identity/identity.routes').then(m => m.IDENTITY_ROUTES) }
    ]
  },
  { path: '**', redirectTo: '' }
];
