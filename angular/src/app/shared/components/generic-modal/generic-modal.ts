import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-generic-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './generic-modal.html',
  styleUrls: ['./generic-modal.scss']
})
export class GenericModalComponent implements OnChanges {
  @Input() show: boolean = false;
  @Input() title: string = '';
  @Input() maxWidth: string = '1400px';
  @Input() showCloseButton: boolean = true;
  @Input() closeOnOverlayClick: boolean = true;
  @Input() bodyBackground: string = '#f8fafc';
  
  @Output() close = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['show']) {
      if (changes['show'].currentValue) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onOverlayClick(): void {
    if (this.closeOnOverlayClick) {
      this.onClose();
    }
  }

  onContentClick(event: Event): void {
    event.stopPropagation();
  }
}

