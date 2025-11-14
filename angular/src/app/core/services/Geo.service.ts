import { Injectable } from '@angular/core';
import { RestService, Rest } from '@abp/ng.core';
import type { ProvinceDto, DistrictDto, WardDto } from '../../proxy/dto/geo-dto';
import { map, shareReplay } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GeoService {
  apiName = 'Default';
  private provincesCache$?: Observable<ProvinceDto[]>;

  constructor(private restService: RestService) {}

  /** Lấy danh sách tỉnh (có cache) */
  getProvinces(config?: Partial<Rest.Config>): Observable<ProvinceDto[]> {
    if (!this.provincesCache$) {
      this.provincesCache$ = this.restService.request<any, ProvinceDto[]>(
        {
          method: 'GET',
          url: '/api/app/geo/provinces',
        },
        { apiName: this.apiName, ...config }
      ).pipe(shareReplay(1)); // cache dữ liệu
    }
    return this.provincesCache$;
  }

  /** Lấy danh sách quận theo mã tỉnh */
  getDistrictsByProvince(provinceCode: number): Observable<DistrictDto[]> {
    return this.getProvinces().pipe(
      map(provinces => {
        const province = provinces.find(p => p.code === provinceCode);
        return province ? province.districts || [] : [];
      })
    );
  }

  /** Lấy danh sách phường theo mã quận */
  getWardsByDistrict(districtCode: number): Observable<WardDto[]> {
    return this.getProvinces().pipe(
      map(provinces => {
        for (const province of provinces) {
          const district = province.districts?.find(d => d.code === districtCode);
          if (district) return district.wards || [];
        }
        return [];
      })
    );
  }

  /** Xóa cache nếu cần reload lại dữ liệu */
  clearCache() {
    this.provincesCache$ = undefined;
  }
}
