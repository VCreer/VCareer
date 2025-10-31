import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * CategoryTreeDto - ĐÚNG 100% với backend .NET
 * Match với VCareer.Dto.Job.CategoryTreeDto
 */
export interface CategoryTreeDto {
  categoryId: string;           // Guid
  categoryName: string;
  slug: string;
  description: string;
  jobCount: number;
  children: CategoryTreeDto[];  // Recursive structure
  fullPath: string;             // Đường dẫn đầy đủ từ root đến node này
  isLeaf: boolean;              // Có phải là leaf node không
}

/**
 * Category API Service
 * Kết nối với backend .NET JobCategoryController
 * Route: /api/job-categories
 */
@Injectable({
  providedIn: 'root'
})
export class CategoryApiService {
  private apiUrl = `${environment.apis.default.url}/api/job-categories`;

  constructor(private http: HttpClient) {}

  /**
   * GET /api/job-categories/tree
   * Lấy cây phân cấp category đầy đủ với số lượng job
   */
  getCategoryTree(): Observable<CategoryTreeDto[]> {
    return this.http.get<CategoryTreeDto[]>(`${this.apiUrl}/tree`);
  }

  /**
   * GET /api/job-categories/search?keyword={keyword}
   * Tìm kiếm category theo từ khóa
   * Trả về danh sách các leaf categories có path chứa từ khóa
   */
  searchCategories(keyword: string): Observable<CategoryTreeDto[]> {
    return this.http.get<CategoryTreeDto[]>(`${this.apiUrl}/search`, {
      params: { keyword }
    });
  }
}

