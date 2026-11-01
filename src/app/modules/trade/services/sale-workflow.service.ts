import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { errMsg } from '@core/api';
import { Dialog } from '@core/dialog/dialog.service';
import { SalesApi } from '../api';
import { SaleStatus } from '../models';

export interface SaleAction { target: SaleStatus; label: string; kind: 'ok' | 'bad' | 'alt'; needsReason: boolean; }

/** What can be done to a sale in each status. The server enforces the same rules. */
export const SALE_ACTIONS: Record<SaleStatus, SaleAction[]> = {
  Hold: [
    { target: 'Completed', label: 'Complete', kind: 'ok', needsReason: false },
    { target: 'Void', label: 'Void', kind: 'bad', needsReason: true }
  ],
  Completed: [
    { target: 'Returned', label: 'Return', kind: 'alt', needsReason: true },
    { target: 'Void', label: 'Void', kind: 'bad', needsReason: true }
  ],
  Returned: [],
  Void: []
};

export interface SaleRef { id: number; number: string; status: SaleStatus; }

/** Changing a sale's status, shared by Find sales and the sale detail page: ask first, then call the server. */
@Injectable({ providedIn: 'root' })
export class SaleWorkflow {
  private api = inject(SalesApi);
  private dialog = inject(Dialog);

  /** Resolves true when the screen should reload, and false when the user cancelled. */
  async change(sale: SaleRef, target: SaleStatus): Promise<boolean> {
    const action = SALE_ACTIONS[sale.status].find(a => a.target === target);
    if (!action) return false;

    let reason: string | undefined;
    if (action.needsReason) {
      const effect = sale.status === 'Completed' ? 'The stock will be put back.' : 'The held bill is cancelled. No stock changes.';
      const text = await this.dialog.prompt(`${action.label} ${sale.number}?\n${effect}`, {
        label: 'Reason', placeholder: 'For example: customer returned the goods', minLength: 3
      });
      if (text === null) return false;
      reason = text;
    } else if (!(await this.dialog.confirm(`Complete ${sale.number}?\nThe stock will be taken out and the sale will count in your sales.`))) {
      return false;
    }

    try {
      await firstValueFrom(this.api.changeStatus(sale.id, target, reason));
      await this.dialog.success(`${sale.number} is now ${target.toLowerCase()}.`);
    } catch (e) {
      await this.dialog.error(errMsg(e as HttpErrorResponse));
    }
    return true;   // reload either way, because someone else may have changed it
  }
}
