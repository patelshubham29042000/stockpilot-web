import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { errMsg } from '@core/api';
import { Dialog } from '@core/dialog/dialog.service';
import { PageHeaderComponent } from '@shared/page-header/page-header.component';
import { TabulatorGridComponent } from '@shared/tabulator-grid/tabulator-grid.component';
import { actionButtons, esc } from '@shared/tabulator-grid/grid-formatters';
import { CategoriesApi } from '@modules/catalog/api';
import { Category } from '@modules/catalog/models';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, TabulatorGridComponent],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css'
})
export class CategoriesComponent {
  private categoriesApi = inject(CategoriesApi);
  private dialog = inject(Dialog);

  categories = signal<Category[]>([]);
  loading = signal(false);
  busy = signal(false);
  search = signal('');
  form = signal<{ id?: number; name: string } | null>(null);   // the add / edit form above the grid

  shown = computed(() => {
    const text = this.search().trim().toLowerCase();
    return text ? this.categories().filter(c => c.name.toLowerCase().includes(text)) : this.categories();
  });

  /** Tabulator columns. A higher `responsive` number is hidden first on a narrow screen. */
  readonly columns: any[] = [
    { title: 'Category', field: 'name', minWidth: 160, widthGrow: 3, responsive: 0, formatter: (cell: any) => esc(cell.getValue()) },
    { title: 'Items', field: 'itemCount', width: 110, hozAlign: 'right', sorter: 'number', responsive: 2 },
    {
      title: '', width: 180, hozAlign: 'right', headerSort: false, responsive: 0,
      formatter: (cell: any) => {
        const c: Category = cell.getRow().getData();
        const used = c.itemCount > 0;
        return actionButtons([
          { action: 'edit', label: 'Edit' },
          { action: 'delete', label: 'Delete', kind: 'bad', disabled: used, title: used ? 'Move its items to another category first' : '' }
        ]);
      }
    }
  ];

  constructor() { this.load(); }

  load() {
    this.loading.set(true);
    this.categoriesApi.list().subscribe({
      next: r => { this.categories.set(r); this.loading.set(false); },
      error: e => { this.loading.set(false); this.dialog.error(errMsg(e)); }
    });
  }

  add() { this.form.set({ name: '' }); this.focusName(); }
  edit(category: Category) { this.form.set({ id: category.id, name: category.name }); this.focusName(); }
  cancel() { this.form.set(null); }

  private focusName() { setTimeout(() => document.getElementById('category-name')?.focus(), 0); }

  save() {
    const f = this.form()!;
    const name = f.name.trim();
    if (name.length < 2) { this.dialog.error('Category name needs at least 2 characters.'); return; }

    this.busy.set(true);
    const request = f.id ? this.categoriesApi.update(f.id, name) : this.categoriesApi.create(name);
    request.subscribe({
      next: () => {
        this.busy.set(false);
        this.form.set(null);
        this.dialog.success(f.id ? 'Category updated.' : 'Category added.');
        this.load();
      },
      error: e => { this.busy.set(false); this.dialog.error(errMsg(e)); }
    });
  }

  /** A button inside a grid row was clicked. */
  onAction(event: { action: string; row: Category }) {
    if (event.action === 'edit') this.edit(event.row);
    else if (event.action === 'delete') this.remove(event.row);
  }

  async remove(category: Category) {
    if (category.itemCount > 0) {
      await this.dialog.info(`${category.name} still has ${category.itemCount} item(s). Move them to another category first.`);
      return;
    }
    if (!(await this.dialog.confirm(`Delete the category ${category.name}?`))) return;
    this.categoriesApi.remove(category.id).subscribe({
      next: () => { this.dialog.success(`${category.name} was deleted.`); this.load(); },
      error: e => this.dialog.error(errMsg(e))
    });
  }
}
