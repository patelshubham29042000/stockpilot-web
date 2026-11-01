import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { dayEndIso, dayStartIso, daysAgoLocal, todayLocal } from '@core/api';
import { Dialog } from '@core/dialog/dialog.service';
import { PageHeaderComponent } from '@shared/page-header/page-header.component';
import { TabulatorGridComponent } from '@shared/tabulator-grid/tabulator-grid.component';
import { badge, dateTime, esc } from '@shared/tabulator-grid/grid-formatters';
import { AuditApi } from './api';
import { AuditFilter, AuditRow, AuditSource } from './models';

/** An audit entry as the grid shows it. */
type AuditView = AuditRow & { rid: string; what: string };

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, TabulatorGridComponent],
  templateUrl: './audit.component.html',
  styleUrl: './audit.component.css'
})
export class AuditComponent {
  private auditApi = inject(AuditApi);
  private dialog = inject(Dialog);

  readonly modules: { value: AuditSource; label: string }[] = [
  { value: 'identity', label: 'User & Access Management' },
  { value: 'catalog', label: 'Product & Inventory Management' },
  { value: 'trade', label: 'Sales & Purchase Management' }
];

  // Defaults: from = one week ago, to = today, module = All, user = All.
  fromDate = daysAgoLocal(7);
  toDate = todayLocal();
  source: AuditSource | 'all' = 'all';
  userName = '';

  users = signal<string[]>([]);
  entries = signal<AuditView[]>([]);
  loading = signal(false);
  search = signal('');

  shown = computed(() => {
    const text = this.search().trim().toLowerCase();
    if (!text) return this.entries();
    return this.entries().filter(r => `${r.userName} ${r.what} ${r.details}`.toLowerCase().includes(text));
  });

  /** Tabulator columns. A higher `responsive` number is hidden first on a narrow screen. */
  readonly columns: any[] = [
    { title: 'When', field: 'at', width: 170, responsive: 4, formatter: (cell: any) => dateTime(cell.getValue()) },
    { title: 'User', field: 'userName', width: 130, responsive: 0, formatter: (cell: any) => esc(cell.getValue()) },
    { title: 'Module', field: 'source', width: 220, responsive: 3, formatter: (cell: any) => badge(this.moduleLabel(cell.getValue())) },
    { title: 'Action', field: 'what', width: 180, responsive: 0, formatter: (cell: any) => esc(cell.getValue()) },
    { title: 'Details', field: 'details', minWidth: 200, widthGrow: 3, formatter: 'textarea', responsive: 2 }
  ];

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
    this.loading.set(true);

    // Whole days in the user's own time zone, sent to the server as exact moments.
    const filter: AuditFilter = {
      userName: this.userName || undefined,
      from: this.fromDate ? dayStartIso(this.fromDate) : undefined,
      to: this.toDate ? dayEndIso(this.toDate) : undefined
    };
    const chosen = this.source === 'all' ? this.modules.map(m => m.value) : [this.source];
    const failed: string[] = [];

    forkJoin(chosen.map(s => this.auditApi.list(s, filter).pipe(
      catchError(() => { failed.push(this.moduleLabel(s)); return of([] as AuditRow[]); })
    ))).subscribe(lists => {
      const rows = lists.flat()
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, 200)
        .map(r => ({ ...r, rid: `${r.source}-${r.id}`, what: `${r.entity} ${r.action}` }));
      this.entries.set(rows);
      this.loading.set(false);
      if (failed.length) this.dialog.error(`Could not load the audit entries for: ${failed.join(', ')}. Check that the service is running.`);
    });
  }

  reset() {
    this.fromDate = daysAgoLocal(7);
    this.toDate = todayLocal();
    this.source = 'all';
    this.userName = '';
    this.apply();
  }

  moduleLabel(source: AuditSource): string {
    return this.modules.find(m => m.value === source)?.label ?? source;
  }
}
