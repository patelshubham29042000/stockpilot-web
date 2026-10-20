import { CurrencyPipe, DatePipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { Component, ContentChild, ContentChildren, Input, QueryList, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GridActionsDirective, GridCellDirective } from './grid-templates';
import { GridColumn } from './grid.types';

const compare = (a: unknown, b: unknown): number => {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
};

@Component({
  selector: 'app-data-grid',
  standalone: true,
  imports: [FormsModule, NgTemplateOutlet, CurrencyPipe, DatePipe, DecimalPipe],
  templateUrl: './data-grid.component.html',
  styleUrl: './data-grid.component.css'
})
export class DataGridComponent {
  @Input({ required: true }) set columns(value: GridColumn[]) { this.cols.set(value); }
  @Input() set rows(value: any[] | null | undefined) { this.data.set(value ?? []); this.page.set(1); }
  @Input() set pageSize(value: number) { this.size.set(value); }
  @Input() loading = false;
  @Input() searchable = true;
  @Input() searchPlaceholder = 'Search…';
  @Input() emptyText = 'Nothing to show.';
  @Input() pageSizes = [10, 25, 50, 100];

  @ContentChildren(GridCellDirective) cellTemplates!: QueryList<GridCellDirective>;
  @ContentChild(GridActionsDirective) actions?: GridActionsDirective;

  cols = signal<GridColumn[]>([]);
  private data = signal<any[]>([]);
  query = signal('');
  sortKey = signal<string | null>(null);
  sortDir = signal<'asc' | 'desc'>('asc');
  page = signal(1);
  size = signal(10);

  filtered = computed(() => {
    const text = this.query().trim().toLowerCase();
    if (!text) return this.data();
    const keys = this.cols().map(c => c.key);
    return this.data().filter(row => keys.some(k => String(row[k] ?? '').toLowerCase().includes(text)));
  });

  sorted = computed(() => {
    const key = this.sortKey();
    if (!key) return this.filtered();
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    return [...this.filtered()].sort((a, b) => compare(a[key], b[key]) * dir);
  });

  pageCount = computed(() => Math.max(1, Math.ceil(this.sorted().length / this.size())));
  currentPage = computed(() => Math.min(this.page(), this.pageCount()));
  pageRows = computed(() => {
    const start = (this.currentPage() - 1) * this.size();
    return this.sorted().slice(start, start + this.size());
  });
  rangeText = computed(() => {
    const total = this.sorted().length;
    if (!total) return '';
    const from = (this.currentPage() - 1) * this.size() + 1;
    return `Showing ${from}–${Math.min(this.currentPage() * this.size(), total)} of ${total}`;
  });

  cellTemplate(key: string) { return this.cellTemplates?.find(t => t.key === key)?.template; }

  sortBy(column: GridColumn) {
    if (column.sortable === false) return;
    if (this.sortKey() === column.key) this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    else { this.sortKey.set(column.key); this.sortDir.set('asc'); }
    this.page.set(1);
  }
  arrow(column: GridColumn) { return this.sortKey() === column.key ? (this.sortDir() === 'asc' ? '▲' : '▼') : '↕'; }
  ariaSort(column: GridColumn) {
    return this.sortKey() === column.key ? (this.sortDir() === 'asc' ? 'ascending' : 'descending') : 'none';
  }
  search(text: string) { this.query.set(text); this.page.set(1); }
  setSize(value: number) { this.size.set(+value); this.page.set(1); }
  go(page: number) { this.page.set(page); }
}
