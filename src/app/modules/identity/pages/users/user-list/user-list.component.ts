import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errMsg } from '@core/api';
import { Dialog } from '@core/dialog/dialog.service';
import { PageHeaderComponent } from '@shared/page-header/page-header.component';
import { TabulatorGridComponent } from '@shared/tabulator-grid/tabulator-grid.component';
import { actionButtons, badge, dateOnly, esc } from '@shared/tabulator-grid/grid-formatters';
import { UsersApi } from '@modules/identity/api';
import { User } from '@modules/identity/models';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [FormsModule, RouterLink, PageHeaderComponent, TabulatorGridComponent],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css'
})
export class UserListComponent {
  private usersApi = inject(UsersApi);
  private router = inject(Router);
  private dialog = inject(Dialog);

  employees = signal<User[]>([]);
  loading = signal(false);
  search = signal('');
  pendingOnly = signal(false);

  pending = computed(() => this.employees().filter(u => !u.isActive).length);
  shown = computed(() => {
    const text = this.search().trim().toLowerCase();
    return this.employees().filter(u =>
      (!this.pendingOnly() || !u.isActive) &&
      (!text || `${u.employeeCode} ${u.username} ${u.fullName} ${u.mobile ?? ''} ${u.email ?? ''} ${u.designation ?? ''}`.toLowerCase().includes(text)));
  });

 /** Tabulator columns. A higher `responsive` number is hidden first on a narrow screen. */
readonly columns: any[] = [
  { title: 'Name', field: 'fullName', minWidth: 180, widthGrow: 2, responsive: 0, formatter: (cell: any) => `<strong>${esc(cell.getValue())}</strong>` },
  { title: 'Username', field: 'username', minWidth: 140, width: 180, widthGrow: 2, responsive: 4, formatter: (cell: any) => esc(cell.getValue()) },
  { title: 'Mobile', field: 'mobile', width: 150, responsive: 5, formatter: (cell: any) => esc(cell.getValue()) },
  { title: 'Designation', field: 'designation', minWidth: 120, widthGrow: 1, responsive: 6, formatter: (cell: any) => esc(cell.getValue()) },
  { title: 'Role', field: 'roleName', minWidth: 110, widthGrow: 1, responsive: 3, formatter: (cell: any) => cell.getValue() ? esc(cell.getValue()) : '<span class="muted">No role</span>' },
  { title: 'Status', field: 'isActive', width: 110, sorter: 'boolean', responsive: 0, formatter: (cell: any) => cell.getValue() ? badge('Active', 'ok') : badge('Pending', 'warn') },
  { title: 'Joined', field: 'joiningDate', width: 130, responsive: 7, formatter: (cell: any) => cell.getValue() ? dateOnly(cell.getValue() + 'T00:00:00') : '' },
  { title: '', width: 100, hozAlign: 'right', headerSort: false, responsive: 0, formatter: () => actionButtons([{ action: 'edit', label: 'Edit' }]) }
];

  constructor() { this.load(); }

  load() {
    this.loading.set(true);
    this.usersApi.list().subscribe({
      next: r => { this.employees.set(r); this.loading.set(false); },
      error: e => { this.loading.set(false); this.dialog.error(errMsg(e)); }
    });
  }

  /** A button inside a grid row was clicked. */
  onAction(event: { action: string; row: User }) {
    if (event.action === 'edit') this.router.navigate(['/users', event.row.id, 'edit']);
  }
}
