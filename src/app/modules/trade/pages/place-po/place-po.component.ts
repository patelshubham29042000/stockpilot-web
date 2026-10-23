import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errMsg } from '@core/api';
import { Dialog } from '@core/dialog/dialog.service';
import { PageHeaderComponent } from '@shared/page-header/page-header.component';
import { TabulatorGridComponent } from '@shared/tabulator-grid/tabulator-grid.component';
import { ItemsApi, SuppliersApi } from '@modules/catalog/api';
import { Item, Supplier } from '@modules/catalog/models';
import { PurchaseOrdersApi } from '../../api';
import { PurchaseOrder } from '../../models';
import { PoWorkflow } from '../../services/po-workflow.service';

/** One line of the purchase order, as it lives in the grid. */
interface PoRow { itemId: number; sku?: string; name: string; qty: number; unitCost: number; }

const rupees = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);
const money = { symbol: '₹', precision: 2, thousand: ',', decimal: '.' };

/**
 * Place PO: build a purchase order by scanning items.
 * The same form opens an existing order read-only on /purchase-orders/find/:id.
 */
@Component({
  selector: 'app-place-po',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DatePipe, RouterLink, PageHeaderComponent, TabulatorGridComponent],
  templateUrl: './place-po.component.html',
  styleUrl: './place-po.component.css'
})
export class PlacePoComponent implements OnInit, AfterViewInit {
  private itemsApi = inject(ItemsApi);
  private suppliersApi = inject(SuppliersApi);
  private ordersApi = inject(PurchaseOrdersApi);
  private workflow = inject(PoWorkflow);
  private dialog = inject(Dialog);
  private router = inject(Router);

  /** Filled from the URL /purchase-orders/find/:id. Empty on /purchase-orders/place. */
  @Input() id?: string;

  @ViewChild(TabulatorGridComponent) grid!: TabulatorGridComponent;
  @ViewChild('scanBox') scanBox?: ElementRef<HTMLInputElement>;

  suppliers = signal<Supplier[]>([]);
  supplierId: number | null = null;
  code = '';                                  // what is scanned or typed in the box
  lines = signal<PoRow[]>([]);                // copy of the grid rows, used for the totals
  busy = signal(false);
  po = signal<PurchaseOrder | null>(null);    // the order being viewed
  viewRows = signal<PoRow[] | null>(null);    // rows handed to the grid in view mode

  totalQty = computed(() => this.lines().reduce((sum, r) => sum + (+r.qty || 0), 0));
  totalCost = computed(() => this.lines().reduce((sum, r) => sum + (+r.qty || 0) * (+r.unitCost || 0), 0));

  get viewing(): boolean { return !!this.id; }

  private readonly lineTotal = (cell: any) => {
    const r = cell.getRow().getData();
    return rupees((+r.qty || 0) * (+r.unitCost || 0));
  };

  /** New order: Qty and Unit cost are editable right in the grid. */
  private readonly editColumns: any[] = [
    { title: '#', formatter: 'rownum', width: 56, hozAlign: 'center', headerSort: false },
    { title: 'SKU', field: 'sku', width: 130, headerSort: false },
    { title: 'Item', field: 'name', minWidth: 180, widthGrow: 3, formatter: 'textarea', headerSort: false },
    {
      title: 'Qty', field: 'qty', width: 110, hozAlign: 'right', headerSort: false,
      editor: 'number', editorParams: { min: 1, step: 1, selectContents: true },
      validator: ['required', 'min:1', 'integer'],
      cellEdited: (cell: any) => cell.getRow().reformat()
    },
    {
      title: 'Unit cost', field: 'unitCost', width: 140, hozAlign: 'right', headerSort: false,
      editor: 'number', editorParams: { min: 0, step: 0.01, selectContents: true },
      formatter: 'money', formatterParams: money,
      validator: ['required', 'min:0'],
      cellEdited: (cell: any) => cell.getRow().reformat()
    },
    { title: 'Line total', width: 140, hozAlign: 'right', headerSort: false, formatter: this.lineTotal },
    {
      title: '', width: 64, hozAlign: 'center', headerSort: false,
      formatter: () => '<button type="button" class="row-remove" aria-label="Remove this line">✕</button>',
      cellClick: (_event: any, cell: any) => this.grid.remove(cell.getRow().getData().itemId)
    }
  ];

  /** Existing order: the same grid, read-only. */
  private readonly viewColumns: any[] = [
    { title: '#', formatter: 'rownum', width: 56, hozAlign: 'center', headerSort: false },
    { title: 'Item', field: 'name', minWidth: 180, widthGrow: 3, formatter: 'textarea', headerSort: false },
    { title: 'Qty', field: 'qty', width: 100, hozAlign: 'right', headerSort: false },
    { title: 'Unit cost', field: 'unitCost', width: 140, hozAlign: 'right', headerSort: false, formatter: 'money', formatterParams: money },
    { title: 'Line total', width: 140, hozAlign: 'right', headerSort: false, formatter: this.lineTotal }
  ];

  get columns(): any[] { return this.viewing ? this.viewColumns : this.editColumns; }

  ngOnInit() {
    if (this.viewing) this.loadPo();
    else this.suppliersApi.list().subscribe(r => this.suppliers.set(r));
  }

  ngAfterViewInit() {
    // On a computer the scan box is ready for the scanner. On a phone we do not pop the keyboard open.
    if (!this.viewing && window.matchMedia('(pointer: fine)').matches) this.focusBox();
  }

  // ---- scan ----

  /** A scanner types the code and presses Enter. The Add button does the same for a typed code. */
  scan() {
    const text = this.code.trim();
    if (!text) return;
    this.itemsApi.byCode(text).subscribe({
      next: item => this.addItem(item).then(() => this.resetBox()),
      error: e => this.dialog.error(errMsg(e)).then(() => this.focusBox())
    });
  }

  private async addItem(item: Item) {
    const existing = this.grid.get(item.id);
    if (existing) {
      await this.grid.patch(item.id, { qty: (+existing.qty || 0) + 1 });   // scanning again adds one
      this.grid.flash(item.id);
    } else {
      await this.grid.add({ itemId: item.id, sku: item.sku, name: item.name, qty: 1, unitCost: item.cost });
    }
    // The first item sets the supplier when none was chosen yet.
    if (this.supplierId === null && item.supplierId) this.supplierId = item.supplierId;
  }

  private resetBox() { this.code = ''; this.focusBox(); }
  private focusBox() { const el = this.scanBox?.nativeElement; el?.focus(); el?.select(); }

  // ---- new order ----

  async clearAll() {
    if (this.lines().length === 0) return;
    if (!(await this.dialog.confirm('Remove all items from this purchase order?'))) return;
    await this.grid.clear();
    this.focusBox();
  }

  async save() {
    const rows = this.grid.rows() as PoRow[];
    if (this.supplierId === null) { await this.dialog.error('Choose a supplier.'); return; }
    if (rows.length === 0) { await this.dialog.error('Scan at least one item.'); return; }
    const bad = rows.find(r => !Number.isInteger(+r.qty) || +r.qty < 1 || !(+r.unitCost >= 0));
    if (bad) { await this.dialog.error(`Check the quantity and unit cost of ${bad.name}.`); return; }

    this.busy.set(true);
    this.ordersApi.create({
      supplierId: this.supplierId,
      lines: rows.map(r => ({ itemId: r.itemId, qty: +r.qty, unitCost: +r.unitCost }))
    }).subscribe({
      next: async r => {
        this.busy.set(false);
        await this.grid.clear();
        this.supplierId = null;
        await this.dialog.success(`Purchase order ${r.number} was saved as pending.`);
        this.focusBox();
      },
      error: e => { this.busy.set(false); this.dialog.error(errMsg(e)); }
    });
  }

  // ---- existing order (view) ----

  private loadPo() {
    this.ordersApi.get(+this.id!).subscribe({
      next: po => {
        this.po.set(po);
        const rows = po.lines.map(l => ({ itemId: l.itemId, name: l.item, qty: l.qty, unitCost: l.unitCost }));
        this.viewRows.set(rows);
        this.lines.set(rows);
      },
      error: e => this.dialog.error(errMsg(e)).then(() => this.router.navigate(['/purchase-orders/find']))
    });
  }

  async completePo() { const po = this.po(); if (po && await this.workflow.complete(po)) this.loadPo(); }
  async cancelPo() { const po = this.po(); if (po && await this.workflow.cancel(po)) this.loadPo(); }
}
