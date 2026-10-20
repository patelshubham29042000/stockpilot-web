import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { Dialog } from '@core/dialog/dialog.service';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errMsg } from '@core/api';
import { Auth, PERM } from '@core/auth';
import { Category, ItemInput, Supplier } from '@modules/catalog/models';
import { NoticeComponent } from '@shared/notice/notice.component';
import { PageHeaderComponent } from '@shared/page-header/page-header.component';
import { CategoriesApi } from '@modules/catalog/api';
import { ItemsApi } from '@modules/catalog/api';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-item-form',
  standalone: true,
  imports: [FormsModule, RouterLink, PageHeaderComponent, NoticeComponent],
  templateUrl: './item-form.component.html',
  styleUrl: './item-form.component.css'
})
export class ItemFormComponent implements OnInit {
  private dialog = inject(Dialog);
  private itemsApi = inject(ItemsApi);
  private categoriesApi = inject(CategoriesApi);
  private router = inject(Router);
  auth = inject(Auth);
  readonly PERM = PERM;

  /** Filled from the URL /items/:id/edit. Empty on /items/new. */
  @Input() id?: string;

  categories = signal<Category[]>([]);
  suppliers = signal<Supplier[]>([]);
  error = signal('');
  busy = signal(false);
  model: ItemInput = { sku: '', name: '', categoryId: null, supplierId: null, price: 0, cost: 0, reorderLevel: 10, stock: 0 };

  ngOnInit() {
    this.categoriesApi.list().subscribe(r => this.categories.set(r));
    this.itemsApi.suppliers().subscribe({ next: r => this.suppliers.set(r), error: () => this.suppliers.set([]) });
    if (this.id) {
      this.itemsApi.get(+this.id).subscribe({
        next: i => this.model = {
          sku: i.sku, name: i.name, categoryId: i.categoryId, supplierId: i.supplierId,
          price: i.price, cost: i.cost, reorderLevel: i.reorderLevel, stock: i.stock
        },
        error: e => this.dialog.error(errMsg(e))
      });
    }
  }

  save() {
    const request: Observable<unknown> = this.id ? this.itemsApi.update(+this.id, this.model) : this.itemsApi.create(this.model);    this.error.set('');
    request.subscribe({
      next: () => { this.dialog.success('Item saved.'); this.router.navigate(['/items']); },
      error: e => { this.dialog.error(errMsg(e)); this.busy.set(false); }
    });
  }
}
