import { Component, ElementRef, Injector, ViewChild, afterNextRender, effect, inject } from '@angular/core';
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
    return { success: 'Success', error: 'Failed', info: 'Information', confirm: 'Please confirm' }[kind];
  }

  mark(kind: DialogKind): string {
    return { success: '✓', error: '!', info: 'i', confirm: '?' }[kind];
  }

  answer(value: boolean) { this.dialog.answer(value); }

  /** Escape key: counts as No on a question and as OK on a message. */
  onCancel(event: Event) {
    event.preventDefault();
    this.dialog.answer(false);
  }
}
