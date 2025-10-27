import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../core/services/translation.service';
// ✅ Import Enums from Job API Service
import { EmploymentType, ExperienceLevel, PositionType, SalaryFilterType } from '../../../proxy/api/job.service';

interface FilterOption {
  value: number | null;
  label: string;
  checked: boolean;
}

@Component({
  selector: 'app-job-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './job-filter.html',
  styleUrls: ['./job-filter.scss']
})
export class JobFilterComponent implements OnInit {
  @Output() filterChange = new EventEmitter<any>();

  selectedLanguage: string = 'vi';
  
  // ============================================
  // ✅ FILTER OPTIONS (From Enums)
  // ============================================

  // Hình thức làm việc (EmploymentType)
  employmentTypes: FilterOption[] = [
    { value: null, label: 'Tất cả', checked: true },
    { value: EmploymentType.FullTime, label: 'Toàn thời gian', checked: false },
    { value: EmploymentType.PartTime, label: 'Bán thời gian', checked: false },
    { value: EmploymentType.Internship, label: 'Thực tập', checked: false },
    { value: EmploymentType.Contract, label: 'Hợp đồng', checked: false },
    { value: EmploymentType.Freelance, label: 'Freelance', checked: false }
  ];
  
  // Kinh nghiệm (ExperienceLevel)
  experienceLevels: FilterOption[] = [
    { value: null, label: 'Tất cả', checked: true },
    { value: ExperienceLevel.None, label: 'Không yêu cầu', checked: false },
    { value: ExperienceLevel.Under1, label: 'Dưới 1 năm', checked: false },
    { value: ExperienceLevel.Year1, label: '1 năm', checked: false },
    { value: ExperienceLevel.Year2, label: '2 năm', checked: false },
    { value: ExperienceLevel.Year3, label: '3 năm', checked: false },
    { value: ExperienceLevel.Year4, label: '4 năm', checked: false },
    { value: ExperienceLevel.Year5, label: '5 năm', checked: false },
    { value: ExperienceLevel.Year6, label: '6 năm', checked: false },
    { value: ExperienceLevel.Year7, label: '7 năm', checked: false },
    { value: ExperienceLevel.Year8, label: '8 năm', checked: false },
    { value: ExperienceLevel.Year9, label: '9 năm', checked: false },
    { value: ExperienceLevel.Year10, label: '10 năm', checked: false },
    { value: ExperienceLevel.Over10, label: 'Trên 10 năm', checked: false }
  ];
  
  // Cấp bậc (PositionType)
  positionTypes: FilterOption[] = [
    { value: null, label: 'Tất cả', checked: true },
    { value: PositionType.Intern, label: 'Thực tập sinh', checked: false },
    { value: PositionType.Employee, label: 'Nhân viên', checked: false },
    { value: PositionType.Specialist, label: 'Chuyên viên', checked: false },
    { value: PositionType.SeniorSpecialist, label: 'Chuyên viên chính', checked: false },
    { value: PositionType.Expert, label: 'Chuyên gia', checked: false },
    { value: PositionType.TeamLead, label: 'Trưởng nhóm', checked: false },
    { value: PositionType.Supervisor, label: 'Giám sát', checked: false },
    { value: PositionType.Manager, label: 'Quản lý', checked: false },
    { value: PositionType.BranchManager, label: 'Trưởng chi nhánh', checked: false },
    { value: PositionType.DeputyDirector, label: 'Phó giám đốc', checked: false },
    { value: PositionType.Director, label: 'Giám đốc', checked: false },
    { value: PositionType.Consultant, label: 'Tư vấn', checked: false }
  ];

  // Mức lương (SalaryFilterType)
  salaryFilters: FilterOption[] = [
    { value: null, label: 'Tất cả', checked: true },
    { value: SalaryFilterType.Under10, label: 'Dưới 10 triệu', checked: false },
    { value: SalaryFilterType.Range10To15, label: '10 - 15 triệu', checked: false },
    { value: SalaryFilterType.Range15To20, label: '15 - 20 triệu', checked: false },
    { value: SalaryFilterType.Range20To30, label: '20 - 30 triệu', checked: false },
    { value: SalaryFilterType.Range30To50, label: '30 - 50 triệu', checked: false },
    { value: SalaryFilterType.Over50, label: 'Trên 50 triệu', checked: false },
    { value: SalaryFilterType.Deal, label: 'Thỏa thuận', checked: false }
  ];

  constructor(private translationService: TranslationService) {}

  ngOnInit() {
    this.translationService.currentLanguage$.subscribe(lang => {
      this.selectedLanguage = lang;
    });
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  // ============================================
  // ✅ EVENT HANDLERS (Radio button logic)
  // ============================================

  /**
   * Hình thức làm việc changed
   */
  onEmploymentTypeChange(option: FilterOption) {
    this.employmentTypes.forEach(o => o.checked = false);
    option.checked = true;
    this.emitFilterChange();
  }

  /**
   * Kinh nghiệm changed
   */
  onExperienceChange(option: FilterOption) {
    this.experienceLevels.forEach(o => o.checked = false);
    option.checked = true;
    this.emitFilterChange();
  }

  /**
   * Cấp bậc changed
   */
  onPositionTypeChange(option: FilterOption) {
    this.positionTypes.forEach(o => o.checked = false);
    option.checked = true;
    this.emitFilterChange();
  }

  /**
   * Mức lương changed
   */
  onSalaryChange(option: FilterOption) {
    this.salaryFilters.forEach(o => o.checked = false);
    option.checked = true;
    this.emitFilterChange();
  }

  /**
   * Clear all filters (reset về "Tất cả")
   */
  clearFilters() {
    this.employmentTypes.forEach(o => {
      o.checked = o.value === null;
    });
    
    this.experienceLevels.forEach(o => {
      o.checked = o.value === null;
    });
    
    this.positionTypes.forEach(o => {
      o.checked = o.value === null;
    });

    this.salaryFilters.forEach(o => {
      o.checked = o.value === null;
    });
    
    this.emitFilterChange();
  }

  /**
   * Emit filter changes
   */
  private emitFilterChange() {
    const selectedEmploymentType = this.employmentTypes.find(o => o.checked);
    const selectedExperience = this.experienceLevels.find(o => o.checked);
    const selectedPosition = this.positionTypes.find(o => o.checked);
    const selectedSalary = this.salaryFilters.find(o => o.checked);

    const filters = {
      employmentTypes: selectedEmploymentType && selectedEmploymentType.value !== null 
        ? [selectedEmploymentType.value] 
        : [],
      experienceLevel: selectedExperience && selectedExperience.value !== null 
        ? selectedExperience.value 
        : null,
      positionTypes: selectedPosition && selectedPosition.value !== null 
        ? [selectedPosition.value] 
        : [],
      salaryFilter: selectedSalary && selectedSalary.value !== null 
        ? selectedSalary.value 
        : null
    };
    
    console.log('🔧 JobFilter emitting:', filters);
    this.filterChange.emit(filters);
  }
}
