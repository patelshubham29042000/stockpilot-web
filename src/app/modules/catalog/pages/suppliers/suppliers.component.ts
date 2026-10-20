import { Component, inject, signal } from '@angular/core';
import { Dialog } from '@core/dialog/dialog.service';
import { FormsModule } from '@angular/forms';
import { errMsg } from '@core/api';
import { NoticeComponent } from '@shared/notice/notice.component';
import { PageHeaderComponent } from '@shared/page-header/page-header.component';
import { SuppliersApi } from '../../api';
import { Supplier } from '../../models';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, NoticeComponent],
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.css'
})
export class SuppliersComponent {
  private dialog = inject(Dialog);
  private suppliersApi = inject(SuppliersApi);
  suppliers = signal<Supplier[]>([]);
  form = signal<Partial<Supplier> | null>(null);
  message = signal('');

  constructor() { this.load(); }

  load() { this.suppliersApi.list().subscribe(r => this.suppliers.set(r)); }
  newSupplier() { this.form.set({}); }
  edit(supplier: Supplier) { this.form.set({ ...supplier }); }

  save() {
    const m = this.form()!;
    const body = { name: m.name ?? '', phone: m.phone ?? null, email: m.email ?? null };
    const request = m.id ? this.suppliersApi.update(m.id, body) : this.suppliersApi.create(body);
    request.subscribe({
      next: () => { this.form.set(null); this.load(); },
      error: e => this.dialog.error(errMsg(e))
    });
  }

  async remove(supplier: Supplier) {
    if (!(await this.dialog.confirm(`Remove ${supplier.name}?`))) return;
    this.suppliersApi.remove(supplier.id).subscribe(() => this.load());
  }
}
