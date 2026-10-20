import { Routes } from '@angular/router';
import { PERM, guard } from '@core/auth';

/** Pages of the Catalog module. */
export const CATALOG_ROUTES: Routes = [
  { path: 'items', canActivate: [guard(PERM.itemsView, PERM.itemsManage)], loadComponent: () => import('./pages/items/item-list/item-list.component').then(m => m.ItemListComponent) },
  { path: 'items/new', canActivate: [guard(PERM.itemsManage)], loadComponent: () => import('./pages/items/item-form/item-form.component').then(m => m.ItemFormComponent) },
  { path: 'items/:id/edit', canActivate: [guard(PERM.itemsManage)], loadComponent: () => import('./pages/items/item-form/item-form.component').then(m => m.ItemFormComponent) },
  { path: 'categories', canActivate: [guard(PERM.categoriesManage)], loadComponent: () => import('./pages/categories/categories.component').then(m => m.CategoriesComponent) },
  { path: 'suppliers', canActivate: [guard(PERM.suppliersManage)], loadComponent: () => import('./pages/suppliers/suppliers.component').then(m => m.SuppliersComponent) }
];
