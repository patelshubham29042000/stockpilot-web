import { Injectable, inject } from '@angular/core';
import { ApiService } from '../api';
import { LoginResponse, RegisterResponse } from '../models';

/** Auth endpoints (the /api prefix is added by ApiService). */
export const AUTH_API = { login: '/auth/login', register: '/auth/register' } as const;

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private api = inject(ApiService);

  login(username: string, password: string) {
    return this.api.post<LoginResponse>(AUTH_API.login, { username, password });
  }
  register(username: string, fullName: string, password: string) {
    return this.api.post<RegisterResponse>(AUTH_API.register, { username, fullName, password });
  }
}
