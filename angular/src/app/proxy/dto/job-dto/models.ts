import type { JobStatus } from '../../constants/job-constant/job-status.enum';
import type { EmploymentType } from '../../constants/job-constant/employment-type.enum';
import type { PositionType } from '../../constants/job-constant/position-type.enum';
import type { ExperienceLevel } from '../../constants/job-constant/experience-level.enum';
import type { RiskJobLevel } from '../../constants/job-constant/risk-job-level.enum';
import type { SalaryFilterType } from './salary-filter-type.enum';
import type { JobDisplayArea } from '../../constants/job-constant/job-display-area.enum';
import type { JobPriorityLevel } from '../../constants/job-constant/job-priority-level.enum';

export interface JobViewDto {
  companyImageUrl?: string;
  companyId: number;
  companyName?: string;
  title?: string;
  status?: JobStatus;
  jobId?: string;
  expiresAt?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryDeal: boolean;
  provinceCode: number;
  districtCode: number;
  employmentType?: EmploymentType;
  positionType?: PositionType;
  experience?: ExperienceLevel;
  jobCategoryId?: string;
}

export interface JobApproveViewDto {
  riskJobLevel?: RiskJobLevel;
  companyImageUrl?: string;
  companyId: number;
  companyName?: string;
  title?: string;
  jobId?: string;
  expiresAt?: string;
  provinceCode: number;
}

export interface JobPostCreateDto {
  title?: string;
  slug?: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryDeal: boolean;
  employmentType?: EmploymentType;
  positionType?: PositionType;
  experience?: ExperienceLevel;
  workTime?: string;
  provinceCode: number;
  districtCode: number;
  wardCode?: number;
  workLocation?: string;
  quantity: number;
  expiresAt?: string;
  jobCategoryId?: string;
}

export interface JobPostStatisticDto {
}

export interface JobPostUpdateDto {
  description?: string;
  requirements?: string;
  benefits?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryDeal: boolean;
  workTime?: string;
  wardCode?: number;
  workLocation?: string;
  quantity: number;
  expiresAt?: string;
  isSetActive: boolean;
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

export interface JobViewWithPriorityDto {
  jobPriorityId?: string;
  displayArea?: JobDisplayArea;
  priorityLevel?: JobPriorityLevel;
  sortScore: number;
  companyImageUrl?: string;
  companyName?: string;
  title?: string;
  status?: JobStatus;
  jobId?: string;
  expiresAt?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryDeal: boolean;
  provinceCode: number;
  districtCode: number;
  employmentType?: EmploymentType;
  positionType?: PositionType;
  experience?: ExperienceLevel;
  jobCategoryId?: string;
}

export interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
}
