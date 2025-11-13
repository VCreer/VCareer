import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PaginationComponent, ToastNotificationComponent } from '../../../../shared/components';

type JobStatus = 'pending' | 'approved' | 'rejected';

interface EmployeeJobPosting {
  id: string;
  title: string;
  position: string;
  status: JobStatus;
  createdDate: string;
  updatedDate: string;
  companyName: string;
  companyLogo?: string;
  location: string;
  experience: string;
  salary: string;
  keywords: string[];
  postedDate: string;
  campaignCode: string;
  description?: string;
  requirements?: string[];
  benefits?: string[];
  workLocation?: string[];
  rejectReason?: string;
}

interface JobSummaryCard {
  label: string;
  value: number;
  icon: string;
  borderColor: string;
}

@Component({
  selector: 'app-employee-job-management',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent, ToastNotificationComponent],
  templateUrl: './manage-recruitment-information.html',
  styleUrls: ['./manage-recruitment-information.scss'],
})
export class EmployeeJobManagementComponent implements OnInit, OnDestroy {
  sidebarExpanded = false;
  sidebarWidth = 0;
  private sidebarCheckInterval?: any;

  summaryCards: JobSummaryCard[] = [
    { label: 'Tổng số tin', value: 0, icon: 'fa fa-file-alt', borderColor: '#0F83BA' },
    { label: 'Chờ duyệt', value: 0, icon: 'fa fa-clock', borderColor: '#f59e0b' },
    { label: 'Đã duyệt', value: 0, icon: 'fa fa-check-circle', borderColor: '#10b981' },
    { label: 'Từ chối', value: 0, icon: 'fa fa-times-circle', borderColor: '#ef4444' },
  ];

  statusOptions = [
    { label: 'Tất cả trạng thái', value: 'all' },
    { label: 'Chờ duyệt', value: 'pending' },
    { label: 'Đã duyệt', value: 'approved' },
    { label: 'Từ chối', value: 'rejected' },
  ];
  selectedStatus = this.statusOptions[0];
  showStatusDropdown = false;
  searchTerm = '';

  jobPostings: EmployeeJobPosting[] = [
    { 
      id: 'JD-001', 
      title: 'FullStack Developer (NodeJS, ReactJS, Vue JS) - Sign On Bonus', 
      position: 'Fullstack Developer', 
      status: 'pending', 
      createdDate: '02/11/2025', 
      updatedDate: '02/11/2025',
      companyName: 'CÔNG TY TNHH AIRCLOSET ENGINEERING',
      companyLogo: 'airCloset',
      location: 'Hà Nội',
      experience: '4 năm',
      salary: 'Thoả thuận',
      keywords: ['Fullstack Developer', '4 năm kinh nghiệm', 'Đại học', 'NodeJS'],
      postedDate: 'Đăng 2 tuần trước',
      campaignCode: '#2366831',
      description: 'Chúng tôi đang tìm kiếm một FullStack Developer có kinh nghiệm để tham gia vào đội ngũ phát triển sản phẩm. Bạn sẽ làm việc với các công nghệ hiện đại như NodeJS, ReactJS, Vue JS để xây dựng các ứng dụng web chất lượng cao.',
      requirements: [
        'Tốt nghiệp Đại học chuyên ngành Công nghệ thông tin hoặc tương đương',
        'Có ít nhất 4 năm kinh nghiệm phát triển FullStack',
        'Thành thạo NodeJS, ReactJS, Vue JS',
        'Có kinh nghiệm với database (MongoDB, PostgreSQL)',
        'Kỹ năng làm việc nhóm tốt, tư duy logic'
      ],
      benefits: [
        'Mức lương cạnh tranh, thưởng theo hiệu suất',
        'Bảo hiểm đầy đủ theo quy định',
        'Môi trường làm việc trẻ trung, năng động',
        'Cơ hội phát triển nghề nghiệp',
        'Đào tạo và nâng cao kỹ năng'
      ],
      workLocation: [
        'Hà Nội: Tầng 5, Tòa nhà ABC, 123 Đường XYZ, Quận Cầu Giấy',
        'Làm việc từ xa: 2 ngày/tuần'
      ]
    },
    { 
      id: 'JD-002', 
      title: 'Lập Trình Frontend (AI & Data)', 
      position: 'Frontend Developer', 
      status: 'approved', 
      createdDate: '28/10/2025', 
      updatedDate: '01/11/2025',
      companyName: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ FOXAI',
      companyLogo: 'FOXAi',
      location: 'Hà Nội',
      experience: '2 năm',
      salary: '2.5 - 3.5 triệu',
      keywords: ['Frontend Developer', 'IT - Phần mềm', 'Công nghệ thông tin', 'React', 'Vue'],
      postedDate: 'Đăng 1 ngày trước',
      campaignCode: '#2366845'
    },
    { 
      id: 'JD-003', 
      title: 'Intern Game Developer - HTML5 (Children Educational Game)', 
      position: 'Game Developer', 
      status: 'approved', 
      createdDate: '24/10/2025', 
      updatedDate: '29/10/2025',
      companyName: 'CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ LIFESTYLE VIỆT NAM',
      companyLogo: 'LIFESTYLE',
      location: 'Hà Nội',
      experience: 'Không yêu cầu',
      salary: '12 - 18 triệu',
      keywords: ['Game Developer', 'Game', 'Giáo dục / Đào tạo', 'IT - Phần mềm', 'HTML5', 'JavaScript'],
      postedDate: 'Đăng 3 ngày trước',
      campaignCode: '#2366846'
    },
    { 
      id: 'JD-004', 
      title: 'Frontend Developer', 
      position: 'Frontend Developer', 
      status: 'pending', 
      createdDate: '23/10/2025', 
      updatedDate: '23/10/2025',
      companyName: 'CÔNG TY CỔ PHẦN JARVIS GLOBAL',
      companyLogo: 'Jarvis',
      location: 'Hà Nội',
      experience: '1 năm',
      salary: 'Thoả thuận',
      keywords: ['Frontend Developer', 'An ninh mạng', 'IT - Phần mềm', 'React', 'TypeScript', 'Vue'],
      postedDate: 'Đăng 1 tuần trước',
      campaignCode: '#2366847'
    },
    { 
      id: 'JD-005', 
      title: 'Chuyên viên Nhân sự tổng hợp', 
      position: 'HR Generalist', 
      status: 'approved', 
      createdDate: '21/10/2025', 
      updatedDate: '28/10/2025',
      companyName: 'CÔNG TY TNHH ABC',
      companyLogo: 'ABC',
      location: 'Hà Nội',
      experience: '3 năm',
      salary: '15 - 20 triệu',
      keywords: ['Nhân sự', 'HR', 'Quản trị nhân sự'],
      postedDate: 'Đăng 5 ngày trước',
      campaignCode: '#2366848'
    },
    { 
      id: 'JD-006', 
      title: 'Nhân viên Kinh doanh B2B', 
      position: 'Sales Executive', 
      status: 'pending', 
      createdDate: '18/10/2025', 
      updatedDate: '18/10/2025',
      companyName: 'CÔNG TY TNHH XYZ',
      companyLogo: 'XYZ',
      location: 'Hà Nội',
      experience: '2 năm',
      salary: 'Thoả thuận',
      keywords: ['Kinh doanh', 'Sales', 'B2B'],
      postedDate: 'Đăng 2 tuần trước',
      campaignCode: '#2366849'
    },
    { 
      id: 'JD-007', 
      title: 'Trưởng nhóm Marketing', 
      position: 'Marketing Lead', 
      status: 'approved', 
      createdDate: '16/10/2025', 
      updatedDate: '20/10/2025',
      companyName: 'CÔNG TY CỔ PHẦN DEF',
      companyLogo: 'DEF',
      location: 'Hà Nội',
      experience: '5 năm',
      salary: '25 - 35 triệu',
      keywords: ['Marketing', 'Digital Marketing', 'Quản lý'],
      postedDate: 'Đăng 1 tuần trước',
      campaignCode: '#2366850'
    },
    { 
      id: 'JD-008', 
      title: 'Nhân viên Hành chính văn phòng', 
      position: 'Office Admin', 
      status: 'rejected', 
      createdDate: '15/10/2025', 
      updatedDate: '17/10/2025',
      companyName: 'CÔNG TY TNHH GHI',
      companyLogo: 'GHI',
      location: 'Hà Nội',
      experience: '1 năm',
      salary: '8 - 12 triệu',
      keywords: ['Hành chính', 'Văn phòng', 'Admin'],
      postedDate: 'Đăng 3 tuần trước',
      campaignCode: '#2366851'
    },
    { 
      id: 'JD-009', 
      title: 'Kỹ sư Phần mềm .NET', 
      position: '.NET Developer', 
      status: 'pending', 
      createdDate: '13/10/2025', 
      updatedDate: '13/10/2025',
      companyName: 'CÔNG TY TNHH JKL',
      companyLogo: 'JKL',
      location: 'Hà Nội',
      experience: '3 năm',
      salary: '20 - 30 triệu',
      keywords: ['.NET', 'C#', 'Backend Developer'],
      postedDate: 'Đăng 4 ngày trước',
      campaignCode: '#2366852'
    },
    { 
      id: 'JD-010', 
      title: 'Nhân viên Thiết kế UI/UX', 
      position: 'UI/UX Designer', 
      status: 'approved', 
      createdDate: '10/10/2025', 
      updatedDate: '12/10/2025',
      companyName: 'CÔNG TY CỔ PHẦN MNO',
      companyLogo: 'MNO',
      location: 'Hà Nội',
      experience: '2 năm',
      salary: '15 - 25 triệu',
      keywords: ['UI/UX', 'Designer', 'Figma', 'Adobe XD'],
      postedDate: 'Đăng 6 ngày trước',
      campaignCode: '#2366853'
    },
    { 
      id: 'JD-011', 
      title: 'Chuyên viên Tuyển dụng', 
      position: 'Talent Acquisition', 
      status: 'approved', 
      createdDate: '08/10/2025', 
      updatedDate: '11/10/2025',
      companyName: 'CÔNG TY TNHH PQR',
      companyLogo: 'PQR',
      location: 'Hà Nội',
      experience: '2 năm',
      salary: '12 - 18 triệu',
      keywords: ['Tuyển dụng', 'Recruitment', 'HR'],
      postedDate: 'Đăng 1 tuần trước',
      campaignCode: '#2366854'
    },
    { 
      id: 'JD-012', 
      title: 'Nhân viên Chăm sóc khách hàng', 
      position: 'Customer Success', 
      status: 'rejected', 
      createdDate: '05/10/2025', 
      updatedDate: '07/10/2025',
      companyName: 'CÔNG TY TNHH STU',
      companyLogo: 'STU',
      location: 'Hà Nội',
      experience: '1 năm',
      salary: '10 - 15 triệu',
      keywords: ['Customer Service', 'Chăm sóc khách hàng'],
      postedDate: 'Đăng 3 tuần trước',
      campaignCode: '#2366855'
    },
    { 
      id: 'JD-013', 
      title: 'Kỹ sư QA Automation', 
      position: 'QA Automation Engineer', 
      status: 'pending', 
      createdDate: '03/10/2025', 
      updatedDate: '03/10/2025',
      companyName: 'CÔNG TY CỔ PHẦN VWX',
      companyLogo: 'VWX',
      location: 'Hà Nội',
      experience: '3 năm',
      salary: '18 - 28 triệu',
      keywords: ['QA', 'Automation', 'Testing', 'Selenium'],
      postedDate: 'Đăng 5 ngày trước',
      campaignCode: '#2366856'
    },
    { 
      id: 'JD-014', 
      title: 'Nhân viên Phát triển kinh doanh', 
      position: 'Business Development', 
      status: 'approved', 
      createdDate: '01/10/2025', 
      updatedDate: '04/10/2025',
      companyName: 'CÔNG TY TNHH YZA',
      companyLogo: 'YZA',
      location: 'Hà Nội',
      experience: '2 năm',
      salary: 'Thoả thuận',
      keywords: ['Business Development', 'Kinh doanh', 'Sales'],
      postedDate: 'Đăng 2 tuần trước',
      campaignCode: '#2366857'
    },
  ];

  filteredPostings: EmployeeJobPosting[] = [];
  paginatedPostings: EmployeeJobPosting[] = [];
  itemsPerPage = 7;
  currentPage = 1;
  totalPages = 0;
  totalItems = 0;
  selectedJob: EmployeeJobPosting | null = null;
  showRejectModal = false;
  rejectReason = '';
  hoveredJobId: string | null = null;
  showViewRejectReasonModal = false;
  editingRejectReason = false;
  viewingRejectReasonJob: EmployeeJobPosting | null = null;
  
  // Toast notification properties
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.checkSidebarState();
    this.sidebarCheckInterval = setInterval(() => {
      this.checkSidebarState();
    }, 100);

    this.updateFilteredPostings();
    this.updateSummaryCounts();
  }

  ngOnDestroy(): void {
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
  }

  private checkSidebarState(): void {
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    if (sidebar) {
      this.sidebarExpanded = sidebar.classList.contains('show');
      const rect = sidebar.getBoundingClientRect();
      this.sidebarWidth = rect.width;
    } else {
      this.sidebarWidth = 0;
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.checkSidebarState();
  }

  getModalPaddingLeft(): string {
    if (window.innerWidth <= 768) {
      return '0';
    }
    return `${this.sidebarWidth}px`;
  }

  getModalMaxWidth(): string {
    const viewportWidth = window.innerWidth;
    if (viewportWidth <= 768) {
      return 'calc(100% - 40px)';
    }
    const overlayPadding = 40;
    const availableWidth = viewportWidth - this.sidebarWidth - overlayPadding;
    return `${Math.min(500, availableWidth)}px`;
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.currentPage = 1;
    this.updateFilteredPostings();
  }

  toggleStatusDropdown(): void {
    this.showStatusDropdown = !this.showStatusDropdown;
  }

  selectStatus(option: { label: string; value: string }): void {
    this.selectedStatus = option;
    this.showStatusDropdown = false;
    this.currentPage = 1;
    this.updateFilteredPostings();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updatePaginatedPostings();
  }

  getStatusBadgeClass(status: JobStatus): string {
    return `status-badge ${status}`;
  }

  getStatusLabel(status: JobStatus): string {
    switch (status) {
      case 'pending':
        return 'Chờ duyệt';
      case 'approved':
        return 'Đã duyệt';
      case 'rejected':
        return 'Từ chối';
      default:
        return status;
    }
  }

  getCompanyLogoUrl(logoOrName: string): string {
    // Try to get logo image, fallback to placeholder
    const logoMap: { [key: string]: string } = {
      'airCloset': 'assets/images/companies/aircloset.png',
      'FOXAi': 'assets/images/companies/foxai.png',
      'LIFESTYLE': 'assets/images/companies/lifestyle.png',
      'Jarvis': 'assets/images/companies/jarvis.png',
    };
    
    if (logoMap[logoOrName]) {
      return logoMap[logoOrName];
    }
    
    // Generate SVG with first letter as fallback
    const firstLetter = logoOrName.charAt(0).toUpperCase();
    const svg = `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="80" fill="#F3F4F6" rx="8"/><text x="50%" y="50%" font-size="24" font-weight="700" fill="#6B7280" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif">${firstLetter}</text></svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  private updateFilteredPostings(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredPostings = this.jobPostings.filter((posting) => {
      const matchesSearch =
        !term ||
        posting.title.toLowerCase().includes(term) ||
        posting.position.toLowerCase().includes(term) ||
        posting.id.toLowerCase().includes(term) ||
        posting.companyName.toLowerCase().includes(term) ||
        posting.keywords.some(k => k.toLowerCase().includes(term));

      const matchesStatus =
        this.selectedStatus.value === 'all' ||
        posting.status === this.selectedStatus.value;

      return matchesSearch && matchesStatus;
    });

    this.totalItems = this.filteredPostings.length;
    this.totalPages = Math.max(1, Math.ceil(this.totalItems / this.itemsPerPage));
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    this.updatePaginatedPostings();
    this.updateSummaryCounts();
  }

  private updateSummaryCounts(): void {
    const total = this.jobPostings.length;
    const pending = this.jobPostings.filter(p => p.status === 'pending').length;
    const approved = this.jobPostings.filter(p => p.status === 'approved').length;
    const rejected = this.jobPostings.filter(p => p.status === 'rejected').length;

    this.summaryCards[0].value = total;
    this.summaryCards[1].value = pending;
    this.summaryCards[2].value = approved;
    this.summaryCards[3].value = rejected;
  }

  private updatePaginatedPostings(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedPostings = this.filteredPostings.slice(
      startIndex,
      startIndex + this.itemsPerPage
    );
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.status-dropdown-wrapper')) {
      this.showStatusDropdown = false;
    }
  }

  onJobItemClick(posting: EmployeeJobPosting): void {
    this.selectedJob = posting;
  }

  onCloseDetail(): void {
    this.selectedJob = null;
  }

  onApprove(): void {
    if (this.selectedJob) {
      this.selectedJob.status = 'approved';
      this.selectedJob.updatedDate = new Date().toLocaleDateString('vi-VN');
      // Update in main array
      const index = this.jobPostings.findIndex(j => j.id === this.selectedJob!.id);
      if (index > -1) {
        this.jobPostings[index].status = 'approved';
        this.jobPostings[index].updatedDate = this.selectedJob.updatedDate;
      }
      this.updateFilteredPostings();
      this.updateSummaryCounts();
      this.showSuccessToast('Đã duyệt tin tuyển dụng thành công');
    }
  }

  onReject(): void {
    this.showRejectModal = true;
    this.rejectReason = this.selectedJob?.rejectReason || '';
  }

  onCloseRejectModal(): void {
    this.showRejectModal = false;
    this.rejectReason = '';
  }

  onSubmitReject(): void {
    if (this.selectedJob && this.rejectReason.trim()) {
      this.selectedJob.status = 'rejected';
      this.selectedJob.rejectReason = this.rejectReason.trim();
      this.selectedJob.updatedDate = new Date().toLocaleDateString('vi-VN');
      // Update in main array
      const index = this.jobPostings.findIndex(j => j.id === this.selectedJob!.id);
      if (index > -1) {
        this.jobPostings[index].status = 'rejected';
        this.jobPostings[index].rejectReason = this.rejectReason.trim();
        this.jobPostings[index].updatedDate = this.selectedJob.updatedDate;
      }
      this.updateFilteredPostings();
      this.updateSummaryCounts();
      this.onCloseRejectModal();
      this.showSuccessToast('Đã từ chối tin tuyển dụng thành công');
    } else {
      this.showErrorToast('Vui lòng nhập lý do từ chối');
    }
  }

  onJobItemMouseEnter(jobId: string): void {
    this.hoveredJobId = jobId;
  }

  onJobItemMouseLeave(): void {
    this.hoveredJobId = null;
  }

  onViewRejectReason(posting: EmployeeJobPosting): void {
    this.viewingRejectReasonJob = posting;
    this.showViewRejectReasonModal = true;
    this.editingRejectReason = false;
    this.rejectReason = posting.rejectReason || '';
  }

  onCloseViewRejectReasonModal(): void {
    this.showViewRejectReasonModal = false;
    this.editingRejectReason = false;
    this.rejectReason = '';
    this.viewingRejectReasonJob = null;
  }

  onEditRejectReason(): void {
    this.editingRejectReason = true;
  }

  onSaveRejectReason(): void {
    if (this.viewingRejectReasonJob && this.rejectReason.trim()) {
      this.viewingRejectReasonJob.rejectReason = this.rejectReason.trim();
      // Update in main array
      const index = this.jobPostings.findIndex(j => j.id === this.viewingRejectReasonJob!.id);
      if (index > -1) {
        this.jobPostings[index].rejectReason = this.rejectReason.trim();
      }
      // Update in filtered array if exists
      const filteredIndex = this.filteredPostings.findIndex(j => j.id === this.viewingRejectReasonJob!.id);
      if (filteredIndex > -1) {
        this.filteredPostings[filteredIndex].rejectReason = this.rejectReason.trim();
      }
      // Update selectedJob if it's the same job
      if (this.selectedJob && this.selectedJob.id === this.viewingRejectReasonJob.id) {
        this.selectedJob.rejectReason = this.rejectReason.trim();
      }
      this.editingRejectReason = false;
      this.showSuccessToast('Đã cập nhật lý do từ chối thành công');
    } else {
      this.showErrorToast('Vui lòng nhập lý do từ chối');
    }
  }

  showSuccessToast(message: string): void {
    this.toastMessage = message;
    this.toastType = 'success';
    this.showToast = true;
  }

  showErrorToast(message: string): void {
    this.toastMessage = message;
    this.toastType = 'error';
    this.showToast = true;
  }

  onToastClose(): void {
    this.showToast = false;
  }

  onCancelEditRejectReason(): void {
    this.editingRejectReason = false;
    this.rejectReason = this.viewingRejectReasonJob?.rejectReason || '';
  }

  viewDetail(posting: EmployeeJobPosting): void {
    this.router.navigate(['/employee/manage-recruitment-information-detail'], {
      queryParams: { id: posting.id }
    });
  }
}
