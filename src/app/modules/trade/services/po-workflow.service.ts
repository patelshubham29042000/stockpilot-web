import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { errMsg } from '@core/api';
import { Dialog } from '@core/dialog/dialog.service';
import { PurchaseOrdersApi } from '../api';

/** What a screen needs to know about an order to complete or cancel it. */
export interface PoRef { id: number; number: string; itemCount: number; }

/**
 * Complete and Cancel, shared by Find PO and the view form: ask Yes/No, call the server, show the result.
 * Each method resolves true when the screen should reload, and false when the user answered No.
 */
@Injectable({ providedIn: 'root' })
export class PoWorkflow {
  private api = inject(PurchaseOrdersApi);
  private dialog = inject(Dialog);

  async complete(order: PoRef): Promise<boolean> {
    if (!(await this.dialog.confirm(`Mark ${order.number} as Completed?\nThe stock of ${order.itemCount} item(s) will increase.`))) return false;
    try {
      await firstValueFrom(this.api.complete(order.id));
      await this.dialog.success(`${order.number} is completed. The stock was updated.`);
    } catch (e) {
      await this.dialog.error(errMsg(e as HttpErrorResponse));
    }
    return true;
  }

  async cancel(order: PoRef): Promise<boolean> {
    if (!(await this.dialog.confirm(`Cancel ${order.number}?\nThis cannot be undone.`))) return false;
    try {
      await firstValueFrom(this.api.cancel(order.id));
      await this.dialog.success(`${order.number} was cancelled.`);
    } catch (e) {
      await this.dialog.error(errMsg(e as HttpErrorResponse));
    }
    return true;
  }
}
