import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-generic-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './generic-modal.html',
  styleUrls: ['./generic-modal.scss']
})
export class GenericModalComponent implements OnChanges, OnInit, OnDestroy {
  @Input() show: boolean = false;
  @Input() title: string = '';
  @Input() maxWidth: string = '1400px';
  @Input() showCloseButton: boolean = true;
  @Input() closeOnOverlayClick: boolean = true;
  @Input() bodyBackground: string = '#f8fafc';
  
  @Output() close = new EventEmitter<void>();

  sidebarWidth: number = 0;
  private sidebarCheckInterval?: any;

  ngOnInit(): void {
    this.updateSidebarWidth();
    this.sidebarCheckInterval = setInterval(() => {
      this.updateSidebarWidth();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
    document.body.style.overflow = '';
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateSidebarWidth();
  }

  updateSidebarWidth(): void {
    const sidebar = document.querySelector('app-sidebar .sidebar') as HTMLElement;
    if (sidebar) {
      const rect = sidebar.getBoundingClientRect();
      this.sidebarWidth = rect.width;
    } else {
      this.sidebarWidth = 0;
    }
  }

  getOverlayPaddingLeft(): string {
    // Chỉ thêm padding khi màn hình lớn hơn 768px (desktop)
    if (window.innerWidth <= 768) {
      return '0';
    }
    return `${this.sidebarWidth}px`;
  }

  getModalMaxWidth(): string {
    const viewportWidth = window.innerWidth;
    
    // Trên mobile, không cần tính sidebar
    if (viewportWidth <= 768) {
      return '100%';
    }

    // Parse maxWidth input (có thể là '1400px', '90%', etc.)
    const maxWidthValue = this.parseMaxWidth(this.maxWidth);
    const overlayPadding = 40; // 20px mỗi bên
    const availableWidth = viewportWidth - this.sidebarWidth - overlayPadding;
    
    return `${Math.min(maxWidthValue, availableWidth)}px`;
  }

  private parseMaxWidth(value: string): number {
    if (value.endsWith('px')) {
      return parseInt(value.replace('px', ''), 10);
    }
    if (value.endsWith('%')) {
      const percent = parseFloat(value.replace('%', ''));
      return (window.innerWidth * percent) / 100;
    }
    return 1400; // default
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['show']) {
      if (changes['show'].currentValue) {
        document.body.style.overflow = 'hidden';
        this.updateSidebarWidth();
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

