import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarLayoutService {
  private sidebarWidthSubject = new BehaviorSubject<number>(72);
  public sidebarWidth$: Observable<number> = this.sidebarWidthSubject.asObservable();

  private sidebarExpandedSubject = new BehaviorSubject<boolean>(false);
  public sidebarExpanded$: Observable<boolean> = this.sidebarExpandedSubject.asObservable();

  private checkInterval?: any;

  constructor() {
    this.startChecking();
  }

  private startChecking(): void {
    this.updateSidebarState();
    this.checkInterval = setInterval(() => {
      this.updateSidebarState();
    }, 100);
  }

  private updateSidebarState(): void {
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    if (sidebar) {
      const rect = sidebar.getBoundingClientRect();
      const width = rect.width;
      const isExpanded = sidebar.classList.contains('show') || width > 100;
      
      if (this.sidebarWidthSubject.value !== width) {
        this.sidebarWidthSubject.next(width);
      }
      if (this.sidebarExpandedSubject.value !== isExpanded) {
        this.sidebarExpandedSubject.next(isExpanded);
      }
    } else {
      if (this.sidebarWidthSubject.value !== 0) {
        this.sidebarWidthSubject.next(0);
      }
      if (this.sidebarExpandedSubject.value !== false) {
        this.sidebarExpandedSubject.next(false);
      }
    }
  }

  getSidebarWidth(): number {
    return this.sidebarWidthSubject.value;
  }

  isSidebarExpanded(): boolean {
    return this.sidebarExpandedSubject.value;
  }

  getContentPaddingLeft(): string {
    const width = this.getSidebarWidth();
    if (window.innerWidth <= 768) {
      return '0';
    }
    return `${width}px`;
  }

  getContentMaxWidth(): string {
    const viewportWidth = window.innerWidth;
    if (viewportWidth <= 768) {
      return '100%';
    }
    const sidebarWidth = this.getSidebarWidth();
    const padding = 48; // 24px mỗi bên
    const availableWidth = viewportWidth - sidebarWidth - padding;
    return `${Math.max(0, availableWidth)}px`;
  }

  getContentMarginLeft(): string {
    const width = this.getSidebarWidth();
    if (window.innerWidth <= 768) {
      return '0';
    }
    return `${width}px`;
  }

  getContentWidth(): string {
    const width = this.getSidebarWidth();
    if (window.innerWidth <= 768) {
      return '100%';
    }
    return `calc(100% - ${width}px)`;
  }

  ngOnDestroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
}

