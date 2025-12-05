import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { IdentityRoleDto, IdentityUserDto } from '../../volo/abp/identity/models';
import type { PermissionGroupDto } from '../../volo/abp/permission-management/models';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  apiName = 'Default';
  

  getAllEmployeeRoles = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, IdentityRoleDto[]>({
      method: 'GET',
      url: '/api/app/user/employee-roles',
    },
    { apiName: this.apiName,...config });
  

  getAllPermissionGroups = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, PermissionGroupDto[]>({
      method: 'GET',
      url: '/api/app/user/permission-groups',
    },
    { apiName: this.apiName,...config });
  

  getAllRoles = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, IdentityRoleDto[]>({
      method: 'GET',
      url: '/api/app/user/roles',
    },
    { apiName: this.apiName,...config });
  

  getPermissionGroupsByRole = (roleId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PermissionGroupDto[]>({
      method: 'GET',
      url: `/api/app/user/permission-groups-by-role/${roleId}`,
    },
    { apiName: this.apiName,...config });
  

  getPermissionGroupsByUser = (userId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PermissionGroupDto[]>({
      method: 'GET',
      url: `/api/app/user/permission-groups-by-user/${userId}`,
    },
    { apiName: this.apiName,...config });
  

  getRolesByUserId = (userId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, string[]>({
      method: 'GET',
      url: `/api/app/user/roles-by-user-id/${userId}`,
    },
    { apiName: this.apiName,...config });
  

  getUsersInfoByRole = (roleType: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, IdentityUserDto[]>({
      method: 'GET',
      url: '/api/app/user/users-info-by-role',
      params: { roleType },
    },
    { apiName: this.apiName,...config });
  

  setUserActiveStatus = (userId: string, isActive: boolean, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/user/set-user-active-status/${userId}`,
      params: { isActive },
    },
    { apiName: this.apiName,...config });
  

  updateRolePermissions = (roleName: string, permissions: string[], config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'PUT',
      url: '/api/app/user/role-permissions',
      params: { roleName },
      body: permissions,
    },
    { apiName: this.apiName,...config });
  

  updateUserPermissions = (userId: string, desiredPermissions: string[], config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'PUT',
      url: `/api/app/user/user-permissions/${userId}`,
      body: desiredPermissions,
    },
    { apiName: this.apiName,...config });
  

  updateUserRoles = (userId: string, roleNames: string[], config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'PUT',
      url: `/api/app/user/user-roles/${userId}`,
      body: roleNames,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
