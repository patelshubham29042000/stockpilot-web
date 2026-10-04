import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, forkJoin, of } from 'rxjs';
import { errMsg } from '../core/auth';

@Component({
  standalone: true, imports: [FormsModule, DatePipe],
  template: `
  <div class="bar"><h1>Users &amp; audit</h1></div>
  @if (msg()) { <p class="note">{{ msg() }}</p> }
  <form class="card form" (ngSubmit)="add()">
    <label>Username<input name="u" [(ngModel)]="n.username" required></label>
    <label>Full name<input name="f" [(ngModel)]="n.fullName" required></label>
    <label>Password (8+ characters)<input name="p" type="password" [(ngModel)]="n.password" required minlength="8"></label>
    <label>Role<select name="r" [(ngModel)]="n.role"><option>Cashier</option><option>Manager</option><option>Admin</option></select></label>
    <button class="btn pri">Add user</button>
  </form>
  <div class="card tbl"><table><thead><tr><th>Username</th><th>Name</th><th>Role</th><th></th></tr></thead><tbody>
    @for (u of users(); track u.id) { <tr><td>{{ u.username }}</td><td>{{ u.fullName }}</td><td><span class="badge">{{ u.role }}</span></td><td class="r"><button class="btn bad sm" (click)="remove(u)">Delete</button></td></tr> }
  </tbody></table></div>
  <h2>Recent activity</h2>
  <div class="card tbl"><table><thead><tr><th>When</th><th>User</th><th>What</th><th>Details</th></tr></thead><tbody>
    @for (a of audit(); track a.id) { <tr><td>{{ a.at | date:'short' }}</td><td>{{ a.userName }}</td><td>{{ a.entity }} {{ a.action }}</td><td>{{ a.details }}</td></tr> }
  </tbody></table></div>`
})
export class UsersPage {
  private http = inject(HttpClient);
  users = signal<any[]>([]); audit = signal<any[]>([]); msg = signal('');
  n: any = { role: 'Cashier' };
  constructor() { this.load(); }
  load() { this.http.get<any[]>('/api/users').subscribe(r => this.users.set(r)); forkJoin(['identity', 'catalog', 'trade'].map(svc => this.http.get<any[]>(`/api/audit/${svc}`).pipe(catchError(() => of([])))))
      .subscribe(r => this.audit.set(r.flat().sort((a, b) => b.at.localeCompare(a.at)).slice(0, 100)));
  }
  add() { this.http.post('/api/users', this.n).subscribe({ next: () => { this.n = { role: 'Cashier' }; this.msg.set('User added.'); this.load(); }, error: e => this.msg.set(errMsg(e)) }); }
  remove(u: any) { if (confirm(`Delete ${u.username}?`)) this.http.delete(`/api/users/${u.id}`).subscribe({ next: () => this.load(), error: e => this.msg.set(errMsg(e)) }); }
}
