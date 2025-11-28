import type { EmploymentType } from '../../constants/job-constant/employment-type.enum';
import type { PositionType } from '../../constants/job-constant/position-type.enum';
import type { ExperienceLevel } from '../../constants/job-constant/experience-level.enum';
import type { JobViewDto } from '../job-dto/models';

export interface JobViewDetail {
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
  provinceCode: number;
  wardCode?: number;
  workLocation?: string;
  quantity: number;
  viewCount: number;
  postedAt?: string;
  expiresAt?: string;
  applyCount: number;
  jobCategoryId?: string;
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
