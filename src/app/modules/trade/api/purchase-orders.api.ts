import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { ApiService, asUtc } from '@core/api';
import { PoDraft, PurchaseOrder } from '../models';
import { TRADE_API } from './trade.endpoints';

@Injectable({ providedIn: 'root' })
export class PurchaseOrdersApi {
  private api = inject(ApiService);

  list() {
    return this.api.get<PurchaseOrder[]>(TRADE_API.purchaseOrders)
      .pipe(map(rows => rows.map(o => ({ ...o, createdAt: asUtc(o.createdAt) }))));
  }
  create(draft: PoDraft) { return this.api.post<{ id: number; number: string }>(TRADE_API.purchaseOrders, draft); }
  autoCreate() { return this.api.post<{ created: number }>(`${TRADE_API.purchaseOrders}/auto`); }
  receive(id: number) { return this.api.post<void>(`${TRADE_API.purchaseOrders}/${id}/receive`); }
}
