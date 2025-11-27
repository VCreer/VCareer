import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { GeoService } from '../../../../core/services/Geo.service';
import { TagService } from 'src/app/proxy/services/job';
import { JobCategoryService } from 'src/app/proxy/services/job';
import { TagViewDto, CategoryTreeDto } from 'src/app/proxy/dto/category';
import {
  EmploymentType,
  ExperienceLevel,
  PositionType,
} from '../../../../proxy/constants/job-constant';
import {
  ButtonComponent,
  InputFieldComponent,
  RichTextEditorComponent,
  SelectFieldComponent,
  FileUploadComponent,
  GenericModalComponent,
  JobPreviewComponent,
  JobFormData,
  ToastNotificationComponent,
} from '../../../../shared/components';
import { JobOptionsService } from '../../../../shared/services/job-options.service';
import { JobPostCreateDto } from '../../../../proxy/dto/job-dto/models';
import { CompanyLegalInfoDto } from '../../../../proxy/dto/profile/models';
import { JobPostService } from 'src/app/proxy/services/job';
import { CompanyLegalInfoService } from 'src/app/proxy/services/profile/company-legal-info.service';

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
    ToastNotificationComponent,
  ],
  templateUrl: './job-posting.html',
  styleUrls: ['./job-posting.scss'],
})
export class JobPostingComponent implements OnInit, OnDestroy {
  sidebarExpanded = false;
  private sidebarCheckInterval?: any;
  private queryParamsSubscription?: Subscription;
  showPreviewModal = false;
  currentCompanyInfo?: CompanyLegalInfoDto;
  private jobOptionsService = inject(JobOptionsService);
  private jobPostService = inject(JobPostService);
  private route = inject(ActivatedRoute);
  private geoService = inject(GeoService);
  private companyProfile = inject(CompanyLegalInfoService);
  private tagService = inject(TagService);
  private jobCategoryService = inject(JobCategoryService);
  campaignName = '';
  campaignId = ''; // Thêm biến để lưu campaignId
  validationErrors: ValidationErrors = {};
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';
  salaryMin: number = 100000;
  salaryMax: number = 500000000;
  salaryDeal: boolean = false;
  salaryOptions = this.jobOptionsService.SALARY_OPTIONS;
  educationOptions = this.jobOptionsService.EDUCATION_OPTIONS;
  experienceOptions = this.enumToOptions(ExperienceLevel);
  positionLevelOptions = this.enumToOptions(PositionType);
  employmentTypeOptions = this.enumToOptions(EmploymentType);
  private isSubmitting = false;

  provinceOptions: { label: string; value: number }[] = [];
  wardOptions: { label: string; value: number }[] = [];

  // Category - 2 Dropdowns
  categoryTree: CategoryTreeDto[] = [];
  parentCategoryOptions: { label: string; value: string }[] = [];
  childCategoryOptions: { label: string; value: string }[] = [];
  selectedParentId: string = '';
  selectedCategoryId: string = '';
  
  // Tags - Chỉ chọn từ danh sách có sẵn
  availableTags: TagViewDto[] = [];
  selectedTags: TagViewDto[] = [];

  selectedProvince?: number;
  selectedWard?: number;

  jobForm: JobFormData = {
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
    salary: '',
    experience: '',
    applicationDeadline: '',
    description: '',
    requirements: '',
    benefits: '',
    workLocation: '',
    applicationMethod: '',
    workTime: '',
  };

  ngOnInit() {
    this.checkSidebarState();
    this.sidebarCheckInterval = setInterval(() => this.checkSidebarState(), 100);
    this.loadCategoryTree();

    this.queryParamsSubscription = this.route.queryParams.subscribe(params => {
      if (params['campaignName']) this.campaignName = params['campaignName'];
      if (params['campaignId']) this.campaignId = params['campaignId']; // Lấy campaignId từ query params
    });

    this.geoService.getProvinces().subscribe({
      next: res => {
        this.provinceOptions = res.map(p => ({
          label: p.name ?? '',
          value: p.code ?? 0,
        }));
      },
      error: err => console.error('Lỗi tải danh sách tỉnh:', err),
    });

    this.companyProfile.getCurrentUserCompanyLegalInfo().subscribe({
      next: res => {
        this.currentCompanyInfo = res;
        console.log('Thông tin công ty hiện tại:', this.currentCompanyInfo);
      },
      error: err => {
        console.error('Lỗi khi lấy thông tin công ty:', err);
      },
    });
  }

  ngOnDestroy() {
    clearInterval(this.sidebarCheckInterval);
    this.queryParamsSubscription?.unsubscribe();
  }

  //#region Category - 2 Dropdowns
  loadCategoryTree() {
    this.jobCategoryService.getCategoryTree().subscribe({
      next: (tree: CategoryTreeDto[]) => {
        this.categoryTree = tree;
        // Tạo options cho parent dropdown
        this.parentCategoryOptions = tree.map(parent => ({
          label: parent.categoryName || '',
          value: parent.categoryId || ''
        }));
      },
      error: err => console.error('Lỗi load danh mục:', err),
    });
  }

  onParentCategoryChange(parentId: string) {
    this.selectedParentId = parentId;
    this.selectedCategoryId = '';
    this.childCategoryOptions = [];
    this.availableTags = [];
    this.selectedTags = [];
    this.clearFieldError('parentCategory');

    // Tìm parent category và load children
    const parent = this.categoryTree.find(p => p.categoryId === parentId);
    if (parent && parent.children) {
      this.childCategoryOptions = parent.children.map(child => ({
        label: child.categoryName || '',
        value: child.categoryId || ''
      }));
    }
  }

  onChildCategoryChange(childId: string) {
    this.selectedCategoryId = childId;
    this.selectedTags = [];
    this.clearFieldError('jobCategoryId');

    // Load tags cho child category này
    if (childId) {
      this.loadTagsForCategory(childId);
    }
  }

  loadTagsForCategory(categoryId: string) {
    this.tagService.getTagsByCategoryId(categoryId).subscribe({
      next: tags => {
        this.availableTags = tags;
      },
      error: err => console.error('Lỗi load tag:', err),
    });
  }
  //#endregion

  //#region Tags - Chỉ chọn từ danh sách
  toggleTag(tag: TagViewDto) {
    const index = this.selectedTags.findIndex(t => t.id === tag.id);
    if (index > -1) {
      this.selectedTags.splice(index, 1);
    } else {
      this.selectedTags.push(tag);
    }
  }

  isTagSelected(tag: TagViewDto): boolean {
    return this.selectedTags.some(t => t.id === tag.id);
  }

  clearAllTags() {
    this.selectedTags = [];
  }
  //#endregion

  //#region Địa điểm
  onProvinceChange(provinceCode: number) {
    this.selectedProvince = provinceCode;
    this.selectedWard = undefined;

    this.geoService.getProvinces().subscribe({
      next: res => {
        const selected = res.find(p => p.code === Number(provinceCode));
        this.wardOptions =
          selected?.wards.map(d => ({
            label: d.name ?? '',
            value: d.code ?? 0,
          })) ?? [];
      },
    });
  }
  //#endregion

  //#region Job
  onSaveJob() {
    console.log('Lưu việc làm nháp:', this.jobForm);
    this.showToastMessage('Đã lưu việc làm nháp', 'info');
  }

  async onPostJob() {
    if (this.isSubmitting) return;

    if (!this.validateForm()) {
      this.showToastMessage('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
      return;
    }
    
    this.isSubmitting = true;

    const dto: JobPostCreateDto = {
      title: this.jobForm.jobTitle,
      description: this.jobForm.description,
      requirements: this.jobForm.requirements,
      benefits: this.jobForm.benefits,
      workLocation: this.jobForm.workLocation,
      employmentType: this.jobForm.employmentType as unknown as EmploymentType,
      experience: this.jobForm.experience as unknown as ExperienceLevel,
      positionType: this.jobForm.positionLevel as unknown as PositionType,
      quantity: Number(this.jobForm.quantity) || 1,
      expiresAt: this.jobForm.applicationDeadline
        ? new Date(this.jobForm.applicationDeadline).toISOString()
        : undefined,
      salaryMin: this.salaryDeal ? 0 : this.salaryMin,
      salaryMax: this.salaryDeal ? 0 : this.salaryMax,
      salaryDeal: this.salaryDeal,
      provinceCode: this.selectedProvince ?? 0,
      wardCode: this.selectedWard ?? 0,
      slug: this.jobForm.jobTitle.trim().toLowerCase().replace(/\s+/g, '-'),
      workTime: this.jobForm.workTime,
      jobCategoryId: this.selectedCategoryId,
      tagIds: this.selectedTags.map(t => t.id!),
      recruitmentCampaignId: this.campaignId || undefined, // Thêm campaignId vào DTO
    };

    try {
      this.jobPostService.createJobPostByDto(dto).subscribe({
        next: res => {
          console.log(res);
          this.showToastMessage('Đăng công việc thành công!', 'success');
          this.isSubmitting = false;
        },
        error: err => {
          console.error(err);
          this.showToastMessage('Lỗi khi đăng công việc', 'error');
          this.isSubmitting = false;
        },
      });
    } catch (error: any) {
      console.error('Error posting job:', error);
      this.showToastMessage('Lỗi khi đăng công việc', 'error');
      this.isSubmitting = false;
    }
  }
  //#endregion

  //#region Toast
  showToastMessage(msg: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
    this.toastMessage = msg;
    this.toastType = type;
    this.showToast = true;
  }
  
  onToastClose() {
    this.showToast = false;
  }
  //#endregion

  //#region Preview
  openPreviewModal() {
    this.showPreviewModal = true;
  }
  
  closePreviewModal() {
    this.showPreviewModal = false;
  }
  //#endregion

  //#region Salary
  onSalaryChange() {
    if (this.salaryDeal) return;

    if (this.salaryMin > this.salaryMax) {
      const temp = this.salaryMin;
      this.salaryMin = this.salaryMax;
      this.salaryMax = temp;
    }
    this.jobForm.salary = `${this.salaryMin}-${this.salaryMax}`;
    if (this.salaryMin == this.salaryMax) this.jobForm.salary = `${this.salaryMin}`;
    this.clearFieldError('salary');
  }

  onToggleSalaryDeal(event: any) {
    const value = event.target.checked;
    this.salaryDeal = value;

    if (value) {
      this.salaryMin = 0;
      this.salaryMax = 0;
      this.jobForm.salary = 'deal';
    } else {
      this.salaryMin = 100000;
      this.salaryMax = 500000000;
      this.onSalaryChange();
    }
  }
  
  formatSalary(value: number): string {
    if (value >= 1_000_000_000) {
      return (value / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + ' tỷ';
    }
    if (value >= 1_000_000) {
      return (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + ' triệu';
    }
    return value.toLocaleString('vi-VN');
  }
  //#endregion

  //#region Helper
  getFieldError(field: string) {
    return this.validationErrors[field] || '';
  }

  clearFieldError(field: string) {
    delete this.validationErrors[field];
  }

  onFieldChange(field: string) {
    this.clearFieldError(field);
  }

  validateForm(): boolean {
    this.validationErrors = {};
    
    if (!this.jobForm.jobTitle?.trim()) {
      this.validationErrors['jobTitle'] = 'Vui lòng nhập tên công việc';
    }
    if (!this.jobForm.description?.trim()) {
      this.validationErrors['description'] = 'Vui lòng nhập mô tả công việc';
    }
    if (!this.jobForm.requirements?.trim()) {
      this.validationErrors['requirements'] = 'Vui lòng nhập yêu cầu công việc';
    }
    if (!this.jobForm.workLocation?.trim()) {
      this.validationErrors['workLocation'] = 'Vui lòng nhập địa điểm làm việc';
    }
    if (!this.jobForm.workTime?.trim()) {
      this.validationErrors['workTime'] = 'Vui lòng nhập thời gian làm việc';
    }
    if (!this.selectedParentId) {
      this.validationErrors['parentCategory'] = 'Vui lòng chọn ngành nghề chính';
    }
    if (!this.selectedCategoryId) {
      this.validationErrors['jobCategoryId'] = 'Vui lòng chọn lĩnh vực cụ thể';
    }

    return Object.keys(this.validationErrors).length === 0;
  }

  enumToOptions(enumType: any) {
    return Object.keys(enumType)
      .filter(key => isNaN(Number(key)))
      .map(key => ({
        label: key.replace(/([A-Z])/g, ' $1').trim(),
        value: enumType[key],
      }));
  }

  checkSidebarState(): void {
    const sidebar = document.querySelector('app-sidebar .sidebar');
    this.sidebarExpanded = !!sidebar?.classList.contains('show');
  }
  //#endregion
}