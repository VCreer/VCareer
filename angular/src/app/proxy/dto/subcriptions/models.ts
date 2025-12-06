import type { SubcriptionContance_ServiceAction } from '../../constants/job-constant/subcription-contance-service-action.enum';
import type { SubcriptionContance_ServiceTarget } from '../../constants/job-constant/subcription-contance-service-target.enum';
import type { PagingDto } from '../../iservices/common/models';
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

export interface ChildServiceGetDto {
  serviceAction?: SubcriptionContance_ServiceAction;
  target?: SubcriptionContance_ServiceTarget;
  pagingDto: PagingDto;
  isActive?: boolean;
}

export interface ChildServiceUpdateDto {
  cHildServiceId?: string;
  name?: string;
  description?: string;
  isActive: boolean;
}

export interface ChildServiceViewDto {
  id?: string;
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
  user_ChildServiceId?: string;
  jobPostId?: string;
  childServiceId?: string;
}

export interface EffectingJobServiceUpdateDto {
  effectingJobServiceId?: string;
  endDate?: string;
  status?: SubcriptionContance_ChildServiceStatus;
}

export interface EffectingJobServiceViewDto {
  effectingJobServiceId?: string;
  jobPostId?: string;
  childServiceId?: string;
  action?: SubcriptionContance_ServiceAction;
  target?: SubcriptionContance_ServiceTarget;
  status?: SubcriptionContance_ChildServiceStatus;
  value?: number;
  startDate?: string;
  endDate?: string;
}

export interface SubcriptionPriceCreateDto {
  subcriptionServiceId?: string;
  salePercent: number;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface SubcriptionPriceUpdateDto {
  subcriptionPriceId?: string;
  subcriptionServiceId?: string;
  salePercent: number;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface SubcriptionPriceViewDto {
  subcriptionServiceId?: string;
  originalPrice: number;
  salePercent: number;
  type?: SubcriptionContance_CurrencyType;
  isExpried: boolean;
  isActive: boolean;
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
  id?: string;
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
