import { Component, inject, signal } from '@angular/core';
import { Dialog } from '@core/dialog/dialog.service';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { PageHeaderComponent } from '@shared/page-header/page-header.component';
import { AuditApi } from './api';
import { AuditFilter, AuditRow, AuditSource } from './models';

/** A date as yyyy-MM-dd in the user's own time zone (what a date input expects). */
const toDateString = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const todayLocal = (): string => toDateString(new Date());
const weekAgoLocal = (): string => { const d = new Date(); d.setDate(d.getDate() - 7); return toDateString(d); };

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [FormsModule, DatePipe, PageHeaderComponent],
  templateUrl: './audit.component.html',
  styleUrl: './audit.component.css'
})
export class AuditComponent {
  private dialog = inject(Dialog);
  private auditApi = inject(AuditApi);

  readonly modules: { value: AuditSource; label: string }[] = [
    { value: 'identity', label: 'Users and roles' },
    { value: 'catalog', label: 'Items and stock' },
    { value: 'trade', label: 'Sales and purchasing' }
  ];

  // Defaults: from = one week ago, to = today, module = All, user = All.
  fromDate = weekAgoLocal();
  toDate = todayLocal();
  source: AuditSource | 'all' = 'all';
  userName = '';

  users = signal<string[]>([]);
  rows = signal<AuditRow[]>([]);
  loading = signal(false);
  error = signal('');

  constructor() {
    this.auditApi.users().subscribe({ next: u => this.users.set(u), error: () => this.users.set([]) });
    this.apply();
  }

  /** Runs for the Filter button, and right away when Module or User changes. */
  apply() {
    if (this.fromDate && this.toDate && this.fromDate > this.toDate) {
      this.dialog.error('The From date must be on or before the To date.');
      return;
    }
    this.error.set('');
    this.loading.set(true);

    // Whole days in the user's own time zone, sent to the server as exact moments.
    const filter: AuditFilter = {
      userName: this.userName || undefined,
      from: this.fromDate ? new Date(`${this.fromDate}T00:00:00`).toISOString() : undefined,
      to: this.toDate ? new Date(`${this.toDate}T23:59:59.999`).toISOString() : undefined
    };
    const chosen = this.source === 'all' ? this.modules.map(m => m.value) : [this.source];
    forkJoin(chosen.map(s => this.auditApi.list(s, filter).pipe(catchError(() => of([] as AuditRow[])))))
      .subscribe(lists => {
        this.rows.set(lists.flat().sort((a, b) => b.at.localeCompare(a.at)).slice(0, 200));
        this.loading.set(false);
      });
  }

  reset() {
    this.fromDate = weekAgoLocal();
    this.toDate = todayLocal();
    this.source = 'all';
    this.userName = '';
    this.apply();
  }

  moduleLabel(source: AuditSource): string {
    return this.modules.find(m => m.value === source)?.label ?? source;
  }
}
