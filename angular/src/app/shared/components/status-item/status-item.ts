import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StatusItemData {
  status: string;
  count: number;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-status-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-item.html',
  styleUrls: ['./status-item.scss']
})
export class StatusItemComponent {
  @Input() item!: StatusItemData;
}