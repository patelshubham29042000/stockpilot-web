import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { LoginResponse } from '../models';
import { HOME_LINKS } from '../navigation';
import { AuthApi } from './auth.api';

@Injectable({ providedIn: 'root' })
export class Auth {
  private authApi = inject(AuthApi);
  private router = inject(Router);

  token = signal<string | null>(localStorage.getItem('token'));
  role = signal<string | null>(localStorage.getItem('role'));
  name = signal<string | null>(localStorage.getItem('name'));
  permissions = signal<string[]>(this.readPermissions());
  isLoggedIn = computed(() => !!this.token());

  constructor() {
    // A session saved before permissions existed has no permission list: start clean.
    if (this.token() && this.permissions().length === 0) this.clear();
  }

  login(username: string, password: string) {
    return this.authApi.login(username, password).pipe(tap(r => this.store(r)));
  }

  register(username: string, fullName: string, password: string) {
    return this.authApi.register(username, fullName, password);
  }

  logout() {
    this.clear();
    this.router.navigate(['/login']);
  }

  /** True when the user has ANY of the given permissions (or none were asked for). */
  can(...keys: string[]): boolean {
    return keys.length === 0 || keys.some(k => this.permissions().includes(k));
  }

  /** The first page this user is allowed to open. */
  homePath(): string {
    return HOME_LINKS.find(l => this.can(...l.permissions))?.path ?? '/login';
  }

  private store(r: LoginResponse) {
    localStorage.setItem('token', r.token);
    localStorage.setItem('role', r.role);
    localStorage.setItem('name', r.name);
    localStorage.setItem('permissions', JSON.stringify(r.permissions));
    this.token.set(r.token); this.role.set(r.role); this.name.set(r.name); this.permissions.set(r.permissions);
  }

  private clear() {
    localStorage.clear();
    this.token.set(null); this.role.set(null); this.name.set(null); this.permissions.set([]);
  }

  private readPermissions(): string[] {
    try { return JSON.parse(localStorage.getItem('permissions') ?? '[]'); } catch { return []; }
  }
}
