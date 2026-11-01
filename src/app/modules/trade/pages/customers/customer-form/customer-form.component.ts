import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errMsg } from '@core/api';
import { Dialog } from '@core/dialog/dialog.service';
import { PageHeaderComponent } from '@shared/page-header/page-header.component';
import { CustomersApi } from '@modules/trade/api';
import { CUSTOMER_TYPES, CustomerDto, CustomerType } from '@modules/trade/models';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [FormsModule, RouterLink, PageHeaderComponent],
  templateUrl: './customer-form.component.html',
  styleUrl: './customer-form.component.css'
})
export class CustomerFormComponent implements OnInit {
  private customersApi = inject(CustomersApi);
  private router = inject(Router);
  private dialog = inject(Dialog);

  /** Filled from /customers/:id/edit. Empty on /customers/new. */
  @Input() id?: string;

  readonly customerTypes = CUSTOMER_TYPES;
  busy = signal(false);
  loading = signal(false);

  name = '';
  mobile = '';
  email = '';
  dateOfBirth = '';
  customerType: CustomerType = 'Regular';
  gstNumber = '';
  addressLine1 = '';
  city = '';
  district = '';
  state = '';
  country = 'India';
  pinCode = '';
  notes = '';
  isActive = true;

  ngOnInit() {
    if (!this.id) return;

    this.loading.set(true);

    this.customersApi.get(+this.id).subscribe({
      next: customer => {
        this.name = customer.name;
        this.mobile = customer.mobile;
        this.email = customer.email ?? '';
        this.dateOfBirth = customer.dateOfBirth?.substring(0, 10) ?? '';
        this.customerType = customer.customerType;
        this.gstNumber = customer.gstNumber ?? '';
        this.addressLine1 = customer.addressLine1 ?? '';
        this.city = customer.city ?? '';
        this.district = customer.district ?? '';
        this.state = customer.state ?? '';
        this.country = customer.country ?? 'India';
        this.pinCode = customer.pinCode ?? '';
        this.notes = customer.notes ?? '';
        this.isActive = customer.isActive;
        this.loading.set(false);
      },
      error: error => {
        this.loading.set(false);
        this.dialog.error(errMsg(error));
      }
    });
  }

  save() {
    const name = this.name.trim();
    const mobile = this.mobile.trim();
    const email = this.email.trim();

    if (name.length < 2) {
      this.dialog.error('Customer name needs at least 2 characters.');
      return;
    }

    if (!mobile) {
      this.dialog.error('Mobile number is required.');
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.dialog.error('Enter a valid email address, or leave it empty.');
      return;
    }

    const body: CustomerDto = {
      name,
      mobile,
      email: email || null,
      dateOfBirth: this.dateOfBirth || null,
      customerType: this.customerType,
      gstNumber: this.gstNumber.trim() || null,
      addressLine1: this.addressLine1.trim() || null,
      addressLine2: null,
      city: this.city.trim() || null,
      district: this.district.trim() || null,
      state: this.state.trim() || null,
      country: this.country.trim() || null,
      pinCode: this.pinCode.trim() || null,
      notes: this.notes.trim() || null,
      isActive: this.isActive
    };

    this.busy.set(true);

    const request = this.id
      ? this.customersApi.update(+this.id, body)
      : this.customersApi.create(body);

    request.subscribe({
      next: () => {
        this.busy.set(false);
        this.dialog.success(this.id ? 'Customer updated.' : 'Customer added.');
        this.router.navigate(['/customers']);
      },
      error: error => {
        this.busy.set(false);
        this.dialog.error(errMsg(error));
      }
    });
  }
}
