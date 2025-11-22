import type { EmploymentType } from '../../constants/job-constant/employment-type.enum';
import type { PositionType } from '../../constants/job-constant/position-type.enum';
import type { JobViewDto } from '../job-dto/models';

export interface JobViewDetail {
  id?: string;
  slug?: string;
  title?: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  companyLogo?: string;
  companyId: number;
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
  applyCount: number;
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
