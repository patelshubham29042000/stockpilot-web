import { Injectable, inject } from '@angular/core';
import { ApiService } from '@core/api';
import { Category } from '../models';
import { CATALOG_API } from './catalog.endpoints';

@Injectable({ providedIn: 'root' })
export class CategoriesApi {
  private api = inject(ApiService);

  list() { return this.api.get<Category[]>(CATALOG_API.categories); }
  /** Categories that have items for sale, with their active item counts (the sale screen). */
  forSale() { return this.api.get<Category[]>(`${CATALOG_API.categories}/for-sale`); }
  create(name: string) { return this.api.post<Category>(CATALOG_API.categories, { name }); }
  update(id: number, name: string) { return this.api.put<Category>(`${CATALOG_API.categories}/${id}`, { name }); }
  remove(id: number) { return this.api.delete<void>(`${CATALOG_API.categories}/${id}`); }
}
