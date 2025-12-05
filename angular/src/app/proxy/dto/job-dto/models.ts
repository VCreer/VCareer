import type { EmploymentType } from '../../constants/job-constant/employment-type.enum';
import type { PositionType } from '../../constants/job-constant/position-type.enum';
import type { ExperienceLevel } from '../../constants/job-constant/experience-level.enum';
import type { JobStatus } from '../../constants/job-constant/job-status.enum';
import type { JobPriorityLevel } from '../../constants/job-constant/job-priority-level.enum';
import type { RecruiterLevel } from '../../constants/job-constant/recruiter-level.enum';
import type { RiskJobLevel } from '../../constants/job-constant/risk-job-level.enum';

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
  recruitmentCampaignId?: string;
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
  tagIds: number[];
  expiresAt?: string;
  jobCategoryId?: string;
}

export interface JobPostStatisticDto {
}

export interface JobPostUpdateDto {
  id?: string;
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
  tagIds: number[];
  expiresAt?: string;
  jobCategoryId?: string;
}

export interface JobSearchInputDto {
  keyword?: string;
  categoryIds: string[];
  provinceCodes: number[];
  wardCodes: number[];
  experienceFilter?: ExperienceLevel;
  minSalary?: number;
  maxSalary?: number;
  salaryDeal?: boolean;
  employmentTypes?: EmploymentType[];
  positionTypes?: PositionType[];
  skipCount: number;
  maxResultCount: number;
}

export interface JobTagViewDto {
  jobId?: string;
  tagId: number;
}

export interface JobTagViewDto_JobTagCreateUpdateDto {
  jobId?: string;
  tagIds: number[];
}

export interface JobViewDto {
  companyImageUrl?: string;
  companyId: number;
  companyName?: string;
  title?: string;
  status?: JobStatus;
  id?: string;
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

export interface PostJobDto {
  jobId?: string;
  childServiceIds: string[];
}

export interface RecruimentCampainCreateDto {
  name?: string;
  isActive: boolean;
  description?: string;
}

export interface RecruimentCampainUpdateDto {
  id?: string;
  name?: string;
  description?: string;
}

export interface RecruimentCampainViewDto {
  id?: string;
  name?: string;
  isActive: boolean;
  description?: string;
  companyId: number;
  creationTime?: string;
  creatorId?: string;
  lastModificationTime?: string;
  lastModifierId?: string;
}
