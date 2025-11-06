import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cv-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cv-empty-state.component.html',
  styleUrls: ['./cv-empty-state.component.scss']
})
export class CvEmptyStateComponent {
  @Input() message: string = 'Bạn không có CV';
}

