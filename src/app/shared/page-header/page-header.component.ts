import { Component, Input, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { menuLabel } from '../../core/navigation';

@Component({
  selector: 'app-page-header',
  standalone: true,
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.css'
})
export class PageHeaderComponent {
  private route = inject(ActivatedRoute);

  /** Optional. Leave it out and the title is the menu name of the current page. */
  @Input() title = '';
  /** Small line under the title, for example "New item" on a form page. */
  @Input() subtitle = '';

  get heading(): string {
    return this.title || menuLabel(this.route.snapshot.routeConfig?.path) || '';
  }
}
