import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-employee-job-management-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employee-job-management-detail.html',
  styleUrls: ['./employee-job-management-detail.scss'],
})
export class EmployeeJobManagementDetailComponent implements OnInit, OnDestroy {
  sidebarExpanded = false;
  private sidebarCheckInterval?: any;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.checkSidebarState();
    this.sidebarCheckInterval = setInterval(() => {
      this.checkSidebarState();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
  }

  private checkSidebarState(): void {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      this.sidebarExpanded = sidebar.classList.contains('show');
    }
  }

  onApprove(): void {
    // TODO: Implement approve logic
  }

  onReject(): void {
    // TODO: Implement reject logic
  }

  onBack(): void {
    this.router.navigate(['/employee/manage-recruitment-information']);
  }

  getCompanyLogoUrl(companyName: string): string {
    // Try to get logo image, fallback to placeholder
    const logoMap: { [key: string]: string } = {
      'airCloset': 'assets/images/companies/aircloset.png',
      'FOXAi': 'assets/images/companies/foxai.png',
      'LIFESTYLE': 'assets/images/companies/lifestyle.png',
      'Jarvis': 'assets/images/companies/jarvis.png',
    };
    
    // Check if company name contains any logo key
    for (const [key, url] of Object.entries(logoMap)) {
      if (companyName.toUpperCase().includes(key.toUpperCase())) {
        return url;
      }
    }
    
    // Generate SVG with first letter as fallback
    const firstLetter = companyName.charAt(0).toUpperCase();
    const svg = `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="80" fill="#F3F4F6" rx="8"/><text x="50%" y="50%" font-size="24" font-weight="700" fill="#6B7280" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif">${firstLetter}</text></svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }
}

