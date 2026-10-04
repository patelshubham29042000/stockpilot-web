import { Routes } from '@angular/router';
import { guard } from './core/auth';
import { Shell } from './pages/shell';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login').then(m => m.LoginPage) },
  {
    path: '', component: Shell, canActivate: [guard()], children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard').then(m => m.DashboardPage) },
      { path: 'pos', loadComponent: () => import('./pages/pos').then(m => m.PosPage) },
      { path: 'items', canActivate: [guard('Admin', 'Manager')], loadComponent: () => import('./pages/items').then(m => m.ItemsPage) },
      { path: 'suppliers', canActivate: [guard('Admin', 'Manager')], loadComponent: () => import('./pages/suppliers').then(m => m.SuppliersPage) },
      { path: 'purchase-orders', canActivate: [guard('Admin', 'Manager')], loadComponent: () => import('./pages/purchase-orders').then(m => m.PurchaseOrdersPage) },
      { path: 'users', canActivate: [guard('Admin')], loadComponent: () => import('./pages/users').then(m => m.UsersPage) }
    ]
  },
  { path: '**', redirectTo: '' }
];
