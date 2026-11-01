import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errMsg } from '@core/api';
import { Auth, PERM } from '@core/auth';
import { Dialog } from '@core/dialog/dialog.service';
import { PageHeaderComponent } from '@shared/page-header/page-header.component';
import { TabulatorGridComponent } from '@shared/tabulator-grid/tabulator-grid.component';
import { GridButton, actionButtons, badge, esc } from '@shared/tabulator-grid/grid-formatters';
import { RolesApi } from '@modules/identity/api';
import { Role } from '@modules/identity/models';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [FormsModule, RouterLink, PageHeaderComponent, TabulatorGridComponent],
  templateUrl: './role-list.component.html',
  styleUrl: './role-list.component.css'
})
export class RoleListComponent {
  private rolesApi = inject(RolesApi);
  private router = inject(Router);
  private dialog = inject(Dialog);
  auth = inject(Auth);
  readonly PERM = PERM;

  roles = signal<Role[]>([]);
  loading = signal(false);
  search = signal('');

  /** The rows for the grid: the roles that match the search, with a permission count. */
  shown = computed(() => {
    const text = this.search().trim().toLowerCase();
    return this.roles()
      .filter(r => !text || `${r.name} ${r.description ?? ''}`.toLowerCase().includes(text))
      .map(r => ({ ...r, permissionCount: r.permissions?.length ?? 0 }));
  });

  /** Tabulator columns. A higher `responsive` number is hidden first on a narrow screen. */
  readonly columns: any[] = this.buildColumns();

  constructor() { this.load(); }

  private buildColumns(): any[] {
    const columns: any[] = [
      {
        title: 'Role', field: 'name', minWidth: 150, widthGrow: 1, responsive: 0,
        formatter: (cell: any) => {
          const r: Role = cell.getRow().getData();
          return `<strong>${esc(r.name)}</strong>` + (r.isSystem ? ' ' + badge('Built-in') : '');
        }
      },
      { title: 'Description', field: 'description', minWidth: 200, widthGrow: 3, formatter: 'textarea', responsive: 3 },
      { title: 'Permissions', field: 'permissionCount', width: 130, hozAlign: 'right', sorter: 'number', responsive: 2 },
      { title: 'Employees', field: 'userCount', width: 90, hozAlign: 'right', sorter: 'number', responsive: 0 }
    ];

    if (this.auth.can(PERM.rolesManage)) {
      columns.push({
        title: '', width: 180, hozAlign: 'right', headerSort: false, responsive: 0,
        formatter: (cell: any) => {
          const r: Role = cell.getRow().getData();
          const buttons: GridButton[] = [{ action: 'edit', label: 'Edit' }];
          if (!r.isSystem) {
            const used = r.userCount > 0;
            buttons.push({ action: 'delete', label: 'Delete', kind: 'bad', disabled: used, title: used ? 'Move its employees to another role first' : '' });
          }
          return actionButtons(buttons);
        }
      });
    }
    return columns;
  }

  load() {
    this.loading.set(true);
    this.rolesApi.list().subscribe({
      next: r => { this.roles.set(r); this.loading.set(false); },
      error: e => { this.loading.set(false); this.dialog.error(errMsg(e)); }
    });
  }

  /** A button inside a grid row was clicked. */
  onAction(event: { action: string; row: Role }) {
    if (event.action === 'edit') this.router.navigate(['/roles', event.row.id, 'edit']);
    else if (event.action === 'delete') this.remove(event.row);
  }

  async remove(role: Role) {
    if (!(await this.dialog.confirm(`Delete the role ${role.name}?`))) return;
    this.rolesApi.remove(role.id).subscribe({
      next: () => { this.dialog.success(`${role.name} was deleted.`); this.load(); },
      error: e => this.dialog.error(errMsg(e))
    });
  }
}
