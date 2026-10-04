import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { errMsg } from '../core/auth';

@Component({
  standalone: true, imports: [FormsModule],
  template: `
  <div class="bar"><h1>Suppliers</h1><button class="btn pri" (click)="f.set({})">Add supplier</button></div>
  @if (msg()) { <p class="note">{{ msg() }}</p> }
  @if (f(); as m) {
    <form class="card form" (ngSubmit)="save()">
      <label>Name<input name="n" [(ngModel)]="m.name" required></label>
      <label>Phone<input name="p" [(ngModel)]="m.phone"></label>
      <label>Email<input name="e" type="email" [(ngModel)]="m.email"></label>
      <div class="row"><button class="btn pri">Save supplier</button><button type="button" class="btn alt" (click)="f.set(null)">Cancel</button></div>
    </form>
  }
  <div class="card tbl"><table><thead><tr><th>Name</th><th>Phone</th><th>Email</th><th></th></tr></thead><tbody>
    @for (s of list(); track s.id) { <tr><td>{{ s.name }}</td><td>{{ s.phone }}</td><td>{{ s.email }}</td>
      <td class="r"><button class="btn alt sm" (click)="edit(s)">Edit</button> <button class="btn bad sm" (click)="remove(s)">Remove</button></td></tr> }
    @empty { <tr><td colspan="4">No suppliers yet.</td></tr> }
  </tbody></table></div>`
})
export class SuppliersPage {
  private http = inject(HttpClient);
  list = signal<any[]>([]); f = signal<any>(null); msg = signal('');
  edit(s: any) { this.f.set({...s});}
  load() { this.http.get<any[]>('/api/suppliers').subscribe(r => this.list.set(r)); }
  save() {
    const m = this.f(); const b = { name: m.name, phone: m.phone ?? null, email: m.email ?? null };
    (m.id ? this.http.put(`/api/suppliers/${m.id}`, b) : this.http.post('/api/suppliers', b))
      .subscribe({ next: () => { this.f.set(null); this.load(); }, error: e => this.msg.set(errMsg(e)) });
  }
  remove(s: any) { if (confirm(`Remove ${s.name}?`)) this.http.delete(`/api/suppliers/${s.id}`).subscribe(() => this.load()); }
}
