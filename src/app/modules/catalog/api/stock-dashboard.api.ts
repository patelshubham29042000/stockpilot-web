import { Injectable, inject } from '@angular/core';
import { ApiService } from '@core/api';
import { StockSummary } from '../models';
import { CATALOG_API } from './catalog.endpoints';

@Injectable({ providedIn: 'root' })
export class StockDashboardApi {
  private api = inject(ApiService);

  summary() { return this.api.get<StockSummary>(CATALOG_API.dashboardStock); }
}
