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

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}

