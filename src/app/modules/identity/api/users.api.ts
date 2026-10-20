import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { ApiService, asUtc } from '@core/api';
import { User, UserCreateInput, UserUpdateInput } from '../models';
import { IDENTITY_API } from './identity.endpoints';

const fixDates = (u: User): User => ({ ...u, createdAt: asUtc(u.createdAt) });

@Injectable({ providedIn: 'root' })
export class UsersApi {
  private api = inject(ApiService);

  list() { return this.api.get<User[]>(IDENTITY_API.users).pipe(map(rows => rows.map(fixDates))); }
  get(id: number) { return this.api.get<User>(`${IDENTITY_API.users}/${id}`).pipe(map(fixDates)); }
  create(input: UserCreateInput) { return this.api.post<User>(IDENTITY_API.users, input); }
  update(id: number, input: UserUpdateInput) { return this.api.put<User>(`${IDENTITY_API.users}/${id}`, input); }
}
