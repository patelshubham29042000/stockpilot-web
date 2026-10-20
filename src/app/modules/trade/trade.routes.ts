import { Routes } from '@angular/router';
import { PERM, guard } from '@core/auth';

/** Pages of the Trade module. */
export const TRADE_ROUTES: Routes = [
  { path: 'pos', canActivate: [guard(PERM.salesCreate)], loadComponent: () => import('./pages/pos/pos.component').then(m => m.PosComponent) },
  { path: 'purchase-orders', canActivate: [guard(PERM.purchaseOrdersManage)], loadComponent: () => import('./pages/purchase-orders/purchase-orders.component').then(m => m.PurchaseOrdersComponent) }
];
