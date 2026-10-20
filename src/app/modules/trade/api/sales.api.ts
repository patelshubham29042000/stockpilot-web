import { Injectable, inject } from '@angular/core';
import { ApiService } from '@core/api';
import { SaleCreated, SaleLineInput, SalesSummary } from '../models';
import { TRADE_API } from './trade.endpoints';

@Injectable({ providedIn: 'root' })
export class SalesApi {
  private api = inject(ApiService);

  checkout(lines: SaleLineInput[]) { return this.api.post<SaleCreated>(TRADE_API.sales, { lines }); }
  summary() { return this.api.get<SalesSummary>(TRADE_API.dashboardSales); }
  exportCsv() { this.api.download(TRADE_API.salesExport, 'sales.csv'); }
}
