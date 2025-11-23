import type { EmploymentType } from '../../constants/job-constant/employment-type.enum';
import type { PositionType } from '../../constants/job-constant/position-type.enum';
import type { ExperienceLevel } from '../../constants/job-constant/experience-level.enum';
import type { JobStatus } from '../../constants/job-constant/job-status.enum';
import type { JobPriorityLevel } from '../../constants/job-constant/job-priority-level.enum';
import type { RecruiterLevel } from '../../constants/job-constant/recruiter-level.enum';
import type { RiskJobLevel } from '../../constants/job-constant/risk-job-level.enum';
import type { SalaryFilterType } from '../../constants/job-constant/salary-filter-type.enum';
import type { SortByField } from '../../constants/job-constant/sort-by-field.enum';
import type { JobDisplayArea } from '../../constants/job-constant/job-display-area.enum';

export interface JobApproveViewDto {
  id?: string;
  companyImageUrl?: string;
  companyId: number;
  companyName?: string;
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
  provinceName?: string;
  wardName?: string;
  workLocation?: string;
  quantity: number;
  status?: JobStatus;
  priorityLevel?: JobPriorityLevel;
  recruiterLevel?: RecruiterLevel;
  riskJobLevel?: RiskJobLevel;
  rejectedReason?: string;
  postedAt?: string;
  expiresAt?: string;
  jobCategoryId?: string;
  categoryName?: string;
}

export interface JobFilterDto {
  priorityLevel?: JobPriorityLevel;
  recruiterLevel?: RecruiterLevel;
  riskJobLevel?: RiskJobLevel;
  page: number;
  pageSize: number;
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
  provinceCode: number[];
  wardCode: number[];
  experienceFilter?: ExperienceLevel;
  salaryFilter?: SalaryFilterType;
  employmentTypes?: EmploymentType[];
  positionTypes?: PositionType[];
  sortBy?: SortByField;
  skipCount: number;
  maxResultCount: number;
}

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
