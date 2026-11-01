import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { dayEndIso, dayStartIso, daysAgoLocal, errMsg, todayLocal } from '@core/api';
import { Auth, PERM } from '@core/auth';
import { Dialog } from '@core/dialog/dialog.service';
import { PageHeaderComponent } from '@shared/page-header/page-header.component';
import { TabulatorGridComponent } from '@shared/tabulator-grid/tabulator-grid.component';
import { BadgeKind, actionButtons, badge, dateTime, esc, money } from '@shared/tabulator-grid/grid-formatters';
import { SalesApi } from '../../api';
import { SaleFilter, SaleRow, SaleStatus } from '../../models';
import { SALE_ACTIONS, SaleWorkflow } from '../../services/sale-workflow.service';

/** Badge colour of each status: Completed green, Hold amber, Void red, Returned grey. */
const STATUS_KIND: Record<SaleStatus, BadgeKind> = { Completed: 'ok', Hold: 'warn', Returned: '', Void: 'low' };

@Component({
  selector: 'app-find-sales',
  standalone: true,
  imports: [FormsModule, RouterLink, CurrencyPipe, PageHeaderComponent, TabulatorGridComponent],
  templateUrl: './find-sales.component.html',
  styleUrl: './find-sales.component.css'
})
export class FindSalesComponent {
  private salesApi = inject(SalesApi);
  private dialog = inject(Dialog);
  private router = inject(Router);
  private workflow = inject(SaleWorkflow);
  private auth = inject(Auth);

  readonly statuses: SaleStatus[] = ['Completed', 'Hold', 'Returned', 'Void'];

  // Defaults: one week back to today, every status.
  fromDate = daysAgoLocal(7);
  toDate = todayLocal();
  status: SaleStatus | 'all' = 'all';

  sales = signal<SaleRow[]>([]);
  loading = signal(false);
  search = signal('');

  shown = computed(() => {
    const text = this.search().trim().toLowerCase();
    if (!text) return this.sales();
    return this.sales().filter(s => `${s.number} ${s.cashier} ${s.status}`.toLowerCase().includes(text));
  });

  /** Money from Completed sales in the list: returned, void and held bills are not counted. */
  completedTotal = computed(() => this.shown().filter(s => s.status === 'Completed').reduce((sum, s) => sum + s.total, 0));

  /** Tabulator columns. A higher `responsive` number is hidden first on a narrow screen. */
  readonly columns: any[] = [
    { title: 'Bill no.', field: 'number', width: 190, responsive: 0, formatter: (cell: any) => `<strong>${esc(cell.getValue())}</strong>` },
    { title: 'Date', field: 'createdAt', width: 170, responsive: 4, formatter: (cell: any) => dateTime(cell.getValue()) },
    { title: 'Cashier', field: 'cashier', minWidth: 110, widthGrow: 1, responsive: 3, formatter: (cell: any) => esc(cell.getValue()) },
    { title: 'Total', field: 'total', width: 130, hozAlign: 'right', sorter: 'number', responsive: 2, formatter: 'money', formatterParams: money },
    {
      title: 'Status', field: 'status', width: 120, responsive: 0,
      formatter: (cell: any) => badge(cell.getValue(), STATUS_KIND[cell.getValue() as SaleStatus] ?? '')
    },
    { title: 'View', width: 100, hozAlign: 'center', headerSort: false, responsive: 0, formatter: () => actionButtons([{ action: 'view', label: 'View' }]) }
  ];

  constructor() {
    // Only people who may change a status get the Action column. On a narrow screen it hides first: use View instead.
    if (this.auth.can(PERM.salesStatus)) this.columns.push({
      title: 'Action', width: 190, hozAlign: 'right', headerSort: false, responsive: 5,
      formatter: (cell: any) => {
        const actions = SALE_ACTIONS[cell.getRow().getData().status as SaleStatus] ?? [];
        return actions.length
          ? actionButtons(actions.map(a => ({ action: 'status:' + a.target, label: a.label, kind: a.kind })))
          : '<span class="muted">—</span>';
      }
    });
    this.apply();
  }

  private filter(): SaleFilter {
    return {
      from: this.fromDate ? dayStartIso(this.fromDate) : undefined,
      to: this.toDate ? dayEndIso(this.toDate) : undefined,
      status: this.status === 'all' ? undefined : this.status
    };
  }

  /** Runs for the Filter button, and right away when the Status changes. */
  apply() {
    if (this.fromDate && this.toDate && this.fromDate > this.toDate) {
      this.dialog.error('The From date must be on or before the To date.');
      return;
    }
    this.loading.set(true);
    this.salesApi.list(this.filter()).subscribe({
      next: rows => { this.sales.set(rows); this.loading.set(false); },
      error: e => { this.loading.set(false); this.dialog.error(errMsg(e)); }
    });
  }

  reset() {
    this.fromDate = daysAgoLocal(7);
    this.toDate = todayLocal();
    this.status = 'all';
    this.apply();
  }

  /** A button inside a grid row was clicked. */
  async onAction(event: { action: string; row: SaleRow }) {
    const { action, row } = event;
    if (action === 'view') { this.router.navigate(['/sales/find', row.id]); return; }
    if (action.startsWith('status:') && await this.workflow.change(row, action.slice(7) as SaleStatus)) this.apply();
  }

  exportCsv() { this.salesApi.exportCsv(this.filter()); }
}
