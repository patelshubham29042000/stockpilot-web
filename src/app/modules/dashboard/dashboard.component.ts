import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { Auth, PERM } from '@core/auth';
import { PageHeaderComponent } from '@shared/page-header/page-header.component';
import { StockDashboardApi } from '@modules/catalog/api';
import { SalesApi } from '@modules/trade/api';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink, PageHeaderComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  private stockApi = inject(StockDashboardApi);
  private salesApi = inject(SalesApi);
  auth = inject(Auth);
  readonly PERM = PERM;
  data = signal<any>(null);
  max = computed(() => Math.max(1, ...(this.data()?.last7 ?? []).map((s: any) => s.total)));

  constructor() {
    // Stock numbers come from the Catalog module, sales numbers from the Trade module.
    forkJoin([
      this.stockApi.summary().pipe(catchError(() => of({}))),
      this.salesApi.summary().pipe(catchError(() => of({})))
    ]).subscribe(([stock, sales]) =>
      this.data.set({ low: [], last7: [], todaySales: 0, todayCount: 0, items: 0, lowStock: 0, stockValue: 0, ...stock, ...sales }));
  }

  exportSales() { this.salesApi.exportCsv(); }
  barHeight(value: number) { return (value / this.max()) * 85; }
}
