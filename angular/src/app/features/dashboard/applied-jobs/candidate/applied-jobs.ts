import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslationService } from '../../../../core/services/translation.service';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { ToastNotificationComponent } from '../../../../shared/components/toast-notification/toast-notification';
import { ProfilePictureEditModal } from '../../../../shared/components/profile-picture-edit-modal/profile-picture-edit-modal';

interface AppliedJob {
  id: string;
  companyLogoImage?: string;
  companyName: string;
  jobTitle: string;
  appliedDate: string;
  appliedTime: string;
  cvType: string;
  cvName: string;
  salary: string;
  status: 'viewed' | 'suitable' | 'pending';
}

@Component({
  selector: 'app-applied-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, ToastNotificationComponent, ProfilePictureEditModal],
  templateUrl: './applied-jobs.html',
  styleUrls: ['./applied-jobs.scss']
})
export class AppliedJobsComponent implements OnInit {
  appliedJobs: AppliedJob[] = [];
  filteredJobs: AppliedJob[] = [];
  displayedJobs: AppliedJob[] = [];
  loading: boolean = false;
  selectedStatus: string = 'all';
  showStatusDropdown: boolean = false;
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 7;
  totalPages: number = 1;
  
  statusOptions = [
    { value: 'all', label: 'Trạng thái' },
    { value: 'applied', label: 'Đã ứng tuyển' },
    { value: 'viewed', label: 'NTD đã xem hồ sơ' },
    { value: 'suitable', label: 'Hồ sơ phù hợp' },
    { value: 'not-suitable', label: 'Hồ sơ chưa phù hợp' }
  ];
  
  get selectedStatusLabel(): string {
    return this.statusOptions.find(opt => opt.value === this.selectedStatus)?.label || 'Trạng thái';
  }
  
  // Profile management
  jobSearchEnabled: boolean = false;
  allowRecruiterSearch: boolean = true;
  showProfilePictureModal: boolean = false;

  // Toast
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';

  constructor(
    private router: Router,
    private translationService: TranslationService
  ) {}

  ngOnInit(): void {
    this.loadAppliedJobs();
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  loadAppliedJobs(): void {
    this.loading = true;
    setTimeout(() => {
      this.appliedJobs = [
        {
          id: '1',
          companyLogoImage: 'assets/images/companies/atx-logo.png',
          companyName: 'ATX',
          jobTitle: 'Thực Tập Sinh Content Creator',
          appliedDate: '04-10-2025',
          appliedTime: '10:00',
          cvType: 'uploaded',
          cvName: 'CV tải lên',
          salary: 'Tới 3 triệu',
          status: 'viewed'
        },
        {
          id: '2',
          companyLogoImage: 'assets/images/companies/seta-logo.png',
          companyName: 'Công ty TNHH SETA international Việt Nam',
          jobTitle: 'Front-End Developer Intern',
          appliedDate: '02-10-2025',
          appliedTime: '21:49',
          cvType: 'uploaded',
          cvName: 'CV tải lên',
          salary: 'Thoả thuận',
          status: 'suitable'
        },
        {
          id: '3',
          companyLogoImage: 'assets/images/companies/jvb-logo.png',
          companyName: 'Công ty Cổ phần JVB Việt Nam',
          jobTitle: 'Thực Tập Sinh (Python/ AI/ ReactJS/ PHP)',
          appliedDate: '01-10-2025',
          appliedTime: '22:46',
          cvType: 'uploaded',
          cvName: 'CV tải lên',
          salary: 'Thoả thuận',
          status: 'viewed'
        },
        {
          id: '4',
          companyLogoImage: 'assets/images/companies/company-logo.png',
          companyName: 'Công ty ABC',
          jobTitle: 'Thực Tập Sinh Lập Trình Viên Front-End',
          appliedDate: '30-09-2025',
          appliedTime: '15:30',
          cvType: 'uploaded',
          cvName: 'CV tải lên',
          salary: 'Từ 4 triệu',
          status: 'pending'
        },
        {
          id: '5',
          companyLogoImage: 'assets/images/companies/company-logo.png',
          companyName: 'Công ty XYZ',
          jobTitle: 'Backend Developer',
          appliedDate: '29-09-2025',
          appliedTime: '14:20',
          cvType: 'uploaded',
          cvName: 'CV tải lên',
          salary: 'Từ 5 triệu',
          status: 'viewed'
        },
        {
          id: '6',
          companyLogoImage: 'assets/images/companies/company-logo.png',
          companyName: 'Công ty DEF',
          jobTitle: 'Full Stack Developer',
          appliedDate: '28-09-2025',
          appliedTime: '13:15',
          cvType: 'uploaded',
          cvName: 'CV tải lên',
          salary: 'Từ 6 triệu',
          status: 'suitable'
        },
        {
          id: '7',
          companyLogoImage: 'assets/images/companies/company-logo.png',
          companyName: 'Công ty GHI',
          jobTitle: 'Mobile Developer',
          appliedDate: '27-09-2025',
          appliedTime: '12:00',
          cvType: 'uploaded',
          cvName: 'CV tải lên',
          salary: 'Từ 7 triệu',
          status: 'pending'
        },
        {
          id: '8',
          companyLogoImage: 'assets/images/companies/company-logo.png',
          companyName: 'Công ty JKL',
          jobTitle: 'DevOps Engineer',
          appliedDate: '26-09-2025',
          appliedTime: '11:30',
          cvType: 'uploaded',
          cvName: 'CV tải lên',
          salary: 'Từ 8 triệu',
          status: 'viewed'
        },
        {
          id: '9',
          companyLogoImage: 'assets/images/companies/company-logo.png',
          companyName: 'Công ty MNO',
          jobTitle: 'QA Engineer',
          appliedDate: '25-09-2025',
          appliedTime: '10:45',
          cvType: 'uploaded',
          cvName: 'CV tải lên',
          salary: 'Từ 5 triệu',
          status: 'suitable'
        },
        {
          id: '10',
          companyLogoImage: 'assets/images/companies/company-logo.png',
          companyName: 'Công ty PQR',
          jobTitle: 'UI/UX Designer',
          appliedDate: '24-09-2025',
          appliedTime: '09:20',
          cvType: 'uploaded',
          cvName: 'CV tải lên',
          salary: 'Từ 6 triệu',
          status: 'pending'
        },
        {
          id: '11',
          companyLogoImage: 'assets/images/companies/company-logo.png',
          companyName: 'Công ty STU',
          jobTitle: 'Data Analyst',
          appliedDate: '23-09-2025',
          appliedTime: '08:15',
          cvType: 'uploaded',
          cvName: 'CV tải lên',
          salary: 'Từ 7 triệu',
          status: 'viewed'
        },
        {
          id: '12',
          companyLogoImage: 'assets/images/companies/company-logo.png',
          companyName: 'Công ty VWX',
          jobTitle: 'Product Manager',
          appliedDate: '22-09-2025',
          appliedTime: '07:30',
          cvType: 'uploaded',
          cvName: 'CV tải lên',
          salary: 'Từ 10 triệu',
          status: 'suitable'
        },
        {
          id: '13',
          companyLogoImage: 'assets/images/companies/company-logo.png',
          companyName: 'Công ty YZ',
          jobTitle: 'Business Analyst',
          appliedDate: '21-09-2025',
          appliedTime: '06:00',
          cvType: 'uploaded',
          cvName: 'CV tải lên',
          salary: 'Từ 8 triệu',
          status: 'pending'
        },
        {
          id: '14',
          companyLogoImage: 'assets/images/companies/company-logo.png',
          companyName: 'Công ty Tech',
          jobTitle: 'Software Engineer',
          appliedDate: '20-09-2025',
          appliedTime: '05:45',
          cvType: 'uploaded',
          cvName: 'CV tải lên',
          salary: 'Từ 9 triệu',
          status: 'viewed'
        }
      ];
      this.filteredJobs = this.appliedJobs;
      this.updateDisplayedJobs();
      this.loading = false;
    }, 500);
  }

  toggleStatusDropdown(): void {
    this.showStatusDropdown = !this.showStatusDropdown;
  }

  selectStatus(status: string): void {
    this.selectedStatus = status;
    this.showStatusDropdown = false;
    this.onStatusChange();
  }

  onStatusChange(): void {
    if (this.selectedStatus === 'all') {
      this.filteredJobs = this.appliedJobs;
    } else if (this.selectedStatus === 'applied') {
      this.filteredJobs = this.appliedJobs;
    } else if (this.selectedStatus === 'viewed') {
      this.filteredJobs = this.appliedJobs.filter(job => job.status === 'viewed');
    } else if (this.selectedStatus === 'suitable') {
      this.filteredJobs = this.appliedJobs.filter(job => job.status === 'suitable');
    }
    this.currentPage = 1;
    this.updateDisplayedJobs();
  }

  updateDisplayedJobs(): void {
    this.totalPages = Math.ceil(this.filteredJobs.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.displayedJobs = this.filteredJobs.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedJobs();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateDisplayedJobs();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateDisplayedJobs();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.status-filter')) {
      this.showStatusDropdown = false;
    }
  }

  onViewCV(job: AppliedJob): void {
    this.showToastMessage('Đang mở CV...', 'info');
  }

  onJobSearchToggle(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.jobSearchEnabled = target.checked;
    const message = this.jobSearchEnabled 
      ? 'Đã bật tìm việc thành công' 
      : 'Đã tắt tìm việc thành công';
    this.showToastMessage(message, 'success');
  }

  onAllowRecruiterSearchToggle(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.allowRecruiterSearch = target.checked;
    const message = this.allowRecruiterSearch 
      ? 'Đã bật cho phép NTD tìm kiếm hồ sơ' 
      : 'Đã tắt cho phép NTD tìm kiếm hồ sơ';
    this.showToastMessage(message, 'success');
  }

  showToastMessage(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
  }

  navigateToJobSuggestionSettings(): void {
    this.router.navigate(['/candidate/job-suggestion-settings']);
  }

  onToastClose(): void {
    this.showToast = false;
  }

  trackByJobId(index: number, job: AppliedJob): string {
    return job.id;
  }

  openProfilePictureModal(): void {
    this.showProfilePictureModal = true;
  }

  closeProfilePictureModal(): void {
    this.showProfilePictureModal = false;
  }

  onProfilePictureChange(): void {
    this.closeProfilePictureModal();
    this.showToastMessage('Đã cập nhật ảnh đại diện thành công', 'success');
  }

  onProfilePictureDelete(): void {
    this.closeProfilePictureModal();
    this.showToastMessage('Đã xóa ảnh đại diện thành công', 'success');
  }
}

