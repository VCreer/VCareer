import { Injectable, Renderer2, RendererFactory2, OnDestroy } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarSyncService implements OnDestroy {
  private renderer: Renderer2;
  private observers: Map<string, ResizeObserver> = new Map();

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  /**
   * Setup sidebar synchronization for a component
   * @param pageSelector - CSS selector for the page element (e.g., '.recruitment-report-page')
   * @param breadcrumbSelector - CSS selector for breadcrumb element (e.g., '.breadcrumb-box')
   * @param componentId - Unique ID for this component
   */
  setupSync(pageSelector: string, breadcrumbSelector: string, componentId: string): void {
    const trySetup = (attempts = 0) => {
      const sidebar = document.querySelector('app-sidebar .sidebar') as HTMLElement;
      
      if (sidebar) {
        this.checkAndUpdateState(sidebar, pageSelector, breadcrumbSelector);
        
        const resizeObserver = new ResizeObserver(() => {
          this.checkAndUpdateState(sidebar, pageSelector, breadcrumbSelector);
        });

        resizeObserver.observe(sidebar);
        this.observers.set(componentId, resizeObserver);
      } else if (attempts < 10) {
        setTimeout(() => trySetup(attempts + 1), 100);
      }
    };

    trySetup();
  }

  /**
   * Cleanup observer for a component
   * @param componentId - Unique ID for this component
   */
  cleanup(componentId: string): void {
    const observer = this.observers.get(componentId);
    if (observer) {
      observer.disconnect();
      this.observers.delete(componentId);
    }
  }

  private checkAndUpdateState(
    sidebar: HTMLElement,
    pageSelector: string,
    breadcrumbSelector: string
  ): void {
    const width = Math.round(sidebar.getBoundingClientRect().width);
    
    // Hysteresis thresholds
    const expandThreshold = 180;
    const collapseThreshold = 170;
    
    const pageElement = document.querySelector(pageSelector);
    const breadcrumbElement = document.querySelector(breadcrumbSelector);
    
    if (!pageElement || !breadcrumbElement) return;
    
    const isCurrentlyExpanded = pageElement.classList.contains('sidebar-expanded');
    let shouldBeExpanded = isCurrentlyExpanded;
    
    if (isCurrentlyExpanded) {
      if (width < collapseThreshold) {
        shouldBeExpanded = false;
      }
    } else {
      if (width > expandThreshold) {
        shouldBeExpanded = true;
      }
    }
    
    // Update DOM
    if (shouldBeExpanded) {
      this.renderer.addClass(pageElement, 'sidebar-expanded');
      this.renderer.addClass(breadcrumbElement, 'sidebar-expanded');
    } else {
      this.renderer.removeClass(pageElement, 'sidebar-expanded');
      this.renderer.removeClass(breadcrumbElement, 'sidebar-expanded');
    }
  }

  ngOnDestroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}
