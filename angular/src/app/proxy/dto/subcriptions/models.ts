import type { SubcriptionContance_ServiceAction } from '../../constants/job-constant/subcription-contance-service-action.enum';
import type { SubcriptionContance_ServiceTarget } from '../../constants/job-constant/subcription-contance-service-target.enum';
import type { SubcriptionContance_ChildServiceStatus } from '../../constants/job-constant/subcription-contance-child-service-status.enum';
import type { SubcriptionContance_CurrencyType } from '../../constants/job-constant/subcription-contance-currency-type.enum';
import type { SubcriptionContance_SubcriptorTarget } from '../../constants/job-constant/subcription-contance-subcriptor-target.enum';
import type { SubcriptionContance_SubcriptionStatus } from '../../constants/job-constant/subcription-contance-subcription-status.enum';

export interface AddChildServicesDto {
  childServiceIds: string[];
  subcriptionId?: string;
}

export interface ChildServiceCreateDto {
  name?: string;
  description?: string;
  action?: SubcriptionContance_ServiceAction;
  target?: SubcriptionContance_ServiceTarget;
  isActive: boolean;
  isLifeTime: boolean;
  isAutoActive: boolean;
  isLimitUsedTime: boolean;
  timeUsedLimit?: number;
  dayDuration?: number;
  value?: number;
}

export interface ChildServiceUpdateDto {
  cHildServiceId?: string;
  name?: string;
  description?: string;
  isActive: boolean;
}

export interface ChildServiceViewDto {
  cHildServiceId?: string;
  name?: string;
  description?: string;
  action?: SubcriptionContance_ServiceAction;
  target?: SubcriptionContance_ServiceTarget;
  isLimitUsedTime: boolean;
  isActive: boolean;
  isLifeTime: boolean;
  isAutoActive: boolean;
  timeUsedLimit?: number;
  dayDuration?: number;
  value?: number;
}

export interface EffectingJobServiceCreateDto {
  jobPostId?: string;
  childServiceId?: string;
}

export interface EffectingJobServiceUpdateDto {
  endDate?: string;
  status?: SubcriptionContance_ChildServiceStatus;
}

export interface EffectingJobServiceViewDto {
  jobPostId?: string;
  childServiceId?: string;
  action?: SubcriptionContance_ServiceAction;
  target?: SubcriptionContance_ServiceTarget;
  status?: SubcriptionContance_ChildServiceStatus;
  value?: number;
  startDate?: string;
  endDate?: string;
}

export interface SubcriptionPriceViewDto {
  salePercent: number;
  originalPrice: number;
  type?: SubcriptionContance_CurrencyType;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface SubcriptionsCreateDto {
  title?: string;
  description?: string;
  target?: SubcriptionContance_SubcriptorTarget;
  status?: SubcriptionContance_SubcriptionStatus;
  originalPrice: number;
  isLimited: boolean;
  isBuyLimited: boolean;
  totalBuyEachUser: number;
  isLifeTime: boolean;
  dayDuration?: number;
  isActive: boolean;
}

export interface SubcriptionsUpdateDto {
  subcriptionId?: string;
  title?: string;
  description?: string;
  isActive: boolean;
  dayDuration?: number;
}

export interface SubcriptionsViewDto {
  title?: string;
  description?: string;
  target?: SubcriptionContance_SubcriptorTarget;
  status?: SubcriptionContance_SubcriptionStatus;
  isLimited: boolean;
  isBuyLimited: boolean;
  totalBuyEachUser: number;
  isActive: boolean;
}

export interface User_ChildServiceCreateDto {
  userId?: string;
  childServiceId?: string;
  status?: SubcriptionContance_ChildServiceStatus;
  usedTime?: number;
  totalUsageLimit?: number;
  startDate?: string;
  endDate?: string;
}

export interface User_ChildServiceUpdateDto {
  status?: SubcriptionContance_ChildServiceStatus;
  usedTime?: number;
  totalUsageLimit?: number;
  endDate?: string;
}

export interface User_ChildServiceViewDto {
  userId?: string;
  childServiceId?: string;
  status?: SubcriptionContance_ChildServiceStatus;
  isLifeTime: boolean;
  isLimitUsedTime: boolean;
  usedTime?: number;
  totalUsageLimit?: number;
  startDate?: string;
  endDate?: string;
}

export interface User_SubcirptionCreateDto {
  userId?: string;
  subcriptionServiceId?: string;
  status?: SubcriptionContance_SubcriptionStatus;
}

export interface User_SubcirptionUpdateDto {
  user_SubcriptionId?: string;
  endDate?: string;
  status?: SubcriptionContance_SubcriptionStatus;
}

export interface User_SubcirptionViewDto {
  userId?: string;
  subcriptionServiceId?: string;
  startDate?: string;
  endDate?: string;
  status?: SubcriptionContance_SubcriptionStatus;
}
