import { Routes } from '@angular/router';
import { PERM, guard } from '@core/auth';

/** Pages of the Trade module. */
export const TRADE_ROUTES: Routes = [
  { path: 'customers', canActivate: [guard(PERM.customersManage)], loadComponent: () => import('./pages/customers/customer-list/customer-list.component').then(m => m.CustomerListComponent) },
  { path: 'customers/new', canActivate: [guard(PERM.customersManage)], loadComponent: () => import('./pages/customers/customer-form/customer-form.component').then(m => m.CustomerFormComponent) },
  { path: 'customers/:id/edit', canActivate: [guard(PERM.customersManage)], loadComponent: () => import('./pages/customers/customer-form/customer-form.component').then(m => m.CustomerFormComponent) },
  { path: 'sales/find/:id', canActivate: [guard(PERM.salesReport)], loadComponent: () => import('./pages/sale-detail/sale-detail.component').then(m => m.SaleDetailComponent) },
  { path: 'sales/find', canActivate: [guard(PERM.salesReport)], loadComponent: () => import('./pages/find-sales/find-sales.component').then(m => m.FindSalesComponent) },
  { path: 'pos', canActivate: [guard(PERM.salesCreate)], loadComponent: () => import('./pages/pos/pos.component').then(m => m.PosComponent) },
  { path: 'purchase-orders/place', canActivate: [guard(PERM.purchaseOrdersManage)], loadComponent: () => import('./pages/place-po/place-po.component').then(m => m.PlacePoComponent) },
  { path: 'purchase-orders/find/:id', canActivate: [guard(PERM.purchaseOrdersManage)], loadComponent: () => import('./pages/place-po/place-po.component').then(m => m.PlacePoComponent) },
  { path: 'purchase-orders/find', canActivate: [guard(PERM.purchaseOrdersManage)], loadComponent: () => import('./pages/find-po/find-po.component').then(m => m.FindPoComponent) }
];
