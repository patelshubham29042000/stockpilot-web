import { Injectable, signal } from '@angular/core';

/** One banner message shown at the top of every page (used for connection problems). */
@Injectable({ providedIn: 'root' })
export class Notify {
  readonly message = signal<string | null>(null);
  show(text: string) { this.message.set(text); }
  clear() { this.message.set(null); }
}
