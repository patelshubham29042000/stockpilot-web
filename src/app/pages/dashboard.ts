import { Component, computed, inject, signal } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Auth } from '../core/auth';

@Component({
  standalone: true, imports: [CurrencyPipe, DatePipe, RouterLink],
  template: `
  <div class="bar"><h1>Dashboard</h1>
    @if (auth.can(['Admin','Manager'])) { <button class="btn alt" (click)="auth.download('/api/sales/export','sales.csv')">Download sales report</button> }
  </div>
  @if (d(); as x) {
    <div class="stats">
      <div class="stat"><b>{{ x.todaySales | currency:'INR':'symbol':'1.0-0' }}</b><span>Sales today ({{ x.todayCount }} bills)</span></div>
      <div class="stat"><b>{{ x.items }}</b><span>Active items</span></div>
      <div class="stat" [class.warn]="x.lowStock>0"><b>{{ x.lowStock }}</b><span>Items to reorder</span></div>
      <div class="stat"><b>{{ x.stockValue | currency:'INR':'symbol':'1.0-0' }}</b><span>Stock value at cost</span></div>
    </div>
    <div class="card"><b>Last 7 days</b>
      <div class="chart" style="margin-top:12px">
        @for (s of x.last7; track s.date) { <div><i [style.height.%]="pct(s.total)"></i>{{ s.date | date:'EEE' }}</div> }
      </div>
    </div>
    <div class="card tbl"><div style="padding:14px 16px;display:flex;justify-content:space-between"><b>Running low</b>
      @if (auth.can(['Admin','Manager'])) { <a routerLink="/purchase-orders" class="btn sm pri">Create purchase orders</a> }</div>
      <table><thead><tr><th>SKU</th><th>Item</th><th class="r">In stock</th><th class="r">Reorder at</th></tr></thead><tbody>
      @for (i of x.low; track i.id) { <tr><td>{{ i.sku }}</td><td>{{ i.name }}</td><td class="r"><span class="badge low">{{ i.stock }}</span></td><td class="r">{{ i.reorderLevel }}</td></tr> }
      @empty { <tr><td colspan="4">All items are above their reorder level.</td></tr> }
      </tbody></table></div>
  }`
})
export class DashboardPage {
  auth = inject(Auth);
  d = signal<any>(null);
  max = computed(() => Math.max(1, ...(this.d()?.last7 ?? []).map((s: any) => s.total)));
  constructor() {
    const h = inject(HttpClient);
    const get = (u: string) => h.get<any>(u).pipe(catchError(() => of({})));
    forkJoin([get('/api/dashboard/stock'), get('/api/dashboard/sales')]).subscribe(([a, b]) => this.d.set({ low: [], last7: [], todaySales: 0, todayCount: 0, items: 0, lowStock: 0, stockValue: 0, ...a, ...b }));
  }
  pct(v: number) { return (v / this.max()) * 85; }
}
