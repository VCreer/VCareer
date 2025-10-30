import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * DistrictDto - ĐÚNG 100% với backend .NET
 * Match với VCareer.Dto.Job.DistrictDto
 */
export interface DistrictDto {
  id: number;
  name: string;
  code: string;         // Mã quận/huyện
  provinceId: number;
}

/**
 * ProvinceDto - ĐÚNG 100% với backend .NET
 * Match với VCareer.Dto.Job.ProvinceDto
 */
export interface ProvinceDto {
  id: number;
  name: string;
  code: string;             // Mã tỉnh/thành phố
  districts: DistrictDto[]; // Danh sách quận/huyện
}

/**
 * Location API Service
 * Kết nối với backend .NET LocationController
 * Route: /api/locations
 */
@Injectable({
  providedIn: 'root'
})
export class LocationApiService {
  private apiUrl = `${environment.apis.default.url}/api/locations`;

  constructor(private http: HttpClient) {}

  /**
   * GET /api/locations/provinces
   * Lấy tất cả tỉnh/thành phố với danh sách quận/huyện
   */
  getAllProvinces(): Observable<ProvinceDto[]> {
    return this.http.get<ProvinceDto[]>(`${this.apiUrl}/provinces`);
  }

  /**
   * GET /api/locations/provinces/search?searchTerm={searchTerm}
   * Tìm kiếm tỉnh/thành phố theo tên
   */
  searchProvinces(searchTerm: string): Observable<ProvinceDto[]> {
    return this.http.get<ProvinceDto[]>(`${this.apiUrl}/provinces/search`, {
      params: { searchTerm }
    });
  }
}

