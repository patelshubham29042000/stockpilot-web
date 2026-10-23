import { Routes } from '@angular/router';
import { PERM, guard } from '@core/auth';

/** Pages of the Trade module. */
export const TRADE_ROUTES: Routes = [
  { path: 'pos', canActivate: [guard(PERM.salesCreate)], loadComponent: () => import('./pages/pos/pos.component').then(m => m.PosComponent) },
  { path: 'purchase-orders/place', canActivate: [guard(PERM.purchaseOrdersManage)], loadComponent: () => import('./pages/place-po/place-po.component').then(m => m.PlacePoComponent) },
  { path: 'purchase-orders/find/:id', canActivate: [guard(PERM.purchaseOrdersManage)], loadComponent: () => import('./pages/place-po/place-po.component').then(m => m.PlacePoComponent) },
  { path: 'purchase-orders/find', canActivate: [guard(PERM.purchaseOrdersManage)], loadComponent: () => import('./pages/find-po/find-po.component').then(m => m.FindPoComponent) }
];
