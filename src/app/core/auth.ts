import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, tap, throwError } from 'rxjs';

export const errMsg = (e: HttpErrorResponse) => e.error?.message ?? (e.status === 403 ? 'You do not have permission.' : 'Something went wrong. Try again.');

@Injectable({ providedIn: 'root' })
export class Auth {
  private http = inject(HttpClient);
  private router = inject(Router);
  token = signal<string | null>(localStorage.getItem('token'));
  role = signal<string | null>(localStorage.getItem('role'));
  name = signal<string | null>(localStorage.getItem('name'));

  login(username: string, password: string) {
    return this.http.post<{ token: string; role: string; name: string }>('/api/auth/login', { username, password }).pipe(
      tap(r => {
        localStorage.setItem('token', r.token); localStorage.setItem('role', r.role); localStorage.setItem('name', r.name);
        this.token.set(r.token); this.role.set(r.role); this.name.set(r.name);
      }));
  }
  logout() {
    localStorage.clear(); this.token.set(null); this.role.set(null); this.name.set(null);
    this.router.navigate(['/login']);
  }
  can(roles?: string[]) { return !roles?.length || roles.includes(this.role() ?? ''); }
  download(url: string, file: string) {
    this.http.get(url, { responseType: 'blob' }).subscribe(b => {
      const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = file; a.click(); URL.revokeObjectURL(a.href);
    });
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth); const t = auth.token();
  const r = t ? req.clone({ setHeaders: { Authorization: `Bearer ${t}` } }) : req;
  return next(r).pipe(catchError(e => {
    if (e.status === 401 && !req.url.includes('/auth/login')) auth.logout();
    return throwError(() => e);
  }));
};

export const guard = (...roles: string[]): CanActivateFn => () => {
  const a = inject(Auth), r = inject(Router);
  if (!a.token()) return r.parseUrl('/login');
  return a.can(roles) ? true : r.parseUrl('/dashboard');
};
