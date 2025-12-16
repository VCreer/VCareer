import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ButtonComponent,
  CampaignSummaryCardsComponent,
  SummaryCard
} from '../../../../shared/components';
import { ApplicationService } from '../../../../proxy/application/applications/application.service';
import { ApplicationDto, GetApplicationListDto } from '../../../../proxy/dto/applications/models';
import { PagedResultDto } from '@abp/ng.core';

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

  // Application list
  loading: boolean = false;
  applications: ApplicationDto[] = [];
  totalCount: number = 0;
  pageSize: number = 10;
  currentPage: number = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private applicationService: ApplicationService
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
      this.loadApplications();
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
    this.currentPage = 1;
    this.loadApplications();
  }

  onExportCvList(): void {
    // Implement export logic
    console.log('Export CV list');
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadApplications();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
  }

  private loadApplications(): void {
    if (!this.campaignId) {
      this.applications = [];
      this.totalCount = 0;
      return;
    }

    const input: GetApplicationListDto = {
      recruitmentCampaignId: this.campaignId,
      keyword: this.searchQuery?.trim() || undefined,
      isViewed: this.filterType === 'viewed' ? true : undefined,
      sorting: this.sortType === 'date' ? 'creationTime DESC' : undefined,
      skipCount: (this.currentPage - 1) * this.pageSize,
      maxResultCount: this.pageSize
    };

    this.loading = true;
    // Scope to current recruiter company and campaign to avoid leaking other campaigns
    this.applicationService.getCompanyApplications(input)
      .subscribe({
        next: (res: PagedResultDto<ApplicationDto>) => {
          // Defensive filter in case backend returns mixed campaigns
          const filteredItems = (res.items || []).filter(
            app => app.recruitmentCampaignId === this.campaignId
          );

          // Sắp xếp theo thời gian (mới nhất lên đầu)
          filteredItems.sort((a, b) => {
            const timeA = a.creationTime ? new Date(a.creationTime).getTime() : 0;
            const timeB = b.creationTime ? new Date(b.creationTime).getTime() : 0;
            return timeB - timeA; // newest first
          });

          // Hiển thị tất cả applications (không dedupe)
          this.applications = filteredItems;
          
          // Đếm số ứng viên duy nhất cho statistics
          const uniqueCandidateCount = this.countUniqueCandidates(filteredItems);
          this.totalCount = filteredItems.length; // Tổng số đơn ứng tuyển
          
          // Số đếm ở summary cards dựa trên số ứng viên duy nhất
          this.appliedCvs = uniqueCandidateCount;
          this.totalCvs = uniqueCandidateCount;
          this.updateSummaryCards();
        },
        error: (err) => {
          console.error('Failed to load applications for campaign', err);
          this.applications = [];
          this.totalCount = 0;
        },
        complete: () => {
          this.loading = false;
        }
      });
  }

  /**
   * Đếm số ứng viên duy nhất (unique candidateId) từ danh sách applications
   */
  private countUniqueCandidates(applications: ApplicationDto[]): number {
    const uniqueCandidateIds = new Set<string>();
    applications.forEach((app, index) => {
      const candidateId = app.candidateId || app.id || `unknown-${index}`;
      uniqueCandidateIds.add(candidateId);
    });
    return uniqueCandidateIds.size;
  }

}

