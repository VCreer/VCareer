
export interface PermissionGrantInfoDto {
  name?: string;
  displayName?: string;
  parentName?: string;
  isGranted: boolean;
  allowedProviders: string[];
  grantedProviders: ProviderInfoDto[];
}

export interface PermissionGroupDto {
  name?: string;
  displayName?: string;
  displayNameKey?: string;
  displayNameResource?: string;
  permissions: PermissionGrantInfoDto[];
}

export interface ProviderInfoDto {
  providerName?: string;
  providerKey?: string;
}
