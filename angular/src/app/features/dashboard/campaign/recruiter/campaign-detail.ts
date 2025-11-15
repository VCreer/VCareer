import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ButtonComponent,
  CampaignSummaryCardsComponent,
  SummaryCard
} from '../../../../shared/components';

@Component({
  selector: 'app-campaign-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    CampaignSummaryCardsComponent
  ],
  templateUrl: './campaign-detail.html',
  styleUrls: ['./campaign-detail.scss']
})
export class CampaignDetailComponent implements OnInit, OnDestroy {
  sidebarExpanded: boolean = false;
  private sidebarCheckInterval?: any;

  // Campaign data
  campaignId: string = '';
  campaignName: string = '';
  
  // Summary stats
  totalCvs: number = 0;
  appliedCvs: number = 0;
  openContactCvs: number = 0;

  // Summary cards
  summaryCards: SummaryCard[] = [];

  // Tabs
  activeTab: string = 'applied';
  tabs = [
    { id: 'applied', label: 'CV ứng tuyển' },
    { id: 'viewed', label: 'Ứng viên đã xem tin' },
    { id: 'suggested', label: 'CV đề xuất' }
  ];

  // Filter and search
  searchQuery: string = '';
  filterType: string = 'all';
  sortType: string = 'default';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkSidebarState();
    this.sidebarCheckInterval = setInterval(() => {
      this.checkSidebarState();
    }, 100);

    // Get campaign data from route params
    this.route.queryParams.subscribe(params => {
      this.campaignId = params['campaignId'] || '';
      this.campaignName = params['campaignName'] || 'Chiến dịch tuyển dụng';
      
      // Load campaign data from localStorage
      this.loadCampaignData();
    });

    // Initialize summary cards
    this.updateSummaryCards();
  }

  ngOnDestroy(): void {
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
  }

  private checkSidebarState(): void {
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    if (sidebar) {
      const rect = sidebar.getBoundingClientRect();
      const width = rect.width;
      // Consider sidebar expanded if it has 'show' class OR width > 100px (hover state)
      this.sidebarExpanded = sidebar.classList.contains('show') || width > 100;
    }
  }

  private loadCampaignData(): void {
    try {
      const stored = localStorage.getItem('recruitment_campaigns');
      if (stored) {
        const campaigns = JSON.parse(stored);
        const campaign = campaigns.find((c: any) => c.id === this.campaignId);
        if (campaign) {
          this.campaignName = campaign.name;
          this.appliedCvs = campaign.appliedCvs || 0;
          // You can load more data here
        }
      }
    } catch (error) {
      console.error('Error loading campaign data:', error);
    }
    this.updateSummaryCards();
  }

  private updateSummaryCards(): void {
    this.summaryCards = [
      {
        label: 'TỔNG LƯỢNG CV ỨNG VIÊN',
        value: this.totalCvs,
        icon: 'fa-users',
        type: 'total'
      },
      {
        label: 'CV ỨNG TUYỂN',
        value: this.appliedCvs,
        icon: 'fa-file-text',
        type: 'applied'
      },
      {
        label: 'CV MỞ LIÊN HỆ',
        value: this.openContactCvs,
        icon: 'fa-envelope-open',
        type: 'contact'
      }
    ];
  }

  onBack(): void {
    this.router.navigate(['/recruiter/recruitment-campaign']);
  }

  onTabChange(tabId: string): void {
    this.activeTab = tabId;
  }

  onSearch(): void {
    // Implement search logic
    console.log('Search:', this.searchQuery);
  }

  onExportCvList(): void {
    // Implement export logic
    console.log('Export CV list');
  }

}

