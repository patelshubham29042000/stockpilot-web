import { Component, ElementRef, Injector, ViewChild, afterNextRender, effect, inject, signal } from '@angular/core';
import { Dialog, DialogKind } from '../../core/dialog/dialog.service';

@Component({
  selector: 'app-dialog-host',
  standalone: true,
  templateUrl: './dialog-host.component.html',
  styleUrl: './dialog-host.component.css'
})
export class DialogHostComponent {
  private injector = inject(Injector);
  private dialog = inject(Dialog);
  readonly state = this.dialog.current;
  text = signal('');          // what is typed in a prompt
  promptError = signal('');

  @ViewChild('box', { static: true }) box!: ElementRef<HTMLDialogElement>;

  constructor() {
    // Opens the modal when a popup is requested and closes it when none is left.
    effect(() => {
      const open = this.state();
      const el = this.box?.nativeElement;
      if (!el) return;
      if (open) {
        if (!el.open) el.showModal();
        afterNextRender(() => el.querySelector<HTMLElement>('[data-focus]')?.focus(), { injector: this.injector });
      } else if (el.open) {
        el.close();
      }
    });
  }

  statusText(kind: DialogKind): string {
    return { success: 'Success', error: 'Failed', info: 'Information', confirm: 'Please confirm', prompt: 'Please confirm' }[kind];
  }

  mark(kind: DialogKind): string {
    return { success: '✓', error: '!', info: 'i', confirm: '?', prompt: '?' }[kind];
  }

  answer(value: boolean) {
    const s = this.state();
    if (s?.kind === 'prompt' && value) {
      const text = this.text().trim();
      if (text.length < (s.minLength ?? 0)) { this.promptError.set(`Please write at least ${s.minLength} characters.`); return; }
      this.dialog.answer(true, text);
    } else {
      this.dialog.answer(value);
    }
    this.text.set('');
    this.promptError.set('');
  }

  /** Escape key: counts as No on a question and as OK on a message. */
  onCancel(event: Event) {
    event.preventDefault();
    this.dialog.answer(false);
    this.text.set('');
    this.promptError.set('');
  }
}
