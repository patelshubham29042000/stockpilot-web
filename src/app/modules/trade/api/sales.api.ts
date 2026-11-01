import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { ApiService, asUtc } from '@core/api';
import { SaleCreated, SaleDetail, SaleFilter, SaleLineInput, SaleRow, SaleStatus, SalesSummary } from '../models';
import { TRADE_API } from './trade.endpoints';

@Injectable({ providedIn: 'root' })
export class SalesApi {
  private api = inject(ApiService);

  /** hold = true parks the bill: no stock is taken out until it is completed in Find sales. */
  checkout(lines: SaleLineInput[], hold = false) { return this.api.post<SaleCreated>(TRADE_API.sales, { lines, hold }); }
  summary() { return this.api.get<SalesSummary>(TRADE_API.dashboardSales); }

  /** Filter by date range (full ISO times), status and a search text (bill number or cashier). */
  list(filter: SaleFilter = {}) {
    return this.api.get<SaleRow[]>(TRADE_API.sales, { from: filter.from, to: filter.to, status: filter.status, search: filter.search })
      .pipe(map(rows => rows.map(s => ({ ...s, createdAt: asUtc(s.createdAt) }))));
  }

  get(id: number) {
    return this.api.get<SaleDetail>(`${TRADE_API.sales}/${id}`).pipe(map(s => ({ ...s, createdAt: asUtc(s.createdAt) })));
  }

  /** Complete a held sale, or return or void a sale. Returned and Void need a reason. */
  changeStatus(id: number, status: SaleStatus, reason?: string) {
    return this.api.put<SaleDetail>(`${TRADE_API.sales}/${id}/status`, { status, reason: reason ?? null })
      .pipe(map(s => ({ ...s, createdAt: asUtc(s.createdAt) })));
  }

  /** Downloads the sales CSV. With a filter, only the matching sales are exported. */
  exportCsv(filter: SaleFilter = {}) {
    const query = Object.entries(filter).filter(([, v]) => !!v).map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
    this.api.download(query ? `${TRADE_API.salesExport}?${query}` : TRADE_API.salesExport, 'sales.csv');
  }
}
