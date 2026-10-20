import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { User } from '@modules/identity/models';
import { PageHeaderComponent } from '@shared/page-header/page-header.component';
import { UsersApi } from '@modules/identity/api';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [FormsModule, DatePipe, RouterLink, PageHeaderComponent],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css'
})
export class UserListComponent {
  private usersApi = inject(UsersApi);
  users = signal<User[]>([]);
  search = signal('');
  pendingOnly = signal(false);

  pending = computed(() => this.users().filter(u => !u.isActive).length);
  shown = computed(() => {
    const text = this.search().toLowerCase();
    return this.users().filter(u =>
      (!this.pendingOnly() || !u.isActive) && (u.username + ' ' + u.fullName).toLowerCase().includes(text));
  });

  constructor() { this.usersApi.list().subscribe(r => this.users.set(r)); }
}
