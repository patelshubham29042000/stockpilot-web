import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { Dialog } from '@core/dialog/dialog.service';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errMsg } from '@core/api';
import { Role } from '@modules/identity/models';
import { NoticeComponent } from '@shared/notice/notice.component';
import { PageHeaderComponent } from '@shared/page-header/page-header.component';
import { RolesApi } from '@modules/identity/api';
import { UsersApi } from '@modules/identity/api';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [FormsModule, RouterLink, PageHeaderComponent, NoticeComponent],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.css'
})
export class UserFormComponent implements OnInit {
  private dialog = inject(Dialog);
  private usersApi = inject(UsersApi);
  private rolesApi = inject(RolesApi);
  private router = inject(Router);

  /** Filled from the URL /users/:id/edit. Empty on /users/new. */
  @Input() id?: string;

  roles = signal<Role[]>([]);
  error = signal('');
  busy = signal(false);
  username = '';
  fullName = '';
  password = '';
  roleId: number | null = null;
  isActive = false;

  ngOnInit() {
    this.rolesApi.list().subscribe(r => this.roles.set(r));
    if (this.id) {
      this.usersApi.get(+this.id).subscribe({
        next: u => { this.username = u.username; this.fullName = u.fullName; this.roleId = u.roleId; this.isActive = u.isActive; },
        error: e => this.dialog.error(errMsg(e))
      });
    }
  }

  /** A user can only be active when it has a role. */
  onRoleChange(roleId: number | null) {
    this.roleId = roleId;
    if (roleId === null) this.isActive = false;
  }

  save() {
    const request = this.id
      ? this.usersApi.update(+this.id, { fullName: this.fullName, roleId: this.roleId, isActive: this.isActive, newPassword: this.password || null })
      : this.usersApi.create({ username: this.username, fullName: this.fullName, password: this.password, roleId: this.roleId, isActive: this.isActive });
    this.busy.set(true);
    this.error.set('');
    request.subscribe({
      next: () => { this.dialog.success('User saved.'); this.router.navigate(['/users']); },
      error: e => { this.dialog.error(errMsg(e)); this.busy.set(false); }
    });
  }
}
