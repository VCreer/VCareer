import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { SidebarSyncService } from '../../../../core/services/sidebar-sync.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ButtonComponent,
  ToastNotificationComponent,
  InputFieldComponent,
  SelectFieldComponent,
  StatCardComponent,
  PaginationComponent,
  StaffTableComponent,
  HRStaff,
} from '../../../../shared/components';
import { TeamManagementService } from '../../../../proxy/services/team-management';
import type {
  StaffListItemDto,
  ActivateStaffDto,
  DeactivateStaffDto,
  InviteStaffDto,
} from '../../../../proxy/dto/team-management-dto/models';
import { NavigationService } from '../../../../core/services/navigation.service';
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
    SelectFieldComponent,
    StatCardComponent,
    PaginationComponent,
    StaffTableComponent,
  ],
  templateUrl: './hr-staff-management.html',
  styleUrls: ['./hr-staff-management.scss'],
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
  selectedStaff: HRStaff | null = null;

  // Form data
  staffForm: Partial<HRStaff> = {
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    status: 'active',
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
    { value: 'hr_assistant', label: 'HR Assistant' },
  ];

  departmentOptions = [
    { value: '', label: 'Tất cả phòng ban' },
    { value: 'recruitment', label: 'Tuyển dụng' },
    { value: 'training', label: 'Đào tạo' },
    { value: 'compensation', label: 'Lương thưởng' },
    { value: 'employee_relations', label: 'Quan hệ nhân viên' },
  ];

  statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'active', label: 'Đang hoạt động' },
    { value: 'inactive', label: 'Ngừng hoạt động' },
  ];

  // Current Leader Info
  currentLeaderInfo: StaffListItemDto | null = null;
  loadingLeaderInfo = false;
  // Chỉ cho phép Leader đã xác thực (Cấp 3/3) thêm HR Staff
  canAddStaff: boolean = false;

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

  get inactiveStaff(): number {
    return this.staffList.filter(s => s.status === 'inactive').length;
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private teamManagementService: TeamManagementService,
    private navigationService: NavigationService
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
      next: userInfo => {
        this.currentLeaderInfo = userInfo;
        // Leader được phép thêm HR Staff chỉ khi đã xác thực tài khoản (Cấp 3/3)
        const isLeader = !!userInfo.isLead;
        // Kiểm tra verification status từ userInfo hoặc từ navigationService
        const verificationStatus = (userInfo as any)?.verificationStatus;
        let isVerified = false;
        if (verificationStatus !== undefined) {
          isVerified = verificationStatus;
          // Cập nhật verification status trong navigationService
          this.navigationService.setVerified(verificationStatus);
        } else {
          // Fallback: sử dụng giá trị từ navigationService
          isVerified = this.navigationService.isVerified();
        }
        this.canAddStaff = isLeader && isVerified;
        this.loadingLeaderInfo = false;
        console.log('Current user info:', userInfo);
        console.log('IsLead:', userInfo.isLead);
        console.log('IsVerified:', isVerified);
        console.log('CompanyId:', userInfo.companyId);
        console.log('CompanyName:', userInfo.companyName);
      },
      error: error => {
        console.error('Error loading current user info:', error);
        this.loadingLeaderInfo = false;
        // Nếu lỗi 401/403, có thể là vấn đề authentication
        if (error.status === 401 || error.status === 403) {
          console.warn('Authentication error, user may need to re-login');
          // Không redirect tự động, để user tự xử lý
        }
      },
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
    // Đóng dropdown nếu click không phải trong filter-dropdown
    // Và không phải trong modal
    if (!target.closest('.filter-dropdown') && !target.closest('.modal-overlay') && !target.closest('.modal-content')) {
      this.showFilterDropdown = false;
    }
  };

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
      const matchSearch =
        !this.searchKeyword ||
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
        Email: staff.email,
        'Điện thoại': staff.phone || 'N/A',
        'Trạng thái': this.getStatusLabel(staff.status),
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
        { wch: 20 }, // Trạng thái
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

  openAddModal(): void {
    if (!this.canAddStaff) {
      this.showToastMessage(
        'Chỉ Leader Recruiter đã xác thực tài khoản (Cấp 3/3) mới được phép thêm HR Staff.',
        'error'
      );
      return;
    }

    // Đóng tất cả modal và dropdown khác trước khi mở modal thêm
    this.closeAllModals();

    // Đợi một chút để đảm bảo các modal khác đã đóng hoàn toàn
    setTimeout(() => {
      this.staffForm = {
        email: '',
      };
      this.showAddModal = true;
      this.cdr.detectChanges();
    }, 50);
  }

  closeAllModals(): void {
    this.showAddModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.showFilterDropdown = false;
    this.selectedStaff = null;
    this.cdr.detectChanges();
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.staffForm = {
      email: '',
    };
  }

  openEditModal(staff: HRStaff): void {
    // Đóng dropdown khi mở modal
    this.showFilterDropdown = false;
    
    this.selectedStaff = staff;
    this.staffForm = { ...staff };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedStaff = null;
    this.staffForm = {
      email: '',
    };
    this.cdr.detectChanges();
  }

  openDeleteModal(staff: HRStaff): void {
    // Đóng dropdown khi mở modal
    this.showFilterDropdown = false;
    
    this.selectedStaff = staff;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedStaff = null;
  }

  onAddStaff(): void {
    if (!this.canAddStaff) {
      this.showToastMessage(
        'Chỉ Leader Recruiter đã xác thực tài khoản (Cấp 3/3) mới được phép thêm HR Staff.',
        'error'
      );
      return;
    }

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
      email: this.staffForm.email.trim(),
    };

    this.loading = true;
    this.showToastMessage('Đang tạo tài khoản và gửi email...', 'info');

    // Call API to invite HR Staff
    this.teamManagementService.inviteStaff(inviteStaffDto).subscribe({
      next: response => {
        this.showToastMessage(
          'Thêm HR Staff thành công! Thông tin đăng nhập đã được gửi đến email: ' +
            this.staffForm.email,
          'success'
        );
        this.loadStaffList(); // Reload list to show new staff
        // Reload current user info để cập nhật verification status
        this.loadCurrentUserInfo();
        this.closeAddModal();
        this.loading = false;
      },
      error: error => {
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
      },
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
          phone: staff.phoneNumber || '', // Lấy số điện thoại từ API
          role: 'HR Staff', // HR Staff role
          department: 'Tuyển dụng', // Default department
          status: staff.status ? 'active' : 'inactive',
          joinDate: '', // API hiện chưa trả về joinDate
          campaigns: 0, // Có thể tính sau
          candidates: 0, // Có thể tính sau
        }));
        console.log('Mapped staff list:', this.staffList);
        this.applyFilters();
        this.loading = false;
      },
      error: error => {
        console.error('Error loading staff list:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          message: error.message,
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
      },
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
      sendNotification: true,
    };

    this.loading = true;
    this.teamManagementService.activateStaff(input).subscribe({
      next: response => {
        this.showToastMessage(response.message || 'Kích hoạt HR Staff thành công!', 'success');
        this.loadStaffList(); // Reload list
        this.closeEditModal();
      },
      error: error => {
        console.error('Error activating staff:', error);
        this.showToastMessage(
          error.error?.error?.message || 'Không thể kích hoạt HR Staff. Vui lòng thử lại.',
          'error'
        );
        this.loading = false;
      },
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
      sendNotification: true,
    };

    this.loading = true;
    this.teamManagementService.deactivateStaff(input).subscribe({
      next: response => {
        this.showToastMessage(response.message || 'Vô hiệu hóa HR Staff thành công!', 'success');
        this.loadStaffList(); // Reload list
        this.closeEditModal();
      },
      error: error => {
        console.error('Error deactivating staff:', error);
        this.showToastMessage(
          error.error?.error?.message || 'Không thể vô hiệu hóa HR Staff. Vui lòng thử lại.',
          'error'
        );
        this.loading = false;
      },
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