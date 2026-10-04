import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Auth, errMsg } from '../core/auth';

@Component({
  standalone: true, imports: [FormsModule, CurrencyPipe],
  template: `
  <div class="bar"><h1>Items</h1>
    <div class="row">
      <input placeholder="Search name or SKU" [(ngModel)]="q" (input)="load()">
      <label class="row"><input type="checkbox" [(ngModel)]="low" (change)="load()"> Low stock only</label>
      <button class="btn pri" (click)="edit({ reorderLevel: 10, stock: 0, price: 0, cost: 0 })">Add item</button>
      <label class="btn alt">Import CSV<input type="file" accept=".csv" hidden (change)="import($event)"></label>
      <button class="btn alt" (click)="auth.download('/api/items/export','items.csv')">Export CSV</button>
    </div>
  </div>
  <p style="color:var(--mut);margin-top:-8px">CSV columns: sku, name, category, price, cost, qty, reorder. The qty is added to current stock.</p>
  @if (msg()) { <p class="note">{{ msg() }}</p> }
  @if (f(); as m) {
    <form class="card form" (ngSubmit)="save()">
      <label>SKU<input name="sku" [(ngModel)]="m.sku" required></label>
      <label>Name<input name="name" [(ngModel)]="m.name" required></label>
      <label>Category<select name="cat" [(ngModel)]="m.categoryId"><option [ngValue]="null">None</option>@for (c of cats(); track c.id) { <option [ngValue]="c.id">{{ c.name }}</option> }</select></label>
      <label>Supplier<select name="sup" [(ngModel)]="m.supplierId"><option [ngValue]="null">None</option>@for (s of sups(); track s.id) { <option [ngValue]="s.id">{{ s.name }}</option> }</select></label>
      <label>Selling price<input name="price" type="number" min="0" step="0.01" [(ngModel)]="m.price"></label>
      <label>Cost<input name="cost" type="number" min="0" step="0.01" [(ngModel)]="m.cost"></label>
      @if (!m.id) { <label>Opening stock<input name="stock" type="number" min="0" [(ngModel)]="m.stock"></label> }
      <label>Reorder at<input name="ro" type="number" min="0" [(ngModel)]="m.reorderLevel"></label>
      <div class="row"><button class="btn pri">Save item</button><button type="button" class="btn alt" (click)="f.set(null)">Cancel</button><button type="button" class="btn alt" (click)="addCat()">New category</button></div>
    </form>
  }
  <div class="card tbl"><table>
    <thead><tr><th>SKU</th><th>Name</th><th>Category</th><th class="r">Price</th><th class="r">Cost</th><th class="r">Stock</th><th></th></tr></thead>
    <tbody>
    @for (i of items(); track i.id) {
      <tr [style.opacity]="i.isActive ? 1 : .45"><td>{{ i.sku }}</td><td>{{ i.name }}</td><td>{{ i.category }}</td>
        <td class="r">{{ i.price | currency:'INR' }}</td><td class="r">{{ i.cost | currency:'INR' }}</td>
        <td class="r"><span class="badge" [class.low]="i.stock <= i.reorderLevel" [class.ok]="i.stock > i.reorderLevel">{{ i.stock }}</span></td>
        <td class="r"><button class="btn alt sm" (click)="edit(i)">Edit</button> @if (i.isActive) { <button class="btn bad sm" (click)="remove(i)">Deactivate</button> }</td></tr>
    } @empty { <tr><td colspan="7">No items yet. Add one or import a CSV.</td></tr> }
    </tbody></table></div>`
})
export class ItemsPage {
  private http = inject(HttpClient); auth = inject(Auth);
  items = signal<any[]>([]); cats = signal<any[]>([]); sups = signal<any[]>([]); f = signal<any>(null); msg = signal('');
  q = ''; low = false;
  constructor() { this.load(); this.loadLists(); }
  loadLists() { this.http.get<any[]>('/api/categories').subscribe(r => this.cats.set(r)); this.http.get<any[]>('/api/suppliers').subscribe(r => this.sups.set(r)); }
  load() { this.http.get<any[]>('/api/items', { params: { q: this.q, lowOnly: this.low } }).subscribe(r => this.items.set(r)); }
  edit(i: any) { this.f.set({ ...i }); }
  save() {
    const m = this.f(); const body = { sku: m.sku, name: m.name, categoryId: m.categoryId ?? null, supplierId: m.supplierId ?? null, price: m.price, cost: m.cost, reorderLevel: m.reorderLevel, stock: m.stock ?? 0 };
    const req = m.id ? this.http.put(`/api/items/${m.id}`, body) : this.http.post('/api/items', body);
    req.subscribe({ next: () => { this.f.set(null); this.msg.set('Item saved.'); this.load(); }, error: e => this.msg.set(errMsg(e)) });
  }
  remove(i: any) { if (confirm(`Deactivate ${i.name}? It will no longer show in sales.`)) this.http.delete(`/api/items/${i.id}`).subscribe(() => this.load()); }
  addCat() { const name = prompt('Category name'); if (name) this.http.post('/api/categories', { name }).subscribe({ next: () => this.loadLists(), error: e => this.msg.set(errMsg(e)) }); }
  import(ev: Event) {
    const el = ev.target as HTMLInputElement; const file = el.files?.[0]; if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    this.http.post<any>('/api/items/import', fd).subscribe({
      next: r => { this.msg.set(`Imported: ${r.created} new, ${r.updated} updated${r.errors.length ? ', skipped: ' + r.errors.join('; ') : ''}.`); this.load(); this.loadLists(); },
      error: e => this.msg.set(errMsg(e))
    });
    el.value = '';
  }
}
