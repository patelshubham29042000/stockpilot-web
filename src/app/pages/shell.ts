import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Auth } from '../core/auth';

@Component({
  selector: 'app-shell', standalone: true, imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
  <div class="shell">
    <aside [class.open]="open()">
      <h2>StockPilot</h2>
      @for (l of links; track l.p) {
        @if (auth.can(l.r)) { <a [routerLink]="l.p" routerLinkActive="on" (click)="open.set(false)">{{ l.t }}</a> }
      }
      <div class="me"><span>{{ auth.name() }} ({{ auth.role() }})</span><button class="btn alt sm" (click)="auth.logout()">Log out</button></div>
    </aside>
    @if (open()) { <div class="scrim" (click)="open.set(false)"></div> }
    <main>
      <header><button class="burger" aria-label="Open menu" (click)="open.set(true)">☰</button></header>
      <router-outlet />
    </main>
  </div>`
})
export class Shell {
  auth = inject(Auth);
  open = signal(false);
  links = [
    { p: '/dashboard', t: 'Dashboard' }, { p: '/pos', t: 'Sell (POS)' },
    { p: '/items', t: 'Items', r: ['Admin', 'Manager'] }, { p: '/purchase-orders', t: 'Purchase orders', r: ['Admin', 'Manager'] },
    { p: '/suppliers', t: 'Suppliers', r: ['Admin', 'Manager'] }, { p: '/users', t: 'Users & audit', r: ['Admin'] }
  ] as { p: string; t: string; r?: string[] }[];
}
