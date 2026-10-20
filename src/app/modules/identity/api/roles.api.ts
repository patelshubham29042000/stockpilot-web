import { Injectable, inject } from '@angular/core';
import { ApiService } from '@core/api';
import { PermissionInfo, Role, RoleInput } from '../models';
import { IDENTITY_API } from './identity.endpoints';

@Injectable({ providedIn: 'root' })
export class RolesApi {
  private api = inject(ApiService);

  list() { return this.api.get<Role[]>(IDENTITY_API.roles); }
  permissions() { return this.api.get<PermissionInfo[]>(IDENTITY_API.rolePermissions); }
  get(id: number) { return this.api.get<Role>(`${IDENTITY_API.roles}/${id}`); }
  create(input: RoleInput) { return this.api.post<Role>(IDENTITY_API.roles, input); }
  update(id: number, input: RoleInput) { return this.api.put<Role>(`${IDENTITY_API.roles}/${id}`, input); }
  remove(id: number) { return this.api.delete<void>(`${IDENTITY_API.roles}/${id}`); }
}
