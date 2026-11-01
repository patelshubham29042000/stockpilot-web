import { Injectable, inject } from '@angular/core';
import { ApiService } from '@core/api';
import { CustomerDto, CustomerFilter, CustomerRow } from '../models';
import { TRADE_API } from './trade.endpoints';

@Injectable({ providedIn: 'root' })
export class CustomersApi {
  private api = inject(ApiService);

  list(filter: CustomerFilter = {}) {
    return this.api.get<CustomerRow[]>(TRADE_API.customers, {
      search: filter.search,
      type: filter.type,
      active: filter.active
    });
  }

  get(id: number) {
    return this.api.get<CustomerRow>(`${TRADE_API.customers}/${id}`);
  }

  create(input: CustomerDto) {
    return this.api.post<CustomerRow>(TRADE_API.customers, input);
  }

  update(id: number, input: CustomerDto) {
    return this.api.put<CustomerRow>(`${TRADE_API.customers}/${id}`, input);
  }

  deactivate(id: number) {
    return this.api.delete<void>(`${TRADE_API.customers}/${id}`);
  }
}
