import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errMsg } from '@core/api';
import { Auth, PERM } from '@core/auth';
import { Dialog } from '@core/dialog/dialog.service';
import { PageHeaderComponent } from '@shared/page-header/page-header.component';
import { TabulatorGridComponent } from '@shared/tabulator-grid/tabulator-grid.component';
import { GridButton, actionButtons, badge, esc, money } from '@shared/tabulator-grid/grid-formatters';
import { ItemsApi } from '@modules/catalog/api';
import { Item } from '@modules/catalog/models';

@Component({
  selector: 'app-item-list',
  standalone: true,
  imports: [FormsModule, RouterLink, PageHeaderComponent, TabulatorGridComponent],
  templateUrl: './item-list.component.html',
  styleUrl: './item-list.component.css'
})
export class ItemListComponent implements OnDestroy {
  private itemsApi = inject(ItemsApi);
  private router = inject(Router);
  private dialog = inject(Dialog);
  auth = inject(Auth);
  readonly PERM = PERM;

  rows = signal<Item[]>([]);
  loading = signal(false);
  search = '';
  lowOnly = false;
  private timer?: ReturnType<typeof setTimeout>;

  /** Tabulator columns. A higher `responsive` number is hidden first on a narrow screen. */
  readonly columns: any[] = this.buildColumns();

  constructor() { this.load(); }

  ngOnDestroy() { clearTimeout(this.timer); }

  private buildColumns(): any[] {
    const columns: any[] = [
      { title: 'SKU', field: 'sku', width: 120, responsive: 1, formatter: (cell: any) => esc(cell.getValue()) },
      {
        title: 'Name', field: 'name', minWidth: 120, widthGrow: 3, responsive: 0,
        formatter: (cell: any) => {
          const r: Item = cell.getRow().getData();
          return esc(r.name) + (r.isActive ? '' : ' ' + badge('Inactive'));
        }
      },
      { title: 'Category', field: 'category', minWidth: 120, widthGrow: 1, responsive: 3, formatter: (cell: any) => esc(cell.getValue()) },
      { title: 'Price', field: 'price', width: 120, hozAlign: 'right', sorter: 'number', formatter: 'money', formatterParams: money, responsive: 2 },
      { title: 'Cost', field: 'cost', width: 120, hozAlign: 'right', sorter: 'number', formatter: 'money', formatterParams: money, responsive: 4 },
      {
        title: 'Stock', field: 'stock', width: 90, hozAlign: 'right', sorter: 'number', responsive: 0,
        formatter: (cell: any) => {
          const r: Item = cell.getRow().getData();
          return badge(r.stock, r.stock <= r.reorderLevel ? 'low' : 'ok');
        }
      }
    ];

    // Only people who may manage items get the buttons column.
    if (this.auth.can(PERM.itemsManage)) {
      columns.push({
        title: '', width: 185, hozAlign: 'right', headerSort: false, responsive: 0,
        formatter: (cell: any) => {
          const r: Item = cell.getRow().getData();
          const buttons: GridButton[] = [{ action: 'edit', label: 'Edit' }];
          if (r.isActive) buttons.push({ action: 'deactivate', label: 'Deactivate', kind: 'bad' });
          return actionButtons(buttons);
        }
      });
    }
    return columns;
  }

  load() {
    this.loading.set(true);
    this.itemsApi.list(this.search, this.lowOnly).subscribe({
      next: r => { this.rows.set(r); this.loading.set(false); },
      error: e => { this.loading.set(false); this.dialog.error(errMsg(e)); }
    });
  }

  /** Typing in the search box: wait a moment, then ask the server. */
  onSearch(text: string) {
    this.search = text;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.load(), 300);
  }

  onLowOnly(on: boolean) { this.lowOnly = on; this.load(); }

  /** A button inside a grid row was clicked. */
  onAction(event: { action: string; row: Item }) {
    if (event.action === 'edit') this.router.navigate(['/items', event.row.id, 'edit']);
    else if (event.action === 'deactivate') this.deactivate(event.row);
  }

  async deactivate(item: Item) {
    if (!(await this.dialog.confirm(`Deactivate ${item.name}? It will no longer show in sales.`))) return;
    this.itemsApi.deactivate(item.id).subscribe({
      next: () => { this.dialog.success(`${item.name} was deactivated.`); this.load(); },
      error: e => this.dialog.error(errMsg(e))
    });
  }

  exportCsv() { this.itemsApi.exportCsv(); }

  import(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.itemsApi.importCsv(file).subscribe({
      next: r => {
        this.dialog.success(`Imported: ${r.created} new, ${r.updated} updated${r.errors.length ? ', skipped: ' + r.errors.join('; ') : ''}.`);
        this.load();
      },
      error: e => this.dialog.error(errMsg(e))
    });
    input.value = '';
  }
}
