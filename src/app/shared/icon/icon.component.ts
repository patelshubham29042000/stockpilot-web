import { Component, Input } from '@angular/core';
import { IconName } from '../../core/icon-name';

@Component({
  selector: 'app-icon',
  standalone: true,
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.css'
})
export class IconComponent {
  @Input({ required: true }) name!: IconName;
  @Input() size = 20;
}
