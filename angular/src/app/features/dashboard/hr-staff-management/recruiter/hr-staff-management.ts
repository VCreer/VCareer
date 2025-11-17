import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  ButtonComponent, 
  ToastNotificationComponent,
  InputFieldComponent,
  PaginationComponent,
  StaffTableComponent,
  ActivityLogTableComponent,
  HRStaff,
  ActivityLog
} from '../../../../shared/components';
import { TeamManagementService } from '../../../../proxy/services/team-management';
import type { StaffListItemDto, ActivateStaffDto, DeactivateStaffDto, InviteStaffDto } from '../../../../proxy/dto/team-management-dto/models';
import { ActivityLogService } from '../../../../proxy/services/auth/activity-log';
import type { ActivityLogDto, ActivityLogFilterDto, ActivityLogListDto } from '../../../../proxy/dto/activity-log-dto/models';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-hr-staff-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    ToastNotificationComponent,
    InputFieldComponent,
    PaginationComponent,
    StaffTableComponent,
    ActivityLogTableComponent
  ],
  templateUrl: './hr-staff-management.html',
  styleUrls: ['./hr-staff-management.scss']
})
export class HRStaffManagementComponent implements OnInit, OnDestroy {
  sidebarExpanded: boolean = false;
  private sidebarCheckInterval?: any;
  
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' | 'warning' = 'info';

  // Modal states
  showAddModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showFilterDropdown = false;
  showActivityLog = false;
  selectedStaff: HRStaff | null = null;

  // Form data
  staffForm: Partial<HRStaff> = {
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    status: 'active'
  };

  // Filter
  searchKeyword = '';
  filterRole = '';
  filterDepartment = '';
  filterStatus = '';

  // Options
  roleOptions = [
    { value: '', label: 'Tất cả vai trò' },
    { value: 'hr_manager', label: 'HR Manager' },
    { value: 'recruiter', label: 'Recruiter' },
    { value: 'hr_specialist', label: 'HR Specialist' },
    { value: 'hr_assistant', label: 'HR Assistant' }
  ];

  departmentOptions = [
    { value: '', label: 'Tất cả phòng ban' },
    { value: 'recruitment', label: 'Tuyển dụng' },
    { value: 'training', label: 'Đào tạo' },
    { value: 'compensation', label: 'Lương thưởng' },
    { value: 'employee_relations', label: 'Quan hệ nhân viên' }
  ];

  statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'active', label: 'Đang hoạt động' },
    { value: 'inactive', label: 'Ngừng hoạt động' }
  ];

  // Activity Log
  activitySearchKeyword = '';
  activityLogs: ActivityLog[] = [];
  filteredActivityLogs: ActivityLog[] = [];
  paginatedActivityLogs: ActivityLog[] = [];
  loadingActivityLogs = false;

  // Activity Log Pagination
  activityCurrentPage: number = 1;
  activityItemsPerPage: number = 7;

  get activityTotalPages(): number {
    return Math.ceil(this.filteredActivityLogs.length / this.activityItemsPerPage);
  }

  // Current Leader Info
  currentLeaderInfo: StaffListItemDto | null = null;
  loadingLeaderInfo = false;

  // Staff list
  staffList: HRStaff[] = [];
  loading = false;

  filteredStaffList: HRStaff[] = [];
  paginatedStaffList: HRStaff[] = [];

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 7;

  get totalPages(): number {
    return Math.ceil(this.filteredStaffList.length / this.itemsPerPage);
  }

  // Statistics
  get totalStaff(): number {
    return this.staffList.length;
  }

  get activeStaff(): number {
    return this.staffList.filter(s => s.status === 'active').length;
  }

  get pendingStaff(): number {
    return 0; // API không hỗ trợ pending status
  }

  get inactiveStaff(): number {
    return this.staffList.filter(s => s.status === 'inactive').length;
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private teamManagementService: TeamManagementService,
    private activityLogService: ActivityLogService
  ) {}

  ngOnInit(): void {
    this.checkSidebarState();
    this.sidebarCheckInterval = setInterval(() => {
      this.checkSidebarState();
    }, 100);
    
    // Load current user info for debugging
    this.loadCurrentUserInfo();
    this.loadStaffList();
    
    // Close dropdown when clicking outside
    setTimeout(() => {
      document.addEventListener('click', this.handleClickOutside);
    }, 0);
  }

  loadCurrentUserInfo(): void {
    this.loadingLeaderInfo = true;
    this.teamManagementService.getCurrentUserInfo().subscribe({
      next: (userInfo) => {
        this.currentLeaderInfo = userInfo;
        this.loadingLeaderInfo = false;
        console.log('Current user info:', userInfo);
        console.log('IsLead:', userInfo.isLead);
        console.log('CompanyId:', userInfo.companyId);
        console.log('CompanyName:', userInfo.companyName);
      },
      error: (error) => {
        console.error('Error loading current user info:', error);
        this.loadingLeaderInfo = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
    document.removeEventListener('click', this.handleClickOutside);
  }

  handleClickOutside = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    if (!target.closest('.filter-dropdown')) {
      this.showFilterDropdown = false;
    }
  }

  checkSidebarState(): void {
    const sidebar = document.querySelector('app-sidebar .sidebar') as HTMLElement;
    if (sidebar) {
      const rect = sidebar.getBoundingClientRect();
      const width = rect.width;
      this.sidebarExpanded = sidebar.classList.contains('show') || width > 100;
    }
  }

  applyFilters(): void {
    this.filteredStaffList = this.staffList.filter(staff => {
      const matchSearch = !this.searchKeyword || 
        staff.name.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
        staff.email.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
        staff.phone.includes(this.searchKeyword);
      
      const matchRole = !this.filterRole || staff.role === this.filterRole;
      const matchDepartment = !this.filterDepartment || staff.department === this.filterDepartment;
      const matchStatus = !this.filterStatus || staff.status === this.filterStatus;

      return matchSearch && matchRole && matchDepartment && matchStatus;
    });
    
    this.currentPage = 1;
    this.updatePaginatedList();
  }

  updatePaginatedList(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedStaffList = this.filteredStaffList.slice(startIndex, endIndex);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updatePaginatedList();
    
    // Scroll to top of table
    const tableElement = document.querySelector('.staff-table-wrapper');
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  onExportExcel(): void {
    try {
      this.showToastMessage('Đang xuất file Excel...', 'info');
      
      // Chuẩn bị dữ liệu để export
      const exportData = this.filteredStaffList.map(staff => ({
        'Mã nhân viên': staff.id,
        'Họ và tên': staff.name,
        'Email': staff.email,
        'Điện thoại': staff.phone || 'N/A',
        'Trạng thái': this.getStatusLabel(staff.status)
      }));

      // Tạo workbook và worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'HR Staff');

      // Đặt độ rộng cột
      const columnWidths = [
        { wch: 20 }, // Mã nhân viên
        { wch: 30 }, // Họ và tên
        { wch: 35 }, // Email
        { wch: 15 }, // Điện thoại
        { wch: 20 }  // Trạng thái
      ];
      worksheet['!cols'] = columnWidths;

      // Tạo tên file với timestamp
      const fileName = `HR_Staff_Management_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Xuất file
      XLSX.writeFile(workbook, fileName);
      
      this.showToastMessage('Xuất file Excel thành công!', 'success');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      this.showToastMessage('Có lỗi xảy ra khi xuất file Excel. Vui lòng thử lại.', 'error');
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active':
        return 'Đang hoạt động';
      case 'inactive':
        return 'Ngừng hoạt động';
      case 'pending':
        return 'Chờ duyệt';
      default:
        return status;
    }
  }

  toggleFilterDropdown(event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.showFilterDropdown = !this.showFilterDropdown;
    console.log('Toggle dropdown:', this.showFilterDropdown);
    console.log('Status options:', this.statusOptions);
    this.cdr.detectChanges();
  }

  selectStatus(value: string): void {
    this.filterStatus = value;
    this.showFilterDropdown = false;
    this.applyFilters();
  }

  getSelectedStatusLabel(): string {
    const selected = this.statusOptions.find(opt => opt.value === this.filterStatus);
    return selected ? selected.label : 'Tất cả trạng thái';
  }

  toggleActivityLog(): void {
    this.showActivityLog = !this.showActivityLog;
    if (this.showActivityLog) {
      this.activitySearchKeyword = '';
      this.loadActivityLogs();
    }
  }

  loadActivityLogs(): void {
    if (this.staffList.length === 0) {
      // Nếu chưa có staff list, load lại
      this.loadStaffList();
      return;
    }

    this.loadingActivityLogs = true;
    this.activityLogs = [];

    // Lấy activity logs cho tất cả HR Staff
    const activityPromises = this.staffList.map(staff => {
      if (!staff.id) return Promise.resolve(null);

      const filter: ActivityLogFilterDto = {
        skipCount: 0,
        maxResultCount: 100, // Lấy tối đa 100 logs mỗi staff
        sorting: 'creationTime DESC',
        searchKeyword: '' // Truyền empty string để tránh validation error (backend sẽ check IsNullOrWhiteSpace)
      };

      return this.activityLogService.getStaffActivityLogs(staff.id, filter).toPromise()
        .then((response: ActivityLogListDto | undefined) => {
          if (response && response.activities) {
            return response.activities.map((activity: ActivityLogDto) => ({
              id: activity.id || '',
              staffId: staff.id,
              staffName: staff.name,
              staffRole: staff.role,
              activityType: this.mapActivityType(String(activity.activityType || '')),
              detail: this.formatActivityDetail(activity),
              timestamp: activity.creationTime ? new Date(activity.creationTime) : new Date()
            }));
          }
          return [];
        })
        .catch(error => {
          console.error(`Error loading activity logs for staff ${staff.id}:`, error);
          return [];
        });
    });

    Promise.all(activityPromises)
      .then(allLogs => {
        // Merge tất cả logs và sort theo thời gian (mới nhất trước)
        // Sử dụng reduce thay vì flat() để tương thích với TypeScript cũ hơn
        this.activityLogs = allLogs
          .reduce((acc: ActivityLog[], logs) => {
            if (logs && Array.isArray(logs)) {
              acc.push(...logs);
            }
            return acc;
          }, [])
          .filter(log => log !== null)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        this.filterActivityLogs();
        this.loadingActivityLogs = false;
      })
      .catch(error => {
        console.error('Error loading activity logs:', error);
        this.showToastMessage('Không thể tải nhật ký hoạt động. Vui lòng thử lại.', 'error');
        this.loadingActivityLogs = false;
      });
  }

  mapActivityType(activityType: string): string {
    // Map ActivityType enum sang string dễ hiểu
    const typeMap: { [key: string]: string } = {
      'Login': 'login',
      'Logout': 'logout',
      'JobPosted': 'create_campaign',
      'JobUpdated': 'update_campaign',
      'JobDeleted': 'delete_campaign',
      'ApplicationSubmitted': 'submit_application',
      'ApplicationApproved': 'approve',
      'ApplicationRejected': 'reject',
      'CandidateEvaluated': 'review_cv',
      'ProfileUpdated': 'update_profile',
      'EmailSent': 'send_email',
      'InterviewScheduled': 'schedule_interview',
      'InterviewCompleted': 'complete_interview'
    };

    return typeMap[activityType] || activityType.toLowerCase();
  }

  formatActivityDetail(activity: ActivityLogDto): string {
    // Format activity detail từ action và description
    if (activity.description) {
      return activity.description;
    }
    if (activity.action) {
      return activity.action;
    }
    return 'Hoạt động không có mô tả';
  }

  filterActivityLogs(): void {
    if (!this.activitySearchKeyword || this.activitySearchKeyword.trim() === '') {
      this.filteredActivityLogs = [...this.activityLogs];
    } else {
      const keyword = this.activitySearchKeyword.toLowerCase();
      this.filteredActivityLogs = this.activityLogs.filter(log => 
        log.staffName.toLowerCase().includes(keyword) ||
        log.detail.toLowerCase().includes(keyword) ||
        log.activityType.toLowerCase().includes(keyword)
      );
    }
    this.activityCurrentPage = 1;
    this.updatePaginatedActivityLogs();
  }

  updatePaginatedActivityLogs(): void {
    const startIndex = (this.activityCurrentPage - 1) * this.activityItemsPerPage;
    const endIndex = startIndex + this.activityItemsPerPage;
    this.paginatedActivityLogs = this.filteredActivityLogs.slice(startIndex, endIndex);
  }

  onActivityPageChange(page: number): void {
    this.activityCurrentPage = page;
    this.updatePaginatedActivityLogs();
    
    // Scroll to top of table
    const tableElement = document.querySelector('.staff-table-container');
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  openAddModal(): void {
    this.staffForm = {
      email: ''
    };
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  openEditModal(staff: HRStaff): void {
    this.selectedStaff = staff;
    this.staffForm = { ...staff };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedStaff = null;
  }

  openDeleteModal(staff: HRStaff): void {
    this.selectedStaff = staff;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedStaff = null;
  }

  onAddStaff(): void {
    // Validate email
    if (!this.staffForm.email || !this.staffForm.email.trim()) {
      this.showToastMessage('Vui lòng nhập email.', 'error');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.staffForm.email.trim())) {
      this.showToastMessage('Email không hợp lệ. Vui lòng nhập lại.', 'error');
      return;
    }

    // Prepare data for API
    const inviteStaffDto: InviteStaffDto = {
      email: this.staffForm.email.trim()
    };

    this.loading = true;
    this.showToastMessage('Đang tạo tài khoản và gửi email...', 'info');

    // Call API to invite HR Staff
    this.teamManagementService.inviteStaff(inviteStaffDto).subscribe({
      next: (response) => {
        this.showToastMessage(
          'Thêm HR Staff thành công! Thông tin đăng nhập đã được gửi đến email: ' + this.staffForm.email,
          'success'
        );
        this.loadStaffList(); // Reload list to show new staff
        this.closeAddModal();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error inviting staff:', error);
        let errorMessage = 'Không thể thêm HR Staff. Vui lòng thử lại.';
        
        if (error.error?.error?.message) {
          errorMessage = error.error.error.message;
        } else if (error.error?.error?.details) {
          errorMessage = error.error.error.details;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.showToastMessage(errorMessage, 'error');
        this.loading = false;
      }
    });
  }

  onUpdateStaff(): void {
    if (!this.selectedStaff) {
      return;
    }

    const newStatus = this.staffForm.status;
    const currentStatus = this.selectedStaff.status;

    // Nếu status không thay đổi, không cần gọi API
    if (newStatus === currentStatus) {
      this.closeEditModal();
      return;
    }

    // Activate hoặc Deactivate dựa trên status mới
    if (newStatus === 'active') {
      this.activateStaff(this.selectedStaff);
    } else if (newStatus === 'inactive') {
      this.deactivateStaff(this.selectedStaff);
    } else {
      this.showToastMessage('Trạng thái không hợp lệ.', 'error');
    }
  }

  onDeleteStaff(): void {
    // TODO: Implement API call
    this.showToastMessage('Xóa nhân sự thành công!', 'success');
    this.closeDeleteModal();
  }

  loadStaffList(): void {
    this.loading = true;
    this.teamManagementService.getAllStaff().subscribe({
      next: (response: StaffListItemDto[]) => {
        console.log('Staff list loaded:', response);
        // Map StaffListItemDto to HRStaff
        this.staffList = response.map((staff: StaffListItemDto) => ({
          id: staff.recruiterProfileId || staff.userId || '',
          name: staff.fullName || '',
          email: staff.email || '',
          phone: '', // API không trả về phone, có thể để trống hoặc lấy từ profile khác
          role: 'HR Staff', // HR Staff role
          department: 'Tuyển dụng', // Default department
          status: staff.status ? 'active' : 'inactive',
          joinDate: '', // API không trả về joinDate
          campaigns: 0, // Có thể tính sau
          candidates: 0 // Có thể tính sau
        }));
        console.log('Mapped staff list:', this.staffList);
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading staff list:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          message: error.message
        });
        
        let errorMessage = 'Không thể tải danh sách HR Staff. Vui lòng thử lại.';
        
        if (error.error?.error?.message) {
          errorMessage = error.error.error.message;
        } else if (error.error?.error?.details) {
          errorMessage = error.error.error.details;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.showToastMessage(errorMessage, 'error');
        this.loading = false;
      }
    });
  }

  activateStaff(staff: HRStaff): void {
    if (!staff.id) {
      this.showToastMessage('Không tìm thấy ID nhân viên.', 'error');
      return;
    }

    const input: ActivateStaffDto = {
      staffId: staff.id,
      reason: 'Kích hoạt lại HR Staff',
      sendNotification: true
    };

    this.loading = true;
    this.teamManagementService.activateStaff(input).subscribe({
      next: (response) => {
        this.showToastMessage(
          response.message || 'Kích hoạt HR Staff thành công!',
          'success'
        );
        this.loadStaffList(); // Reload list
        this.closeEditModal();
      },
      error: (error) => {
        console.error('Error activating staff:', error);
        this.showToastMessage(
          error.error?.error?.message || 'Không thể kích hoạt HR Staff. Vui lòng thử lại.',
          'error'
        );
        this.loading = false;
      }
    });
  }

  deactivateStaff(staff: HRStaff): void {
    if (!staff.id) {
      this.showToastMessage('Không tìm thấy ID nhân viên.', 'error');
      return;
    }

    const input: DeactivateStaffDto = {
      staffId: staff.id,
      reason: 'Vô hiệu hóa HR Staff',
      sendNotification: true
    };

    this.loading = true;
    this.teamManagementService.deactivateStaff(input).subscribe({
      next: (response) => {
        this.showToastMessage(
          response.message || 'Vô hiệu hóa HR Staff thành công!',
          'success'
        );
        this.loadStaffList(); // Reload list
        this.closeEditModal();
      },
      error: (error) => {
        console.error('Error deactivating staff:', error);
        this.showToastMessage(
          error.error?.error?.message || 'Không thể vô hiệu hóa HR Staff. Vui lòng thử lại.',
          'error'
        );
        this.loading = false;
      }
    });
  }

  showToastMessage(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
  }

  onToastClose(): void {
    this.showToast = false;
  }
}