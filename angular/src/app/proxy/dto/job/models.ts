import type { ExperienceLevel } from '../../model/experience-level.enum';
import type { SalaryFilterType } from './salary-filter-type.enum';
import type { EmploymentType } from '../../model/employment-type.enum';
import type { PositionType } from '../../model/position-type.enum';

export interface CategoryTreeDto {
  categoryId?: string;
  categoryName?: string;
  slug?: string;
  description?: string;
  jobCount: number;
  children: CategoryTreeDto[];
  fullPath?: string;
  isLeaf: boolean;
}

export interface DistrictDto {
  id: number;
  name?: string;
  code?: string;
  provinceId: number;
}

export interface JobSearchInputDto {
  keyword?: string;
  categoryIds: string[];
  provinceIds: number[];
  districtIds: number[];
  experienceFilter?: ExperienceLevel;
  salaryFilter?: SalaryFilterType;
  employmentTypes?: EmploymentType[];
  positionTypes?: PositionType[];
  isUrgent?: boolean;
  sortBy?: string;
  skipCount: number;
  maxResultCount: number;
}

export interface JobViewDetail {
  id?: string;
  slug?: string;
  title?: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  companyLogo?: string;
  companyName?: string;
  salaryText?: string;
  experienceText?: string;
  quantity: number;
  categoryName?: string;
  provinceName?: string;
  districtName?: string;
  workLocation?: string;
  employmentType?: EmploymentType;
  positionType?: PositionType;
  isUrgent: boolean;
  postedAt?: string;
  expiresAt?: string;
  viewCount: number;
  applyCount: number;
}

export interface JobViewDto {
  id?: string;
  title?: string;
  salaryText?: string;
  experienceText?: string;
  categoryName?: string;
  workLocation?: string;
  isUrgent: boolean;
  postedAt?: string;
  expiresAt?: string;
}

export interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
}

export interface ProvinceDto {
  id: number;
  name?: string;
  code?: string;
  districts: DistrictDto[];
}
