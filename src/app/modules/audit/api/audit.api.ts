import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { ApiService, asUtc } from '@core/api';
import { CATALOG_API } from '@modules/catalog/api';
import { IDENTITY_API } from '@modules/identity/api';
import { TRADE_API } from '@modules/trade/api';
import { AuditFilter, AuditLog, AuditRow, AuditSource } from '../models';

@Injectable({ providedIn: 'root' })
export class AuditApi {
  private api = inject(ApiService);

  /** Where each module keeps its log. A new module adds one line here (and one name in AuditSource). */
  private readonly paths: Record<AuditSource, string> = {
    identity: IDENTITY_API.audit,
    catalog: CATALOG_API.audit,
    trade: TRADE_API.audit
  };

  list(source: AuditSource, filter: AuditFilter = {}, take = 200) {
    return this.api.get<AuditLog[]>(this.paths[source], { userName: filter.userName, from: filter.from, to: filter.to, take })
      .pipe(map(rows => rows.map((r): AuditRow => ({ ...r, at: asUtc(r.at), source }))));
  }

  /** User names for the filter dropdown (users live in the Identity module). */
  users() { return this.api.get<string[]>(IDENTITY_API.auditUsers); }
}
