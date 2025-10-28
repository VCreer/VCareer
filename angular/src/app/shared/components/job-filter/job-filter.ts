import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../core/services/translation.service';

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
  
  // Job categories
  jobCategories = [
    { value: 'all', label: 'Tất cả', checked: true },
    { value: 'it', label: 'Công nghệ thông tin', checked: false },
    { value: 'marketing', label: 'Marketing', checked: false },
    { value: 'sales', label: 'Kinh doanh', checked: false },
    { value: 'hr', label: 'Nhân sự', checked: false },
    { value: 'finance', label: 'Tài chính', checked: false },
    { value: 'design', label: 'Thiết kế', checked: false },
    { value: 'production', label: 'Sản xuất', checked: false }
  ];
  
  // Experience levels
  experienceLevels = [
    { value: 'all', label: 'Tất cả', checked: true },
    { value: 'under1', label: 'Dưới 1 năm', checked: false },
    { value: 'none', label: 'Không yêu cầu', checked: false },
    { value: '1year', label: '1 năm', checked: false },
    { value: '2years', label: '2 năm', checked: false },
    { value: '3years', label: '3 năm', checked: false },
    { value: '4years', label: '4 năm', checked: false },
    { value: '5years', label: '5 năm', checked: false },
    { value: 'over5', label: 'Trên 5 năm', checked: false }
  ];
  
  // Job levels
  jobLevels = [
    { value: 'all', label: 'Tất cả', checked: true },
    { value: 'intern', label: 'Thực tập sinh', checked: false },
    { value: 'staff', label: 'Nhân viên', checked: false },
    { value: 'team-lead', label: 'Trưởng nhóm', checked: false },
    { value: 'head-department', label: 'Trưởng/Phó phòng', checked: false },
    { value: 'manager', label: 'Quản lý / Giám sát', checked: false },
    { value: 'branch-manager', label: 'Trưởng chi nhánh', checked: false },
    { value: 'deputy-director', label: 'Phó giám đốc', checked: false },
    { value: 'director', label: 'Giám đốc', checked: false }
  ];

  // Work types
  workTypes = [
    { value: 'all', label: 'Tất cả', checked: true },
    { value: 'full_time', label: 'Toàn thời gian', checked: false },
    { value: 'part_time', label: 'Bán thời gian', checked: false },
    { value: 'internship', label: 'Thực tập', checked: false }
  ];

  // Salary levels
  salaries = [
    { value: 'all', label: 'Tất cả', checked: true },
    { value: 'under_10', label: 'Dưới 10 triệu', checked: false },
    { value: '10_15', label: '10 - 15 triệu', checked: false },
    { value: '15_20', label: '15 - 20 triệu', checked: false },
    { value: '20_25', label: '20 - 25 triệu', checked: false },
    { value: '25_30', label: '25 - 30 triệu', checked: false },
    { value: '30_50', label: '30 - 50 triệu', checked: false },
    { value: 'over_50', label: 'Trên 50 triệu', checked: false },
    { value: 'negotiable', label: 'Thoả thuận', checked: false }
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


  onExperienceChange(level: any) {
    // Uncheck all other experience levels
    this.experienceLevels.forEach(l => l.checked = false);
    level.checked = true;
    this.emitFilterChange();
  }

  onCategoryChange(category: any) {
    category.checked = !category.checked;
    this.emitFilterChange();
  }

  onJobLevelChange(level: any) {
    // Uncheck all other job levels
    this.jobLevels.forEach(l => l.checked = false);
    level.checked = true;
    this.emitFilterChange();
  }

  onWorkTypeChange(workType: any) {
    // Uncheck all other work types
    this.workTypes.forEach(wt => wt.checked = false);
    workType.checked = true;
    this.emitFilterChange();
  }

  onSalaryChange(salary: any) {
    // Uncheck all other salaries
    this.salaries.forEach(s => s.checked = false);
    salary.checked = true;
    this.emitFilterChange();
  }

  clearFilters() {
    // Reset all filters
    this.jobCategories.forEach(category => {
      category.checked = category.value === 'all';
    });
    
    this.experienceLevels.forEach(level => {
      level.checked = level.value === 'all';
    });
    
    this.jobLevels.forEach(level => {
      level.checked = level.value === 'all';
    });

    this.workTypes.forEach(workType => {
      workType.checked = workType.value === 'all';
    });

    this.salaries.forEach(salary => {
      salary.checked = salary.value === 'all';
    });
    
    this.emitFilterChange();
  }

  private emitFilterChange() {
    const filters = {
      categories: this.jobCategories.filter(category => category.checked && category.value !== 'all').map(c => c.value),
      experience: this.experienceLevels.find(level => level.checked)?.value,
      jobLevel: this.jobLevels.find(level => level.checked)?.value,
      workType: this.workTypes.find(workType => workType.checked)?.value,
      salary: this.salaries.find(salary => salary.checked)?.value
    };
    
    this.filterChange.emit(filters);
  }
}
