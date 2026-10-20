import { Directive, Input, TemplateRef } from '@angular/core';

/** Custom content for one column:  <ng-template gridCell="status" let-row> ... </ng-template> */
@Directive({ selector: 'ng-template[gridCell]', standalone: true })
export class GridCellDirective {
  @Input('gridCell') key = '';
  constructor(readonly template: TemplateRef<unknown>) {}
}

/** Buttons at the end of each row:  <ng-template gridActions let-row> ... </ng-template> */
@Directive({ selector: 'ng-template[gridActions]', standalone: true })
export class GridActionsDirective {
  constructor(readonly template: TemplateRef<unknown>) {}
}
