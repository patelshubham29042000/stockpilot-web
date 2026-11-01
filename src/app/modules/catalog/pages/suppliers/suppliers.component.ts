import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { errMsg } from '@core/api';
import { Dialog } from '@core/dialog/dialog.service';
import { PageHeaderComponent } from '@shared/page-header/page-header.component';
import { TabulatorGridComponent } from '@shared/tabulator-grid/tabulator-grid.component';
import { actionButtons, esc } from '@shared/tabulator-grid/grid-formatters';
import { SuppliersApi } from '@modules/catalog/api';
import { Supplier } from '@modules/catalog/models';

interface SupplierForm { id?: number; name: string; phone: string; email: string; }

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, TabulatorGridComponent],
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.css'
})
export class SuppliersComponent {
  private suppliersApi = inject(SuppliersApi);
  private dialog = inject(Dialog);

  suppliers = signal<Supplier[]>([]);
  loading = signal(false);
  busy = signal(false);
  search = signal('');
  form = signal<SupplierForm | null>(null);   // the add / edit form above the grid

  shown = computed(() => {
    const text = this.search().trim().toLowerCase();
    if (!text) return this.suppliers();
    return this.suppliers().filter(s => `${s.name} ${s.phone ?? ''} ${s.email ?? ''}`.toLowerCase().includes(text));
  });

  /** Tabulator columns. A higher `responsive` number is hidden first on a narrow screen. */
  readonly columns: any[] = [
    { title: 'Name', field: 'name', minWidth: 160, widthGrow: 3, responsive: 0, formatter: (cell: any) => esc(cell.getValue()) },
    { title: 'Phone', field: 'phone', width: 150, responsive: 2, formatter: (cell: any) => esc(cell.getValue()) },
    { title: 'Email', field: 'email', minWidth: 160, widthGrow: 2, responsive: 3, formatter: (cell: any) => esc(cell.getValue()) },
    {
      title: '', width: 180, hozAlign: 'right', headerSort: false, responsive: 0,
      formatter: () => actionButtons([{ action: 'edit', label: 'Edit' }, { action: 'remove', label: 'Remove', kind: 'bad' }])
    }
  ];

  constructor() { this.load(); }

  load() {
    this.loading.set(true);
    this.suppliersApi.list().subscribe({
      next: r => { this.suppliers.set(r); this.loading.set(false); },
      error: e => { this.loading.set(false); this.dialog.error(errMsg(e)); }
    });
  }

  add() { this.form.set({ name: '', phone: '', email: '' }); this.focusName(); }
  edit(s: Supplier) { this.form.set({ id: s.id, name: s.name, phone: s.phone ?? '', email: s.email ?? '' }); this.focusName(); }
  cancel() { this.form.set(null); }

  private focusName() { setTimeout(() => document.getElementById('supplier-name')?.focus(), 0); }

  save() {
    const f = this.form()!;
    const name = f.name.trim();
    const email = f.email.trim();
    if (name.length < 2) { this.dialog.error('Supplier name needs at least 2 characters.'); return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { this.dialog.error('Enter a valid email address, or leave it empty.'); return; }

    const body = { name, phone: f.phone.trim() || null, email: email || null };
    this.busy.set(true);
    const request = f.id ? this.suppliersApi.update(f.id, body) : this.suppliersApi.create(body);
    request.subscribe({
      next: () => {
        this.busy.set(false);
        this.form.set(null);
        this.dialog.success(f.id ? 'Supplier updated.' : 'Supplier added.');
        this.load();
      },
      error: e => { this.busy.set(false); this.dialog.error(errMsg(e)); }
    });
  }

  /** A button inside a grid row was clicked. */
  onAction(event: { action: string; row: Supplier }) {
    if (event.action === 'edit') this.edit(event.row);
    else if (event.action === 'remove') this.remove(event.row);
  }

  async remove(supplier: Supplier) {
    if (!(await this.dialog.confirm(`Remove ${supplier.name}?\nTheir earlier purchase orders stay as they are.`))) return;
    this.suppliersApi.remove(supplier.id).subscribe({
      next: () => { this.dialog.success(`${supplier.name} was removed.`); this.load(); },
      error: e => this.dialog.error(errMsg(e))
    });
  }
}
