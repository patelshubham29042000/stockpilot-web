
import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { errMsg } from '@core/api';
import { Auth, PERM } from '@core/auth';
import { Dialog } from '@core/dialog/dialog.service';
import { PageHeaderComponent } from '@shared/page-header/page-header.component';
import { TabulatorGridComponent } from '@shared/tabulator-grid/tabulator-grid.component';
import { money, rupees } from '@shared/tabulator-grid/grid-formatters';
import { SalesApi } from '../../api';
import { SaleDetail, SaleStatus } from '../../models';
import { SALE_ACTIONS, SaleWorkflow } from '../../services/sale-workflow.service';

@Component({
  selector: 'app-sale-detail',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    PageHeaderComponent,
    TabulatorGridComponent
  ],
  templateUrl: './sale-detail.component.html',
  styleUrl: './sale-detail.component.css'
})
export class SaleDetailComponent implements OnInit {
  private salesApi = inject(SalesApi);
  private dialog = inject(Dialog);
  private router = inject(Router);
  private workflow = inject(SaleWorkflow);

  auth = inject(Auth);

  /** Filled from the URL /sales/find/:id. */
  @Input() id?: string;

  sale = signal<SaleDetail | null>(null);

  lines = computed(() => this.sale()?.lines ?? null);

  units = computed(() =>
    (this.sale()?.lines ?? []).reduce((sum, l) => sum + l.qty, 0)
  );

  readonly columns: any[] = [
    {
      title: '#',
      formatter: 'rownum',
      width: 56,
      hozAlign: 'center',
      headerSort: false
    },
    {
      title: 'Item',
      field: 'item',
      minWidth: 180,
      widthGrow: 3,
      formatter: 'textarea',
      headerSort: false
    },
    {
      title: 'Qty',
      field: 'qty',
      width: 100,
      hozAlign: 'right',
      headerSort: false
    },
    {
      title: 'Unit price',
      field: 'unitPrice',
      width: 140,
      hozAlign: 'right',
      headerSort: false,
      formatter: 'money',
      formatterParams: money
    },
    {
      title: 'Line total',
      width: 140,
      hozAlign: 'right',
      headerSort: false,
      formatter: (cell: any) => {
        const l = cell.getRow().getData();
        return rupees(l.qty * l.unitPrice);
      }
    }
  ];

  ngOnInit() {
    this.load();
  }

  /** The status buttons this person may use on this sale. */
  actions = computed(() => {
    const s = this.sale();

    return s && this.auth.can(PERM.salesStatus)
      ? SALE_ACTIONS[s.status]
      : [];
  });

  async change(target: SaleStatus) {
    const s = this.sale();

    if (s && await this.workflow.change(s, target)) {
      this.load();
    }
  }

  load() {
    this.salesApi.get(+this.id!).subscribe({
      next: s => this.sale.set(s),
      error: e =>
        this.dialog.error(errMsg(e)).then(() =>
          this.router.navigate(['/sales/find'])
        )
    });
  }
}
