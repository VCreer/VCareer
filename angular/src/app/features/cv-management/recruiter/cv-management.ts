import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslationService } from '../../../core/services/translation.service';
import { 
  CvFilterBarComponent,
  CvFilterData,
  ButtonComponent, 
  ToastNotificationComponent,
  CvEmptyStateComponent,
  PaginationComponent,
  GenericModalComponent
} from '../../../shared/components';
import { ApplicationService } from '../../../proxy/application/applications/application.service';
import type { ApplicationDto,GetApplicationListDto, UpdateApplicationStatusDto } from 'src/app/proxy/dto/applications';
import { NotificationService } from '../../../core/services/notification.service';
import { environment } from '../../../../environments/environment';
import * as XLSX from 'xlsx';
import * as JSZip from 'jszip';

export interface CandidateCv {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  status: string; // 'suitable' | 'send-offer' | 'new' | 'viewed' | etc.
  source: string; // 'find-cv' | 'topcv-support' | etc.
  appliedDate: string;
  addedDate: string; // Thời gian CV được vào Quản lý CV
  campaignId: string;
  campaignName: string;
  jobId?: string;
  jobTitle?: string;
  isViewed: boolean;
  avatarImageUrl?: string; // URL ảnh đại diện từ CV
  avatar?: string; // Fallback initials
  candidateCode?: string; // Mã ứng viên
  candidateId?: string; // ID của candidate để gửi notification
  notes?: string; // Ghi chú
  labels?: string[];
  rating?: number; // Đánh giá từ 1-10
}

// Đồng bộ với enum ApplicationDisplayStatus bên backend:
// VCareer.Constants.JobConstant.ApplicationDisplayStatus
export enum ApplicationDisplayStatus {
  RECEIVED = 'received',        // CV tiếp nhận
  SUITABLE = 'suitable',        // Phù hợp
  INTERVIEW = 'interview',      // Hẹn phỏng vấn
  OFFER = 'offer',              // Gửi đề nghị
  HIRED = 'hired',              // Nhận việc
  NOT_SUITABLE = 'not-suitable' // Chưa phù hợp
}

@Component({
  selector: 'app-recruiter-cv-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CvFilterBarComponent,
    CvEmptyStateComponent,
    ButtonComponent,
    ToastNotificationComponent,
    PaginationComponent,
    GenericModalComponent
  ],
  templateUrl: './cv-management.html',
  styleUrls: ['./cv-management.scss']
})
export class RecruiterCvManagementComponent implements OnInit, OnDestroy {
  selectedLanguage = 'vi';
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' | 'warning' = 'success';
  sidebarExpanded: boolean = false;
  private sidebarCheckInterval?: any;

  // Filter data
  campaigns: { id: string; name: string }[] = [
    { id: '1', name: 'Chiến dịch Tuyển dụng Q1 2025' },
    { id: '2', name: 'Chiến dịch Tuyển dụng Q2 2025' },
    { id: '3', name: 'Chiến dịch Tuyển dụng Q3 2025' }
  ];

  statuses: { id: string; name: string }[] = [
    { id: ApplicationDisplayStatus.RECEIVED, name: 'CV tiếp nhận' },  // Trạng thái mặc định
    { id: ApplicationDisplayStatus.SUITABLE, name: 'Phù hợp' },
    { id: ApplicationDisplayStatus.INTERVIEW, name: 'Hẹn phỏng vấn' },
    { id: ApplicationDisplayStatus.OFFER, name: 'Gửi đề nghị' },
    { id: ApplicationDisplayStatus.HIRED, name: 'Nhận việc' },
    { id: ApplicationDisplayStatus.NOT_SUITABLE, name: 'Chưa phù hợp' }
  ];

  sources: { id: string; name: string }[] = [
    { id: 'find-cv', name: 'Tìm CV' },
    { id: 'topcv-support', name: 'TopCV hỗ trợ' },
    { id: 'website', name: 'Website' },
    { id: 'linkedin', name: 'LinkedIn' },
    { id: 'facebook', name: 'Facebook' },
    { id: 'referral', name: 'Giới thiệu' },
    { id: 'other', name: 'Khác' }
  ];

  labels: { id: string; name: string }[] = [
    { id: 'hot', name: 'Hot' },
    { id: 'priority', name: 'Ưu tiên' },
    { id: 'follow-up', name: 'Cần follow-up' }
  ];

  // CV list
  candidateCvs: CandidateCv[] = [];
  filteredCvs: CandidateCv[] = [];
  paginatedCvs: CandidateCv[] = [];
  loading = false;
  // Đếm ứng viên (unique) và số đơn
  totalCandidateCount = 0;
  totalApplicationCount = 0;
  filteredCandidateCount = 0;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 20;
  
  // Export
  exporting: boolean = false;

  // Current filters
  currentFilters: CvFilterData = {
    searchKeyword: '',
    campaignId: '',
    statusId: '',
    sourceId: '',
    displayAll: true,
    labelId: '',
    timeRange: '',
    startDate: null,
    endDate: null
  };

  constructor(
    private translationService: TranslationService,
    private router: Router,
    private applicationService: ApplicationService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.translationService.currentLanguage$.subscribe(lang => {
      this.selectedLanguage = lang;
    });
    this.loadCampaigns();
    this.loadCvs();
    this.checkSidebarState();
    // Check sidebar state periodically
    this.sidebarCheckInterval = setInterval(() => {
      this.checkSidebarState();
    }, 100);
  }

  private loadCampaigns(): void {
    try {
      const stored = localStorage.getItem('recruitment_campaigns');
      if (stored) {
        const campaigns = JSON.parse(stored);
        this.campaigns = campaigns.map((c: any) => ({
          id: c.id,
          name: c.name
        }));
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
  }

  ngOnDestroy(): void {
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
    this.removeScrollListener();
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

  loadCvs(): void {
    this.loading = true;
    
    const input: GetApplicationListDto = {
      skipCount: 0,
      maxResultCount: 1000, // Load all for client-side filtering
      sorting: 'creationTime DESC',
      // companyId sẽ được backend tự lấy từ current user
    };
    
    this.applicationService.getCompanyApplications(input).subscribe({
      next: (response) => {
        console.log('Applications loaded from API:', response);
        const applications = response.items || [];
        // Hiển thị tất cả CV (không dedupe)
        this.candidateCvs = this.mapApplicationsToCvs(applications);
        // Tổng số đơn ứng tuyển & số ứng viên duy nhất
        this.totalApplicationCount = applications.length;
        this.totalCandidateCount = this.countUniqueCandidates(applications);
        this.loading = false;
        this.applyFilters();
        this.showToastMessage(
          `Đã tải ${this.totalApplicationCount} đơn ứng tuyển từ ${this.totalCandidateCount} ứng viên.`,
          'success'
        );
      },
      error: (error) => {
        console.error('Error loading applications:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        
        let errorMessage = 'Không thể tải danh sách ứng viên từ server.';
        
        if (error.status === 401) {
          errorMessage = 'Vui lòng đăng nhập để xem danh sách ứng viên.';
        } else if (error.status === 403) {
          errorMessage = 'Bạn không có quyền truy cập danh sách ứng viên.';
        } else if (error.status === 404) {
          errorMessage = 'Không tìm thấy dữ liệu ứng viên.';
        } else if (error.status === 0 || error.status >= 500) {
          errorMessage = 'Lỗi kết nối server. Vui lòng thử lại sau.';
        }
        
        this.showToastMessage(errorMessage, 'error');
        this.loading = false;
        this.candidateCvs = [];
        this.filteredCvs = [];
        this.paginatedCvs = [];
        this.totalApplicationCount = 0;
        this.totalCandidateCount = 0;
        this.filteredCandidateCount = 0;
        this.applyFilters();
      }
    });
  }
  
  private mapApplicationsToCvs(applications: ApplicationDto[]): CandidateCv[] {
    // Đảm bảo sắp xếp theo creationTime DESC (mới nhất lên đầu) sau khi map
    const mapped = applications.map(app => {
      // Generate placeholder email/phone từ candidateId nếu có
      // TODO: Backend nên thêm email và phone vào ApplicationDto
      const candidateIdShort = app.candidateId?.substring(0, 8) || 'unknown';
      const email = app.candidateId ? `candidate_${candidateIdShort}@vcareer.vn` : 'N/A';
      const phone = app.candidateId ? candidateIdShort.padEnd(10, '0') : 'N/A';
      
      // Normalize status from backend
      const normalizedStatus = this.normalizeStatus(app.status);
      
      // Debug log to help identify status mapping issues
      if (app.status && app.status !== normalizedStatus) {
        console.log(`Status normalized: "${app.status}" → "${normalizedStatus}" for CV ${app.id}`);
      }
      
      return {
        id: app.id || '',
        name: app.candidateName || 'N/A',
        email: app.candidateEmail || 'N/A',
        phone: app.candidatePhone || 'N/A',
        position: app.jobTitle || 'N/A',
        status: normalizedStatus, // Normalize backend status to frontend status
        source: this.getCvSource(app.cvType),
        appliedDate: app.creationTime ? new Date(app.creationTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        addedDate: app.creationTime ? new Date(app.creationTime).toISOString() : new Date().toISOString(),
        campaignId: app.recruitmentCampaignId || '',
        campaignName: app.recruitmentCampaignName || '',
        jobId: app.jobId || '',
        jobTitle: app.jobTitle || 'N/A',
        isViewed: !!app.viewedAt,
        candidateCode: app.candidateId || '',
        candidateId: app.candidateId || '',
           notes: app.recruiterNotes || '',
        rating: app.rating || undefined
      };
    });
    
    // Sắp xếp lại theo addedDate DESC (mới nhất lên đầu) để đảm bảo thứ tự đúng
    return mapped.sort((a, b) => {
      const dateA = new Date(a.addedDate).getTime();
      const dateB = new Date(b.addedDate).getTime();
      return dateB - dateA; // DESC: mới nhất lên đầu
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

  /**
   * Normalize backend status values to frontend status values
   * Backend: "Pending", "Reviewed", "Shortlisted", "Interviewed", "Accepted", "Rejected", "Withdrawn"
   * Frontend: 'received', 'suitable', 'interview', 'offer', 'hired', 'not-suitable'
   */
  private normalizeStatus(backendStatus?: string | null): string {
    // Handle null, undefined, or empty string
    if (!backendStatus || !backendStatus.trim()) {
      return 'received'; // Default: CV tiếp nhận
    }

    const statusLower = backendStatus.toLowerCase().trim();
    
    // If already in frontend format, return as is
    const frontendStatuses = Object.values(ApplicationDisplayStatus) as string[];
    if (frontendStatuses.includes(statusLower)) {
      return statusLower;
    }

    // Map backend status to frontend status
    const statusMap: { [key: string]: string } = {
      'pending': ApplicationDisplayStatus.RECEIVED,           // CV tiếp nhận
      'reviewed': ApplicationDisplayStatus.SUITABLE,          // Phù hợp
      'shortlisted': ApplicationDisplayStatus.SUITABLE,       // Phù hợp
      'interviewed': ApplicationDisplayStatus.INTERVIEW,      // Hẹn phỏng vấn
      'accepted': ApplicationDisplayStatus.HIRED,             // Nhận việc
      'rejected': ApplicationDisplayStatus.NOT_SUITABLE,      // Chưa phù hợp
      'withdrawn': ApplicationDisplayStatus.NOT_SUITABLE,     // Chưa phù hợp
      'offer': ApplicationDisplayStatus.OFFER,                // Gửi đề nghị
      'send-offer': ApplicationDisplayStatus.OFFER,           // Gửi đề nghị (alternative)
      'new': ApplicationDisplayStatus.RECEIVED,               // Mới = CV tiếp nhận
      'viewed': ApplicationDisplayStatus.RECEIVED             // Đã xem nhưng chưa đánh giá = CV tiếp nhận
    };

    const normalizedStatus = statusMap[statusLower] || ApplicationDisplayStatus.RECEIVED;
    
    // Log unknown status values for debugging
    if (!statusMap[statusLower]) {
      console.warn(`Unknown status value from backend: "${backendStatus}" (normalized to "received")`);
    }
    
    return normalizedStatus;
  }
  
  private getCvSource(cvType?: string): string {
    if (cvType === 'uploaded') return 'topcv-support';
    if (cvType === 'online') return 'find-cv';
    return 'find-cv';
  }

  private generateMockCvs(): CandidateCv[] {
    const mockCvs: CandidateCv[] = [
      {
        id: '1',
        name: 'Nguyễn Thị Lụa',
        email: 'cv_3474319@gmail.com',
        phone: '0003474319',
        position: 'Chuyên viên Nhân sự tổng hợp',
        status: 'suitable', // Phù hợp
        source: 'find-cv',
        appliedDate: '2022-09-16',
        addedDate: '2022-09-16T14:14:00',
        campaignId: '#407764',
        campaignName: 'Tuyển Nhân viên Tester',
        jobId: '#407764',
        jobTitle: 'Tuyển Nhân viên Tester',
        isViewed: true,
        candidateCode: 'CV001',
        notes: 'Ứng viên có kinh nghiệm tốt'
      },
      {
        id: '2',
        name: 'PHẠM THANH TUYỀN',
        email: 'tuyen.pham@example.com',
        phone: '0123456789',
        position: 'Nhân viên Marketing',
        status: 'offer', // Gửi đề nghị
        source: 'topcv-support',
        appliedDate: '2022-09-15',
        addedDate: '2022-09-15T10:30:00',
        campaignId: '#407767',
        campaignName: 'Tuyển Nhân viên Market...',
        jobId: '#407767',
        jobTitle: 'Tuyển Nhân viên Market...',
        isViewed: true,
        candidateCode: 'CV002'
      },
      {
        id: '3',
        name: 'Trần Tấn Phước',
        email: 'phuoc.tran@example.com',
        phone: '0987654321',
        position: 'Developer',
        status: 'suitable', // Phù hợp
        source: 'find-cv',
        appliedDate: '2022-09-14',
        addedDate: '2022-09-14T16:45:00',
        campaignId: '#407726',
        campaignName: 'chien dich test',
        jobId: '#407726',
        jobTitle: 'chien dich test',
        isViewed: true,
        avatar: 'TP',
        candidateCode: 'CV003',
        notes: 'Cần phỏng vấn kỹ thuật'
      },
      {
        id: '4',
        name: 'Trần Ngọc Gia Mẫn',
        email: 'man.tran@example.com',
        phone: '0912345678',
        position: 'Designer',
        status: 'suitable', // Phù hợp
        source: 'topcv-support',
        appliedDate: '2022-09-13',
        addedDate: '2022-09-13T09:20:00',
        campaignId: '#407685',
        campaignName: 'Tuyển Designer',
        jobId: '#407685',
        jobTitle: 'Tuyển Designer',
        isViewed: true,
        candidateCode: 'CV004'
      }
    ];

    // Generate more mock data to reach 747 items
    for (let i = 5; i <= 747; i++) {
      const names = ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Thị D', 'Hoàng Văn E'];
      const positions = ['Developer', 'Designer', 'Marketing', 'HR', 'Tester'];
      const statuses = ['received', 'suitable', 'interview', 'offer', 'hired', 'not-suitable']; // Các trạng thái mới
      const sources = ['find-cv', 'topcv-support'];
      const campaigns = [
        { id: '#407764', name: 'Tuyển Nhân viên Tester' },
        { id: '#407767', name: 'Tuyển Nhân viên Market...' },
        { id: '#407726', name: 'chien dich test' },
        { id: '#407685', name: 'Tuyển Designer' }
      ];

      const randomName = names[Math.floor(Math.random() * names.length)] + ` ${i}`;
      const randomPosition = positions[Math.floor(Math.random() * positions.length)];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      const randomSource = sources[Math.floor(Math.random() * sources.length)];
      const randomCampaign = campaigns[Math.floor(Math.random() * campaigns.length)];

      const appliedDate = `2022-09-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`;
      const addedHour = String(Math.floor(Math.random() * 24)).padStart(2, '0');
      const addedMinute = String(Math.floor(Math.random() * 60)).padStart(2, '0');
      
      mockCvs.push({
        id: String(i),
        name: randomName,
        email: `cv_${i}@example.com`,
        phone: `0${Math.floor(Math.random() * 900000000) + 100000000}`,
        position: randomPosition,
        status: randomStatus,
        source: randomSource,
        appliedDate: appliedDate,
        addedDate: `${appliedDate}T${addedHour}:${addedMinute}:00`,
        campaignId: randomCampaign.id,
        campaignName: randomCampaign.name,
        jobId: randomCampaign.id,
        jobTitle: randomCampaign.name,
        isViewed: Math.random() > 0.3,
        candidateCode: `CV${String(i).padStart(3, '0')}`,
        notes: Math.random() > 0.7 ? 'Có ghi chú' : undefined
      });
    }

    return mockCvs;
  }

  onFilterChange(filterData: CvFilterData): void {
    this.currentFilters = filterData;
    this.currentPage = 1; // Reset to page 1 when filters change
    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.candidateCvs];

    // Search filter
    if (this.currentFilters.searchKeyword.trim()) {
      const keyword = this.currentFilters.searchKeyword.toLowerCase();
      result = result.filter(cv =>
        cv.name.toLowerCase().includes(keyword) ||
        cv.email.toLowerCase().includes(keyword) ||
        cv.phone.includes(keyword)
      );
    }

    // Campaign filter
    if (this.currentFilters.campaignId) {
      result = result.filter(cv => cv.campaignId === this.currentFilters.campaignId);
    }

    // Status filter
    if (this.currentFilters.statusId) {
      const filterStatus = this.currentFilters.statusId.toLowerCase().trim();
      result = result.filter(cv => {
        const cvStatus = (cv.status || '').toLowerCase().trim();
        return cvStatus === filterStatus;
      });
    }

    // Source filter
    if (this.currentFilters.sourceId) {
      result = result.filter(cv => cv.source === this.currentFilters.sourceId);
    }

    // Label filter
    if (this.currentFilters.labelId) {
      result = result.filter(cv =>
        cv.labels && cv.labels.includes(this.currentFilters.labelId)
      );
    }

    // Display all filter (show all CVs or only unviewed)
    if (!this.currentFilters.displayAll) {
      result = result.filter(cv => !cv.isViewed);
    }

    // Time range filter - handle both preset ranges and custom date range
    if (this.currentFilters.timeRange || this.currentFilters.startDate || this.currentFilters.endDate) {
      result = result.filter(cv => {
        const appliedDate = new Date(cv.appliedDate);
        
        // Custom date range (from date picker)
        if (this.currentFilters.startDate || this.currentFilters.endDate) {
          if (this.currentFilters.startDate) {
            const startDate = new Date(this.currentFilters.startDate);
            startDate.setHours(0, 0, 0, 0); // Start of day
            if (appliedDate < startDate) {
              return false;
            }
          }
          
          if (this.currentFilters.endDate) {
            const endDate = new Date(this.currentFilters.endDate);
            endDate.setHours(23, 59, 59, 999); // End of day
            if (appliedDate > endDate) {
              return false;
            }
          }
          
          return true;
        }
        
        // Preset time ranges
        if (this.currentFilters.timeRange) {
          const now = new Date();
          switch (this.currentFilters.timeRange) {
            case 'today':
              return appliedDate.toDateString() === now.toDateString();
            case 'week':
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              weekAgo.setHours(0, 0, 0, 0);
              return appliedDate >= weekAgo;
            case 'month':
              const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              monthAgo.setHours(0, 0, 0, 0);
              return appliedDate >= monthAgo;
            case 'year':
              const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
              yearAgo.setHours(0, 0, 0, 0);
              return appliedDate >= yearAgo;
            case 'all':
              return true;
            default:
              return true;
          }
        }
        
        return true;
      });
    }

    this.filteredCvs = result;
    // Đếm lại ứng viên (unique) theo filter
    const uniqueCandidateIds = new Set<string>();
    result.forEach(cv => {
      const candidateId = cv.candidateCode || cv.id || '';
      if (candidateId) uniqueCandidateIds.add(candidateId);
    });
    this.filteredCandidateCount = uniqueCandidateIds.size;
    
    // Reset to page 1 when filters change
    this.currentPage = 1;
    this.updatePaginatedCvs();
  }

  get totalPages(): number {
    return Math.ceil(this.filteredCvs.length / this.itemsPerPage);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updatePaginatedCvs();
    // Scroll to top of table
    const tableElement = document.querySelector('.cv-table-wrapper');
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  updatePaginatedCvs(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedCvs = this.filteredCvs.slice(startIndex, endIndex);
  }

  async onExportCvList(): Promise<void> {
    if (this.exporting || this.filteredCvs.length === 0) {
      return;
    }

    this.exporting = true;
    this.showToastMessage('Đang xuất Excel và tải CV...', 'info');

    try {
      // Tạo Excel file với dữ liệu ứng viên
      const excelData = this.prepareExcelData(this.filteredCvs);
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(excelData);
      
      // Set column widths
      const colWidths = [
        { wch: 25 }, // Ứng viên
        { wch: 20 }, // Chiến dịch
        { wch: 30 }, // Email
        { wch: 15 }, // Số điện thoại
        { wch: 15 }, // Nguồn CV
        { wch: 15 }, // Ngày ứng tuyển
        { wch: 20 }, // Trạng thái
        { wch: 10 }, // Đánh giá
        { wch: 30 }, // Ghi chú
        { wch: 50 }  // Link CV
      ];
      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách ứng viên');
      
      // Convert workbook to buffer
      const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
      
      // Tải CV PDF cho từng ứng viên
      const cvFiles: { name: string; blob: Blob }[] = [];
      let successCount = 0;
      let failedCount = 0;

      console.log(`Bắt đầu tải ${this.filteredCvs.length} CV...`);

      for (let i = 0; i < this.filteredCvs.length; i++) {
        const cv = this.filteredCvs[i];
        try {
          console.log(`Đang tải CV ${i + 1}/${this.filteredCvs.length}: ${cv.name} (${cv.id})`);
          
          // Sử dụng fetch trực tiếp với responseType blob để đảm bảo nhận được blob
          const fetchResponse = await fetch(`${environment.apis.default.url}/api/applications/${cv.id}/download-cv`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Accept': 'application/pdf, application/octet-stream, */*'
            }
          });
          
          if (!fetchResponse.ok) {
            const errorText = await fetchResponse.text();
            console.error(`✗ Failed to download CV for ${cv.name}: ${fetchResponse.status} - ${errorText}`);
            failedCount++;
            continue;
          }
          
          // Kiểm tra content-type để đảm bảo là PDF
          const contentType = fetchResponse.headers.get('content-type');
          console.log(`  Content-Type: ${contentType}`);
          
          const cvBlob = await fetchResponse.blob();
          
          // Kiểm tra blob có hợp lệ không
          if (!cvBlob || cvBlob.size === 0) {
            console.warn(`✗ CV của ${cv.name} rỗng hoặc không hợp lệ (size: ${cvBlob?.size || 0})`);
            failedCount++;
            continue;
          }
          
          // Kiểm tra xem có phải là PDF không (có thể là error message dạng JSON)
          if (cvBlob.type === 'application/json' || cvBlob.size < 100) {
            const text = await cvBlob.text();
            try {
              const json = JSON.parse(text);
              if (json.error || json.message) {
                console.error(`✗ API trả về lỗi cho ${cv.name}: ${json.error || json.message}`);
                failedCount++;
                continue;
              }
            } catch {
              // Không phải JSON, có thể là PDF nhỏ
            }
          }
          
          const fileName = `${cv.name.replace(/[^a-zA-Z0-9]/g, '_')}_${cv.id.substring(0, 8)}.pdf`;
          cvFiles.push({ name: fileName, blob: cvBlob });
          successCount++;
          console.log(`✓ Đã tải CV ${i + 1}/${this.filteredCvs.length}: ${cv.name} (${cvBlob.size} bytes, type: ${cvBlob.type})`);
        } catch (error: any) {
          console.error(`✗ Lỗi khi tải CV cho ${cv.name} (${cv.id}):`, error);
          if (error?.error?.message) {
            console.error(`  Chi tiết lỗi: ${error.error.message}`);
          } else if (error?.message) {
            console.error(`  Chi tiết lỗi: ${error.message}`);
          }
          failedCount++;
        }
      }

      console.log(`Hoàn thành: ${successCount} thành công, ${failedCount} thất bại`);

      // Tạo ZIP file chứa Excel + PDFs
      const zip = new JSZip();
      
      // Thêm Excel file
      zip.file('Danh_sach_ung_vien.xlsx', excelBuffer);
      
      // Thêm thư mục CVs và các file PDF
      const cvFolder = zip.folder('CVs');
      cvFiles.forEach(file => {
        cvFolder?.file(file.name, file.blob);
      });

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Download ZIP file
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.download = `Danh_sach_ung_vien_${timestamp}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      this.exporting = false;
      
      if (successCount > 0) {
        const message = failedCount > 0
          ? `Xuất Excel thành công! Đã tải ${successCount}/${this.filteredCvs.length} CV PDF. ${failedCount} CV không tải được.`
          : `Xuất Excel thành công! Đã tải ${successCount}/${this.filteredCvs.length} CV PDF.`;
        this.showToastMessage(message, successCount === this.filteredCvs.length ? 'success' : 'warning');
      } else {
        this.showToastMessage('Không thể tải CV nào. Vui lòng kiểm tra lại.', 'error');
      }
    } catch (error) {
      console.error('Error exporting CV list:', error);
      this.exporting = false;
      this.showToastMessage('Lỗi khi xuất Excel. Vui lòng thử lại.', 'error');
    }
  }

  private prepareExcelData(cvs: CandidateCv[]): any[][] {
    // Header row
    const headers = [
      'Ứng viên',
      'Chiến dịch',
      'Email',
      'Số điện thoại',
      'Công việc',
      'Ngày ứng tuyển',
      'Trạng thái',
      'Đánh giá',
      'Ghi chú',
      'Tên file CV PDF'
    ];

    const data: any[][] = [headers];

    // Data rows
    cvs.forEach(cv => {
      const row = [
        cv.name,
        cv.campaignName || cv.campaignId || '',
        cv.email,
        cv.phone,
        this.getJobName(cv),
        this.formatDate(cv.appliedDate),
        this.getStatusName(cv.status),
        cv.rating ? `${cv.rating}/10` : 'Chưa đánh giá',
        cv.notes || '',
        `CVs/${cv.name.replace(/[^a-zA-Z0-9]/g, '_')}_${cv.id.substring(0, 8)}.pdf`
      ];
      data.push(row);
    });

    return data;
  }

  viewCv(cvId: string): void {
    this.showActionsMenu = null;
    this.router.navigate(['/recruiter/cv-management-detail'], {
      queryParams: { cvId: cvId }
    });
  }

  editCv(cvId: string): void {
    // TODO: Navigate to edit CV page or open modal
    this.showActionsMenu = null;
    this.showToastMessage('Đang mở chỉnh sửa CV...', 'info');
  }

  deleteCv(cvId: string): void {
    // TODO: Implement delete functionality
    this.showActionsMenu = null;
    if (confirm('Bạn có chắc chắn muốn xóa CV này?')) {
      this.candidateCvs = this.candidateCvs.filter(cv => cv.id !== cvId);
      this.applyFilters();
      this.showToastMessage('Xóa CV thành công!', 'success');
    }
  }

  getStatusName(statusId: string): string {
    const status = this.statuses.find(s => s.id === statusId);
    return status ? status.name : statusId;
  }

  getStatusBadgeClass(statusId: string): string {
    switch (statusId) {
      case 'received':
        return 'status-received'; // Gray - CV tiếp nhận (mặc định)
      case 'suitable':
        return 'status-suitable'; // Orange - Phù hợp
      case 'interview':
        return 'status-interview'; // Purple - Hẹn phỏng vấn
      case 'offer':
        return 'status-offer'; // Blue - Gửi đề nghị
      case 'hired':
        return 'status-hired'; // Green - Nhận việc
      case 'not-suitable':
        return 'status-not-suitable'; // Red - Chưa phù hợp
      default:
        return 'status-default';
    }
  }

  getJobName(cv: CandidateCv): string {
    return cv.jobTitle || cv.campaignName || cv.campaignId || 'Không rõ công việc';
  }
  
  // Inline status change
  changingStatusFor: string | null = null;
  
  // Rating change
  changingRatingFor: string | null = null;
  
  onChangeStatus(cv: CandidateCv, newStatus: string): void {
    const oldStatus = cv.status;
    
    // Don't update if status hasn't changed
    if (oldStatus === newStatus) {
      return;
    }
    
    console.log(`Changing status for ${cv.name} from ${oldStatus} to ${newStatus}`);
    
    // Optimistic update - update UI immediately
    cv.status = newStatus;
    
    const updateDto: UpdateApplicationStatusDto = {
      status: newStatus,
      recruiterNotes: cv.notes,
      rating: cv.rating
    };
    
    this.changingStatusFor = cv.id;
    
    this.applicationService.updateApplicationStatus(cv.id, updateDto).subscribe({
      next: () => {
        this.showToastMessage(`Đã cập nhật trạng thái thành "${this.getStatusName(newStatus)}"`, 'success');
        this.changingStatusFor = null;
        
        // Send notification to candidate when status changes to 'offer'
        if (newStatus === 'offer') {
          console.log('[CV Management] Status changed to offer, preparing to send notification');
          console.log('[CV Management] CV data:', { 
            id: cv.id, 
            candidateId: cv.candidateId, 
            jobId: cv.jobId, 
            position: cv.position 
          });
          
          if (cv.candidateId) {
            this.sendOfferNotification(cv);
          } else {
            console.warn('[CV Management] Cannot send notification: candidateId is missing for CV:', cv.id);
          }
        }
        
        // Re-apply filters to ensure the CV appears/disappears based on current filter
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error updating status:', error);
        console.error('Error status:', error.status);
        
        let errorMessage = 'Không thể cập nhật trạng thái. Vui lòng thử lại.';
        
        if (error.status === 403) {
          errorMessage = 'Bạn không có quyền cập nhật trạng thái ứng viên này.';
        } else if (error.status === 401) {
          errorMessage = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
        }
        
        this.showToastMessage(errorMessage, 'error');
        this.changingStatusFor = null;
        
        // Revert to previous status on error
        cv.status = oldStatus;
      }
    });
  }

  onAiAnalyze(): void {
    // Placeholder for future AI integration
    this.showToastMessage('Tính năng AI phân tích đang được phát triển.', 'info');
  }

  // Rating methods
  getStarState(rating: number | undefined, starIndex: number): 'full' | 'half' | 'empty' {
    if (!rating) return 'empty';
    
    // Convert 1-10 scale to 1-5 scale (each star = 2 points)
    const starValue = starIndex * 2;
    const previousStarValue = (starIndex - 1) * 2;
    
    if (rating >= starValue) {
      return 'full';
    } else if (rating > previousStarValue && rating < starValue) {
      return 'half';
    }
    return 'empty';
  }

  onRateCandidate(cv: CandidateCv, rating: number): void {
    if (this.changingRatingFor === cv.id) return; // Prevent double click
    
    const oldRating = cv.rating;
    
    console.log(`Rating candidate ${cv.name} with ${rating}/10`);
    
    // Optimistic update
    cv.rating = rating;
    this.changingRatingFor = cv.id;
    
    const updateDto: UpdateApplicationStatusDto = {
      status: cv.status,
      recruiterNotes: cv.notes,
      rating: rating
    };
    
    this.applicationService.updateApplicationStatus(cv.id, updateDto).subscribe({
      next: () => {
        this.showToastMessage(`Đã đánh giá ứng viên ${rating}/10`, 'success');
        this.changingRatingFor = null;
      },
      error: (error) => {
        console.error('Error updating rating:', error);
        
        let errorMessage = 'Không thể cập nhật đánh giá. Vui lòng thử lại.';
        
        if (error.status === 403) {
          errorMessage = 'Bạn không có quyền đánh giá ứng viên này.';
        } else if (error.status === 401) {
          errorMessage = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
        }
        
        this.showToastMessage(errorMessage, 'error');
        this.changingRatingFor = null;
        
        // Revert to previous rating on error
        cv.rating = oldRating;
      }
    });
  }

  getInitials(name: string): string {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  showActionsMenu: string | null = null;
  private scrollListener?: () => void;
  private currentMenuCvId: string | null = null;
  private currentMenuButton: HTMLElement | null = null;

  // Note modal
  showNoteModal = false;
  selectedCvForNote: CandidateCv | null = null;
  noteText: string = '';

  toggleActionsMenu(cvId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    if (this.showActionsMenu === cvId) {
      this.closeActionsMenu();
    } else {
      this.closeActionsMenu();
      this.showActionsMenu = cvId;
      this.currentMenuCvId = cvId;
      if (event) {
        const button = (event.target as HTMLElement).closest('.actions-menu-btn') as HTMLElement;
        this.currentMenuButton = button || null;
      }
      setTimeout(() => {
        this.positionActionsMenu(cvId, event);
        this.setupScrollListener(cvId);
      }, 0);
    }
  }

  private closeActionsMenu(): void {
    this.showActionsMenu = null;
    this.currentMenuCvId = null;
    this.currentMenuButton = null;
    this.removeScrollListener();
  }

  private setupScrollListener(cvId: string): void {
    this.removeScrollListener();
    
    this.scrollListener = () => {
      if (this.showActionsMenu === cvId && this.currentMenuCvId === cvId) {
        this.updateMenuPosition(cvId);
      }
    };
    
    window.addEventListener('scroll', this.scrollListener, true);
    window.addEventListener('resize', this.scrollListener);
  }

  private removeScrollListener(): void {
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener, true);
      window.removeEventListener('resize', this.scrollListener);
      this.scrollListener = undefined;
    }
  }

  private getSidebarWidth(): number {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) return 0;
    
    const pageElement = document.querySelector('.cv-management-page');
    if (pageElement && pageElement.classList.contains('sidebar-expanded')) {
      return 280;
    }
    return 72;
  }

  private updateMenuPosition(cvId: string): void {
    const menu = document.querySelector(`.actions-menu[data-cv-id="${cvId}"]`) as HTMLElement;
    const button = this.currentMenuButton;
    
    if (!menu || !button) {
      // Retry after a short delay if menu not found
      if (!menu) {
        setTimeout(() => this.updateMenuPosition(cvId), 10);
      }
      return;
    }
    
    const rect = button.getBoundingClientRect();
    const menuWidth = menu.offsetWidth || 180;
    const sidebarWidth = this.getSidebarWidth();
    const viewportWidth = window.innerWidth;
    const padding = 8;
    
    // Position menu below button, aligned to right
    let left = rect.right - menuWidth;
    
    // Ensure menu doesn't go off left edge (consider sidebar)
    const minLeft = sidebarWidth + padding;
    if (left < minLeft) {
      left = Math.max(minLeft, rect.left);
    }
    
    // Ensure menu doesn't go off right edge
    const maxLeft = viewportWidth - menuWidth - padding;
    if (left > maxLeft) {
      left = maxLeft;
    }
    
    menu.style.top = `${rect.bottom + 4}px`;
    menu.style.left = `${left}px`;
  }

  private positionActionsMenu(cvId: string, event?: Event): void {
    // Use stored button reference if available, otherwise try to find from event
    if (!this.currentMenuButton && event) {
      const button = (event.target as HTMLElement).closest('.actions-menu-btn') as HTMLElement;
      this.currentMenuButton = button || null;
    }
    
    if (!this.currentMenuButton) return;
    
    this.updateMenuPosition(cvId);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.showActionsMenu) {
      const target = event.target as HTMLElement;
      if (!target.closest('.actions-menu-wrapper')) {
        this.closeActionsMenu();
      }
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  onAddNote(cv: CandidateCv): void {
    this.showActionsMenu = null;
    this.selectedCvForNote = cv;
    this.noteText = cv.notes || '';
    this.showNoteModal = true;
  }

  onCloseNoteModal(): void {
    this.showNoteModal = false;
    this.selectedCvForNote = null;
    this.noteText = '';
  }

  onConfirmNote(): void {
    if (!this.selectedCvForNote) return;
    
    const oldNotes = this.selectedCvForNote.notes;
    
    // Optimistic update - update UI immediately
    this.selectedCvForNote.notes = this.noteText;
    
    const updateDto: UpdateApplicationStatusDto = {
      status: this.selectedCvForNote.status,
      recruiterNotes: this.noteText,
      rating: this.selectedCvForNote.rating
    };
    
    this.applicationService.updateApplicationStatus(this.selectedCvForNote.id, updateDto).subscribe({
      next: () => {
        this.showToastMessage('Đã cập nhật ghi chú!', 'success');
        this.showNoteModal = false;
        this.selectedCvForNote = null;
        this.noteText = '';
      },
      error: (error) => {
        console.error('Error updating notes:', error);
        
        // Revert to previous notes on error
        this.selectedCvForNote.notes = oldNotes;
        
        let errorMessage = 'Không thể cập nhật ghi chú. Vui lòng thử lại.';
        
        if (error.status === 403) {
          errorMessage = 'Bạn không có quyền cập nhật ghi chú.';
        } else if (error.status === 401) {
          errorMessage = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
        }
        
        this.showToastMessage(errorMessage, 'error');
      }
    });
  }

  onDownloadCv(cv: CandidateCv): void {
    this.showActionsMenu = null;
    // TODO: Implement download CV functionality
    this.showToastMessage('Đang tải CV...', 'info');
    setTimeout(() => {
      this.showToastMessage('Tải CV thành công!', 'success');
    }, 1000);
  }

  onCopyCandidateCode(cv: CandidateCv): void {
    this.showActionsMenu = null;
    const code = cv.candidateCode || cv.id;
    // Copy to clipboard
    navigator.clipboard.writeText(code).then(() => {
      this.showToastMessage(`Đã sao chép mã ứng viên: ${code}`, 'success');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.showToastMessage(`Đã sao chép mã ứng viên: ${code}`, 'success');
    });
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  private sendOfferNotification(cv: CandidateCv): void {
    if (!cv.candidateId) {
      console.warn('[CV Management] Cannot send notification: candidateId is missing');
      return;
    }

    // Validate and convert candidateId to Guid
    let candidateGuid: string;
    try {
      // Try to parse as Guid, if it's already a valid Guid string, use it
      candidateGuid = cv.candidateId;
      // Validate Guid format
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(candidateGuid)) {
        console.error('[CV Management] Invalid candidateId format (not a Guid):', cv.candidateId);
        return;
      }
    } catch (error) {
      console.error('[CV Management] Error parsing candidateId:', error);
      return;
    }

    // Prepare notification metadata
    const metadata = {
      JobTitle: cv.position || 'Công việc',
      CompanyName: '', // TODO: Get company name from current user context
      JobId: cv.jobId || '',
      ApplicationId: cv.id
    };

    // Convert jobId to Guid if provided, otherwise null
    let relatedEntityId: string | null = null;
    if (cv.jobId) {
      try {
        // Validate Guid format
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cv.jobId)) {
          relatedEntityId = cv.jobId;
        } else {
          console.warn('[CV Management] Invalid jobId format (not a Guid):', cv.jobId);
        }
      } catch (error) {
        console.warn('[CV Management] Error parsing jobId:', error);
      }
    }

    const notification = {
      userId: candidateGuid,
      userRole: 'Candidate',
      notificationType: 'JobOffer',
      title: 'Đề nghị công việc',
      // Message removed per request to avoid duplicate/verbose text
      message: '',
      relatedEntityType: 'JobPost',
      relatedEntityId: relatedEntityId,
      metadata: JSON.stringify(metadata)
    };

    console.log('[CV Management] Sending notification:', notification);

    this.notificationService.createNotification(notification).subscribe({
      next: (result) => {
        console.log('[CV Management] Notification sent successfully to candidate:', cv.candidateId, result);
      },
      error: (error) => {
        console.error('[CV Management] Error sending notification:', error);
        console.error('[CV Management] Error details:', error.error, error.status, error.statusText);
        // Don't show error to user as status update was successful
      }
    });
  }

  private showToastMessage(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  onToastClose(): void {
    this.showToast = false;
  }
  
  onAiAnalyzeCandidate(cv: CandidateCv): void {
    this.showActionsMenu = null;
    const name = cv.name || 'ứng viên';
    this.showToastMessage(`AI đang phân tích hồ sơ của ${name} (placeholder).`, 'info');
  }
}