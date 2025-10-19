import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FilterService } from '../../proxy/api/filter.service';

export interface FilterOption {
  id: string;
  name: string;
  value: string;
}

@Injectable({
  providedIn: 'root'
})
export class FilterOptionsService {

  constructor(private filterService: FilterService) {}

  // Lấy danh sách địa điểm
  getLocations(): Observable<FilterOption[]> {
    return this.filterService.getFilterOptions('location');
  }

  // Lấy danh sách mức lương
  getSalaryRanges(): Observable<FilterOption[]> {
    return this.filterService.getFilterOptions('salary');
  }

  // Lấy danh sách kinh nghiệm
  getExperienceLevels(): Observable<FilterOption[]> {
    return this.filterService.getFilterOptions('experience');
  }

  // Lấy danh sách ngành nghề
  getIndustries(): Observable<FilterOption[]> {
    return this.filterService.getFilterOptions('industry');
  }

  // Lấy tất cả filter options theo loại
  getFilterOptions(filterType: string): Observable<FilterOption[]> {
    switch (filterType) {
      case 'Địa điểm':
        // Tạm thời map 'Địa điểm' sang danh sách Quận/Huyện để UI lọc theo huyện
        return this.filterService.getFilterOptions('district');
      case 'Mức lương':
        return this.getSalaryRanges();
      case 'Kinh nghiệm':
        return this.getExperienceLevels();
      case 'Ngành nghề':
        return this.getIndustries();
      default:
        return this.filterService.getFilterOptions(filterType.toLowerCase());
    }
  }
}