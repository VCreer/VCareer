import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ============================================
// ENUMS - MATCH 100% VỚI .NET
// ============================================

/**
 * EmploymentType enum - Match với VCareer.Model.EmploymentType
 */
export enum EmploymentType {
  PartTime = 1,
  FullTime = 2,
  Internship = 3,
  Contract = 4,
  Freelance = 5,
  Other = 6
}

/**
 * PositionType enum - Match với VCareer.Model.PositionType
 */
export enum PositionType {
  Employee = 1,
  TeamLead = 2,
  Manager = 3,
  Supervisor = 4,
  BranchManager = 5,
  DeputyDirector = 6,
  Director = 7,
  Intern = 8,
  Specialist = 9,
  SeniorSpecialist = 10,
  Expert = 11,
  Consultant = 12
}

/**
 * ExperienceLevel enum - Match với VCareer.Model.ExperienceLevel
 */
export enum ExperienceLevel {
  None = 0,
  Under1 = 1,
  Year1 = 2,
  Year2 = 3,
  Year3 = 4,
  Year4 = 5,
  Year5 = 6,
  Year6 = 7,
  Year7 = 8,
  Year8 = 9,
  Year9 = 10,
  Year10 = 11,
  Over10 = 12
}

/**
 * EducationLevel enum - Match với VCareer.Model.EducationLevel
 */
export enum EducationLevel {
  Any = 0,
  HighSchool = 1,
  College = 2,
  University = 3,
  Master = 4,
  Doctor = 5
}

/**
 * SalaryFilterType enum - Match với VCareer.Dto.Job.SalaryFilterType
 */
export enum SalaryFilterType {
  All = 0,
  Under10 = 1,
  Range10To15 = 2,
  Range15To20 = 3,
  Range20To30 = 4,
  Range30To50 = 5,
  Over50 = 6,
  Deal = 7
}

// ============================================
// DTOs - MATCH 100% VỚI .NET
// ============================================

/**
 * JobSearchInputDto - Match với VCareer.Dto.Job.JobSearchInputDto
 */
export interface JobSearchInputDto {
  keyword?: string | null;
  categoryIds?: string[] | null;  // List<Guid> → string[] in Angular
  provinceIds?: number[] | null;
  districtIds?: number[] | null;
  experienceFilter?: ExperienceLevel | null;
  salaryFilter?: SalaryFilterType | null;
  employmentTypes?: EmploymentType[] | null;
  positionTypes?: PositionType[] | null;
  isUrgent?: boolean | null;
  sortBy?: string;  // default: "relevance"
  skipCount?: number;  // default: 0
  maxResultCount?: number;  // default: 20
}

/**
 * JobViewDto - Match với VCareer.Dto.Job.JobViewDto
 */
export interface JobViewDto {
  id: string;  // Guid
  title: string;
  salaryText: string;
  experienceText: string;
  categoryName?: string | null;
  
  isUrgent: boolean;
  postedAt: Date;
  provinceName?: string | null;
  isSaved?: boolean; // đã lưu bởi user hiện tại
}

/**
 * PagedResultDto - Match với VCareer.Dto.Job.PagedResultDto<T>
 */
export interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
}

/**
 * Category breadcrumb item (cấp 1 -> cấp 3)
 */
export interface CategoryItemDto {
  id: string;
  name: string;
  slug: string;
}

/**
 * JobViewDetail - Match với VCareer.Dto.Job.JobViewDetail
 */
export interface JobViewDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  requirements: string;
  benefits?: string | null;
  salaryText: string;
  experienceText: string;
  quantity: number;
  provinceName?: string | null;
  workLocation?: string | null;
  employmentType: EmploymentType;
  positionType: PositionType;
  education: EducationLevel;
  isUrgent: boolean;
  postedAt: Date;
  expiresAt: Date;
  viewCount: number;
  applyCount: number;
  categoryPath: CategoryItemDto[];
  isSaved?: boolean; // đã lưu bởi user hiện tại
}

// ============================================
// JOB API SERVICE
// ============================================

@Injectable({
  providedIn: 'root'
})
export class JobApiService {
  private apiUrl = `${environment.apis.default.url}/api/jobs`;

  constructor(private http: HttpClient) {}

  /**
   * POST /api/jobs/search
   * Search jobs với filters
   */
  searchJobs(input: JobSearchInputDto): Observable<PagedResultDto<JobViewDto>> {
    const url = `${this.apiUrl}/search`;
    console.log('\n🌐 ===== HTTP REQUEST IN SERVICE =====');
    console.log('   Method: POST');
    console.log('   URL:', url);
    console.log('   Body:', input);
    console.log('   Full API URL:', this.apiUrl);
    
    return this.http.post<PagedResultDto<JobViewDto>>(url, input);
  }

  /**
   * GET /api/jobs/slug/{slug}
   * Lấy chi tiết job theo slug
   */
  getJobBySlug(slug: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/slug/${slug}`);
  }

  /**
   * GET /api/jobs/{id}
   * Lấy chi tiết job theo ID
   */
  getJobById(jobId: string): Observable<JobViewDetail> {
    return this.http.get<JobViewDetail>(`${this.apiUrl}/${jobId}`);
  }

  /**
   * GET /api/jobs/{id}/related
   * Lấy các job liên quan
   */
  getRelatedJobs(jobId: string, maxCount: number = 10): Observable<JobViewDto[]> {
    return this.http.get<JobViewDto[]>(`${this.apiUrl}/${jobId}/related`, {
      params: { maxCount: maxCount.toString() }
    });
  }

  /**
   * POST /api/jobs/{jobId}/save
   * Lưu job vào danh sách yêu thích
   */
  saveJob(jobId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${jobId}/save`, {});
  }

  /**
   * DELETE /api/jobs/{jobId}/save
   * Bỏ lưu job khỏi danh sách yêu thích
   */
  unsaveJob(jobId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${jobId}/save`);
  }

  /**
   * GET /api/jobs/{jobId}/save-status
   * Kiểm tra xem job đã được lưu chưa
   */
  getSavedJobStatus(jobId: string): Observable<{ isSaved: boolean; savedAt?: string }> {
    return this.http.get<{ isSaved: boolean; savedAt?: string }>(`${this.apiUrl}/${jobId}/save-status`);
  }
}
