import { Injectable, signal } from '@angular/core';
import { BRAND } from '../branding';

export type DialogKind = 'success' | 'error' | 'info' | 'confirm' | 'prompt';

export interface DialogState {
  kind: DialogKind;
  title: string;
  message: string;
  okText: string;
  yesText: string;
  noText: string;
  resolve: (answer: boolean, text?: string) => void;
  inputLabel?: string;
  inputPlaceholder?: string;
  minLength?: number;
}

export interface ConfirmOptions { title?: string; yesText?: string; noText?: string; }
export interface PromptOptions extends ConfirmOptions { label?: string; placeholder?: string; minLength?: number; }

/** Popup messages. Every popup is titled "POS System" unless another title is given. */
@Injectable({ providedIn: 'root' })
export class Dialog {
  readonly current = signal<DialogState | null>(null);
  private queue: DialogState[] = [];

  /** Green popup with an OK button. Use after something worked. */
  success(message: string, title = BRAND.appName): Promise<void> {
    return this.show('success', message, title).then(() => undefined);
  }

  /** Red popup with an OK button. Use for failures and validation messages. */
  error(message: string, title = BRAND.appName): Promise<void> {
    return this.show('error', message, title).then(() => undefined);
  }

  /** Plain popup with an OK button. */
  info(message: string, title = BRAND.appName): Promise<void> {
    return this.show('info', message, title).then(() => undefined);
  }

  /** A question with Yes (green) and No (red). Resolves true for Yes and false for No. */
  confirm(message: string, options: ConfirmOptions = {}): Promise<boolean> {
    return this.show('confirm', message, options.title ?? BRAND.appName, options);
  }

  /** A question with a text box, for example a reason. Resolves with the text, or null when cancelled. */
  prompt(message: string, options: PromptOptions = {}): Promise<string | null> {
    return new Promise<string | null>(resolve => {
      const state: DialogState = {
        kind: 'prompt', title: options.title ?? BRAND.appName, message,
        okText: 'OK', yesText: options.yesText ?? 'Confirm', noText: options.noText ?? 'Cancel',
        inputLabel: options.label ?? 'Reason', inputPlaceholder: options.placeholder ?? '', minLength: options.minLength ?? 0,
        resolve: (yes, text) => resolve(yes ? (text ?? '').trim() : null)
      };
      if (this.current()) this.queue.push(state); else this.current.set(state);
    });
  }

  /** Called by the popup when a button is pressed. Shows the next waiting popup, if any. */
  answer(value: boolean, text?: string): void {
    const open = this.current();
    if (!open) return;
    open.resolve(value, text);
    this.current.set(this.queue.shift() ?? null);
  }

  private show(kind: DialogKind, message: string, title: string, options: ConfirmOptions = {}): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      const state: DialogState = {
        kind, title, message, resolve,
        okText: 'OK', yesText: options.yesText ?? 'Yes', noText: options.noText ?? 'No'
      };
      if (this.current()) this.queue.push(state);
      else this.current.set(state);
    });
  }
}
