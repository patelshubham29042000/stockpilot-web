import { Component, inject, signal } from '@angular/core';
import { Dialog } from '@core/dialog/dialog.service';
import { FormsModule } from '@angular/forms';
import { errMsg } from '@core/api';
import { Category } from '@modules/catalog/models';
import { NoticeComponent } from '@shared/notice/notice.component';
import { PageHeaderComponent } from '@shared/page-header/page-header.component';
import { CategoriesApi } from '@modules/catalog/api';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, NoticeComponent],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css'
})
export class CategoriesComponent {
  private dialog = inject(Dialog);
  private categoriesApi = inject(CategoriesApi);
  categories = signal<Category[]>([]);
  form = signal<{ id?: number; name: string } | null>(null);
  message = signal('');

  constructor() { this.load(); }

  load() { this.categoriesApi.list().subscribe(r => this.categories.set(r)); }
  add() { this.form.set({ name: '' }); }
  edit(category: Category) { this.form.set({ id: category.id, name: category.name }); }

  save() {
    const m = this.form()!;
    const request = m.id ? this.categoriesApi.update(m.id, m.name) : this.categoriesApi.create(m.name);
    request.subscribe({
      next: () => { this.form.set(null); this.dialog.success('Category saved.'); this.load(); },
      error: e => this.dialog.error(errMsg(e))
    });
  }

  async remove(category: Category) {
    if (!(await this.dialog.confirm(`Delete the category ${category.name}?`))) return;
    this.categoriesApi.remove(category.id).subscribe({
      next: () => { this.dialog.success('Category deleted.'); this.load(); },
      error: e => this.dialog.error(errMsg(e))
    });
  }
}
