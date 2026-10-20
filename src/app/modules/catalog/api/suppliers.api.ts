import { Injectable, inject } from '@angular/core';
import { ApiService } from '@core/api';
import { Supplier, SupplierInput } from '../models';
import { CATALOG_API } from './catalog.endpoints';

@Injectable({ providedIn: 'root' })
export class SuppliersApi {
  private api = inject(ApiService);

  list() { return this.api.get<Supplier[]>(CATALOG_API.suppliers); }
  create(input: SupplierInput) { return this.api.post<Supplier>(CATALOG_API.suppliers, input); }
  update(id: number, input: SupplierInput) { return this.api.put<Supplier>(`${CATALOG_API.suppliers}/${id}`, input); }
  remove(id: number) { return this.api.delete<void>(`${CATALOG_API.suppliers}/${id}`); }
}
