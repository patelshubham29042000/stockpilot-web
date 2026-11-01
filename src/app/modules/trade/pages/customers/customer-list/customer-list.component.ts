import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errMsg } from '@core/api';
import { Dialog } from '@core/dialog/dialog.service';
import { PageHeaderComponent } from '@shared/page-header/page-header.component';
import { TabulatorGridComponent } from '@shared/tabulator-grid/tabulator-grid.component';
import { actionButtons, esc } from '@shared/tabulator-grid/grid-formatters';
import { CustomersApi } from '@modules/trade/api';
import { CUSTOMER_TYPES, CustomerRow, CustomerType } from '@modules/trade/models';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [FormsModule, RouterLink, PageHeaderComponent, TabulatorGridComponent],
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.css'
})
export class CustomerListComponent {
  private customersApi = inject(CustomersApi);
  private router = inject(Router);
  private dialog = inject(Dialog);

  customers = signal<CustomerRow[]>([]);
  loading = signal(false);
  search = signal('');
  typeFilter = signal<CustomerType | ''>('');
  activeFilter = signal<'all' | 'active' | 'inactive'>('active');

  readonly customerTypes = CUSTOMER_TYPES;

  shown = computed(() => {
    const text = this.search().trim().toLowerCase();
    const type = this.typeFilter();
    const active = this.activeFilter();

    return this.customers().filter(c => {
      const searchable = `${c.name} ${c.mobile} ${c.email ?? ''} ${c.gstNumber ?? ''} ${c.city ?? ''} ${c.country ?? ''}`.toLowerCase();

      return (!text || searchable.includes(text))
        && (!type || c.customerType === type)
        && (active === 'all' || (active === 'active' && c.isActive) || (active === 'inactive' && !c.isActive));
    });
  });

  readonly columns: any[] = [
    { title: 'Customer Name', field: 'name', minWidth: 170, widthGrow: 2, responsive: 0, formatter: (cell: any) => `<strong>${esc(cell.getValue())}</strong>` },
    { title: 'Mobile', field: 'mobile', width: 140, responsive: 0, formatter: (cell: any) => esc(cell.getValue()) },
    { title: 'Email', field: 'email', minWidth: 180, widthGrow: 2, responsive: 2, formatter: (cell: any) => esc(cell.getValue() || '-') },
    { title: 'Type', field: 'customerType', width: 120, responsive: 2, formatter: (cell: any) => esc(cell.getValue()) },
    { title: 'City', field: 'city', width: 120, responsive: 3, formatter: (cell: any) => esc(cell.getValue() || '-') },
    { title: 'Country', field: 'country', width: 120, responsive: 3, formatter: (cell: any) => esc(cell.getValue() || '-') },
    { title: 'GST Number', field: 'gstNumber', minWidth: 140, responsive: 4, formatter: (cell: any) => esc(cell.getValue() || '-') },
    {
      title: '',
      width: 170,
      hozAlign: 'right',
      headerSort: false,
      responsive: 0,
      formatter: () => actionButtons([
        { action: 'edit', label: 'Edit' },
        { action: 'deactivate', label: 'Deactivate', kind: 'bad' }
      ])
    }
  ];

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.customersApi.list().subscribe({
      next: rows => {
        this.customers.set(rows);
        this.loading.set(false);
      },
      error: error => {
        this.loading.set(false);
        this.dialog.error(errMsg(error));
      }
    });
  }

  onAction(event: { action: string; row: CustomerRow }) {
    if (event.action === 'edit') {
      this.router.navigate(['/customers', event.row.id, 'edit']);
    } else if (event.action === 'deactivate') {
      this.deactivate(event.row);
    }
  }

  async deactivate(customer: CustomerRow) {
    if (!customer.isActive) return;

    if (!(await this.dialog.confirm(`Deactivate ${customer.name}?`))) return;

    this.customersApi.deactivate(customer.id).subscribe({
      next: () => {
        this.dialog.success(`${customer.name} was deactivated.`);
        this.load();
      },
      error: error => this.dialog.error(errMsg(error))
    });
  }
}
