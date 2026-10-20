import { Component, computed, inject, signal } from '@angular/core';
import { Dialog } from '@core/dialog/dialog.service';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { errMsg } from '@core/api';
import { NoticeComponent } from '@shared/notice/notice.component';
import { PageHeaderComponent } from '@shared/page-header/page-header.component';
import { ItemsApi } from '@modules/catalog/api';
import { Item } from '@modules/catalog/models';
import { SalesApi } from '../../api';

interface CartLine { item: Item; qty: number; }

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, PageHeaderComponent, NoticeComponent],
  templateUrl: './pos.component.html',
  styleUrl: './pos.component.css'
})
export class PosComponent {
  private dialog = inject(Dialog);
  private itemsApi = inject(ItemsApi);   // items come from the Catalog module
  private salesApi = inject(SalesApi);
  items = signal<Item[]>([]);
  search = signal('');
  message = signal('');
  busy = signal(false);
  cart = signal<CartLine[]>([]);

  shown = computed(() => this.items().filter(i => i.isActive && (i.name + i.sku).toLowerCase().includes(this.search().toLowerCase())));
  total = computed(() => this.cart().reduce((sum, c) => sum + c.item.price * c.qty, 0));

  constructor() { this.load(); }

  load() { this.itemsApi.list().subscribe(r => this.items.set(r)); }

  add(item: Item) {
    const lines = this.cart();
    const existing = lines.find(c => c.item.id === item.id);
    if (!existing) this.cart.set([...lines, { item, qty: 1 }]);
    else if (existing.qty < item.stock) this.cart.set(lines.map(c => c === existing ? { ...c, qty: c.qty + 1 } : c));
  }

  change(line: CartLine, delta: number) {
    const qty = line.qty + delta;
    this.cart.set(qty <= 0
      ? this.cart().filter(c => c !== line)
      : this.cart().map(c => c === line ? { ...c, qty: Math.min(qty, line.item.stock) } : c));
  }

  pay() {
    this.busy.set(true);
    this.salesApi.checkout(this.cart().map(c => ({ itemId: c.item.id, qty: c.qty }))).subscribe({
      next: r => { this.dialog.success(`Sale ${r.number} saved. Total ₹${r.total}.`); this.cart.set([]); this.busy.set(false); this.load(); },
      error: e => { this.dialog.error(errMsg(e)); this.busy.set(false); this.load(); }
    });
  }
}
