import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { ApiService, asUtc } from '@core/api';
import { PoDraft, PoFilter, PurchaseOrder } from '../models';
import { TRADE_API } from './trade.endpoints';

@Injectable({ providedIn: 'root' })
export class PurchaseOrdersApi {
  private api = inject(ApiService);

  /** Filter by date range (full ISO times), status and a search text. */
  list(filter: PoFilter = {}) {
    return this.api.get<PurchaseOrder[]>(TRADE_API.purchaseOrders,
        { from: filter.from, to: filter.to, status: filter.status, search: filter.search })
      .pipe(map(rows => rows.map(o => ({ ...o, createdAt: asUtc(o.createdAt) }))));
  }
  get(id: number) {
    return this.api.get<PurchaseOrder>(`${TRADE_API.purchaseOrders}/${id}`)
      .pipe(map(o => ({ ...o, createdAt: asUtc(o.createdAt) })));
  }
  create(draft: PoDraft) { return this.api.post<{ id: number; number: string }>(TRADE_API.purchaseOrders, draft); }
  autoCreate() { return this.api.post<{ created: number }>(`${TRADE_API.purchaseOrders}/auto`); }
  /** Pending to Completed: the stock is added. */
  complete(id: number) { return this.api.post<void>(`${TRADE_API.purchaseOrders}/${id}/complete`); }
  /** Pending to Cancelled. */
  cancel(id: number) { return this.api.post<void>(`${TRADE_API.purchaseOrders}/${id}/cancel`); }
}
