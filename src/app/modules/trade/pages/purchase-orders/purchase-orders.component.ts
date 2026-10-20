import { Component, inject, signal } from '@angular/core';
import { Dialog } from '@core/dialog/dialog.service';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { errMsg } from '@core/api';
import { NoticeComponent } from '@shared/notice/notice.component';
import { PageHeaderComponent } from '@shared/page-header/page-header.component';
import { ItemsApi, SuppliersApi } from '@modules/catalog/api';
import { Item, Supplier } from '@modules/catalog/models';
import { PurchaseOrdersApi } from '../../api';
import { PoDraft, PoDraftLine, PurchaseOrder } from '../../models';

@Component({
  selector: 'app-purchase-orders',
  standalone: true,
  imports: [FormsModule, DatePipe, PageHeaderComponent, NoticeComponent],
  templateUrl: './purchase-orders.component.html',
  styleUrl: './purchase-orders.component.css'
})
export class PurchaseOrdersComponent {
  private dialog = inject(Dialog);
  private ordersApi = inject(PurchaseOrdersApi);
  private suppliersApi = inject(SuppliersApi);   // suppliers and items come from the Catalog module
  private itemsApi = inject(ItemsApi);
  orders = signal<PurchaseOrder[]>([]);
  suppliers = signal<Supplier[]>([]);
  items = signal<Item[]>([]);
  draft = signal<PoDraft | null>(null);
  message = signal('');

  constructor() {
    this.load();
    this.suppliersApi.list().subscribe(r => this.suppliers.set(r));
    this.itemsApi.list().subscribe(r => this.items.set(r.filter(i => i.isActive)));
  }

  load() { this.ordersApi.list().subscribe(r => this.orders.set(r)); }

  newOrder() { this.draft.set({ supplierId: null, lines: [this.emptyLine()] }); }
  addLine(draft: PoDraft) { draft.lines.push(this.emptyLine()); }
  removeLine(draft: PoDraft, index: number) { draft.lines.splice(index, 1); }
  pickItem(line: PoDraftLine, itemId: number) {
    line.itemId = itemId;
    line.unitCost = this.items().find(i => i.id === itemId)?.cost ?? 0;
  }

  save() {
    this.ordersApi.create(this.draft()!).subscribe({
      next: () => { this.draft.set(null); this.dialog.success('Order saved as draft.'); this.load(); },
      error: e => this.dialog.error(errMsg(e))
    });
  }

  autoCreate() {
    this.ordersApi.autoCreate().subscribe({
      next: r => { r.created ? this.dialog.success(`${r.created} draft order(s) created.`) : this.dialog.info('Nothing to reorder right now.'); this.load(); },
      error: e => this.dialog.error(errMsg(e))
    });
  }

  async receive(order: PurchaseOrder) {
    if (!(await this.dialog.confirm(`Receive ${order.number}? Stock will increase.`))) return;
    this.ordersApi.receive(order.id).subscribe({
      next: () => { this.dialog.success('Stock updated.'); this.load(); },
      error: e => this.dialog.error(errMsg(e))
    });
  }

  private emptyLine(): PoDraftLine { return { itemId: null, qty: 1, unitCost: 0 }; }
}
