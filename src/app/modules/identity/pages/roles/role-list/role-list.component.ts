import { Component, computed, inject, signal } from '@angular/core';
import { Dialog } from '@core/dialog/dialog.service';
import { RouterLink } from '@angular/router';
import { errMsg } from '@core/api';
import { Auth, PERM } from '@core/auth';
import { DataGridComponent, GridActionsDirective, GridCellDirective, GridColumn } from '@shared/data-grid';
import { NoticeComponent } from '@shared/notice/notice.component';
import { PageHeaderComponent } from '@shared/page-header/page-header.component';
import { RolesApi } from '@modules/identity/api';
import { Role } from '@modules/identity/models';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, NoticeComponent, DataGridComponent, GridCellDirective, GridActionsDirective],
  templateUrl: './role-list.component.html',
  styleUrl: './role-list.component.css'
})
export class RoleListComponent {
  private dialog = inject(Dialog);
  private rolesApi = inject(RolesApi);
  auth = inject(Auth);
  readonly PERM = PERM;

  roles = signal<Role[]>([]);
  message = signal('');
  loading = signal(true);

  readonly columns: GridColumn[] = [
  { key: 'name', label: 'Role', width: '22%' },
  { key: 'description', label: 'Description', wrap: true, hideOnSmall: true, width: '48%' },
  { key: 'permissionCount', label: 'Permissions', type: 'number', align: 'right', width: '15%' },
  { key: 'userCount', label: 'Users', type: 'number', align: 'right', width: '15%' }
];

  rows = computed(() => this.roles().map(r => ({ ...r, permissionCount: r.permissions?.length ?? 0 })));

  constructor() { this.load(); }

  load() {
    this.loading.set(true);
    this.rolesApi.list().subscribe({
      next: r => { this.roles.set(r); this.loading.set(false); },
      error: e => { this.loading.set(false); this.dialog.error(errMsg(e)); }
    });
  }

  async remove(role: Role) {
    if (!(await this.dialog.confirm(`Delete the role ${role.name}?`))) return;
    this.rolesApi.remove(role.id).subscribe({
      next: () => { this.dialog.success('Role deleted.'); this.load(); },
      error: e => this.dialog.error(errMsg(e))
    });
  }
}
