import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Activity {
  id: string;
  date: string; // Format: DD/MM/YYYY
  time: string; // Format: HH:mm
  type: string; // Loại hoạt động
}

@Component({
  selector: 'app-history-of-activities',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './history-of-activities.html',
  styleUrls: ['./history-of-activities.scss']
})
export class HistoryOfActivitiesComponent implements OnInit, OnDestroy {
  sidebarExpanded = false;
  sidebarWidth = 72; // Default collapsed width
  private sidebarCheckInterval?: any;
  private resizeListener?: () => void;

  // Activities list
  activities: Activity[] = [
    {
      id: '1',
      date: '13/11/2025',
      time: '21:53',
      type: 'Đăng nhập'
    },
    // Add more mock data as needed
  ];

  ngOnInit(): void {
    this.checkSidebarState();
    this.sidebarCheckInterval = setInterval(() => this.checkSidebarState(), 100);
    
    this.resizeListener = () => {
      this.checkSidebarState();
    };
    window.addEventListener('resize', this.resizeListener);
  }

  ngOnDestroy(): void {
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  private checkSidebarState(): void {
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    if (sidebar) {
      this.sidebarExpanded = sidebar.classList.contains('show') || sidebar.offsetWidth > 100;
      this.sidebarWidth = sidebar.offsetWidth || (this.sidebarExpanded ? 280 : 72);
    }
  }


}

