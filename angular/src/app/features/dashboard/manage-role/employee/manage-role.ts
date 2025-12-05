import { Component, OnDestroy, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  ButtonComponent,
  ToastNotificationComponent,
  InputFieldComponent
} from '../../../../shared/components';
import { UserService } from '../../../../proxy/services/user/user.service';
import type { IdentityRoleDto } from '../../../../proxy/volo/abp/identity/models';
import type { PermissionGroupDto } from '../../../../proxy/volo/abp/permission-management/models';

interface RoleViewModel {
  id: string;
  name: string;
  isDefault?: boolean;
  isPublic?: boolean;
  isStatic?: boolean;
}

interface PermissionItem {
  id: string;
  name: string;
  description?: string;
}

interface PermissionSubGroupViewModel {
  id: string;
  name: string;
  permissions: PermissionItem[];
}

interface PermissionGroupViewModel {
  id: string;
  name: string;
  subGroups: PermissionSubGroupViewModel[];
  permissions: PermissionItem[]; // Permissions không có parentName (direct permissions)
}

@Component({
  selector: 'app-manage-role',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    ToastNotificationComponent,
    InputFieldComponent
  ],
  templateUrl: './manage-role.html',
  styleUrls: ['./manage-role.scss']
})
export class ManageRoleComponent implements OnInit, OnDestroy {
  sidebarWidth = 72;
  private sidebarCheckInterval?: any;

  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' | 'warning' = 'info';

  roles: RoleViewModel[] = [];
  filteredRoles: RoleViewModel[] = [];
  selectedRole: RoleViewModel | null = null;

  searchKeyword = '';

  permissionGroups: PermissionGroupViewModel[] = [];
  expandedPermissionGroups: Set<string> = new Set();
  expandedSubGroups: Set<string> = new Set();
  selectedPermissions: Set<string> = new Set();

  isLoadingRoles = false;
  isLoadingPermissions = false;
  isSaving = false;

  constructor(
    private readonly userService: UserService,
  ) {}

  ngOnInit(): void {
    this.checkSidebarState();
    this.sidebarCheckInterval = setInterval(() => {
      this.checkSidebarState();
    }, 50);

    this.loadRoles();
  }

  ngOnDestroy(): void {
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
  }

  private checkSidebarState(): void {
    const sidebar = document.querySelector('.sidebar') as HTMLElement | null;
    if (sidebar) {
      const rect = sidebar.getBoundingClientRect();
      const width = Math.round(rect.width);
      if (this.sidebarWidth !== width) {
        this.sidebarWidth = width;
      }
    } else {
      this.sidebarWidth = 72;
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.checkSidebarState();
  }

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

  getContentMaxWidth(): string {
    const viewportWidth = window.innerWidth;
    if (viewportWidth <= 768) {
      return '100%';
    }
    const padding = 32;
    const availableWidth = viewportWidth - this.sidebarWidth - padding;
    return `${Math.max(0, availableWidth)}px`;
  }

  loadRoles(): void {
    this.isLoadingRoles = true;
    this.userService.getAllRoles().subscribe({
      next: (roles: IdentityRoleDto[]) => {
        this.roles = (roles ?? []).map(r => ({
          id: r.id ?? '',
          name: r.name ?? '',
          isDefault: r.isDefault,
          isPublic: r.isPublic,
          isStatic: r.isStatic
        })).filter(r => r.id && r.name);
        this.applyRoleFilter();
        this.isLoadingRoles = false;
      },
      error: () => {
        this.roles = [];
        this.filteredRoles = [];
        this.isLoadingRoles = false;
        this.showToastMessage('Không tải được danh sách vai trò', 'error');
      }
    });
  }

  applyRoleFilter(): void {
    const keyword = this.searchKeyword.trim().toLowerCase();
    if (!keyword) {
      this.filteredRoles = [...this.roles];
      return;
    }
    this.filteredRoles = this.roles.filter(r =>
      r.name.toLowerCase().includes(keyword)
    );
  }

  onSearchChange(): void {
    this.applyRoleFilter();
  }

  onSelectRole(role: RoleViewModel): void {
    if (this.selectedRole && this.selectedRole.id === role.id) {
      return;
    }
    this.selectedRole = role;
    this.loadPermissionsForRole(role);
  }

  private loadPermissionsForRole(role: RoleViewModel): void {
    if (!role || !role.id) {
      this.permissionGroups = [];
      this.selectedPermissions = new Set();
      return;
    }
    this.isLoadingPermissions = true;
    this.permissionGroups = [];
    this.selectedPermissions = new Set();

    this.userService.getPermissionGroupsByRole(role.id).subscribe({
      next: (groups: PermissionGroupDto[]) => {
        this.permissionGroups = (groups ?? []).map(group => {
          const groupId = group.name ?? '';
          const groupName = group.displayName ?? group.name ?? '';
          
          // Phân loại permissions: có parentName (sub-group) và không có parentName (direct)
          const permissionsWithParent = (group.permissions ?? []).filter(p => !!p.name && !!p.parentName);
          const permissionsWithoutParent = (group.permissions ?? []).filter(p => !!p.name && !p.parentName);
          
          // Nhóm permissions theo parentName để tạo sub-groups
          const subGroupMap = new Map<string, PermissionItem[]>();
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
          
          // Tạo sub-groups từ map
          const subGroups: PermissionSubGroupViewModel[] = Array.from(subGroupMap.entries()).map(([parentName, perms]) => ({
            id: `${groupId}_${parentName}`,
            name: parentName,
            permissions: perms
          }));
          
          // Direct permissions (không có parentName)
          const directPermissions: PermissionItem[] = permissionsWithoutParent.map(p => ({
            id: p.name as string,
            name: p.displayName ?? (p.name as string),
            description: ''
          }));
          
          return {
            id: groupId,
            name: groupName,
            subGroups: subGroups,
            permissions: directPermissions
          };
        }).filter(g => g.id);

        // Khởi tạo selectedPermissions theo isGranted
        (groups ?? []).forEach(group => {
          (group.permissions ?? []).forEach(p => {
            if (p.isGranted && p.name) {
              this.selectedPermissions.add(p.name as string);
            }
          });
        });

        this.isLoadingPermissions = false;
      },
      error: () => {
        this.permissionGroups = [];
        this.selectedPermissions = new Set();
        this.isLoadingPermissions = false;
        this.showToastMessage('Không tải được quyền của vai trò', 'error');
      }
    });
  }

  isPermissionSelected(permissionId: string): boolean {
    return this.selectedPermissions.has(permissionId);
  }

  onTogglePermission(permissionId: string): void {
    if (this.selectedPermissions.has(permissionId)) {
      this.selectedPermissions.delete(permissionId);
    } else {
      this.selectedPermissions.add(permissionId);
    }
  }

  onTogglePermissionGroup(group: PermissionGroupViewModel): void {
    // Lấy tất cả permissions từ sub-groups và direct permissions
    const allPermissions: PermissionItem[] = [];
    for (const subGroup of group.subGroups) {
      allPermissions.push(...subGroup.permissions);
    }
    allPermissions.push(...group.permissions);
    
    const allSelected = allPermissions.length > 0 && allPermissions.every(p => this.selectedPermissions.has(p.id));
    if (allSelected) {
      allPermissions.forEach(p => this.selectedPermissions.delete(p.id));
    } else {
      allPermissions.forEach(p => this.selectedPermissions.add(p.id));
    }
  }

  isPermissionGroupFullySelected(group: PermissionGroupViewModel): boolean {
    const allPermissions: PermissionItem[] = [];
    for (const subGroup of group.subGroups) {
      allPermissions.push(...subGroup.permissions);
    }
    allPermissions.push(...group.permissions);
    
    return allPermissions.length > 0 &&
      allPermissions.every(p => this.selectedPermissions.has(p.id));
  }

  isPermissionGroupPartiallySelected(group: PermissionGroupViewModel): boolean {
    const allPermissions: PermissionItem[] = [];
    for (const subGroup of group.subGroups) {
      allPermissions.push(...subGroup.permissions);
    }
    allPermissions.push(...group.permissions);
    
    const selectedCount = allPermissions.filter(p => this.selectedPermissions.has(p.id)).length;
    return selectedCount > 0 && selectedCount < allPermissions.length;
  }

  onToggleSubGroup(subGroup: PermissionSubGroupViewModel): void {
    const allSelected = subGroup.permissions.every(p => this.selectedPermissions.has(p.id));
    if (allSelected) {
      subGroup.permissions.forEach(p => this.selectedPermissions.delete(p.id));
    } else {
      subGroup.permissions.forEach(p => this.selectedPermissions.add(p.id));
    }
  }

  isSubGroupFullySelected(subGroup: PermissionSubGroupViewModel): boolean {
    return subGroup.permissions.length > 0 &&
      subGroup.permissions.every(p => this.selectedPermissions.has(p.id));
  }

  isSubGroupPartiallySelected(subGroup: PermissionSubGroupViewModel): boolean {
    const selectedCount = subGroup.permissions.filter(p => this.selectedPermissions.has(p.id)).length;
    return selectedCount > 0 && selectedCount < subGroup.permissions.length;
  }

  toggleSubGroupExpand(subGroupId: string): void {
    if (this.expandedSubGroups.has(subGroupId)) {
      this.expandedSubGroups.delete(subGroupId);
    } else {
      this.expandedSubGroups.add(subGroupId);
    }
  }

  isSubGroupExpanded(subGroupId: string): boolean {
    return this.expandedSubGroups.has(subGroupId);
  }

  togglePermissionGroupExpand(groupId: string): void {
    if (this.expandedPermissionGroups.has(groupId)) {
      this.expandedPermissionGroups.delete(groupId);
    } else {
      this.expandedPermissionGroups.add(groupId);
    }
  }

  isPermissionGroupExpanded(groupId: string): boolean {
    return this.expandedPermissionGroups.has(groupId);
  }

  onSavePermissions(): void {
    if (!this.selectedRole || !this.selectedRole.name) {
      this.showToastMessage('Vui lòng chọn một vai trò', 'error');
      return;
    }
    this.isSaving = true;
    const roleName = this.selectedRole.name;
    const permissions = Array.from(this.selectedPermissions);

    this.userService.updateRolePermissions(roleName, permissions).subscribe({
      next: () => {
        this.isSaving = false;
        this.showToastMessage('Cập nhật quyền cho vai trò thành công', 'success');
      },
      error: () => {
        this.isSaving = false;
        this.showToastMessage('Cập nhật quyền cho vai trò thất bại', 'error');
      }
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
}


