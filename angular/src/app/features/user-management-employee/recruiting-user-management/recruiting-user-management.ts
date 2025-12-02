import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  ButtonComponent, 
  ToastNotificationComponent,
  InputFieldComponent,
  SelectFieldComponent,
  PaginationComponent,
  GenericModalComponent,
  StatusDropdownComponent,
  StatusOption
} from '../../../shared/components';
import { UserService } from '../../../proxy/services/user/user.service';

export interface RecruitingUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  companyName: string;
  isActive: boolean;
  isLocked: boolean;
  lockoutEnabled: boolean;
  lastLoginDate?: string;
  createdDate: string;
  ipAddresses: string[];
  mustChangePassword: boolean;
  securityStamp: string;
}

@Component({
  selector: 'app-recruiting-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    ToastNotificationComponent,
    InputFieldComponent,
    SelectFieldComponent,
    PaginationComponent,
    GenericModalComponent,
    StatusDropdownComponent
  ],
  templateUrl: './recruiting-user-management.html',
  styleUrls: ['./recruiting-user-management.scss']
})
export class RecruitingUserManagementComponent implements OnInit, OnDestroy {
  // Sidebar state
  sidebarWidth = 72;
  private sidebarCheckInterval?: any;
  private resizeObserver?: ResizeObserver;

  // Toast
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' | 'warning' = 'info';

  // Users data
  allUsers: RecruitingUser[] = [];
  filteredUsers: RecruitingUser[] = [];
  paginatedUsers: RecruitingUser[] = [];

  // Search & Filter
  searchKeyword = '';
  filterStatus = '';
  filterCompany = '';
  filterDateFrom = '';
  filterDateTo = '';
  sortField: 'username' | 'email' | 'fullName' | 'createdDate' | 'lastLoginDate' = 'createdDate';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Date Pickers
  showDateFromPicker = false;
  showDateToPicker = false;
  dateFromMonth = new Date().getMonth();
  dateFromYear = new Date().getFullYear();
  dateToMonth = new Date().getMonth();
  dateToYear = new Date().getFullYear();
  dateFromCalendarDays: any[] = [];
  dateToCalendarDays: any[] = [];
  weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  // Status options
  statusOptions: StatusOption[] = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'active', label: 'Đang hoạt động' },
    { value: 'inactive', label: 'Ngừng hoạt động' },
    { value: 'locked', label: 'Đã khóa' }
  ];

  // Company options
  companyOptions = [
    { value: '', label: 'Tất cả công ty' },
    { value: 'Công ty ABC', label: 'Công ty ABC' },
    { value: 'Công ty XYZ', label: 'Công ty XYZ' },
    { value: 'Công ty DEF', label: 'Công ty DEF' }
  ];

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  // Modals
  showForceLogoutModal = false;
  showIpRestrictModal = false;
  showPasswordChangeModal = false;
  selectedUser: RecruitingUser | null = null;

  // Actions Menu
  showActionsMenu: string | null = null;
  private scrollListener?: () => void;
  private currentMenuUserId: string | null = null;
  private currentMenuButton: HTMLElement | null = null;

  // IP Restrict Form
  ipAddress = '';

  constructor(
    private cdr: ChangeDetectorRef,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.checkSidebarState();
    
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    if (sidebar) {
      this.resizeObserver = new ResizeObserver(() => {
        this.checkSidebarState();
      });
      this.resizeObserver.observe(sidebar);
      
      sidebar.addEventListener('mouseenter', () => this.checkSidebarState());
      sidebar.addEventListener('mouseleave', () => this.checkSidebarState());
    }
    
    this.sidebarCheckInterval = setInterval(() => {
      this.checkSidebarState();
    }, 50);

    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.removeScrollListener();
    
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private checkSidebarState(): void {
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    if (sidebar) {
      const rect = sidebar.getBoundingClientRect();
      const width = rect.width;
      const newWidth = Math.round(width);
      
      if (this.sidebarWidth !== newWidth) {
        this.sidebarWidth = newWidth;
      }
    } else {
      this.sidebarWidth = 72;
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.checkSidebarState();
  }

  toggleActionsMenu(userId: string, event: Event): void {
    event.stopPropagation();
    
    if (this.showActionsMenu === userId) {
      this.closeActionsMenu();
    } else {
      this.closeActionsMenu();
      this.showActionsMenu = userId;
      this.currentMenuUserId = userId;
      const button = (event.target as HTMLElement).closest('.actions-menu-btn') as HTMLElement;
      this.currentMenuButton = button || null;
      
      // Retry logic to ensure menu is in DOM
      let retries = 0;
      const tryPosition = () => {
        const menu = document.querySelector(`.actions-menu[data-user-id="${userId}"]`) as HTMLElement;
        if (menu || retries >= 5) {
          if (menu) {
            this.updateMenuPosition(userId);
            this.setupScrollListener(userId);
          }
        } else {
          retries++;
          setTimeout(tryPosition, 10);
        }
      };
      setTimeout(tryPosition, 0);
    }
  }

  private closeActionsMenu(): void {
    this.showActionsMenu = null;
    this.currentMenuUserId = null;
    this.currentMenuButton = null;
    this.removeScrollListener();
  }

  private setupScrollListener(userId: string): void {
    this.removeScrollListener();
    
    this.scrollListener = () => {
      if (this.showActionsMenu === userId && this.currentMenuUserId === userId) {
        this.updateMenuPosition(userId);
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
    
    const pageElement = document.querySelector('.recruiting-user-management-page');
    if (pageElement && pageElement.classList.contains('sidebar-expanded')) {
      return 280;
    }
    return 72;
  }

  private updateMenuPosition(userId: string): void {
    const menu = document.querySelector(`.actions-menu[data-user-id="${userId}"]`) as HTMLElement;
    const button = this.currentMenuButton;
    
    if (!menu || !button) {
      if (!menu) {
        setTimeout(() => this.updateMenuPosition(userId), 10);
      }
      return;
    }
    
    const rect = button.getBoundingClientRect();
    const menuWidth = menu.offsetWidth || 200;
    const menuHeight = menu.offsetHeight || 100;
    const sidebarWidth = this.getSidebarWidth();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 8;
    
    // Position menu below button, aligned to right
    let left = rect.right - menuWidth;
    let top = rect.bottom + 4;
    
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
    
    // Ensure menu doesn't go off bottom
    if (top + menuHeight > viewportHeight - padding) {
      top = rect.top - menuHeight - 4;
    }
    
    // Ensure menu doesn't go off top
    if (top < padding) {
      top = padding;
    }
    
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
  }

  loadUsers(): void {
    // Gọi API lấy danh sách userId theo RoleType Recruiter = 2
    this.userService.getUsersInfoByRole(2).subscribe({
      next: () => {
        // Xóa dữ liệu hardcode, chờ map dữ liệu thật từ BE
        this.allUsers = [];
        this.applyFilters();
      },
      error: () => {
        this.allUsers = [];
        this.applyFilters();
      }
    });
  }

  applyFilters(): void {
    let result = [...this.allUsers];

    // Search
    if (this.searchKeyword.trim()) {
      const keyword = this.searchKeyword.toLowerCase();
      result = result.filter(user =>
        user.username.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword) ||
        user.fullName.toLowerCase().includes(keyword) ||
        user.companyName.toLowerCase().includes(keyword)
      );
    }

    // Filter by status
    if (this.filterStatus) {
      if (this.filterStatus === 'active') {
        result = result.filter(u => u.isActive && !u.isLocked);
      } else if (this.filterStatus === 'inactive') {
        result = result.filter(u => !u.isActive);
      } else if (this.filterStatus === 'locked') {
        result = result.filter(u => u.isLocked);
      }
    }

    // Filter by company
    if (this.filterCompany) {
      result = result.filter(u => u.companyName === this.filterCompany);
    }

    // Filter by date range
    if (this.filterDateFrom || this.filterDateTo) {
      result = result.filter(user => {
        const createdDate = new Date(user.createdDate);
        let matchDate = true;

        if (this.filterDateFrom) {
          const dateFrom = new Date(this.filterDateFrom);
          matchDate = matchDate && createdDate >= dateFrom;
        }

        if (this.filterDateTo) {
          const dateTo = new Date(this.filterDateTo);
          dateTo.setHours(23, 59, 59, 999); // End of day
          matchDate = matchDate && createdDate <= dateTo;
        }

        return matchDate;
      });
    }

    // Sort
    result.sort((a, b) => {
      let aValue: any = a[this.sortField];
      let bValue: any = b[this.sortField];

      if (this.sortField === 'createdDate' || this.sortField === 'lastLoginDate') {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      } else {
        aValue = String(aValue || '').toLowerCase();
        bValue = String(bValue || '').toLowerCase();
      }

      if (this.sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    this.filteredUsers = result;
    this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
    this.updatePagination();
  }

  updatePagination(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedUsers = this.filteredUsers.slice(start, end);
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onSort(field: 'username' | 'email' | 'fullName' | 'createdDate' | 'lastLoginDate'): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updatePagination();
  }

  // Actions
  onForceLogout(user: RecruitingUser): void {
    this.selectedUser = user;
    this.showForceLogoutModal = true;
  }

  onConfirmForceLogout(): void {
    if (!this.selectedUser) return;

    // TODO: Call API to force logout (update SecurityStamp)
    this.showToastMessage(`Đã đăng xuất người dùng ${this.selectedUser.username}`, 'success');
    this.showForceLogoutModal = false;
    this.selectedUser = null;
  }

  onToggleActive(user: RecruitingUser): void {
    const newStatus = !user.isActive;
    this.userService.setUserActiveStatus(user.id, newStatus).subscribe({
      next: () => {
        user.isActive = newStatus;
        this.showToastMessage(
          user.isActive ? 'Đã kích hoạt người dùng' : 'Đã vô hiệu hóa người dùng',
          'success'
        );
        this.applyFilters();
      },
      error: () => {
        this.showToastMessage('Thay đổi trạng thái hoạt động thất bại', 'error');
      }
    });
  }

  onToggleLock(user: RecruitingUser): void {
    // TODO: Call API to lock/unlock
    user.isLocked = !user.isLocked;
    this.showToastMessage(
      user.isLocked ? 'Đã khóa người dùng' : 'Đã mở khóa người dùng',
      'success'
    );
    this.applyFilters();
  }

  onEnforcePasswordChange(user: RecruitingUser): void {
    this.selectedUser = user;
    this.showPasswordChangeModal = true;
  }

  onConfirmPasswordChange(): void {
    if (!this.selectedUser) return;

    // TODO: Call API to enforce password change
    this.selectedUser.mustChangePassword = true;
    this.showToastMessage('Yêu cầu đổi mật khẩu đã được áp dụng', 'success');
    this.showPasswordChangeModal = false;
    this.selectedUser = null;
  }

  onAddIpRestrict(user: RecruitingUser): void {
    this.selectedUser = user;
    this.ipAddress = '';
    this.showIpRestrictModal = true;
  }

  onConfirmAddIpRestrict(): void {
    if (!this.selectedUser || !this.ipAddress.trim()) {
      this.showToastMessage('Vui lòng nhập địa chỉ IP', 'error');
      return;
    }

    // Validate IP format (simple)
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(this.ipAddress.trim())) {
      this.showToastMessage('Địa chỉ IP không hợp lệ', 'error');
      return;
    }

    // TODO: Call API to add IP restrict
    if (!this.selectedUser.ipAddresses.includes(this.ipAddress.trim())) {
      this.selectedUser.ipAddresses.push(this.ipAddress.trim());
    }
    this.showToastMessage('Đã thêm địa chỉ IP', 'success');
    this.showIpRestrictModal = false;
    this.selectedUser = null;
  }

  onRemoveIp(user: RecruitingUser, ip: string): void {
    // TODO: Call API to remove IP
    user.ipAddresses = user.ipAddresses.filter(i => i !== ip);
    this.showToastMessage('Đã xóa địa chỉ IP', 'success');
  }

  onExport(): void {
    // TODO: Call API to export user data
    this.showToastMessage('Đang xuất dữ liệu...', 'info');
    // Simulate export
    setTimeout(() => {
      this.showToastMessage('Xuất dữ liệu thành công', 'success');
    }, 1000);
  }

  onImport(): void {
    // TODO: Implement import functionality
    this.showToastMessage('Tính năng import đang được phát triển', 'info');
  }

  // Helper methods
  getStatusLabel(user: RecruitingUser): string {
    if (user.isLocked) return 'Đã khóa';
    if (!user.isActive) return 'Ngừng hoạt động';
    return 'Đang hoạt động';
  }

  getStatusClass(user: RecruitingUser): string {
    if (user.isLocked) return 'status-locked';
    if (!user.isActive) return 'status-inactive';
    return 'status-active';
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  showToastMessage(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  onCloseToast(): void {
    this.showToast = false;
  }

  // Dynamic styles for responsive layout
  getPageMarginLeft(): string {
    if (window.innerWidth <= 768) {
      return '0';
    }
    return `${this.sidebarWidth}px`;
  }

  getPageWidth(): string {
    if (window.innerWidth <= 768) {
      return '100%';
    }
    return `calc(100% - ${this.sidebarWidth}px)`;
  }

  getBreadcrumbLeft(): string {
    if (window.innerWidth <= 768) {
      return '0';
    }
    return `${this.sidebarWidth}px`;
  }

  getBreadcrumbWidth(): string {
    if (window.innerWidth <= 768) {
      return '100%';
    }
    return `calc(100% - ${this.sidebarWidth}px)`;
  }

  getContentMaxWidth(): string {
    const viewportWidth = window.innerWidth;
    if (viewportWidth <= 768) {
      return '100%';
    }
    const padding = 32; // 16px mỗi bên
    const availableWidth = viewportWidth - this.sidebarWidth - padding;
    return `${Math.max(0, availableWidth)}px`;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.actions-menu-container') && !target.closest('.actions-menu')) {
      this.closeActionsMenu();
    }
    if (!target.closest('.date-picker-wrapper')) {
      this.showDateFromPicker = false;
      this.showDateToPicker = false;
    }
  }

  // Date Picker Methods
  toggleDateFromPicker(): void {
    this.showDateFromPicker = !this.showDateFromPicker;
    if (this.showDateFromPicker) {
      this.showDateToPicker = false;
      this.generateDateFromCalendar();
    }
  }

  toggleDateToPicker(): void {
    this.showDateToPicker = !this.showDateToPicker;
    if (this.showDateToPicker) {
      this.showDateFromPicker = false;
      this.generateDateToCalendar();
    }
  }

  generateDateFromCalendar(): void {
    this.dateFromCalendarDays = [];
    const firstDay = new Date(this.dateFromYear, this.dateFromMonth, 1);
    const lastDay = new Date(this.dateFromYear, this.dateFromMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      this.dateFromCalendarDays.push({ date: '', disabled: true });
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(this.dateFromYear, this.dateFromMonth, day);
      this.dateFromCalendarDays.push({
        date: day,
        fullDate: date,
        disabled: false
      });
    }
    
    // Fill remaining cells to make 42 cells (6 rows x 7 columns)
    const totalCells = 42;
    const remainingCells = totalCells - this.dateFromCalendarDays.length;
    for (let i = 0; i < remainingCells; i++) {
      this.dateFromCalendarDays.push({ date: '', disabled: true });
    }
  }

  generateDateToCalendar(): void {
    this.dateToCalendarDays = [];
    const firstDay = new Date(this.dateToYear, this.dateToMonth, 1);
    const lastDay = new Date(this.dateToYear, this.dateToMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      this.dateToCalendarDays.push({ date: '', disabled: true });
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(this.dateToYear, this.dateToMonth, day);
      this.dateToCalendarDays.push({
        date: day,
        fullDate: date,
        disabled: false
      });
    }
    
    // Fill remaining cells to make 42 cells (6 rows x 7 columns)
    const totalCells = 42;
    const remainingCells = totalCells - this.dateToCalendarDays.length;
    for (let i = 0; i < remainingCells; i++) {
      this.dateToCalendarDays.push({ date: '', disabled: true });
    }
  }

  previousDateFromMonth(): void {
    if (this.dateFromMonth === 0) {
      this.dateFromMonth = 11;
      this.dateFromYear--;
    } else {
      this.dateFromMonth--;
    }
    this.generateDateFromCalendar();
    this.cdr.detectChanges();
  }

  nextDateFromMonth(): void {
    if (this.dateFromMonth === 11) {
      this.dateFromMonth = 0;
      this.dateFromYear++;
    } else {
      this.dateFromMonth++;
    }
    this.generateDateFromCalendar();
    this.cdr.detectChanges();
  }

  previousDateToMonth(): void {
    if (this.dateToMonth === 0) {
      this.dateToMonth = 11;
      this.dateToYear--;
    } else {
      this.dateToMonth--;
    }
    this.generateDateToCalendar();
    this.cdr.detectChanges();
  }

  nextDateToMonth(): void {
    if (this.dateToMonth === 11) {
      this.dateToMonth = 0;
      this.dateToYear++;
    } else {
      this.dateToMonth++;
    }
    this.generateDateToCalendar();
    this.cdr.detectChanges();
  }

  getDateFromMonthYear(): string {
    const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
                    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    return `${months[this.dateFromMonth]} ${this.dateFromYear}`;
  }

  getDateToMonthYear(): string {
    const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
                    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    return `${months[this.dateToMonth]} ${this.dateToYear}`;
  }

  isDateFromSelected(day: any): boolean {
    if (!day.fullDate || !this.filterDateFrom) return false;
    const selectedDate = new Date(this.filterDateFrom);
    return day.fullDate.getTime() === new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).getTime();
  }

  isDateToSelected(day: any): boolean {
    if (!day.fullDate || !this.filterDateTo) return false;
    const selectedDate = new Date(this.filterDateTo);
    return day.fullDate.getTime() === new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).getTime();
  }

  selectDateFrom(day: any): void {
    if (day.disabled) return;
    const date = day.fullDate as Date;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dayNum = String(date.getDate()).padStart(2, '0');
    this.filterDateFrom = `${year}-${month}-${dayNum}`;
    this.showDateFromPicker = false;
    this.onFilterChange();
  }

  selectDateTo(day: any): void {
    if (day.disabled) return;
    const date = day.fullDate as Date;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dayNum = String(date.getDate()).padStart(2, '0');
    this.filterDateTo = `${year}-${month}-${dayNum}`;
    this.showDateToPicker = false;
    this.onFilterChange();
  }

  getFormattedDateFrom(): string {
    if (!this.filterDateFrom) return '';
    const date = new Date(this.filterDateFrom);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  getFormattedDateTo(): string {
    if (!this.filterDateTo) return '';
    const date = new Date(this.filterDateTo);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
}
