import { AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnDestroy, Output, ViewChild, ViewEncapsulation, inject } from '@angular/core';
import { TabulatorFull as Tabulator } from 'tabulator-tables';

type RowId = number | string;

/**
 * An editable grid (Tabulator). The grid itself holds the rows. The page adds, patches or removes rows
 * through the methods below and listens to `changed`, which carries every row after any change.
 */
@Component({
  selector: 'app-tabulator-grid',
  standalone: true,
  templateUrl: './tabulator-grid.component.html',
  styleUrl: './tabulator-grid.component.css',
  encapsulation: ViewEncapsulation.None   // so the styles can reach Tabulator's own markup
})
export class TabulatorGridComponent implements AfterViewInit, OnDestroy {
  private zone = inject(NgZone);
  private table: any;
  private ready: Promise<void> = Promise.resolve();

  /** Tabulator column definitions. */
  @Input({ required: true }) columns: any[] = [];
  /** The field that identifies a row (for example 'itemId'). */
  @Input() idField = 'id';
  @Input() placeholder = 'No rows yet.';
  @Input() maxHeight = '55vh';
  @Output() changed = new EventEmitter<any[]>();
  /** Rows to show in a list grid. When this changes, the grid shows the new rows. */
  @Input() set data(rows: any[] | null | undefined) { this.pending = rows ?? null; this.pushData(); }
  /** 0 = no paging, otherwise rows per page. */
  @Input() pageSize = 0;
  /** On narrow screens, hide columns with a higher `responsive` number first (0 = never hidden). */
  @Input() responsive = false;
  /** A button inside a cell with data-action="name" was clicked. */
  @Output() rowAction = new EventEmitter<{ action: string; row: any }>();
  private pending: any[] | null = null;

  @ViewChild('host', { static: true }) host!: ElementRef<HTMLDivElement>;

  ngAfterViewInit() {
    this.zone.runOutsideAngular(() => {
      this.table = new Tabulator(this.host.nativeElement, {
        data: this.pending ?? [],
        index: this.idField,
        layout: 'fitColumns',
        columns: this.columns,
        placeholder: this.placeholder,
        maxHeight: this.maxHeight,
        movableColumns: false,
        responsiveLayout: this.responsive ? 'hide' : false,
        ...(this.pageSize > 0 ? { pagination: true, paginationSize: this.pageSize, paginationSizeSelector: [10, 25, 50, 100], paginationCounter: 'rows' } : {})
      });
      this.ready = new Promise<void>(resolve => this.table.on('tableBuilt', () => resolve()));
      this.table.on('cellEdited', () => this.emit());
      this.table.on('cellClick', (event: Event, cell: any) => {
        const button = (event.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
        if (button) this.zone.run(() => this.rowAction.emit({ action: button.dataset['action']!, row: cell.getRow().getData() }));
      });
    });
  }

  ngOnDestroy() { this.table?.destroy(); }

  /** All rows, as they are now. */
  rows(): any[] { return this.table?.getData() ?? []; }

  /** One row's data, or undefined when it is not in the grid. */
  get(id: RowId): any | undefined {
    const row = this.table?.getRow(id);
    return row ? row.getData() : undefined;
  }

  async add(row: any): Promise<void> {
    await this.ready;
    await this.table.addRow(row, true);          // newest row on top
    this.emit();
  }

  async patch(id: RowId, changes: any): Promise<void> {
    await this.ready;
    const row = this.table.getRow(id);
    if (!row) return;
    await row.update(changes);
    row.reformat();                              // refresh calculated columns such as the line total
    this.emit();
  }

  async remove(id: RowId): Promise<void> {
    await this.ready;
    await this.table.deleteRow(id);
    this.emit();
  }

  async clear(): Promise<void> {
    await this.ready;
    await this.table.clearData();
    this.emit();
  }

  /** Briefly highlights a row, for example when its quantity went up. */
  flash(id: RowId) {
    const row = this.table?.getRow(id);
    const el: HTMLElement | undefined = row ? row.getElement() : undefined;
    if (!el) return;
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  }

  private async pushData() {
    if (!this.table || !this.pending) return;
    await this.ready;
    await this.table.replaceData(this.pending);
  }

  private emit() { this.zone.run(() => this.changed.emit(this.rows())); }
}
