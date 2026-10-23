import { Injectable, inject } from '@angular/core';
import { ApiService } from '@core/api';
import { Item, ItemInput, Supplier } from '../models';
import { CATALOG_API } from './catalog.endpoints';

@Injectable({ providedIn: 'root' })
export class ItemsApi {
  private api = inject(ApiService);

  list(search = '', lowOnly = false) { return this.api.get<Item[]>(CATALOG_API.items, { q: search, lowOnly }); }
  /** Finds one active item by the code a barcode scanner reads (its SKU). */
  byCode(code: string) { return this.api.get<Item>(`${CATALOG_API.items}/by-code`, { code }); }
  get(id: number) { return this.api.get<Item>(`${CATALOG_API.items}/${id}`); }
  create(input: ItemInput) { return this.api.post<number>(CATALOG_API.items, input); }
  update(id: number, input: ItemInput) { return this.api.put<void>(`${CATALOG_API.items}/${id}`, input); }
  deactivate(id: number) { return this.api.delete<void>(`${CATALOG_API.items}/${id}`); }
  importCsv(file: File) { return this.api.upload<{ created: number; updated: number; errors: string[] }>(CATALOG_API.itemsImport, file); }
  exportCsv() { this.api.download(CATALOG_API.itemsExport, 'items.csv'); }
  /** Supplier list for the item form's dropdown. */
  suppliers() { return this.api.get<Supplier[]>(CATALOG_API.suppliers); }
}
