import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { dayEndIso, dayStartIso, daysAgoLocal, errMsg, todayLocal } from '@core/api';
import { Dialog } from '@core/dialog/dialog.service';
import { PageHeaderComponent } from '@shared/page-header/page-header.component';
import { TabulatorGridComponent } from '@shared/tabulator-grid/tabulator-grid.component';
import { PurchaseOrdersApi } from '../../api';
import { PoStatus, PurchaseOrder } from '../../models';
import { PoWorkflow } from '../../services/po-workflow.service';

const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const dateFormat = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

@Component({
  selector: 'app-find-po',
  standalone: true,
  imports: [FormsModule, RouterLink, PageHeaderComponent, TabulatorGridComponent],
  templateUrl: './find-po.component.html',
  styleUrl: './find-po.component.css'
})
export class FindPoComponent {
  private ordersApi = inject(PurchaseOrdersApi);
  private workflow = inject(PoWorkflow);
  private dialog = inject(Dialog);
  private router = inject(Router);

  readonly statuses: PoStatus[] = ['Pending', 'Completed', 'Cancelled'];

  // Defaults: one week back to today, every status.
  fromDate = daysAgoLocal(7);
  toDate = todayLocal();
  status: PoStatus | 'all' = 'all';

  orders = signal<PurchaseOrder[]>([]);
  loading = signal(false);
  search = signal('');

  shown = computed(() => {
    const text = this.search().trim().toLowerCase();
    if (!text) return this.orders();
    return this.orders().filter(o => `${o.number} ${o.supplier} ${o.status}`.toLowerCase().includes(text));
  });

  /** Tabulator columns. A higher `responsive` number hides first on a narrow screen. */
  readonly columns: any[] = [
    {
      title: 'PO number', field: 'number', width: 200, responsive: 0,
      formatter: (cell: any) => `<strong>${esc(cell.getValue())}</strong>`
    },
    {
      title: 'Date', field: 'createdAt', width: 170, responsive: 4,
      formatter: (cell: any) => { const d = new Date(cell.getValue()); return isNaN(+d) ? '' : esc(dateFormat.format(d)); }
    },
    { title: 'Supplier', field: 'supplier', minWidth: 140, widthGrow: 2, formatter: 'textarea', responsive: 3 },
    {
      title: 'Total', field: 'total', width: 130, hozAlign: 'right', sorter: 'number', responsive: 2,
      formatter: 'money', formatterParams: { symbol: '₹', precision: 2, thousand: ',', decimal: '.' }
    },
    {
      title: 'Status', field: 'status', width: 120, responsive: 0,
      formatter: (cell: any) => {
        const s = cell.getValue();
        const cls = s === 'Pending' ? 'warn' : s === 'Completed' ? 'ok' : 'low';
        return `<span class="badge ${cls}">${esc(s)}</span>`;
      }
    },
    {
      title: '', width: 270, hozAlign: 'right', headerSort: false, responsive: 0,
      formatter: (cell: any) => {
        const pending = cell.getRow().getData().status === 'Pending';
        return `<div class="act">
          <button type="button" class="btn alt sm" data-action="view">View</button>
          ${pending ? '<button type="button" class="btn ok sm act-wide" data-action="complete">Complete</button><button type="button" class="btn bad sm act-wide" data-action="cancel">Cancel</button>' : ''}
        </div>`;
      }
    }
  ];

  constructor() { this.apply(); }

  /** Runs for the Filter button, and right away when the Status changes. */
  apply() {
    if (this.fromDate && this.toDate && this.fromDate > this.toDate) {
      this.dialog.error('The From date must be on or before the To date.');
      return;
    }
    this.loading.set(true);
    this.ordersApi.list({
      from: this.fromDate ? dayStartIso(this.fromDate) : undefined,
      to: this.toDate ? dayEndIso(this.toDate) : undefined,
      status: this.status === 'all' ? undefined : this.status
    }).subscribe({
      next: rows => { this.orders.set(rows); this.loading.set(false); },
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
  async onAction(event: { action: string; row: PurchaseOrder }) {
    const { action, row } = event;
    if (action === 'view') { this.router.navigate(['/purchase-orders/find', row.id]); return; }
    const reload = action === 'complete' ? await this.workflow.complete(row) : await this.workflow.cancel(row);
    if (reload) this.apply();
  }

  autoCreate() {
    this.ordersApi.autoCreate().subscribe({
      next: r => {
        if (r.created) this.dialog.success(`${r.created} pending purchase order(s) were created for low-stock items.`);
        else this.dialog.info('Nothing to reorder right now.');
        this.apply();
      },
      error: e => this.dialog.error(errMsg(e))
    });
  }
}
