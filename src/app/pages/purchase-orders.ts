import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { errMsg } from '../core/auth';

@Component({
  standalone: true, imports: [FormsModule, DatePipe],
  template: `
  <div class="bar"><h1>Purchase orders</h1><div class="row">
    <button class="btn pri" (click)="auto()">Create from low stock</button>
    <button class="btn alt" (click)="draft.set({ supplierId: null, lines: [{ itemId: null, qty: 1, unitCost: 0 }] })">New order</button></div></div>
  @if (msg()) { <p class="note">{{ msg() }}</p> }
  @if (draft(); as d) {
    <form class="card" (ngSubmit)="save()">
      <label class="row">Supplier <select name="s" [(ngModel)]="d.supplierId" required>@for (s of sups(); track s.id) { <option [ngValue]="s.id">{{ s.name }}</option> }</select></label>
      @for (l of d.lines; track $index) {
        <div class="row" style="margin-top:8px">
          <select [name]="'i'+$index" [ngModel]="l.itemId" (ngModelChange)="pick(l, $event)" required><option [ngValue]="null">Choose item</option>@for (i of items(); track i.id) { <option [ngValue]="i.id">{{ i.name }}</option> }</select>
          <input [name]="'q'+$index" type="number" min="1" style="width:90px" [(ngModel)]="l.qty" aria-label="Quantity">
          <input [name]="'c'+$index" type="number" min="0" step="0.01" style="width:110px" [(ngModel)]="l.unitCost" aria-label="Unit cost">
          <button type="button" class="btn alt sm" (click)="d.lines.splice($index, 1)">Remove</button></div>
      }
      <div class="row" style="margin-top:12px"><button type="button" class="btn alt" (click)="d.lines.push({ itemId: null, qty: 1, unitCost: 0 })">Add line</button>
        <button class="btn pri">Save order</button><button type="button" class="btn alt" (click)="draft.set(null)">Cancel</button></div>
    </form>
  }
  @for (p of list(); track p.id) {
    <div class="card"><div class="bar" style="margin:0 0 8px"><div><b>{{ p.number }}</b> · {{ p.supplier }} · {{ p.createdAt | date:'medium' }}</div>
      <div class="row"><span class="badge" [class.ok]="p.status === 'Received'">{{ p.status }}</span>
        @if (p.status === 'Draft') { <button class="btn sm pri" (click)="receive(p)">Mark received</button> }</div></div>
      @for (l of p.lines; track l.itemId) { <div class="line"><span>{{ l.item }}</span><span>{{ l.qty }} × ₹{{ l.unitCost }}</span></div> }
    </div>
  } @empty { <p>No purchase orders yet.</p> }`
})
export class PurchaseOrdersPage {
  private http = inject(HttpClient);
  list = signal<any[]>([]); sups = signal<any[]>([]); items = signal<any[]>([]); draft = signal<any>(null); msg = signal('');
  constructor() {
    this.load();
    this.http.get<any[]>('/api/suppliers').subscribe(r => this.sups.set(r));
    this.http.get<any[]>('/api/items').subscribe(r => this.items.set(r.filter(i => i.isActive)));
  }
  load() { this.http.get<any[]>('/api/purchaseorders').subscribe(r => this.list.set(r)); }
  pick(l: any, id: number) { l.itemId = id; l.unitCost = this.items().find(i => i.id === id)?.cost ?? 0; }
  save() {
    this.http.post('/api/purchaseorders', this.draft()).subscribe({ next: () => { this.draft.set(null); this.msg.set('Order saved as draft.'); this.load(); }, error: e => this.msg.set(errMsg(e)) });
  }
  auto() { this.http.post<any>('/api/purchaseorders/auto', {}).subscribe({ next: r => { this.msg.set(r.created ? `${r.created} draft order(s) created.` : 'Nothing to reorder right now.'); this.load(); }, error: e => this.msg.set(errMsg(e)) }); }
  receive(p: any) { if (confirm(`Receive ${p.number}? Stock will increase.`)) this.http.post(`/api/purchaseorders/${p.id}/receive`, {}).subscribe({ next: () => { this.msg.set('Stock updated.'); this.load(); }, error: e => this.msg.set(errMsg(e)) }); }
}
