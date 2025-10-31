import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface FilterOption {
  id: string;
  name: string;
  value: string;
  count?: number;
}

export interface FilterGroup {
  type: string;
  label: string;
  options: FilterOption[];
}

@Injectable({
  providedIn: 'root'
})
export class FilterService {
  
  private mockFilterData: FilterGroup[] = [
    {
      type: 'location',
      label: 'Địa điểm',
      options: [
        { id: 'hanoi', name: 'Hà Nội', value: 'hanoi', count: 1250 },
        { id: 'hcm', name: 'TP. Hồ Chí Minh', value: 'hcm', count: 2100 },
        { id: 'danang', name: 'Đà Nẵng', value: 'danang', count: 450 },
        { id: 'haiphong', name: 'Hải Phòng', value: 'haiphong', count: 320 },
        { id: 'cantho', name: 'Cần Thơ', value: 'cantho', count: 180 },
        { id: 'binhduong', name: 'Bình Dương', value: 'binhduong', count: 280 },
        { id: 'dongnai', name: 'Đồng Nai', value: 'dongnai', count: 150 },
        { id: 'quangninh', name: 'Quảng Ninh', value: 'quangninh', count: 95 },
        { id: 'thainguyen', name: 'Thái Nguyên', value: 'thainguyen', count: 120 },
        { id: 'hue', name: 'Huế', value: 'hue', count: 85 },
        { id: 'nhatrang', name: 'Nha Trang', value: 'nhatrang', count: 110 },
        { id: 'dalat', name: 'Đà Lạt', value: 'dalat', count: 75 },
        { id: 'vungtau', name: 'Vũng Tàu', value: 'vungtau', count: 90 },
        { id: 'buonmathuot', name: 'Buôn Ma Thuột', value: 'buonmathuot', count: 65 },
        { id: 'pleiku', name: 'Pleiku', value: 'pleiku', count: 45 },
        { id: 'quynhon', name: 'Quy Nhơn', value: 'quynhon', count: 55 },
        { id: 'tuyhoa', name: 'Tuy Hòa', value: 'tuyhoa', count: 40 },
        { id: 'camranh', name: 'Cam Ranh', value: 'camranh', count: 35 },
        { id: 'phanthiet', name: 'Phan Thiết', value: 'phanthiet', count: 50 },
        { id: 'longxuyen', name: 'Long Xuyên', value: 'longxuyen', count: 60 }
      ]
    },
    {
      type: 'district',
      label: 'Quận/Huyện',
      options: [
        { id: 'hanoi', name: 'Hà Nội', value: 'ha noi', count: 0 },
        { id: 'badinh-hn', name: 'Ba Đình', value: 'ba dinh', count: 0 },
        { id: 'hoankiem-hn', name: 'Hoàn Kiếm', value: 'hoan kiem', count: 0 },
        { id: 'haibatrung-hn', name: 'Hai Bà Trưng', value: 'hai ba trung', count: 0 },
        { id: 'dongda-hn', name: 'Đống Đa', value: 'dong da', count: 0 },
        { id: 'tayho-hn', name: 'Tây Hồ', value: 'tay ho', count: 0 },
        { id: 'caugiay-hn', name: 'Cầu Giấy', value: 'cau giay', count: 0 },
        { id: 'thanhxuan-hn', name: 'Thanh Xuân', value: 'thanh xuan', count: 0 },
        { id: 'namtuliem-hn', name: 'Nam Từ Liêm', value: 'nam tu liem', count: 0 },
        { id: 'bactuliem-hn', name: 'Bắc Từ Liêm', value: 'bac tu liem', count: 0 },
        { id: 'hoangmai-hn', name: 'Hoàng Mai', value: 'hoang mai', count: 0 },
        { id: 'longbien-hn', name: 'Long Biên', value: 'long bien', count: 0 },
        { id: 'hadong-hn', name: 'Hà Đông', value: 'ha dong', count: 0 }
      ]
    },
    {
      type: 'salary',
      label: 'Mức lương',
      options: [
        { id: 'under-5m', name: 'Dưới 5 triệu', value: 'under-5m', count: 120 },
        { id: '5-10m', name: '5-10 triệu', value: '5-10m', count: 450 },
        { id: '10-15m', name: '10-15 triệu', value: '10-15m', count: 680 },
        { id: '15-20m', name: '15-20 triệu', value: '15-20m', count: 520 },
        { id: '20-30m', name: '20-30 triệu', value: '20-30m', count: 380 },
        { id: '30-50m', name: '30-50 triệu', value: '30-50m', count: 250 },
        { id: 'over-50m', name: 'Trên 50 triệu', value: 'over-50m', count: 95 }
      ]
    },
    {
      type: 'experience',
      label: 'Kinh nghiệm',
      options: [
        { id: 'intern', name: 'Thực tập sinh', value: 'intern', count: 180 },
        { id: 'fresher', name: 'Fresher (0-1 năm)', value: 'fresher', count: 320 },
        { id: 'junior', name: 'Junior (1-3 năm)', value: 'junior', count: 650 },
        { id: 'middle', name: 'Middle (3-5 năm)', value: 'middle', count: 480 },
        { id: 'senior', name: 'Senior (5-8 năm)', value: 'senior', count: 350 },
        { id: 'lead', name: 'Lead (8+ năm)', value: 'lead', count: 120 }
      ]
    },
    {
      type: 'industry',
      label: 'Ngành nghề',
      options: [
        { id: 'it', name: 'Công nghệ thông tin', value: 'it', count: 1250 },
        { id: 'marketing', name: 'Marketing', value: 'marketing', count: 680 },
        { id: 'sales', name: 'Kinh doanh', value: 'sales', count: 520 },
        { id: 'finance', name: 'Tài chính', value: 'finance', count: 380 },
        { id: 'hr', name: 'Nhân sự', value: 'hr', count: 250 },
        { id: 'design', name: 'Thiết kế', value: 'design', count: 320 },
        { id: 'education', name: 'Giáo dục', value: 'education', count: 180 },
        { id: 'healthcare', name: 'Y tế', value: 'healthcare', count: 150 }
      ]
    }
  ];

  constructor() {}

  /**
   * Lấy tất cả filter options
   */
  getAllFilters(): Observable<FilterGroup[]> {
    return of(this.mockFilterData).pipe(delay(300));
  }

  /**
   * Lấy filter options theo type
   */
  getFilterOptions(type: string): Observable<FilterOption[]> {
    const filterGroup = this.mockFilterData.find(group => group.type === type);
    const options = filterGroup ? filterGroup.options : [];
    return of(options).pipe(delay(200));
  }

  /**
   * Tìm kiếm filter options
   */
  searchFilterOptions(type: string, query: string): Observable<FilterOption[]> {
    const filterGroup = this.mockFilterData.find(group => group.type === type);
    if (!filterGroup) {
      return of([]);
    }

    const filteredOptions = filterGroup.options.filter(option =>
      option.name.toLowerCase().includes(query.toLowerCase())
    );

    return of(filteredOptions).pipe(delay(300));
  }

  /**
   * Lấy filter options phổ biến
   */
  getPopularFilters(type: string, limit: number = 10): Observable<FilterOption[]> {
    const filterGroup = this.mockFilterData.find(group => group.type === type);
    if (!filterGroup) {
      return of([]);
    }

    const popularOptions = filterGroup.options
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, limit);

    return of(popularOptions).pipe(delay(200));
  }
}
