import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastNotificationComponent, StatusDropdownComponent, StatusOption, GenericModalComponent, PaginationComponent } from '../../../../shared/components';
import { SidebarSyncService } from '../../../../core/services/sidebar-sync.service';
import { ApplicationService } from '../../../../proxy/http-api/controllers/application.service';
import type { ApplicationDto, GetApplicationListDto } from '../../../../proxy/dto/applications/models';

export interface CandidateCV {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  appliedDate: string;
  status: 'suitable' | 'reviewing' | 'rejected';
  notes?: string;
}

@Component({
  selector: 'app-campaign-job-management-view-cv',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastNotificationComponent, StatusDropdownComponent, GenericModalComponent, PaginationComponent],
  templateUrl: './campaign-job-management-view-cv.html',
  styleUrls: ['./campaign-job-management-view-cv.scss']
})
export class CampaignJobManagementViewCvComponent implements OnInit, OnDestroy {
  private readonly componentId = 'campaign-job-management-view-cv';
  
  campaignId: string | null = null;
  jobId: string | null = null;
  campaignName: string = '';
  jobTitle: string = '';
  
  // Sidebar state
  sidebarExpanded: boolean = false;
  sidebarWidth = 72;
  private sidebarObserver?: ResizeObserver;
  private resizeListener?: () => void;
  
  // CV list
  cvs: CandidateCV[] = [];
  filteredCvs: CandidateCV[] = [];
  paginatedCvs: CandidateCV[] = [];
  searchQuery: string = '';
  selectedStatus: string = 'all';
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 7;
  totalPages: number = 1;
  
  // UI state
  showActionsMenu: string | null = null;
  showNotesModal = false;
  selectedCV: CandidateCV | null = null;
  notesText: string = '';
  
  // Status options
  statusOptions: StatusOption[] = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'suitable', label: 'Phù hợp' },
    { value: 'reviewing', label: 'Đang xem xét' },
    { value: 'rejected', label: 'Từ chối' }
  ];
  
  // Date Range Picker
  showDateRangeDropdown = false;
  selectedTimeRange = '';
  timeRanges = [
    { id: 'all', name: 'Tất cả thời gian' },
    { id: 'today', name: 'Hôm nay' },
    { id: 'week', name: 'Tuần này' },
    { id: 'month', name: 'Tháng này' },
    { id: 'year', name: 'Năm nay' }
  ];
  dateRange = {
    startDate: null as Date | null,
    endDate: null as Date | null
  };
  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();
  nextCalendarMonth = new Date().getMonth() + 1;
  nextCalendarYear = new Date().getFullYear();
  weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  calendarDays: any[] = [];
  nextCalendarDays: any[] = [];
  tempStartDate: Date | null = null;
  tempEndDate: Date | null = null;
  
  // Toast notification
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private sidebarSync: SidebarSyncService,
    private applicationService: ApplicationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Setup sidebar sync
    this.sidebarSync.setupSync(
      '.campaign-job-management-view-cv-page',
      '.breadcrumb-box',
      this.componentId
    );

    // Setup sidebar width tracking
    this.setupSidebarTracking();

    // Get campaign ID, job ID from query params rồi load data thực từ API
    this.route.queryParams.subscribe(params => {
      this.campaignId = params['campaignId'] || null;
      this.jobId = params['jobId'] || null;
      this.campaignName = params['campaignName'] || 'Chiến dịch tuyển dụng';
      this.jobTitle = params['jobTitle'] || 'Công việc';

      this.loadCVs();
    });
  }

  ngOnDestroy(): void {
    this.sidebarSync.cleanup(this.componentId);
    this.cleanupSidebarTracking();
  }

  // ==================== SIDEBAR METHODS ====================
  
  setupSidebarTracking(): void {
    const trySetup = (attempts = 0) => {
      const sidebar = document.querySelector('app-sidebar .sidebar') as HTMLElement;
      
      if (sidebar) {
        this.checkSidebarState(sidebar);
        
        this.sidebarObserver = new ResizeObserver(() => {
          this.checkSidebarState(sidebar);
        });
        
        this.sidebarObserver.observe(sidebar);
        
        this.resizeListener = () => {
          this.checkSidebarState(sidebar);
          this.cdr.markForCheck();
        };
        window.addEventListener('resize', this.resizeListener);
      } else if (attempts < 10) {
        setTimeout(() => trySetup(attempts + 1), 100);
      }
    };
    
    trySetup();
  }

  cleanupSidebarTracking(): void {
    if (this.sidebarObserver) {
      this.sidebarObserver.disconnect();
    }
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  checkSidebarState(sidebar: HTMLElement): void {
    const rect = sidebar.getBoundingClientRect();
    const width = Math.round(rect.width);
    if (this.sidebarWidth !== width) {
      this.sidebarWidth = width;
      this.sidebarExpanded = sidebar.classList.contains('show') || width > 100;
      this.cdr.markForCheck();
    }
  }

  getContentPaddingLeft(): string {
    const viewportWidth = window.innerWidth;
    if (viewportWidth <= 768) {
      return '0';
    }
    return `${this.sidebarWidth}px`;
  }

  getContentWidth(): string {
    const viewportWidth = window.innerWidth;
    if (viewportWidth <= 768) {
      return '100%';
    }
    return `calc(100% - ${this.sidebarWidth}px)`;
  }

  getContentMaxWidth(): string {
    const viewportWidth = window.innerWidth;
    if (viewportWidth <= 768) {
      return 'calc(100vw - 32px)';
    }
    const sidePadding = 48;
    const availableWidth = viewportWidth - this.sidebarWidth - sidePadding;
    const maxContentWidth = Math.min(1400, Math.max(900, availableWidth));
    return `${maxContentWidth}px`;
  }

  getBreadcrumbLeft(): string {
    const viewportWidth = window.innerWidth;
    if (viewportWidth <= 768) {
      return '0';
    }
    return `${this.sidebarWidth}px`;
  }

  getBreadcrumbWidth(): string {
    const viewportWidth = window.innerWidth;
    if (viewportWidth <= 768) {
      return '100%';
    }
    return `calc(100% - ${this.sidebarWidth}px)`;
  }

  getWindowWidth(): number {
    return window.innerWidth;
  }

  loadCVs(): void {
    if (!this.jobId) {
      this.cvs = [];
      this.filteredCvs = [];
      this.paginatedCvs = [];
      return;
    }

    const input: GetApplicationListDto = {
      jobId: this.jobId,
      recruitmentCampaignId: this.campaignId || undefined,
      skipCount: 0,
      maxResultCount: 1000,
      sorting: 'creationTime DESC'
    };

    this.applicationService.getJobApplications(this.jobId, input).subscribe({
      next: (response) => {
        const paged = response;
        let applications: ApplicationDto[] = paged?.items || [];

        // Phòng trường hợp backend không filter theo campaign, tự filter thêm ở frontend
        if (this.campaignId) {
          applications = applications.filter(
            app => app.recruitmentCampaignId === this.campaignId
          );
        }

        this.cvs = this.mapApplicationsToCvs(applications);
        this.filteredCvs = [...this.cvs];
        this.generateCalendar();
        this.generateNextCalendar();
        this.updatePagination();
      },
      error: (error) => {
        console.error('Error loading job applications for campaign detail:', error);
        this.cvs = [];
        this.filteredCvs = [];
        this.paginatedCvs = [];
      }
    });
  }

  private mapApplicationsToCvs(applications: ApplicationDto[]): CandidateCV[] {
    return (applications || []).map(app => {
      const status = (app.status || '').toLowerCase().trim();
      let mappedStatus: CandidateCV['status'] = 'reviewing';

      if (['accepted', 'hired'].includes(status)) {
        mappedStatus = 'suitable';
      } else if (['rejected', 'withdrawn', 'not-suitable'].includes(status)) {
        mappedStatus = 'rejected';
      } else {
        mappedStatus = 'reviewing';
      }

      const appliedDateIso = app.creationTime
        ? new Date(app.creationTime as string).toISOString()
        : new Date().toISOString();

      return {
        id: app.id || '',
        fullName: app.candidateName || 'Ứng viên ẩn danh',
        email: app.candidateEmail || 'N/A',
        phone: app.candidatePhone || 'N/A',
        appliedDate: appliedDateIso,
        status: mappedStatus,
        notes: app.recruiterNotes || ''
      };
    });
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.currentPage = 1; // Reset to first page when searching
    this.filterCVs();
  }

  onStatusChange(status: string): void {
    this.selectedStatus = status;
    this.currentPage = 1; // Reset to first page when filtering
    this.filterCVs();
  }

  filterCVs(): void {
    this.filteredCvs = this.cvs.filter(cv => {
      const matchesSearch = !this.searchQuery || 
        cv.fullName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        cv.email.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        cv.phone.includes(this.searchQuery);
      
      const matchesStatus = this.selectedStatus === 'all' || cv.status === this.selectedStatus;
      
      // Filter by date range
      let matchesDateRange = true;
      if (this.dateRange.startDate || this.dateRange.endDate) {
        const appliedDate = new Date(cv.appliedDate);
        if (this.dateRange.startDate && appliedDate < this.dateRange.startDate) {
          matchesDateRange = false;
        }
        if (this.dateRange.endDate) {
          const endDate = new Date(this.dateRange.endDate);
          endDate.setHours(23, 59, 59, 999); // Include the entire end date
          if (appliedDate > endDate) {
            matchesDateRange = false;
          }
        }
      }
      
      return matchesSearch && matchesStatus && matchesDateRange;
    });
    
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredCvs.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedCvs = this.filteredCvs.slice(startIndex, endIndex);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updatePagination();
  }

  getStatusLabel(status: CandidateCV['status']): string {
    switch (status) {
      case 'suitable':
        return 'Phù hợp';
      case 'reviewing':
        return 'Đang xem xét';
      case 'rejected':
        return 'Từ chối';
      default:
        return status;
    }
  }

  getStatusClass(status: CandidateCV['status']): string {
    switch (status) {
      case 'suitable':
        return 'status-suitable';
      case 'reviewing':
        return 'status-reviewing';
      case 'rejected':
        return 'status-rejected';
      default:
        return '';
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

  toggleActionsMenu(cvId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    if (this.showActionsMenu === cvId) {
      this.showActionsMenu = null;
    } else {
      this.showActionsMenu = cvId;
    }
  }

  onViewCV(cv: CandidateCV): void {
    // Navigate to CV detail page with return URL
    const currentUrl = this.router.url;
    this.router.navigate(['/recruiter/cv-management-detail'], {
      queryParams: { 
        cvId: cv.id, 
        campaignId: this.campaignId,
        jobId: this.jobId,
        returnUrl: currentUrl
      }
    });
    this.showActionsMenu = null;
  }

  onViewNotes(cv: CandidateCV): void {
    this.selectedCV = cv;
    this.notesText = cv.notes || '';
    this.showNotesModal = true;
    this.showActionsMenu = null;
  }

  closeNotesModal(): void {
    this.showNotesModal = false;
    this.selectedCV = null;
    this.notesText = '';
  }

  saveNotes(): void {
    if (this.selectedCV) {
      this.selectedCV.notes = this.notesText;
      // TODO: Call API to save notes
      this.showSuccessToast('Đã lưu ghi chú thành công');
      this.closeNotesModal();
    }
  }

  onBack(): void {
    this.router.navigate(['/recruiter/campaign-job-management'], {
      queryParams: { campaignId: this.campaignId, campaignName: this.campaignName }
    });
  }

  // Date Range Picker Methods
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    
    // Close date range dropdown if clicking outside
    if (!target.closest('.filter-dropdown-wrapper')) {
      this.showDateRangeDropdown = false;
    }
    
    // Close actions menu if clicking outside
    if (!target.closest('.actions-menu-container')) {
      this.showActionsMenu = null;
    }
  }

  toggleDateRangeDropdown(): void {
    this.showDateRangeDropdown = !this.showDateRangeDropdown;
    if (this.showDateRangeDropdown) {
      this.tempStartDate = this.dateRange.startDate ? new Date(this.dateRange.startDate) : null;
      this.tempEndDate = this.dateRange.endDate ? new Date(this.dateRange.endDate) : null;
      if (this.tempStartDate) {
        this.currentMonth = this.tempStartDate.getMonth();
        this.currentYear = this.tempStartDate.getFullYear();
      } else {
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
      }
      if (this.currentMonth === 11) {
        this.nextCalendarMonth = 0;
        this.nextCalendarYear = this.currentYear + 1;
      } else {
        this.nextCalendarMonth = this.currentMonth + 1;
        this.nextCalendarYear = this.currentYear;
      }
      this.generateCalendar();
      this.generateNextCalendar();
    }
  }

  clearDateRangeFilter(): void {
    this.selectedTimeRange = '';
    this.dateRange.startDate = null;
    this.dateRange.endDate = null;
    this.tempStartDate = null;
    this.tempEndDate = null;
    this.generateCalendar();
    this.generateNextCalendar();
    this.filterCVs();
  }

  selectTimeRange(timeRangeId: string): void {
    this.selectedTimeRange = timeRangeId;
    const today = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    
    switch (timeRangeId) {
      case 'all':
        startDate = null;
        endDate = null;
        break;
      case 'today':
        startDate = new Date(today);
        endDate = new Date(today);
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        startDate = weekStart;
        endDate = new Date(today);
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today);
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today);
        break;
    }
    
    this.tempStartDate = startDate ? new Date(startDate) : null;
    this.tempEndDate = endDate ? new Date(endDate) : null;
    
    if (startDate) {
      this.currentMonth = startDate.getMonth();
      this.currentYear = startDate.getFullYear();
      if (this.currentMonth === 11) {
        this.nextCalendarMonth = 0;
        this.nextCalendarYear = this.currentYear + 1;
      } else {
        this.nextCalendarMonth = this.currentMonth + 1;
        this.nextCalendarYear = this.currentYear;
      }
    }
    this.generateCalendar();
    this.generateNextCalendar();
  }

  generateCalendar(): void {
    this.calendarDays = [];
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      this.calendarDays.push({ date: '', disabled: true });
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(this.currentYear, this.currentMonth, day);
      this.calendarDays.push({
        date: day,
        fullDate: date,
        disabled: false
      });
    }
  }

  generateNextCalendar(): void {
    this.nextCalendarDays = [];
    const firstDay = new Date(this.nextCalendarYear, this.nextCalendarMonth, 1);
    const lastDay = new Date(this.nextCalendarYear, this.nextCalendarMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      this.nextCalendarDays.push({ date: '', disabled: true });
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(this.nextCalendarYear, this.nextCalendarMonth, day);
      this.nextCalendarDays.push({
        date: day,
        fullDate: date,
        disabled: false
      });
    }
  }

  getCurrentMonthYear(): string {
    const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
                    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    return `${months[this.currentMonth]} ${this.currentYear}`;
  }

  getNextMonthYear(): string {
    const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
                    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    return `${months[this.nextCalendarMonth]} ${this.nextCalendarYear}`;
  }

  previousMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    
    if (this.currentMonth === 11) {
      this.nextCalendarMonth = 0;
      this.nextCalendarYear = this.currentYear + 1;
    } else {
      this.nextCalendarMonth = this.currentMonth + 1;
      this.nextCalendarYear = this.currentYear;
    }
    
    this.generateCalendar();
    this.generateNextCalendar();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    
    if (this.currentMonth === 11) {
      this.nextCalendarMonth = 0;
      this.nextCalendarYear = this.currentYear + 1;
    } else {
      this.nextCalendarMonth = this.currentMonth + 1;
      this.nextCalendarYear = this.currentYear;
    }
    
    this.generateCalendar();
    this.generateNextCalendar();
  }

  nextNextMonth(): void {
    if (this.nextCalendarMonth === 11) {
      this.nextCalendarMonth = 0;
      this.nextCalendarYear++;
    } else {
      this.nextCalendarMonth++;
    }
    if (this.nextCalendarMonth === 0) {
      this.currentMonth = 11;
      this.currentYear = this.nextCalendarYear - 1;
    } else {
      this.currentMonth = this.nextCalendarMonth - 1;
      this.currentYear = this.nextCalendarYear;
    }
    this.generateCalendar();
    this.generateNextCalendar();
  }

  selectDate(day: any): void {
    if (day.disabled || !day.fullDate) return;
    
    this.selectedTimeRange = '';
    
    if (!this.tempStartDate || (this.tempStartDate && this.tempEndDate)) {
      this.tempStartDate = day.fullDate;
      this.tempEndDate = null;
    } else {
      if (day.fullDate < this.tempStartDate!) {
        this.tempEndDate = this.tempStartDate;
        this.tempStartDate = day.fullDate;
      } else {
        this.tempEndDate = day.fullDate;
      }
    }
    this.generateCalendar();
    this.generateNextCalendar();
  }

  isDateSelected(day: any): boolean {
    if (!day.fullDate) return false;
    const date = day.fullDate;
    return (this.tempStartDate && this.isSameDay(date, this.tempStartDate)) ||
           (this.tempEndDate && this.isSameDay(date, this.tempEndDate));
  }

  isDateInRange(day: any): boolean {
    if (!day.fullDate || !this.tempStartDate || !this.tempEndDate) return false;
    const date = day.fullDate;
    return date >= this.tempStartDate && date <= this.tempEndDate;
  }

  isStartDate(day: any): boolean {
    if (!day.fullDate || !this.tempStartDate) return false;
    return this.isSameDay(day.fullDate, this.tempStartDate);
  }

  isEndDate(day: any): boolean {
    if (!day.fullDate || !this.tempEndDate) return false;
    return this.isSameDay(day.fullDate, this.tempEndDate);
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  applyDateRange(): void {
    this.dateRange.startDate = this.tempStartDate;
    this.dateRange.endDate = this.tempEndDate;
    this.showDateRangeDropdown = false;
    this.filterCVs();
  }

  cancelDateRange(): void {
    this.tempStartDate = this.dateRange.startDate ? new Date(this.dateRange.startDate) : null;
    this.tempEndDate = this.dateRange.endDate ? new Date(this.dateRange.endDate) : null;
    this.showDateRangeDropdown = false;
    this.generateCalendar();
    this.generateNextCalendar();
  }

  getSelectedDateRangeName(): string {
    if (this.dateRange.startDate && this.dateRange.endDate) {
      const start = this.formatDateRange(this.dateRange.startDate);
      const end = this.formatDateRange(this.dateRange.endDate);
      return `${start} - ${end}`;
    }
    const timeRange = this.timeRanges.find(t => t.id === this.selectedTimeRange);
    return timeRange ? timeRange.name : 'Tất cả thời gian';
  }

  isTimeRangeSelected(timeRangeId: string): boolean {
    if (this.selectedTimeRange === timeRangeId) {
      return true;
    }
    const today = new Date();
    let matches = false;
    
    switch (timeRangeId) {
      case 'all':
        matches = !this.tempStartDate && !this.tempEndDate;
        break;
      case 'today':
        if (this.tempStartDate && this.tempEndDate) {
          matches = this.isSameDay(this.tempStartDate, today) && this.isSameDay(this.tempEndDate, today);
        }
        break;
      case 'week':
        if (this.tempStartDate && this.tempEndDate) {
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          matches = this.isSameDay(this.tempStartDate, weekStart) && this.isSameDay(this.tempEndDate, today);
        }
        break;
      case 'month':
        if (this.tempStartDate && this.tempEndDate) {
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          matches = this.isSameDay(this.tempStartDate, monthStart) && this.isSameDay(this.tempEndDate, today);
        }
        break;
      case 'year':
        if (this.tempStartDate && this.tempEndDate) {
          const yearStart = new Date(today.getFullYear(), 0, 1);
          matches = this.isSameDay(this.tempStartDate, yearStart) && this.isSameDay(this.tempEndDate, today);
        }
        break;
    }
    
    return matches;
  }

  formatDateRange(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  }

  showSuccessToast(message: string): void {
    this.toastMessage = message;
    this.toastType = 'success';
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  onToastClose(): void {
    this.showToast = false;
  }
}