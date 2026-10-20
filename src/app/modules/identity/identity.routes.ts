import { Routes } from '@angular/router';
import { PERM, guard } from '@core/auth';

/** Pages of the Identity module (users and roles). Sign in and register are in app.routes.ts. */
export const IDENTITY_ROUTES: Routes = [
  { path: 'users', canActivate: [guard(PERM.usersManage)], loadComponent: () => import('./pages/users/user-list/user-list.component').then(m => m.UserListComponent) },
  { path: 'users/new', canActivate: [guard(PERM.usersManage)], loadComponent: () => import('./pages/users/user-form/user-form.component').then(m => m.UserFormComponent) },
  { path: 'users/:id/edit', canActivate: [guard(PERM.usersManage)], loadComponent: () => import('./pages/users/user-form/user-form.component').then(m => m.UserFormComponent) },
  { path: 'roles', canActivate: [guard(PERM.rolesManage)], loadComponent: () => import('./pages/roles/role-list/role-list.component').then(m => m.RoleListComponent) },
  { path: 'roles/new', canActivate: [guard(PERM.rolesManage)], loadComponent: () => import('./pages/roles/role-form/role-form.component').then(m => m.RoleFormComponent) },
  { path: 'roles/:id/edit', canActivate: [guard(PERM.rolesManage)], loadComponent: () => import('./pages/roles/role-form/role-form.component').then(m => m.RoleFormComponent) }
];
