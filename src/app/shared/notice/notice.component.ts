import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-notice',
  standalone: true,
  templateUrl: './notice.component.html',
  styleUrl: './notice.component.css'
})
export class NoticeComponent {
  @Input() message: string | null = '';
}
