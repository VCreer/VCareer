import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  ButtonComponent, 
  ToastNotificationComponent,
  InputFieldComponent,
  SelectFieldComponent,
  PaginationComponent,
  GenericModalComponent,
  StatusDropdownComponent,
  StatusOption,
  SelectOption
} from '../../../shared/components';
import { UserService } from '../../../proxy/services/user/user.service';
import { AuthService } from '../../../proxy/services/auth/auth.service';
import type { PermissionGroupDto } from '../../../proxy/volo/abp/permission-management/models';
import type { CreateEmployeeDto } from '../../../proxy/dto/auth-dto/models';

export interface EmployeeUser {
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
  roles?: string[];
  permissions?: string[];
}

interface UserRoleTag {
  label: string;
  tagClass: string;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
}

interface PermissionSubGroup {
  id: string;
  name: string;
  permissions: Permission[];
}

export interface PermissionGroup {
  id: string;
  name: string;
  subGroups: PermissionSubGroup[];
  // Direct permissions không có parentName
  permissions: Permission[];
}

@Component({
  selector: 'app-employee-user-management',
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
  templateUrl: './employee-user-management.html',
  styleUrls: ['./employee-user-management.scss']
})
export class EmployeeUserManagementComponent implements OnInit, OnDestroy {
  // Sidebar state
  sidebarWidth = 72;
  private sidebarCheckInterval?: any;
  private resizeObserver?: ResizeObserver;

  // Toast
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' | 'warning' = 'info';

  // Users data
  allUsers: EmployeeUser[] = [];
  filteredUsers: EmployeeUser[] = [];
  paginatedUsers: EmployeeUser[] = [];

  // Search & Filter
  searchKeyword = '';
  filterStatus = '';
  filterCompany = '';
  filterRole = '';
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
  companyOptions: SelectOption[] = [
    { value: '', label: 'Tất cả công ty' },
    { value: 'Công ty ABC', label: 'Công ty ABC' },
    { value: 'Công ty XYZ', label: 'Công ty XYZ' },
    { value: 'Công ty DEF', label: 'Công ty DEF' }
  ];

  // Role filter options
  roleFilterOptions: SelectOption[] = [];

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  // Modals
  showCreateModal = false;
  showEditModal = false;
  showForceLogoutModal = false;
  showIpRestrictModal = false;
  showPasswordChangeModal = false;
  showRoleModal = false;
  showPermissionModal = false;
  showActivityLogModal = false;
  selectedUser: EmployeeUser | null = null;

  // Actions Menu
  showActionsMenu: string | null = null;
  menuPosition: { top: number; left: number; maxWidth?: number } | null = null;
  private scrollListener?: () => void;
  private currentMenuUserId: string | null = null;
  private currentMenuButton: HTMLElement | null = null;

  // Forms
  createForm = {
    email: '',
    roles: [] as string[], // Changed to array for multi-select
    permissions: [] as string[]
  };
  createErrors = {
    email: '',
    roles: ''
  };
  isCreatingUser = false;
  
  // Role assignment form
  roleForm = {
    roles: [] as string[]
  };
  
  // Permission groups structure
  permissionGroups: PermissionGroup[] = [];
  expandedPermissionGroups: Set<string> = new Set(); // Track which groups are expanded
  expandedSubGroups: Set<string> = new Set(); // Track which sub-groups are expanded
  
  // Role options
  roleOptions: SelectOption[] = [
    { value: 'admin', label: 'Admin' },
    { value: 'manager', label: 'Manager' },
    { value: 'employee', label: 'Employee' },
    { value: 'viewer', label: 'Viewer' }
  ];

  private roleTagColorMap: Record<string, string> = {
    admin: 'role-admin',
    manager: 'role-manager',
    employee: 'role-employee',
    viewer: 'role-viewer'
  };
  editForm = {
    email: '',
    fullName: '',
    phone: '',
    companyName: ''
  };
  ipAddress = '';

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.roleFilterOptions = [
      { value: '', label: 'Tất cả vai trò' },
      ...this.roleOptions
    ];

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

    // Gọi API lấy danh sách role employee (chỉ gọi, không thay đổi nhiều logic hiện tại)
    this.userService.getAllEmployeeRoles().subscribe({
      next: roles => {
        if (roles && roles.length > 0) {
          this.roleOptions = roles.map(r => ({
            value: r.name ?? '',
            label: r.name ?? ''
          })).filter(r => r.value);
          this.roleFilterOptions = [
            { value: '', label: 'Tất cả vai trò' },
            ...this.roleOptions
          ];
        }
      },
      error: () => {
        // Giữ nguyên roleOptions mặc định nếu lỗi
      }
    });

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
    
    const isOpening = this.showActionsMenu !== userId;
    this.showActionsMenu = isOpening ? userId : null;
    this.currentMenuUserId = isOpening ? userId : null;
    
    if (isOpening) {
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
    } else {
      this.closeActionsMenu();
    }
  }

  private closeActionsMenu(): void {
    this.showActionsMenu = null;
    this.currentMenuUserId = null;
    this.currentMenuButton = null;
    this.menuPosition = null;
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
    
    const pageElement = document.querySelector('.employee-user-management-page');
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
    const isMobile = viewportWidth <= 768;
    const padding = isMobile ? 16 : 24;
    const paddingLeft = sidebarWidth + padding;
    
    // Position menu below button, aligned to right
    let left = rect.right - menuWidth;
    let top = rect.bottom + 4;
    
    // Ensure menu doesn't go off left edge (consider sidebar)
    const minLeft = paddingLeft;
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
    // Gọi API lấy danh sách userId theo RoleType Employee = 1
    this.userService.getUsersInfoByRole(1).subscribe({
      next: () => {
        // Tạm thời chỉ clear dữ liệu hardcode, sẽ map dữ liệu thật khi BE sẵn sàng
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

    // Filter by role
    if (this.filterRole) {
      result = result.filter(u => Array.isArray(u.roles) && u.roles.includes(this.filterRole));
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

  // CRUD Actions
  onCreateUser(): void {
    this.createForm = { email: '', roles: [], permissions: [] };
    this.showCreateModal = true;
  }

  onToggleRoleInCreate(roleValue: string): void {
    const index = this.createForm.roles.indexOf(roleValue);
    if (index > -1) {
      this.createForm.roles.splice(index, 1);
    } else {
      this.createForm.roles.push(roleValue);
    }
  }

  onConfirmCreate(event?: Event): void {
    event?.stopPropagation();

    // reset errors
    this.createErrors.email = '';
    this.createErrors.roles = '';

    const email = this.createForm.email.trim();
    if (!email) {
      this.createErrors.email = 'Vui lòng nhập email';
      return;
    }

    // Simple email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.createErrors.email = 'Email không hợp lệ';
      return;
    }

    if (this.createForm.roles.length === 0) {
      this.createErrors.roles = 'Vui lòng chọn ít nhất một role';
      return;
    }

    // Check duplicate email in current list
    const emailExists = this.allUsers.some(u => u.email?.toLowerCase() === email.toLowerCase());
    if (emailExists) {
      this.createErrors.email = 'Email đã tồn tại trong danh sách nhân viên';
      return;
    }

    if (this.isCreatingUser) {
      return;
    }
    this.isCreatingUser = true;

    // Gọi API tạo nhân viên
    const randomPassword = Math.random().toString(36).slice(-10);
    const payload: CreateEmployeeDto = {
      email,
      password: randomPassword,
      employeeRoles: [...this.createForm.roles]
    };

    this.authService.createEmployee(payload).subscribe({
      next: () => {
        this.showToastMessage('Tạo nhân viên thành công', 'success');
        this.showCreateModal = false;
        this.isCreatingUser = false;
        this.createForm = { email: '', roles: [], permissions: [] };
        this.createErrors = { email: '', roles: '' };
        // Reload danh sách để thấy nhân viên mới
        this.loadUsers();
      },
      error: () => {
        this.isCreatingUser = false;
        this.showToastMessage('Tạo nhân viên thất bại', 'error');
      }
    });
  }

  onEditUser(user: EmployeeUser): void {
    this.selectedUser = user;
    this.editForm = {
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      companyName: user.companyName
    };
    this.showEditModal = true;
    this.closeActionsMenu();
  }

  onConfirmEdit(): void {
    if (!this.selectedUser) return;

    // TODO: Call API to update employee
    this.selectedUser.email = this.editForm.email;
    this.selectedUser.fullName = this.editForm.fullName;
    this.selectedUser.phone = this.editForm.phone;
    this.selectedUser.companyName = this.editForm.companyName;

    this.applyFilters();
    this.showToastMessage('Cập nhật nhân viên thành công', 'success');
    this.showEditModal = false;
    this.selectedUser = null;
  }

  onDeleteUser(user: EmployeeUser): void {
    if (confirm(`Xóa nhân viên "${user.fullName}"?`)) {
      // TODO: Call API to delete employee
      const index = this.allUsers.findIndex(u => u.id === user.id);
      if (index > -1) {
        this.allUsers.splice(index, 1);
        this.applyFilters();
        this.showToastMessage('Đã xóa nhân viên', 'success');
      }
    }
    this.closeActionsMenu();
  }

  // Role & Permission Actions
  onAssignRole(user: EmployeeUser): void {
    this.selectedUser = user;
    // Lấy role hiện tại từ API
    this.userService.getRolesByUserId(user.id).subscribe({
      next: roles => {
        this.roleForm.roles = Array.isArray(roles) ? [...roles] : [];
        this.showRoleModal = true;
        this.closeActionsMenu();
      },
      error: () => {
        // Nếu lỗi thì fallback về data hiện tại trên UI
        this.roleForm.roles = user.roles ? [...user.roles] : [];
        this.showRoleModal = true;
        this.closeActionsMenu();
      }
    });
  }

  onToggleRole(roleValue: string): void {
    const index = this.roleForm.roles.indexOf(roleValue);
    if (index > -1) {
      this.roleForm.roles.splice(index, 1);
    } else {
      this.roleForm.roles.push(roleValue);
    }
  }

  isRoleSelected(roleValue: string): boolean {
    return this.roleForm.roles.includes(roleValue);
  }

  onConfirmAssignRole(): void {
    if (!this.selectedUser || this.roleForm.roles.length === 0) {
      this.showToastMessage('Vui lòng chọn ít nhất một role', 'error');
      return;
    }

    // Gọi API gán role cho user
    const userId = this.selectedUser.id;
    const roles = [...this.roleForm.roles];

    this.userService.updateUserRoles(userId, roles).subscribe({
      next: () => {
        this.selectedUser!.roles = roles;
        this.showToastMessage('Đã gắn role thành công', 'success');
        this.showRoleModal = false;
        this.selectedUser = null;
        this.roleForm.roles = [];
      },
      error: () => {
        this.showToastMessage('Gắn role thất bại', 'error');
      }
    });
  }

  onAssignPermission(user: EmployeeUser): void {
    this.selectedUser = user;
    this.createForm.permissions = [];
    // Gọi API lấy nhóm quyền và quyền đã gán cho user
    this.loadPermissionGroups(user.id);
    // Không expand group/sub-group mặc định
    this.expandedPermissionGroups = new Set();
    this.expandedSubGroups = new Set();
    this.showPermissionModal = true;
    this.closeActionsMenu();
  }

  togglePermissionGroupExpand(groupId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.expandedPermissionGroups.has(groupId)) {
      this.expandedPermissionGroups.delete(groupId);
    } else {
      this.expandedPermissionGroups.add(groupId);
    }
  }

  isPermissionGroupExpanded(groupId: string): boolean {
    return this.expandedPermissionGroups.has(groupId);
  }

  private loadPermissionGroups(userId: string): void {
    this.userService.getAllPermissionGroups().subscribe({
      next: (allGroups: PermissionGroupDto[]) => {
        // Map toàn bộ permission group để hiển thị (3 cấp: group -> sub-group -> permission)
        this.permissionGroups = (allGroups ?? []).map(group => {
          const groupId = group.name ?? '';
          const groupName = group.displayName ?? group.name ?? '';

          // Phân loại permissions: có parentName (sub-group) và không có parentName (direct)
          const permissionsWithParent = (group.permissions ?? []).filter(p => !!p.name && !!p.parentName);
          const permissionsWithoutParent = (group.permissions ?? []).filter(p => !!p.name && !p.parentName);

          // Nhóm permissions theo parentName để tạo sub-groups
          const subGroupMap = new Map<string, Permission[]>();
          permissionsWithParent.forEach(p => {
            const parentName = p.parentName as string;
            if (!subGroupMap.has(parentName)) {
              subGroupMap.set(parentName, []);
            }
            subGroupMap.get(parentName)!.push({
              id: p.name as string,
              name: p.displayName ?? (p.name as string),
              description: ''
            });
          });

          const subGroups: PermissionSubGroup[] = Array.from(subGroupMap.entries()).map(([parentName, perms]) => ({
            id: `${groupId}_${parentName}`,
            name: parentName,
            permissions: perms
          }));

          // Direct permissions (không có parentName)
          const directPermissions: Permission[] = permissionsWithoutParent.map(p => ({
            id: p.name as string,
            name: p.displayName ?? (p.name as string),
            description: ''
          }));

          return {
            id: groupId,
            name: groupName,
            subGroups,
            permissions: directPermissions
          } as PermissionGroup;
        }).filter(g => g.id);

        // Lấy các quyền đã được gán cho user
        this.userService.getPermissionGroupsByUser(userId).subscribe({
          next: userGroups => {
            const granted: string[] = [];
            (userGroups ?? []).forEach(group => {
              (group.permissions ?? []).forEach(p => {
                if (p.isGranted && p.name) {
                  granted.push(p.name as string);
                }
              });
            });
            this.createForm.permissions = granted;
          },
          error: () => {
            // Nếu lỗi, để trống -> user tự chọn
            this.createForm.permissions = [];
          }
        });
      },
      error: () => {
        // Nếu lỗi, không có group nào
        this.permissionGroups = [];
        this.createForm.permissions = [];
      }
    });
  }

  onTogglePermission(permissionId: string): void {
    const index = this.createForm.permissions.indexOf(permissionId);
    if (index > -1) {
      this.createForm.permissions.splice(index, 1);
    } else {
      this.createForm.permissions.push(permissionId);
    }
  }

  isPermissionSelected(permissionId: string): boolean {
    return this.createForm.permissions.includes(permissionId);
  }

  onTogglePermissionGroup(groupId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const group = this.permissionGroups.find(g => g.id === groupId);
    if (!group) return;

    const allPermissions: Permission[] = [];
    group.subGroups.forEach(sg => {
      allPermissions.push(...sg.permissions);
    });
    allPermissions.push(...group.permissions);

    const allSelected = allPermissions.length > 0 && allPermissions.every(p => this.isPermissionSelected(p.id));

    if (allSelected) {
      // Deselect all permissions in group
      allPermissions.forEach(p => {
        const index = this.createForm.permissions.indexOf(p.id);
        if (index > -1) {
          this.createForm.permissions.splice(index, 1);
        }
      });
    } else {
      // Select all permissions in group
      allPermissions.forEach(p => {
        if (!this.isPermissionSelected(p.id)) {
          this.createForm.permissions.push(p.id);
        }
      });
    }
  }

  isPermissionGroupFullySelected(groupId: string): boolean {
    const group = this.permissionGroups.find(g => g.id === groupId);
    if (!group) return false;

    const allPermissions: Permission[] = [];
    group.subGroups.forEach(sg => {
      allPermissions.push(...sg.permissions);
    });
    allPermissions.push(...group.permissions);

    return allPermissions.length > 0 && allPermissions.every(p => this.isPermissionSelected(p.id));
  }

  isPermissionGroupPartiallySelected(groupId: string): boolean {
    const group = this.permissionGroups.find(g => g.id === groupId);
    if (!group) return false;

    const allPermissions: Permission[] = [];
    group.subGroups.forEach(sg => {
      allPermissions.push(...sg.permissions);
    });
    allPermissions.push(...group.permissions);

    const selectedCount = allPermissions.filter(p => this.isPermissionSelected(p.id)).length;
    return selectedCount > 0 && selectedCount < allPermissions.length;
  }

  onToggleSubGroup(subGroup: PermissionSubGroup, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const allSelected = subGroup.permissions.every(p => this.isPermissionSelected(p.id));

    if (allSelected) {
      subGroup.permissions.forEach(p => {
        const index = this.createForm.permissions.indexOf(p.id);
        if (index > -1) {
          this.createForm.permissions.splice(index, 1);
        }
      });
    } else {
      subGroup.permissions.forEach(p => {
        if (!this.isPermissionSelected(p.id)) {
          this.createForm.permissions.push(p.id);
        }
      });
    }
  }

  isSubGroupFullySelected(subGroup: PermissionSubGroup): boolean {
    return subGroup.permissions.length > 0 &&
      subGroup.permissions.every(p => this.isPermissionSelected(p.id));
  }

  isSubGroupPartiallySelected(subGroup: PermissionSubGroup): boolean {
    const selectedCount = subGroup.permissions.filter(p => this.isPermissionSelected(p.id)).length;
    return selectedCount > 0 && selectedCount < subGroup.permissions.length;
  }

  toggleSubGroupExpand(subGroupId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.expandedSubGroups.has(subGroupId)) {
      this.expandedSubGroups.delete(subGroupId);
    } else {
      this.expandedSubGroups.add(subGroupId);
    }
  }

  isSubGroupExpanded(subGroupId: string): boolean {
    return this.expandedSubGroups.has(subGroupId);
  }

  onConfirmAssignPermission(): void {
    if (!this.selectedUser) {
      this.showToastMessage('Vui lòng chọn nhân viên', 'error');
      return;
    }

    const userId = this.selectedUser.id;
    const permissions = [...this.createForm.permissions];

    this.userService.updateUserPermissions(userId, permissions).subscribe({
      next: () => {
        this.selectedUser!.permissions = permissions;
        this.showToastMessage('Đã gắn permission thành công', 'success');
        this.showPermissionModal = false;
        this.selectedUser = null;
        this.createForm.permissions = [];
      },
      error: () => {
        this.showToastMessage('Gắn permission thất bại', 'error');
      }
    });
  }

  // Other Actions
  onForceLogout(user: EmployeeUser): void {
    this.selectedUser = user;
    this.showForceLogoutModal = true;
    this.closeActionsMenu();
  }

  onConfirmForceLogout(): void {
    if (!this.selectedUser) return;

    // TODO: Call API to force logout (update SecurityStamp)
    this.showToastMessage(`Đã đăng xuất người dùng ${this.selectedUser.username}`, 'success');
    this.showForceLogoutModal = false;
    this.selectedUser = null;
  }

  onToggleActive(user: EmployeeUser): void {
    const newStatus = !user.isActive;
    this.userService.setUserActiveStatus(user.id, newStatus).subscribe({
      next: () => {
        user.isActive = newStatus;
        this.showToastMessage(
          user.isActive ? 'Đã kích hoạt người dùng' : 'Đã vô hiệu hóa người dùng',
          'success'
        );
        this.applyFilters();
        this.closeActionsMenu();
      },
      error: () => {
        this.showToastMessage('Thay đổi trạng thái hoạt động thất bại', 'error');
        this.closeActionsMenu();
      }
    });
  }

  onToggleLock(user: EmployeeUser): void {
    // TODO: Call API to lock/unlock
    user.isLocked = !user.isLocked;
    this.showToastMessage(
      user.isLocked ? 'Đã khóa người dùng' : 'Đã mở khóa người dùng',
      'success'
    );
    this.applyFilters();
    this.closeActionsMenu();
  }

  onEnforcePasswordChange(user: EmployeeUser): void {
    this.selectedUser = user;
    this.showPasswordChangeModal = true;
    this.closeActionsMenu();
  }

  onConfirmPasswordChange(): void {
    if (!this.selectedUser) return;

    // TODO: Call API to enforce password change
    this.selectedUser.mustChangePassword = true;
    this.showToastMessage('Yêu cầu đổi mật khẩu đã được áp dụng', 'success');
    this.showPasswordChangeModal = false;
    this.selectedUser = null;
  }

  onAddIpRestrict(user: EmployeeUser): void {
    this.selectedUser = user;
    this.ipAddress = '';
    this.showIpRestrictModal = true;
    this.closeActionsMenu();
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

  onRemoveIp(user: EmployeeUser, ip: string): void {
    // TODO: Call API to remove IP
    user.ipAddresses = user.ipAddresses.filter(i => i !== ip);
    this.showToastMessage('Đã xóa địa chỉ IP', 'success');
  }

  onViewActivityLog(user: EmployeeUser): void {
    this.selectedUser = user;
    this.showActivityLogModal = true;
    this.closeActionsMenu();
    // TODO: Load activity log data
  }

  onRefreshActivityLog(): void {
    if (!this.selectedUser) return;
    // TODO: Call API to refresh activity log
    this.showToastMessage('Đang làm mới log hoạt động...', 'info');
  }

  onNavigateToActivityLog(): void {
    if (!this.selectedUser) return;
    // Điều hướng đến màn activity log với userId
    this.router.navigate(['/employee/manage-log/activity'], {
      queryParams: { userId: this.selectedUser.id }
    });
    this.showActivityLogModal = false;
  }

  onExport(): void {
    // TODO: Call API to export user data
    this.showToastMessage('Đang xuất dữ liệu...', 'info');
    setTimeout(() => {
      this.showToastMessage('Xuất dữ liệu thành công', 'success');
    }, 1000);
  }

  onImport(): void {
    // TODO: Implement import functionality
    this.showToastMessage('Tính năng import đang được phát triển', 'info');
  }

  // Helper methods
  getStatusLabel(user: EmployeeUser): string {
    if (user.isLocked) return 'Đã khóa';
    if (!user.isActive) return 'Ngừng hoạt động';
    return 'Đang hoạt động';
  }

  getStatusClass(user: EmployeeUser): string {
    if (user.isLocked) return 'status-locked';
    if (!user.isActive) return 'status-inactive';
    return 'status-active';
  }

  getUserRoleTags(user: EmployeeUser): UserRoleTag[] {
    if (!Array.isArray(user.roles) || user.roles.length === 0) {
      return [];
    }

    return user.roles.map(roleValue => {
      const label = this.roleOptions.find(opt => opt.value === roleValue)?.label || roleValue;
      const tagClass = this.roleTagColorMap[roleValue] || 'role-neutral';
      return { label, tagClass };
    });
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
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      this.dateFromCalendarDays.push({ date: '', disabled: true });
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(this.dateFromYear, this.dateFromMonth, day);
      this.dateFromCalendarDays.push({
        date: day,
        fullDate: date,
        disabled: false
      });
    }
    
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
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      this.dateToCalendarDays.push({ date: '', disabled: true });
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(this.dateToYear, this.dateToMonth, day);
      this.dateToCalendarDays.push({
        date: day,
        fullDate: date,
        disabled: false
      });
    }
    
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

