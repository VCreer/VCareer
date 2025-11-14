import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
  ActivityLogTableComponent,
  HRStaff,
  ActivityLog
} from '../../../../shared/components';

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
    { value: 'pending', label: 'Chờ duyệt' },
    { value: 'inactive', label: 'Ngừng hoạt động' }
  ];

  // Activity Log
  activitySearchKeyword = '';
  activityLogs: ActivityLog[] = [
    {
      id: '1',
      staffId: '1',
      staffName: 'Nguyễn Văn A',
      staffRole: 'HR Manager',
      activityType: 'login',
      detail: 'Đăng nhập vào hệ thống',
      timestamp: new Date('2024-01-15T08:30:00')
    },
    {
      id: '2',
      staffId: '2',
      staffName: 'Trần Thị B',
      staffRole: 'Recruiter',
      activityType: 'create_campaign',
      detail: 'Tạo chiến dịch tuyển dụng "Senior Developer"',
      timestamp: new Date('2024-01-15T09:15:00')
    },
    {
      id: '3',
      staffId: '1',
      staffName: 'Nguyễn Văn A',
      staffRole: 'HR Manager',
      activityType: 'approve',
      detail: 'Phê duyệt ứng viên "Lê Văn C"',
      timestamp: new Date('2024-01-15T10:00:00')
    },
    {
      id: '4',
      staffId: '3',
      staffName: 'Lê Văn C',
      staffRole: 'HR Specialist',
      activityType: 'update_profile',
      detail: 'Cập nhật thông tin cá nhân',
      timestamp: new Date('2024-01-15T11:20:00')
    },
    {
      id: '5',
      staffId: '2',
      staffName: 'Trần Thị B',
      staffRole: 'Recruiter',
      activityType: 'review_cv',
      detail: 'Xem xét 15 CV mới',
      timestamp: new Date('2024-01-15T14:30:00')
    },
    {
      id: '6',
      staffId: '4',
      staffName: 'Phạm Thị D',
      staffRole: 'Recruiter',
      activityType: 'logout',
      detail: 'Đăng xuất khỏi hệ thống',
      timestamp: new Date('2024-01-15T17:45:00')
    },
    {
      id: '7',
      staffId: '5',
      staffName: 'Hoàng Văn E',
      staffRole: 'HR Assistant',
      activityType: 'login',
      detail: 'Đăng nhập vào hệ thống',
      timestamp: new Date('2024-01-16T08:00:00')
    },
    {
      id: '8',
      staffId: '6',
      staffName: 'Đỗ Thị F',
      staffRole: 'HR Specialist',
      activityType: 'update_profile',
      detail: 'Cập nhật thông tin liên hệ',
      timestamp: new Date('2024-01-16T09:30:00')
    },
    {
      id: '9',
      staffId: '7',
      staffName: 'Vũ Văn G',
      staffRole: 'Recruiter',
      activityType: 'create_campaign',
      detail: 'Tạo chiến dịch tuyển dụng "Marketing Manager"',
      timestamp: new Date('2024-01-16T10:15:00')
    },
    {
      id: '10',
      staffId: '8',
      staffName: 'Bùi Thị H',
      staffRole: 'HR Manager',
      activityType: 'approve',
      detail: 'Phê duyệt ứng viên "Nguyễn Văn X"',
      timestamp: new Date('2024-01-16T11:00:00')
    }
  ];
  filteredActivityLogs: ActivityLog[] = [];
  paginatedActivityLogs: ActivityLog[] = [];

  // Activity Log Pagination
  activityCurrentPage: number = 1;
  activityItemsPerPage: number = 7;

  get activityTotalPages(): number {
    return Math.ceil(this.filteredActivityLogs.length / this.activityItemsPerPage);
  }

  // Staff list
  staffList: HRStaff[] = [
    {
      id: '1',
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@company.com',
      phone: '0901234567',
      role: 'HR Manager',
      department: 'Tuyển dụng',
      status: 'active',
      joinDate: '2023-01-15',
      campaigns: 8,
      candidates: 342
    },
    {
      id: '2',
      name: 'Trần Thị B',
      email: 'tranthib@company.com',
      phone: '0902345678',
      role: 'Recruiter',
      department: 'Tuyển dụng',
      status: 'active',
      joinDate: '2023-03-20',
      campaigns: 6,
      candidates: 289
    },
    {
      id: '3',
      name: 'Lê Văn C',
      email: 'levanc@company.com',
      phone: '0903456789',
      role: 'HR Specialist',
      department: 'Đào tạo',
      status: 'active',
      joinDate: '2023-05-10',
      campaigns: 5,
      candidates: 256
    },
    {
      id: '4',
      name: 'Phạm Thị D',
      email: 'phamthid@company.com',
      phone: '0904567890',
      role: 'Recruiter',
      department: 'Tuyển dụng',
      status: 'inactive',
      joinDate: '2022-11-05',
      campaigns: 5,
      candidates: 360
    },
    {
      id: '5',
      name: 'Hoàng Văn E',
      email: 'hoangvane@company.com',
      phone: '0905678901',
      role: 'HR Assistant',
      department: 'Lương thưởng',
      status: 'active',
      joinDate: '2023-06-15',
      campaigns: 3,
      candidates: 145
    },
    {
      id: '6',
      name: 'Đỗ Thị F',
      email: 'dothif@company.com',
      phone: '0906789012',
      role: 'HR Specialist',
      department: 'Quan hệ nhân viên',
      status: 'active',
      joinDate: '2023-07-20',
      campaigns: 4,
      candidates: 198
    },
    {
      id: '7',
      name: 'Vũ Văn G',
      email: 'vuvang@company.com',
      phone: '0907890123',
      role: 'Recruiter',
      department: 'Tuyển dụng',
      status: 'pending',
      joinDate: '2023-08-10',
      campaigns: 2,
      candidates: 87
    },
    {
      id: '8',
      name: 'Bùi Thị H',
      email: 'buithih@company.com',
      phone: '0908901234',
      role: 'HR Manager',
      department: 'Đào tạo',
      status: 'active',
      joinDate: '2023-02-28',
      campaigns: 7,
      candidates: 312
    },
    {
      id: '9',
      name: 'Ngô Văn I',
      email: 'ngovani@company.com',
      phone: '0909012345',
      role: 'HR Assistant',
      department: 'Tuyển dụng',
      status: 'active',
      joinDate: '2023-09-05',
      campaigns: 2,
      candidates: 76
    },
    {
      id: '10',
      name: 'Đinh Thị K',
      email: 'dinhthik@company.com',
      phone: '0900123456',
      role: 'Recruiter',
      department: 'Tuyển dụng',
      status: 'inactive',
      joinDate: '2022-12-15',
      campaigns: 6,
      candidates: 278
    }
  ];

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
    return this.staffList.filter(s => s.status === 'pending').length;
  }

  get inactiveStaff(): number {
    return this.staffList.filter(s => s.status === 'inactive').length;
  }

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.checkSidebarState();
    this.sidebarCheckInterval = setInterval(() => {
      this.checkSidebarState();
    }, 100);
    this.applyFilters();
    this.filteredActivityLogs = [...this.activityLogs];
    
    // Close dropdown when clicking outside
    setTimeout(() => {
      document.addEventListener('click', this.handleClickOutside);
    }, 0);
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
    this.showToastMessage('Đang xuất file Excel...', 'info');
    // TODO: Implement Excel export
    setTimeout(() => {
      this.showToastMessage('Xuất file Excel thành công!', 'success');
    }, 1000);
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
      this.filteredActivityLogs = [...this.activityLogs];
      this.activityCurrentPage = 1;
      this.updatePaginatedActivityLogs();
    }
  }

  filterActivityLogs(): void {
    this.filteredActivityLogs = this.activityLogs.filter(log => 
      log.staffName.toLowerCase().includes(this.activitySearchKeyword.toLowerCase()) ||
      log.detail.toLowerCase().includes(this.activitySearchKeyword.toLowerCase())
    );
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
      name: '',
      email: '',
      phone: '',
      role: '',
      department: '',
      status: 'active'
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
    // TODO: Implement API call
    this.showToastMessage('Thêm nhân sự thành công!', 'success');
    this.closeAddModal();
  }

  onUpdateStaff(): void {
    // TODO: Implement API call
    this.showToastMessage('Cập nhật nhân sự thành công!', 'success');
    this.closeEditModal();
  }

  onDeleteStaff(): void {
    // TODO: Implement API call
    this.showToastMessage('Xóa nhân sự thành công!', 'success');
    this.closeDeleteModal();
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
