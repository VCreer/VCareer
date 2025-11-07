import type { ExperienceLevel } from '../../model/experience-level.enum';
import type { SalaryFilterType } from './salary-filter-type.enum';
import type { EmploymentType } from '../../model/employment-type.enum';
import type { PositionType } from '../../model/position-type.enum';
import type { EducationLevel } from '../../model/education-level.enum';

export interface CategoryItemDto {
  id?: string;
  name?: string;
  slug?: string;
}

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
  education?: EducationLevel;
  categoryPath: CategoryItemDto[];
  isSaved: boolean;
}

export interface JobViewDto {
  id?: string;
  title?: string;
  companyName?: string;
  salaryText?: string;
  experienceText?: string;
  categoryName?: string;
  provinceName?: string;
  isUrgent: boolean;
  postedAt?: string;
  expiresAt?: string;
  isSaved: boolean;
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

export interface SavedJobDto {
  jobId?: string;
  jobTitle?: string;
  companyName?: string;
  salaryText?: string;
  location?: string;
  savedAt?: string;
  jobDetail: JobViewDto;
}

export interface SavedJobStatusDto {
  isSaved: boolean;
  savedAt?: string;
}
