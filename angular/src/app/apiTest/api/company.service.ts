import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Company {
  id: string;
  name: string;
  logo: string;
  description: string;
  industry: string;
  size: string;
  location: string;
  website: string;
  foundedYear: number;
  benefits: string[];
  culture: string[];
  jobsCount: number;
  rating: number;
  reviews: number;
}

export interface CompanyFilters {
  industry?: string;
  size?: string;
  location?: string;
  page?: number;
  limit?: number;
}

/**
 * DTO để hiển thị thông tin công ty trong trang job detail
 */
export interface CompanyInfoForJobDetailDto {
  id: number;
  companyName?: string;
  logoUrl?: string;
  companySize: number;
  headquartersAddress?: string;
  industries: string[];
}

export interface CompanyLegalInfoDto {
  id: number;
  companyName: string;
  companyCode?: string;
  description?: string;
  headquartersAddress?: string;
  contactEmail?: string;
  contactPhone?: string;
  status?: boolean;
  companySize?: number;
  industryId?: number;
  foundedYear?: number;
  logoUrl?: string;
  coverImageUrl?: string;
  websiteUrl?: string;
}

export interface CompanySearchInputDto {
  keyword?: string;
  status?: boolean;
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
}

export interface PagedResultDto<T> {
  totalCount: number;
  items: T[];
}

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private apiUrl = `${environment.apis.default.url}`;
  
  private mockCompanies: Company[] = [
    {
      id: '1',
      name: 'TechCorp Vietnam',
      logo: 'assets/images/companies/techcorp.png',
      description: 'Công ty công nghệ hàng đầu Việt Nam, chuyên về phát triển phần mềm và AI.',
      industry: 'Công nghệ thông tin',
      size: '500-1000 nhân viên',
      location: 'Hồ Chí Minh',
      website: 'https://techcorp.vn',
      foundedYear: 2015,
      benefits: ['Bảo hiểm y tế', 'Lương tháng 13', 'Nghỉ phép có lương', 'Đào tạo nâng cao'],
      culture: ['Năng động', 'Sáng tạo', 'Hợp tác', 'Phát triển'],
      jobsCount: 25,
      rating: 4.5,
      reviews: 128
    },
    {
      id: '2',
      name: 'Digital Agency',
      logo: 'assets/images/companies/digital-agency.png',
      description: 'Công ty marketing số chuyên nghiệp, cung cấp dịch vụ digital marketing toàn diện.',
      industry: 'Marketing',
      size: '50-100 nhân viên',
      location: 'Hà Nội',
      website: 'https://digitalagency.com',
      foundedYear: 2018,
      benefits: ['Thưởng KPI', 'Đào tạo nâng cao', 'Môi trường năng động', 'Làm việc linh hoạt'],
      culture: ['Sáng tạo', 'Năng động', 'Trẻ trung', 'Học hỏi'],
      jobsCount: 12,
      rating: 4.2,
      reviews: 45
    },
    {
      id: '3',
      name: 'StartupXYZ',
      logo: 'assets/images/companies/startup-xyz.png',
      description: 'Startup công nghệ tiên phong trong lĩnh vực fintech và blockchain.',
      industry: 'Công nghệ thông tin',
      size: '10-50 nhân viên',
      location: 'Đà Nẵng',
      website: 'https://startupxyz.com',
      foundedYear: 2020,
      benefits: ['Cổ phần công ty', 'Làm việc linh hoạt', 'Thưởng dự án', 'Môi trường startup'],
      culture: ['Sáng tạo', 'Nhanh nhẹn', 'Học hỏi', 'Đổi mới'],
      jobsCount: 8,
      rating: 4.8,
      reviews: 23
    }
  ];

  constructor(private http: HttpClient) {}

  getCompanies(filters?: CompanyFilters): Observable<{ companies: Company[], total: number }> {
    let filteredCompanies = [...this.mockCompanies];

    if (filters?.industry) {
      filteredCompanies = filteredCompanies.filter(company => 
        company.industry.toLowerCase().includes(filters.industry!.toLowerCase())
      );
    }

    if (filters?.size) {
      filteredCompanies = filteredCompanies.filter(company => 
        company.size.toLowerCase().includes(filters.size!.toLowerCase())
      );
    }

    if (filters?.location) {
      filteredCompanies = filteredCompanies.filter(company => 
        company.location.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);

    return of({
      companies: paginatedCompanies,
      total: filteredCompanies.length
    }).pipe(delay(500));
  }

  // (removed mock getCompanyById)

  getCompanyJobs(companyId: string): Observable<any[]> {
    // Return jobs for specific company
    return of([
      {
        id: 1,
        title: 'Senior Frontend Developer',
        location: 'Hồ Chí Minh',
        salary: '25-35 triệu',
        type: 'Full-time',
        postedAt: '2 giờ trước'
      },
      {
        id: 2,
        title: 'Backend Developer',
        location: 'Hồ Chí Minh',
        salary: '20-30 triệu',
        type: 'Full-time',
        postedAt: '1 ngày trước'
      }
    ]).pipe(delay(400));
  }

  followCompany(companyId: string): Observable<{ success: boolean }> {
    return of({ success: true }).pipe(delay(300));
  }

  unfollowCompany(companyId: string): Observable<{ success: boolean }> {
    return of({ success: true }).pipe(delay(300));
  }

  getFollowedCompanies(): Observable<Company[]> {
    return of(this.mockCompanies.slice(0, 2)).pipe(delay(300));
  }

  /**
   * GET /api/profile/company-legal-info/by-job/{jobId}
   * Lấy thông tin công ty theo Job ID (để hiển thị trong trang job detail)
   */
  getCompanyByJobId(jobId: string): Observable<CompanyInfoForJobDetailDto> {
    if (!jobId) {
      return throwError(() => new Error('JobId is required'));
    }
    
    const url = `${this.apiUrl}/api/profile/company-legal-info/by-job/${jobId}`;
    
    return this.http.get<CompanyInfoForJobDetailDto>(url).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * GET /api/profile/company-legal-info/{companyId}
   * Lấy thông tin chi tiết công ty theo CompanyId
   */
  getCompanyById(companyId: number | string): Observable<CompanyLegalInfoDto> {
    const url = `${this.apiUrl}/api/profile/company-legal-info/${companyId}`;
    return this.http.get<CompanyLegalInfoDto>(url);
  }

  /**
   * POST /api/profile/company-legal-info/search
   * Tìm kiếm danh sách công ty
   */
  searchCompanies(input: CompanySearchInputDto): Observable<PagedResultDto<CompanyLegalInfoDto>> {
    const url = `${this.apiUrl}/api/profile/company-legal-info/search`;
    
    // Đảm bảo các giá trị không phải undefined và đúng kiểu dữ liệu
    // ABP Framework giới hạn MaxResultCount tối đa 1000
    let skipCount = input.skipCount ?? 0;
    let maxResultCount = input.maxResultCount ?? 10;
    
    // Đảm bảo là number, không phải string hoặc undefined
    skipCount = Number(skipCount);
    maxResultCount = Number(maxResultCount);
    
    // Validate và giới hạn maxResultCount
    if (isNaN(skipCount) || skipCount < 0) {
      skipCount = 0;
    }
    if (isNaN(maxResultCount) || maxResultCount <= 0) {
      maxResultCount = 10;
    }
    if (maxResultCount > 1000) {
      console.warn('[CompanyService] MaxResultCount exceeds 1000, capping at 1000');
      maxResultCount = 1000;
    }
    
    // Build request body - chỉ include các field có giá trị hợp lệ
    const requestBody: any = {
      skipCount: skipCount,
      maxResultCount: maxResultCount
    };
    
    // Keyword - luôn gửi (empty string hoặc string)
    // Backend có thể yêu cầu field này, nên luôn gửi (empty string nếu không có để tránh validation error)
    if (input.keyword && typeof input.keyword === 'string' && input.keyword.trim().length > 0) {
      requestBody.keyword = input.keyword.trim();
    } else {
      // Gửi empty string thay vì null hoặc không gửi field
      // Backend sẽ xử lý empty string như "không filter"
      requestBody.keyword = '';
    }
    
    // Status - luôn gửi nếu có giá trị
    if (input.status !== undefined && input.status !== null) {
      requestBody.status = Boolean(input.status);
    }
    
    // Sorting - chỉ gửi nếu có giá trị
    if (input.sorting && typeof input.sorting === 'string' && input.sorting.trim().length > 0) {
      requestBody.sorting = input.sorting.trim();
    }
    
    console.log('[CompanyService] Request body:', JSON.stringify(requestBody, null, 2));
    console.log('[CompanyService] Request body types:', {
      skipCount: typeof requestBody.skipCount,
      maxResultCount: typeof requestBody.maxResultCount,
      keyword: typeof requestBody.keyword,
      status: typeof requestBody.status
    });
    
    return this.http.post<PagedResultDto<CompanyLegalInfoDto>>(url, requestBody).pipe(
      catchError(error => {
        console.error('[CompanyService] Error searching companies:', error);
        console.error('[CompanyService] Error response body:', error.error);
        console.error('[CompanyService] Error status:', error.status);
        
        // Log chi tiết validation errors
        if (error.error && error.error.errors) {
          console.error('[CompanyService] Validation errors:', JSON.stringify(error.error.errors, null, 2));
          Object.keys(error.error.errors || {}).forEach(key => {
            console.error(`[CompanyService] ${key}:`, error.error.errors[key]);
          });
        }
        
        return throwError(() => error);
      })
    );
  }
}
