import { Injectable } from '@angular/core';
import { SelectOption } from '../components/select-field/select-field';

@Injectable({
  providedIn: 'root'
})
export class JobOptionsService {
  // Salary range options
  readonly SALARY_OPTIONS: SelectOption[] = [
    { value: 'under-5', label: 'Dưới 5 triệu' },
    { value: '5-10', label: '5 - 10 triệu' },
    { value: '10-15', label: '10 - 15 triệu' },
    { value: '15-20', label: '15 - 20 triệu' },
    { value: '20-25', label: '20 - 25 triệu' },
    { value: '25-30', label: '25 - 30 triệu' },
    { value: '30-40', label: '30 - 40 triệu' },
    { value: '40-50', label: '40 - 50 triệu' },
    { value: '50-70', label: '50 - 70 triệu' },
    { value: '70-100', label: '70 - 100 triệu' },
    { value: 'over-100', label: 'Trên 100 triệu' },
    { value: 'negotiable', label: 'Thỏa thuận' }
  ];

  // Experience level options
  readonly EXPERIENCE_OPTIONS: SelectOption[] = [
    { value: 'intern', label: 'Thực tập sinh / Sinh viên' },
    { value: '0-1', label: 'Chưa có kinh nghiệm' },
    { value: '1-2', label: '1 - 2 năm' },
    { value: '2-3', label: '2 - 3 năm' },
    { value: '3-5', label: '3 - 5 năm' },
    { value: '5-7', label: '5 - 7 năm' },
    { value: '7-10', label: '7 - 10 năm' },
    { value: 'over-10', label: 'Trên 10 năm' }
  ];

  // Location options (common Vietnamese cities)
  readonly LOCATION_OPTIONS: SelectOption[] = [
    { value: 'hanoi', label: 'Hà Nội' },
    { value: 'hcm', label: 'TP. Hồ Chí Minh' },
    { value: 'danang', label: 'Đà Nẵng' },
    { value: 'haiphong', label: 'Hải Phòng' },
    { value: 'cantho', label: 'Cần Thơ' },
    { value: 'other', label: 'Tỉnh thành khác' }
  ];

  // Province/City options (Tỉnh/Thành phố)
  readonly PROVINCE_OPTIONS: SelectOption[] = [
    { value: 'hanoi', label: 'Hà Nội' },
    { value: 'hcm', label: 'TP. Hồ Chí Minh' },
    { value: 'danang', label: 'Đà Nẵng' },
    { value: 'haiphong', label: 'Hải Phòng' },
    { value: 'cantho', label: 'Cần Thơ' },
    { value: 'an-giang', label: 'An Giang' },
    { value: 'ba-ria-vung-tau', label: 'Bà Rịa - Vũng Tàu' },
    { value: 'bac-lieu', label: 'Bạc Liêu' },
    { value: 'bac-kan', label: 'Bắc Kạn' },
    { value: 'bac-giang', label: 'Bắc Giang' },
    { value: 'bac-ninh', label: 'Bắc Ninh' },
    { value: 'ben-tre', label: 'Bến Tre' },
    { value: 'binh-dinh', label: 'Bình Định' },
    { value: 'binh-duong', label: 'Bình Dương' },
    { value: 'binh-phuoc', label: 'Bình Phước' },
    { value: 'binh-thuan', label: 'Bình Thuận' },
    { value: 'ca-mau', label: 'Cà Mau' },
    { value: 'cao-bang', label: 'Cao Bằng' },
    { value: 'dak-lak', label: 'Đắk Lắk' },
    { value: 'dak-nong', label: 'Đắk Nông' },
    { value: 'dien-bien', label: 'Điện Biên' },
    { value: 'dong-nai', label: 'Đồng Nai' },
    { value: 'dong-thap', label: 'Đồng Tháp' },
    { value: 'gia-lai', label: 'Gia Lai' },
    { value: 'ha-giang', label: 'Hà Giang' },
    { value: 'ha-nam', label: 'Hà Nam' },
    { value: 'ha-tinh', label: 'Hà Tĩnh' },
    { value: 'hai-duong', label: 'Hải Dương' },
    { value: 'hau-giang', label: 'Hậu Giang' },
    { value: 'hoa-binh', label: 'Hòa Bình' },
    { value: 'hung-yen', label: 'Hưng Yên' },
    { value: 'khanh-hoa', label: 'Khánh Hòa' },
    { value: 'kien-giang', label: 'Kiên Giang' },
    { value: 'kon-tum', label: 'Kon Tum' },
    { value: 'lai-chau', label: 'Lai Châu' },
    { value: 'lam-dong', label: 'Lâm Đồng' },
    { value: 'lang-son', label: 'Lạng Sơn' },
    { value: 'lao-cai', label: 'Lào Cai' },
    { value: 'long-an', label: 'Long An' },
    { value: 'nam-dinh', label: 'Nam Định' },
    { value: 'nghe-an', label: 'Nghệ An' },
    { value: 'ninh-binh', label: 'Ninh Bình' },
    { value: 'ninh-thuan', label: 'Ninh Thuận' },
    { value: 'phu-tho', label: 'Phú Thọ' },
    { value: 'phu-yen', label: 'Phú Yên' },
    { value: 'quang-binh', label: 'Quảng Bình' },
    { value: 'quang-nam', label: 'Quảng Nam' },
    { value: 'quang-ngai', label: 'Quảng Ngãi' },
    { value: 'quang-ninh', label: 'Quảng Ninh' },
    { value: 'quang-tri', label: 'Quảng Trị' },
    { value: 'soc-trang', label: 'Sóc Trăng' },
    { value: 'son-la', label: 'Sơn La' },
    { value: 'tay-ninh', label: 'Tây Ninh' },
    { value: 'thai-binh', label: 'Thái Bình' },
    { value: 'thai-nguyen', label: 'Thái Nguyên' },
    { value: 'thanh-hoa', label: 'Thanh Hóa' },
    { value: 'thua-thien-hue', label: 'Thừa Thiên Huế' },
    { value: 'tien-giang', label: 'Tiền Giang' },
    { value: 'tra-vinh', label: 'Trà Vinh' },
    { value: 'tuyen-quang', label: 'Tuyên Quang' },
    { value: 'vinh-long', label: 'Vĩnh Long' },
    { value: 'vinh-phuc', label: 'Vĩnh Phúc' },
    { value: 'yen-bai', label: 'Yên Bái' }
  ];

  // District options (Huyện/Quận) - sẽ được load động dựa trên tỉnh/thành
  getDistrictOptions(provinceValue: string): SelectOption[] {
    if (!provinceValue) return [];
    
    // Mock data - trong thực tế sẽ gọi API
    const districts: { [key: string]: SelectOption[] } = {
      'hanoi': [
        { value: 'ba-dinh', label: 'Ba Đình' },
        { value: 'hoan-kiem', label: 'Hoàn Kiếm' },
        { value: 'tay-ho', label: 'Tây Hồ' },
        { value: 'long-bien', label: 'Long Biên' },
        { value: 'cau-giay', label: 'Cầu Giấy' },
        { value: 'dong-da', label: 'Đống Đa' },
        { value: 'hai-ba-trung', label: 'Hai Bà Trưng' },
        { value: 'hoang-mai', label: 'Hoàng Mai' },
        { value: 'thanh-xuan', label: 'Thanh Xuân' }
      ],
      'hcm': [
        { value: 'quan-1', label: 'Quận 1' },
        { value: 'quan-2', label: 'Quận 2' },
        { value: 'quan-3', label: 'Quận 3' },
        { value: 'quan-4', label: 'Quận 4' },
        { value: 'quan-5', label: 'Quận 5' },
        { value: 'quan-6', label: 'Quận 6' },
        { value: 'quan-7', label: 'Quận 7' },
        { value: 'quan-8', label: 'Quận 8' },
        { value: 'quan-9', label: 'Quận 9' },
        { value: 'quan-10', label: 'Quận 10' },
        { value: 'quan-11', label: 'Quận 11' },
        { value: 'quan-12', label: 'Quận 12' }
      ]
    };
    
    return districts[provinceValue] || [];
  }

  // Ward options (Xã/Phường) - sẽ được load động dựa trên huyện/quận
  getWardOptions(districtValue: string): SelectOption[] {
    if (!districtValue) return [];
    
    // Mock data - trong thực tế sẽ gọi API
    const wards: { [key: string]: SelectOption[] } = {
      'ba-dinh': [
        { value: 'phuc-xa', label: 'Phúc Xá' },
        { value: 'truc-bach', label: 'Trúc Bạch' },
        { value: 'vinh-phuc', label: 'Vĩnh Phúc' },
        { value: 'cong-vi', label: 'Cống Vị' },
        { value: 'lieu-giai', label: 'Liễu Giai' }
      ],
      'hoan-kiem': [
        { value: 'phuc-tan', label: 'Phúc Tân' },
        { value: 'dong-xuan', label: 'Đồng Xuân' },
        { value: 'hang-ma', label: 'Hàng Mã' },
        { value: 'hang-buom', label: 'Hàng Buồm' },
        { value: 'hang-dao', label: 'Hàng Đào' }
      ],
      'quan-1': [
        { value: 'ben-nghe', label: 'Bến Nghé' },
        { value: 'da-kao', label: 'Đa Kao' },
        { value: 'ben-thanh', label: 'Bến Thành' },
        { value: 'nguyen-thai-binh', label: 'Nguyễn Thái Bình' },
        { value: 'pham-ngu-lao', label: 'Phạm Ngũ Lão' }
      ]
    };
    
    return wards[districtValue] || [];
  }

  // Company size options (Quy mô)
  readonly COMPANY_SIZE_OPTIONS: SelectOption[] = [
    { value: '1-10', label: '1 - 10 nhân viên' },
    { value: '11-50', label: '11 - 50 nhân viên' },
    { value: '51-200', label: '51 - 200 nhân viên' },
    { value: '201-500', label: '201 - 500 nhân viên' },
    { value: '501-1000', label: '501 - 1.000 nhân viên' },
    { value: '1001-5000', label: '1.001 - 5.000 nhân viên' },
    { value: '5001-10000', label: '5.001 - 10.000 nhân viên' },
    { value: '10001-20000', label: '10.001 - 20.000 nhân viên' },
    { value: '20000-49999', label: '20.000 - 49.999 nhân viên' },
    { value: '50000+', label: '50.000+ nhân viên' }
  ];

  // Company industry options (Lĩnh vực)
  readonly COMPANY_INDUSTRY_OPTIONS: SelectOption[] = [
    { value: 'it-software', label: 'IT - Phần mềm' },
    { value: 'it-hardware', label: 'IT - Phần cứng' },
    { value: 'telecommunications', label: 'Viễn thông' },
    { value: 'banking', label: 'Ngân hàng' },
    { value: 'finance', label: 'Tài chính' },
    { value: 'insurance', label: 'Bảo hiểm' },
    { value: 'real-estate', label: 'Bất động sản' },
    { value: 'construction', label: 'Xây dựng' },
    { value: 'manufacturing', label: 'Sản xuất' },
    { value: 'retail', label: 'Bán lẻ' },
    { value: 'wholesale', label: 'Bán buôn' },
    { value: 'logistics', label: 'Vận tải - Logistics' },
    { value: 'hospitality', label: 'Du lịch - Khách sạn' },
    { value: 'food-beverage', label: 'Thực phẩm - Đồ uống' },
    { value: 'healthcare', label: 'Y tế - Chăm sóc sức khỏe' },
    { value: 'education', label: 'Giáo dục - Đào tạo' },
    { value: 'media', label: 'Truyền thông - Quảng cáo' },
    { value: 'entertainment', label: 'Giải trí' },
    { value: 'energy', label: 'Năng lượng' },
    { value: 'agriculture', label: 'Nông nghiệp' },
    { value: 'automotive', label: 'Ô tô' },
    { value: 'fashion', label: 'Thời trang' },
    { value: 'beauty', label: 'Làm đẹp' },
    { value: 'consulting', label: 'Tư vấn' },
    { value: 'other', label: 'Khác' }
  ];

  // Position level options (Cấp bậc)
  readonly POSITION_LEVEL_OPTIONS: SelectOption[] = [
    { value: 'employee', label: 'Nhân viên' },
    { value: 'team-lead', label: 'Trưởng nhóm' },
    { value: 'manager', label: 'Trưởng phòng/Phó phòng' },
    { value: 'supervisor', label: 'Quản lý/Giám sát' },
    { value: 'branch-manager', label: 'Trưởng chi nhánh' },
    { value: 'deputy-director', label: 'Phó giám đốc' },
    { value: 'director', label: 'Giám đốc' },
    { value: 'intern', label: 'Thực tập sinh' },
    { value: 'specialist', label: 'Chuyên viên' },
    { value: 'senior-specialist', label: 'Chuyên viên cao cấp' },
    { value: 'expert', label: 'Chuyên gia' },
    { value: 'consultant', label: 'Tư vấn' }
  ];

  // Education level options (Học vấn)
  readonly EDUCATION_OPTIONS: SelectOption[] = [
    { value: 'high-school', label: 'Trung học phổ thông' },
    { value: 'intermediate', label: 'Trung cấp' },
    { value: 'college', label: 'Cao đẳng' },
    { value: 'university', label: 'Đại học' },
    { value: 'master', label: 'Thạc sĩ' },
    { value: 'phd', label: 'Tiến sĩ' },
    { value: 'not-required', label: 'Không yêu cầu' }
  ];

  // Employment type options (Hình thức làm việc)
  readonly EMPLOYMENT_TYPE_OPTIONS: SelectOption[] = [
    { value: 'full-time', label: 'Toàn thời gian' },
    { value: 'part-time', label: 'Bán thời gian' },
    { value: 'internship', label: 'Thực tập' },
    { value: 'contract', label: 'Hợp đồng' },
    { value: 'freelance', label: 'Tự do' },
    { value: 'other', label: 'Khác' }
  ];

  // Job position options (Vị trí tuyển dụng)
  readonly JOB_POSITION_OPTIONS: SelectOption[] = [
    { value: 'marketing-staff', label: 'Nhân viên Marketing' },
    { value: 'designer', label: 'Designer' },
    { value: 'developer', label: 'Developer' },
    { value: 'sales-staff', label: 'Nhân viên Kinh doanh' },
    { value: 'accountant', label: 'Kế toán' },
    { value: 'hr-staff', label: 'Nhân viên Nhân sự' },
    { value: 'content-writer', label: 'Content Writer' },
    { value: 'seo-specialist', label: 'Chuyên viên SEO' },
    { value: 'social-media', label: 'Chuyên viên Social Media' },
    { value: 'project-manager', label: 'Quản lý Dự án' },
    { value: 'business-analyst', label: 'Chuyên viên Phân tích Nghiệp vụ' },
    { value: 'customer-service', label: 'Nhân viên Chăm sóc Khách hàng' },
    { value: 'data-analyst', label: 'Chuyên viên Phân tích Dữ liệu' },
    { value: 'product-manager', label: 'Quản lý Sản phẩm' },
    { value: 'ui-ux-designer', label: 'UI/UX Designer' },
    { value: 'qa-tester', label: 'QA/Tester' },
    { value: 'devops-engineer', label: 'DevOps Engineer' },
    { value: 'system-admin', label: 'Quản trị Hệ thống' },
    { value: 'network-engineer', label: 'Kỹ sư Mạng' },
    { value: 'security-specialist', label: 'Chuyên viên Bảo mật' },
    { value: 'mobile-developer', label: 'Mobile Developer' },
    { value: 'web-developer', label: 'Web Developer' },
    { value: 'fullstack-developer', label: 'Fullstack Developer' },
    { value: 'other', label: 'Khác' }
  ];

  // Helper methods to get label by value
  getSalaryLabel(value: string): string {
    const option = this.SALARY_OPTIONS.find(opt => opt.value === value);
    return option ? option.label : '';
  }

  getLocationLabel(value: string): string {
    const option = this.LOCATION_OPTIONS.find(opt => opt.value === value);
    return option ? option.label : '';
  }

  getExperienceLabel(value: string): string {
    const option = this.EXPERIENCE_OPTIONS.find(opt => opt.value === value);
    return option ? option.label : '';
  }

  getCompanySizeLabel(value: string): string {
    const option = this.COMPANY_SIZE_OPTIONS.find(opt => opt.value === value);
    return option ? option.label : '';
  }

  getCompanyIndustryLabel(value: string): string {
    const option = this.COMPANY_INDUSTRY_OPTIONS.find(opt => opt.value === value);
    return option ? option.label : '';
  }

  getPositionLevelLabel(value: string): string {
    const option = this.POSITION_LEVEL_OPTIONS.find(opt => opt.value === value);
    return option ? option.label : '';
  }

  getEducationLabel(value: string): string {
    const option = this.EDUCATION_OPTIONS.find(opt => opt.value === value);
    return option ? option.label : '';
  }

  getEmploymentTypeLabel(value: string): string {
    const option = this.EMPLOYMENT_TYPE_OPTIONS.find(opt => opt.value === value);
    return option ? option.label : '';
  }

  getJobPositionLabel(value: string): string {
    const option = this.JOB_POSITION_OPTIONS.find(opt => opt.value === value);
    return option ? option.label : '';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}

