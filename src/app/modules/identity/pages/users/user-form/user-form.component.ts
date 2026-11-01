import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errMsg } from '@core/api';
import { Dialog } from '@core/dialog/dialog.service';
import { PageHeaderComponent } from '@shared/page-header/page-header.component';
import { RolesApi, UsersApi } from '@modules/identity/api';
import { EmployeeDetails, Role } from '@modules/identity/models';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [FormsModule, RouterLink, PageHeaderComponent],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.css'
})
export class UserFormComponent implements OnInit {
  private usersApi = inject(UsersApi);
  private rolesApi = inject(RolesApi);
  private router = inject(Router);
  private dialog = inject(Dialog);

  /** Filled from the URL /users/:id/edit. Empty on /users/new. */
  @Input() id?: string;

  roles = signal<Role[]>([]);
  busy = signal(false);

  employeeCode = '';
  fullName = '';
  username = '';
  mobile = '';
  email = '';
  designation = '';
  joiningDate = '';          // yyyy-MM-dd, from the date box
  password = '';
  roleId: number | null = null;
  isActive = false;

  ngOnInit() {
    this.rolesApi.list().subscribe({ next: r => this.roles.set(r), error: e => this.dialog.error(errMsg(e)) });
    if (this.id) {
      this.usersApi.get(+this.id).subscribe({
        next: u => {
          this.employeeCode = u.employeeCode; this.fullName = u.fullName; this.username = u.username;
          this.mobile = u.mobile ?? ''; this.email = u.email ?? ''; this.designation = u.designation ?? '';
          this.joiningDate = u.joiningDate ?? ''; this.roleId = u.roleId; this.isActive = u.isActive;
        },
        error: e => this.dialog.error(errMsg(e))
      });
    }
  }

  /** An employee can only be active when they have a role. */
  onRoleChange(roleId: number | null) {
    this.roleId = roleId;
    if (roleId === null) this.isActive = false;
  }

  private details(): EmployeeDetails {
    return {
      employeeCode: this.employeeCode.trim() || null, mobile: this.mobile.trim() || null, email: this.email.trim() || null,
      designation: this.designation.trim() || null, joiningDate: this.joiningDate || null
    };
  }

  save() {
    if (!this.fullName.trim()) { this.dialog.error('Full name is required.'); return; }
    const request = this.id
      ? this.usersApi.update(+this.id, { ...this.details(), fullName: this.fullName, roleId: this.roleId, isActive: this.isActive, newPassword: this.password || null })
      : this.usersApi.create({ ...this.details(), username: this.username, fullName: this.fullName, password: this.password, roleId: this.roleId, isActive: this.isActive });
    this.busy.set(true);
    request.subscribe({
      next: () => { this.dialog.success('Employee saved.'); this.router.navigate(['/users']); },
      error: e => { this.busy.set(false); this.dialog.error(errMsg(e)); }
    });
  }
}
