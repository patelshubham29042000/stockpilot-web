import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth, errMsg } from '../core/auth';

@Component({
  standalone: true, imports: [FormsModule],
  template: `
  <div class="login">
    <form class="card" (ngSubmit)="go()">
      <h1>StockPilot</h1>
      <p style="margin:0;color:var(--mut)">Sign in to manage stock and sales.</p>
      <input name="u" placeholder="Username" autocomplete="username" [(ngModel)]="u" required>
      <input name="p" type="password" placeholder="Password" autocomplete="current-password" [(ngModel)]="p" required>
      @if (err()) { <span class="err">{{ err() }}</span> }
      <button class="btn pri" [disabled]="busy()">Sign in</button>
    </form>
  </div>`
})
export class LoginPage {
  private auth = inject(Auth); private router = inject(Router);
  u = ''; p = ''; err = signal(''); busy = signal(false);
  go() {
    this.busy.set(true); this.err.set('');
    this.auth.login(this.u, this.p).subscribe({ next: () => this.router.navigate(['/dashboard']), error: e => { this.err.set(errMsg(e)); this.busy.set(false); } });
  }
}
