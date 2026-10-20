import { Component, inject, signal } from '@angular/core';
import { Dialog } from '@core/dialog/dialog.service';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { errMsg } from '@core/api';
import { Auth, PERM } from '@core/auth';
import { Item } from '@modules/catalog/models';
import { NoticeComponent } from '@shared/notice/notice.component';
import { PageHeaderComponent } from '@shared/page-header/page-header.component';
import { ItemsApi } from '@modules/catalog/api';

@Component({
  selector: 'app-item-list',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, RouterLink, PageHeaderComponent, NoticeComponent],
  templateUrl: './item-list.component.html',
  styleUrl: './item-list.component.css'
})
export class ItemListComponent {
  private dialog = inject(Dialog);
  private itemsApi = inject(ItemsApi);
  auth = inject(Auth);
  readonly PERM = PERM;
  rows = signal<Item[]>([]);
  message = signal('');
  search = '';
  lowOnly = false;

  constructor() { this.load(); }

  load() { this.itemsApi.list(this.search, this.lowOnly).subscribe(r => this.rows.set(r)); }
  exportCsv() { this.itemsApi.exportCsv(); }

  async deactivate(item: Item) {
    if (!(await this.dialog.confirm(`Deactivate ${item.name}? It will no longer show in sales.`))) return;
    this.itemsApi.deactivate(item.id).subscribe({ next: () => this.load(), error: e => this.dialog.error(errMsg(e)) });
  }

  import(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.itemsApi.importCsv(file).subscribe({
      next: r => {
        this.dialog.success(`Imported: ${r.created} new, ${r.updated} updated${r.errors.length ? ', skipped: ' + r.errors.join('; ') : ''}.`);
        this.load();
      },
      error: e => this.dialog.error(errMsg(e))
    });
    input.value = '';
  }
}
