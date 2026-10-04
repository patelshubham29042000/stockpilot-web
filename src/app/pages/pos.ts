import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { errMsg } from '../core/auth';

@Component({
  standalone: true, imports: [FormsModule, CurrencyPipe],
  template: `
  <div class="bar"><h1>Sell</h1><input placeholder="Search name or SKU" [ngModel]="q()" (ngModelChange)="q.set($event)" style="min-width:220px"></div>
  @if (msg()) { <p class="note">{{ msg() }}</p> }
  <div class="pos">
    <div class="tiles">
      @for (i of shown(); track i.id) {
        <button class="tile" [disabled]="i.stock < 1" (click)="add(i)">
          <b>{{ i.name }}</b><span style="color:var(--mut)">{{ i.sku }}</span><br>
          {{ i.price | currency:'INR':'symbol':'1.0-2' }} <span class="badge" [class.low]="i.stock <= i.reorderLevel">{{ i.stock }} left</span>
        </button>
      } @empty { <p>No items match.</p> }
    </div>
    <div class="card cart">
      <b>Current bill</b>
      @for (c of cart(); track c.item.id) {
        <div class="line"><span style="flex:1">{{ c.item.name }}<br><small>{{ c.item.price | currency:'INR' }}</small></span>
          <button class="btn alt sm" (click)="chg(c, -1)" aria-label="Less">−</button> {{ c.qty }}
          <button class="btn alt sm" (click)="chg(c, 1)" aria-label="More">+</button></div>
      } @empty { <p style="color:var(--mut)">Tap an item to add it.</p> }
      <div class="total"><span>Total</span><span>{{ total() | currency:'INR' }}</span></div>
      <button class="btn pri" style="width:100%" [disabled]="!cart().length || busy()" (click)="pay()">Complete sale</button>
    </div>
  </div>`
})
export class PosPage {
  private http = inject(HttpClient);
  items = signal<any[]>([]); q = signal(''); msg = signal(''); busy = signal(false);
  cart = signal<{ item: any; qty: number }[]>([]);
  shown = computed(() => this.items().filter(i => i.isActive && (i.name + i.sku).toLowerCase().includes(this.q().toLowerCase())));
  total = computed(() => this.cart().reduce((s, c) => s + c.item.price * c.qty, 0));
  constructor() { this.load(); }
  load() { this.http.get<any[]>('/api/items').subscribe(r => this.items.set(r)); }
  add(i: any) {
    const c = this.cart(); const f = c.find(x => x.item.id === i.id);
    if (f) { if (f.qty < i.stock) this.cart.set(c.map(x => x === f ? { ...x, qty: x.qty + 1 } : x)); }
    else this.cart.set([...c, { item: i, qty: 1 }]);
  }
  chg(c: { item: any; qty: number }, d: number) {
    const q = c.qty + d;
    this.cart.set(q <= 0 ? this.cart().filter(x => x !== c) : this.cart().map(x => x === c ? { ...x, qty: Math.min(q, c.item.stock) } : x));
  }
  pay() {
    this.busy.set(true);
    this.http.post<any>('/api/sales', { lines: this.cart().map(c => ({ itemId: c.item.id, qty: c.qty })) }).subscribe({
      next: r => { this.msg.set(`Sale ${r.number} saved. Total ₹${r.total}.`); this.cart.set([]); this.busy.set(false); this.load(); },
      error: e => { this.msg.set(errMsg(e)); this.busy.set(false); this.load(); }
    });
  }
}
