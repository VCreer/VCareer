import type { ExtensibleEntityDto } from '@abp/ng.core';

export interface IdentityRoleDto extends ExtensibleEntityDto<string> {
  name?: string;
  isDefault: boolean;
  isStatic: boolean;
  isPublic: boolean;
  concurrencyStamp?: string;
  creationTime?: string;
}
