import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { 
  ButtonComponent, 
  InputFieldComponent, 
  RichTextEditorComponent,
  SelectFieldComponent,
  FileUploadComponent,
  GenericModalComponent,
  JobPreviewComponent,
  JobFormData,
  ToastNotificationComponent
} from '../../../../shared/components';
import { JobOptionsService } from '../../../../shared/services/job-options.service';

interface ValidationErrors {
  [key: string]: string;
}

@Component({
  selector: 'app-job-posting',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    ButtonComponent,
    InputFieldComponent,
    RichTextEditorComponent,
    SelectFieldComponent,
    FileUploadComponent,
    GenericModalComponent,
    JobPreviewComponent,
    ToastNotificationComponent
  ],
  templateUrl: './job-posting.html',
  styleUrls: ['./job-posting.scss']
})
export class JobPostingComponent implements OnInit, OnDestroy {
  sidebarExpanded: boolean = false;
  private sidebarCheckInterval?: any;
  private queryParamsSubscription?: Subscription;
  showPreviewModal = false;

  // Campaign data from query params
  campaignName: string = '';

  // Validation errors
  validationErrors: ValidationErrors = {};

  // Toast notification
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';

  private jobOptionsService = inject(JobOptionsService);

  constructor(
    private route: ActivatedRoute
  ) {}

  // Job form options - using service
  salaryOptions = this.jobOptionsService.SALARY_OPTIONS;
  experienceOptions = this.jobOptionsService.EXPERIENCE_OPTIONS;
  locationOptions = this.jobOptionsService.LOCATION_OPTIONS;
  companySizeOptions = this.jobOptionsService.COMPANY_SIZE_OPTIONS;
  companyIndustryOptions = this.jobOptionsService.COMPANY_INDUSTRY_OPTIONS;
  positionLevelOptions = this.jobOptionsService.POSITION_LEVEL_OPTIONS;
  educationOptions = this.jobOptionsService.EDUCATION_OPTIONS;
  employmentTypeOptions = this.jobOptionsService.EMPLOYMENT_TYPE_OPTIONS;
  provinceOptions = this.jobOptionsService.PROVINCE_OPTIONS;
  
  // Dynamic options
  districtOptions: any[] = [];
  wardOptions: any[] = [];

  // Job form data
  jobForm: JobFormData & { province?: string; district?: string; ward?: string } = {
    companyName: '',
    companySize: '',
    companyIndustry: '',
    companyLocation: '',
    companyWebsite: '',
    companyImage: null,
    companyImagePreview: '',
    positionLevel: '',
    education: '',
    quantity: '',
    employmentType: '',
    jobTitle: '',
    location: '',
    province: '',
    district: '',
    ward: '',
    salary: '',
    experience: '',
    applicationDeadline: '',
    description: '',
    requirements: '',
    benefits: '',
    workLocation: '',
    applicationMethod: ''
  };

  ngOnInit() {
    this.checkSidebarState();
    this.sidebarCheckInterval = setInterval(() => {
      this.checkSidebarState();
    }, 100);

    // Read query params for campaign data
    this.queryParamsSubscription = this.route.queryParams.subscribe(params => {
      if (params['campaignName']) {
        this.campaignName = params['campaignName'];
      }
      
    });
  }

  ngOnDestroy() {
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }
  }

  checkSidebarState(): void {
    const sidebar = document.querySelector('app-sidebar .sidebar');
    if (sidebar) {
      this.sidebarExpanded = sidebar.classList.contains('show');
    }
  }

  openPreviewModal(): void {
    this.showPreviewModal = true;
  }

  closePreviewModal(): void {
    this.showPreviewModal = false;
  }

  validateForm(): boolean {
    this.validationErrors = {};

    // General Information Validation
    if (!this.jobForm.positionLevel || this.jobForm.positionLevel === '') {
      this.validationErrors['positionLevel'] = 'Vui lòng chọn cấp bậc';
    }

    if (!this.jobForm.education || this.jobForm.education === '') {
      this.validationErrors['education'] = 'Vui lòng chọn học vấn';
    }

    if (!this.jobForm.quantity || this.jobForm.quantity.trim() === '') {
      this.validationErrors['quantity'] = 'Vui lòng nhập số lượng tuyển';
    } else {
      const quantityNum = parseInt(this.jobForm.quantity);
      if (isNaN(quantityNum) || quantityNum <= 0) {
        this.validationErrors['quantity'] = 'Số lượng tuyển phải là số nguyên dương';
      }
    }

    if (!this.jobForm.employmentType || this.jobForm.employmentType === '') {
      this.validationErrors['employmentType'] = 'Vui lòng chọn hình thức làm việc';
    }

    // Job Title Section Validation
    if (!this.jobForm.jobTitle || this.jobForm.jobTitle.trim() === '') {
      this.validationErrors['jobTitle'] = 'Vui lòng nhập tên công việc';
    }

    if (!this.jobForm.province || this.jobForm.province === '') {
      this.validationErrors['province'] = 'Vui lòng chọn tỉnh/thành phố';
    }
    if (!this.jobForm.district || this.jobForm.district === '') {
      this.validationErrors['district'] = 'Vui lòng chọn quận/huyện';
    }
    if (!this.jobForm.ward || this.jobForm.ward === '') {
      this.validationErrors['ward'] = 'Vui lòng chọn xã/phường';
    }

    if (!this.jobForm.salary || this.jobForm.salary === '' || this.jobForm.salary === null) {
      this.validationErrors['salary'] = 'Vui lòng nhập mức lương';
    } else {
      // Validate salary is a valid number
      const salaryNum = parseFloat(this.jobForm.salary.toString());
      if (isNaN(salaryNum)) {
        this.validationErrors['salary'] = 'Mức lương phải là số';
      } else if (salaryNum < 0) {
        this.validationErrors['salary'] = 'Mức lương không được nhỏ hơn 0';
      }
    }

    if (!this.jobForm.experience || this.jobForm.experience === '') {
      this.validationErrors['experience'] = 'Vui lòng chọn kinh nghiệm';
    }

    if (!this.jobForm.applicationDeadline || this.jobForm.applicationDeadline === '') {
      this.validationErrors['applicationDeadline'] = 'Vui lòng chọn hạn nộp hồ sơ';
    } else {
      // Validate deadline is in the future
      const deadlineDate = new Date(this.jobForm.applicationDeadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (deadlineDate < today) {
        this.validationErrors['applicationDeadline'] = 'Hạn nộp hồ sơ phải là ngày trong tương lai';
      }
    }

    // Helper method to check if rich text content is empty
    const isRichTextEmpty = (content: string): boolean => {
      if (!content || content.trim() === '') return true;
      // Remove HTML tags and check if content is empty
      const div = document.createElement('div');
      div.innerHTML = content;
      const textContent = div.textContent || div.innerText || '';
      return textContent.trim() === '';
    };

    // Rich Text Editor Validation
    if (isRichTextEmpty(this.jobForm.description)) {
      this.validationErrors['description'] = 'Vui lòng nhập mô tả công việc';
    }

    if (isRichTextEmpty(this.jobForm.requirements)) {
      this.validationErrors['requirements'] = 'Vui lòng nhập yêu cầu ứng viên';
    }

    if (isRichTextEmpty(this.jobForm.benefits)) {
      this.validationErrors['benefits'] = 'Vui lòng nhập quyền lợi';
    }

    if (!this.jobForm.workLocation || this.jobForm.workLocation.trim() === '') {
      this.validationErrors['workLocation'] = 'Vui lòng nhập địa điểm làm việc';
    }

    // Scroll to first error
    if (Object.keys(this.validationErrors).length > 0) {
      const firstErrorField = Object.keys(this.validationErrors)[0];
      // Scroll to the first error field after a short delay to ensure DOM is updated
      setTimeout(() => {
        // Try multiple selectors to find the error field
        let errorElement: HTMLElement | null = null;
        
        // Try to find by name attribute first (for ngModel)
        const nameElement = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
        if (nameElement) {
          errorElement = nameElement;
        } else {
          // Try to find input/select within form sections
          const formSection = document.querySelector('.form-section');
          if (formSection) {
            const input = formSection.querySelector(`input, select`) as HTMLElement;
            if (input) errorElement = input;
          }
        }
        
        if (errorElement) {
          // Find the parent form-group, select-field-wrapper, rich-text-editor-wrapper, or form-section
          const scrollTarget = errorElement.closest('.form-group, .select-field-wrapper, .rich-text-editor-wrapper, .form-section, app-input-field, app-select-field, app-rich-text-editor');
          if (scrollTarget) {
            (scrollTarget as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          
          // Try to focus on the input/select element if possible
          const inputElement = errorElement.querySelector('input, select') as HTMLElement;
          if (inputElement && (inputElement instanceof HTMLInputElement || inputElement instanceof HTMLSelectElement)) {
            setTimeout(() => {
              inputElement.focus();
            }, 400);
          }
        } else {
          // Fallback: scroll to form-wrapper top
          const formWrapper = document.querySelector('.form-wrapper');
          if (formWrapper) {
            formWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }, 150);
      return false;
    }

    return true;
  }

  getFieldError(fieldName: string): string {
    return this.validationErrors[fieldName] || '';
  }

  clearFieldError(fieldName: string): void {
    if (this.validationErrors[fieldName]) {
      delete this.validationErrors[fieldName];
    }
  }

  onFieldChange(fieldName: string): void {
    // Clear error when user starts typing
    this.clearFieldError(fieldName);
    
    // Handle cascade for location fields
    if (fieldName === 'province') {
      // Reset district and ward when province changes
      this.jobForm.district = '';
      this.jobForm.ward = '';
      this.wardOptions = [];
      // Load districts for selected province
      this.districtOptions = this.jobOptionsService.getDistrictOptions(this.jobForm.province || '');
    } else if (fieldName === 'district') {
      // Reset ward when district changes
      this.jobForm.ward = '';
      // Load wards for selected district
      this.wardOptions = this.jobOptionsService.getWardOptions(this.jobForm.district || '');
    }
  }

  showToastMessage(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
  }

  onToastClose(): void {
    this.showToast = false;
  }

  onSaveJob(): void {
    if (!this.validateForm()) {
      this.showToastMessage('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
      return;
    }

    // TODO: Implement save job API call
    // Simulate API call
    setTimeout(() => {
      this.showToastMessage('Lưu việc làm thành công!', 'success');
      // Reset validation errors after successful save
      this.validationErrors = {};
    }, 500);
  }

  onPostJob(): void {
    if (!this.validateForm()) {
      this.showToastMessage('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
      return;
    }

    // TODO: Implement post job API call
    // Simulate API call
    setTimeout(() => {
      this.showToastMessage('Đăng công việc thành công!', 'success');
      // Reset validation errors after successful post
      this.validationErrors = {};
    }, 500);
  }
}