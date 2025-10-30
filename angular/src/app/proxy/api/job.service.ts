// import { Injectable } from '@angular/core';
// import { HttpClient, HttpParams } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { environment } from '../../../environments/environment';

// // ============================================
// // ENUMS - MATCH 100% VỚI .NET
// // ============================================

// /**
//  * EmploymentType enum - Match với VCareer.Model.EmploymentType
//  */
// export enum EmploymentType {
//   PartTime = 1,
//   FullTime = 2,
//   Internship = 3,
//   Contract = 4,
//   Freelance = 5,
//   Other = 6
// }

// /**
//  * PositionType enum - Match với VCareer.Model.PositionType
//  */
// export enum PositionType {
//   Employee = 1,
//   TeamLead = 2,
//   Manager = 3,
//   Supervisor = 4,
//   BranchManager = 5,
//   DeputyDirector = 6,
//   Director = 7,
//   Intern = 8,
//   Specialist = 9,
//   SeniorSpecialist = 10,
//   Expert = 11,
//   Consultant = 12
// }

// /**
//  * ExperienceLevel enum - Match với VCareer.Model.ExperienceLevel
//  */
// export enum ExperienceLevel {
//   None = 0,
//   Under1 = 1,
//   Year1 = 2,
//   Year2 = 3,
//   Year3 = 4,
//   Year4 = 5,
//   Year5 = 6,
//   Year6 = 7,
//   Year7 = 8,
//   Year8 = 9,
//   Year9 = 10,
//   Year10 = 11,
//   Over10 = 12
// }

// /**
//  * SalaryFilterType enum - Match với VCareer.Dto.Job.SalaryFilterType
//  */
// export enum SalaryFilterType {
//   All = 0,
//   Under10 = 1,
//   Range10To15 = 2,
//   Range15To20 = 3,
//   Range20To30 = 4,
//   Range30To50 = 5,
//   Over50 = 6,
//   Deal = 7
// }

// // ============================================
// // DTOs - MATCH 100% VỚI .NET
// // ============================================

// /**
//  * JobSearchInputDto - Match với VCareer.Dto.Job.JobSearchInputDto
//  */
// export interface JobSearchInputDto {
//   keyword?: string | null;
//   categoryIds?: string[] | null;  // List<Guid> → string[] in Angular
//   provinceIds?: number[] | null;
//   districtIds?: number[] | null;
//   experienceFilter?: ExperienceLevel | null;
//   salaryFilter?: SalaryFilterType | null;
//   employmentTypes?: EmploymentType[] | null;
//   positionTypes?: PositionType[] | null;
//   isUrgent?: boolean | null;
//   sortBy?: string;  // default: "relevance"
//   skipCount?: number;  // default: 0
//   maxResultCount?: number;  // default: 20
// }

// /**
//  * JobViewDto - Match với VCareer.Dto.Job.JobViewDto
//  */
// export interface JobViewDto {
//   id: string;  // Guid
//   title: string;
//   salaryText: string;
//   experienceText: string;
//   categoryName?: string | null;

//   isUrgent: boolean;
//   postedAt: Date;
//   provinceName?: string | null;
// }

// /**
//  * PagedResultDto - Match với VCareer.Dto.Job.PagedResultDto<T>
//  */
// export interface PagedResultDto<T> {
//   items: T[];
//   totalCount: number;
// }

// // ============================================
// // JOB API SERVICE
// // ============================================

// @Injectable({
//   providedIn: 'root'
// })
// export class JobApiService {
//   private apiUrl = `${environment.apis.default.url}/api/jobs`;

//   constructor(private http: HttpClient) {}

//   /**
//    * POST /api/jobs/search
//    * Search jobs với filters
//    */
//   searchJobs(input: JobSearchInputDto): Observable<PagedResultDto<JobViewDto>> {
//     const url = `${this.apiUrl}/search`;
//     console.log('\n🌐 ===== HTTP REQUEST IN SERVICE =====');
//     console.log('   Method: POST');
//     console.log('   URL:', url);
//     console.log('   Body:', input);
//     console.log('   Full API URL:', this.apiUrl);

//     return this.http.post<PagedResultDto<JobViewDto>>(url, input);
//   }

//   /**
//    * GET /api/jobs/slug/{slug}
//    * Lấy chi tiết job theo slug
//    */
//   getJobBySlug(slug: string): Observable<any> {
//     return this.http.get<any>(`${this.apiUrl}/slug/${slug}`);
//   }

//   /**
//    * GET /api/jobs/{id}
//    * Lấy chi tiết job theo ID
//    */
//   getJobById(jobId: string): Observable<any> {
//     return this.http.get<any>(`${this.apiUrl}/${jobId}`);
//   }

//   /**
//    * GET /api/jobs/{id}/related
//    * Lấy các job liên quan
//    */
//   getRelatedJobs(jobId: string, maxCount: number = 10): Observable<JobViewDto[]> {
//     return this.http.get<JobViewDto[]>(`${this.apiUrl}/${jobId}/related`, {
//       params: { maxCount: maxCount.toString() }
//     });
//   }
// }
