import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
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
import { JobPostCreateDto, JobPostUpdateDto } from '../../../../proxy/dto/job-dto/models';
import { CompanyLegalInfoDto } from '../../../../proxy/dto/profile/models';
import { JobPostService } from 'src/app/proxy/services/job';
import { JobSearchService } from 'src/app/proxy/services/job';
import { CompanyLegalInfoService } from 'src/app/proxy/services/profile/company-legal-info.service';
import { JobViewDetail } from '../../../../proxy/dto/job/models'; 
import { JobTagService } from 'src/app/proxy/services/job';

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
  private jobSearchService = inject(JobSearchService);
  private jobTagService = inject(JobTagService);
  private route = inject(ActivatedRoute);
  private geoService = inject(GeoService);
  private companyProfile = inject(CompanyLegalInfoService);
  private tagService = inject(TagService);
  private jobCategoryService = inject(JobCategoryService);
  
  campaignName = '';
  campaignId = '';
  jobId = '';
  isEditMode = false;
  isLoadingJobData = false;
  
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

    // Load provinces trước
    this.geoService.getProvinces().subscribe({
      next: res => {
        this.provinceOptions = res.map(p => ({
          label: p.name ?? '',
          value: p.code ?? 0,
        }));
      },
      error: err => console.error('Lỗi tải danh sách tỉnh:', err),
    });

    // Load company info
    this.companyProfile.getCurrentUserCompanyLegalInfo().subscribe({
      next: res => {
        this.currentCompanyInfo = res;
        console.log('Thông tin công ty hiện tại:', this.currentCompanyInfo);
      },
      error: err => {
        console.error('Lỗi khi lấy thông tin công ty:', err);
      },
    });

    // Lắng nghe query params để xác định chế độ edit/create
    this.queryParamsSubscription = this.route.queryParams.subscribe(params => {
      if (params['campaignName']) this.campaignName = params['campaignName'];
      if (params['campaignId']) this.campaignId = params['campaignId'];
      
      // Check nếu có jobId -> chế độ edit
      if (params['jobId']) {
        this.jobId = params['jobId'];
        this.isEditMode = true;
        this.loadJobData(this.jobId);
      } else {
        this.isEditMode = false;
      }
    });
  }

  ngOnDestroy() {
    clearInterval(this.sidebarCheckInterval);
    this.queryParamsSubscription?.unsubscribe();
  }

  //#region Load Job Data for Edit
  loadJobData(jobId: string): void {
    this.isLoadingJobData = true;
    
    // Load cả job detail và job tags song song
    forkJoin({
      jobDetail: this.jobSearchService.getJobById(jobId),
      jobTags: this.jobTagService.getTagByJobIdByJobId(jobId)
    }).subscribe({
      next: (result) => {
        this.populateFormWithJobData(result.jobDetail);
        this.populateJobTags(result.jobTags);
        this.isLoadingJobData = false;
        this.showToastMessage('Đã tải thông tin công việc', 'success');
      },
      error: err => {
        console.error('Lỗi khi tải thông tin công việc:', err);
        this.showToastMessage('Không thể tải thông tin công việc', 'error');
        this.isLoadingJobData = false;
      }
    });
  }

  populateFormWithJobData(jobDetail: JobViewDetail): void {
    // Điền thông tin cơ bản
    this.jobForm.jobTitle = jobDetail.title || '';
    this.jobForm.description = jobDetail.description || '';
    this.jobForm.requirements = jobDetail.requirements || '';
    this.jobForm.benefits = jobDetail.benefits || '';
    this.jobForm.workLocation = jobDetail.workLocation || '';
    this.jobForm.workTime = jobDetail.workTime || '';
    this.jobForm.quantity = jobDetail.quantity?.toString() || '';
    
    // Employment Type
    if (jobDetail.employmentType !== undefined) {
      this.jobForm.employmentType = jobDetail.employmentType as any;
    }
    
    // Experience Level
    if (jobDetail.experience !== undefined) {
      this.jobForm.experience = jobDetail.experience as any;
    }
    
    // Position Type
    if (jobDetail.positionType !== undefined) {
      this.jobForm.positionLevel = jobDetail.positionType as any;
    }
    
    // Application Deadline
   if (jobDetail.expiresAt) {
    // Tạo Date object từ ISO string
    const date = new Date(jobDetail.expiresAt);
    
    // Lấy ngày theo local timezone (không bị lệch múi giờ)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Format: YYYY-MM-DD cho input type="date"
    this.jobForm.applicationDeadline = `${year}-${month}-${day}`;
  }
    
    // Salary
    if (jobDetail.salaryDeal) {
      this.salaryDeal = true;
      this.jobForm.salary = 'deal';
      this.salaryMin = 0;
      this.salaryMax = 0;
    } else {
      this.salaryDeal = false;
      this.salaryMin = jobDetail.salaryMin || 100000;
      this.salaryMax = jobDetail.salaryMax || 500000000;
      this.onSalaryChange();
    }
    
    // Location - Province và Ward
    if (jobDetail.provinceCode) {
      this.selectedProvince = jobDetail.provinceCode;
      this.onProvinceChange(jobDetail.provinceCode);
      
      // Set ward sau khi province đã load xong
      setTimeout(() => {
        if (jobDetail.wardCode) {
          this.selectedWard = jobDetail.wardCode;
        }
      }, 500);
    }
    
    // Category - Load parent và child category
    if (jobDetail.jobCategoryId) {
      this.loadCategoryForJob(jobDetail.jobCategoryId);
    }
  }

  populateJobTags(jobTags: any[]): void {
    if (!jobTags || jobTags.length === 0) {
      return;
    }

    // jobTags sẽ có cấu trúc của JobTagViewDto
    // Cần convert sang TagViewDto để match với availableTags
    const tagIds = jobTags.map(jt => jt.tagId).filter(id => id !== undefined);
    
    // Sau khi load available tags từ category, sẽ filter để chọn đúng tags
    // Tạm lưu tagIds để xử lý sau
    this.loadJobTagsAfterCategoryLoad(tagIds);
  }

  private loadJobTagsAfterCategoryLoad(tagIds: number[]): void {
    // Đợi một chút để availableTags được load từ category
    const checkInterval = setInterval(() => {
      if (this.availableTags.length > 0) {
        clearInterval(checkInterval);
        
        // Filter và select các tags từ availableTags dựa trên tagIds
        this.selectedTags = this.availableTags.filter(tag => 
          tag.id && tagIds.includes(tag.id)
        );
      }
    }, 200);

    // Timeout sau 5s để tránh loop vô hạn
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 5000);
  }

  loadCategoryForJob(categoryId: string): void {
    // Tìm category trong tree để xác định parent
    const findCategoryInTree = (tree: CategoryTreeDto[], catId: string): { parent?: CategoryTreeDto, child?: CategoryTreeDto } => {
      for (const parent of tree) {
        if (parent.categoryId === catId) {
          return { child: parent }; // Nếu trùng với parent thì không có child
        }
        if (parent.children) {
          const child = parent.children.find(c => c.categoryId === catId);
          if (child) {
            return { parent, child };
          }
        }
      }
      return {};
    };

    const { parent, child } = findCategoryInTree(this.categoryTree, categoryId);
    
    if (child && parent) {
      // Có cả parent và child
      this.selectedParentId = parent.categoryId || '';
      this.onParentCategoryChange(this.selectedParentId);
      
      setTimeout(() => {
        this.selectedCategoryId = child.categoryId || '';
        this.onChildCategoryChange(this.selectedCategoryId);
      }, 200);
    } else if (child) {
      // Chỉ có child (parent level)
      this.selectedParentId = child.categoryId || '';
      this.onParentCategoryChange(this.selectedParentId);
    }
  }
  //#endregion

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
    
    // Chỉ clear selectedTags nếu không đang ở chế độ edit
    if (!this.isEditMode) {
      this.selectedTags = [];
    }
    
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
    
    // Chỉ clear selectedTags nếu không đang ở chế độ edit
    if (!this.isEditMode) {
      this.selectedTags = [];
    }
    
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
        
        // Re-map selected tags với ID đúng từ available tags (chỉ khi edit mode)
        if (this.isEditMode && this.selectedTags.length > 0) {
          this.selectedTags = this.selectedTags.map(selectedTag => {
            const found = tags.find(t => t.id === selectedTag.id);
            return found || selectedTag;
          }).filter(tag => tag.id); // Chỉ giữ tags có ID
        }
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
  async onSaveOrUpdateJob() {
    if (this.isSubmitting) return;

    if (!this.validateForm()) {
      this.showToastMessage('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
      return;
    }
    
    this.isSubmitting = true;

    try {
      if (this.isEditMode && this.jobId) {
        // Update mode - sử dụng JobPostUpdateDto
        const updateDto: JobPostUpdateDto = {
          id: this.jobId,
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
          tagIds: this.selectedTags.map(t => t.id!).filter(id => id !== undefined),
        };

        // Update job post
        this.jobPostService.updateJobPostByDto(updateDto).subscribe({
          next: () => {
            // Sau khi update job thành công, update tags
            const tagDto = {
              jobId: this.jobId,
              tagIds: this.selectedTags.map(t => t.id!).filter(id => id !== undefined)
            };

            this.jobTagService.updateTagOfJobByDto(tagDto).subscribe({
              next: () => {
                this.showToastMessage('Cập nhật công việc thành công!', 'success');
                this.isSubmitting = false;
              },
              error: err => {
                console.error('Lỗi cập nhật tags:', err);
                this.showToastMessage('Cập nhật công việc thành công nhưng lỗi khi cập nhật tags', 'warning');
                this.isSubmitting = false;
              }
            });
          },
          error: err => {
            console.error('Lỗi cập nhật job:', err);
            this.showToastMessage('Lỗi khi cập nhật công việc', 'error');
            this.isSubmitting = false;
          }
        });
      } else {
        // Create mode - sử dụng JobPostCreateDto
        const createDto: JobPostCreateDto = {
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
          tagIds: this.selectedTags.map(t => t.id!).filter(id => id !== undefined),
          recruitmentCampaignId: this.campaignId || undefined,
        };

        this.jobPostService.createJobPostByDto(createDto).subscribe({
          next: res => {
            console.log(res);
            this.showToastMessage('Đã lưu bản nháp thành công!', 'success');
            this.isSubmitting = false;
          },
          error: err => {
            console.error(err);
            this.showToastMessage('Lỗi khi lưu bản nháp', 'error');
            this.isSubmitting = false;
          },
        });
      }
    } catch (error: any) {
      console.error('Error saving job:', error);
      this.showToastMessage('Lỗi khi lưu công việc', 'error');
      this.isSubmitting = false;
    }
  }

  getSubmitButtonText(): string {
    return this.isEditMode ? 'Cập nhật' : 'Lưu bản nháp';
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

    // Validate application deadline - từ 7 ngày đến 2 tháng
    if (this.jobForm.applicationDeadline) {
      const selectedDate = new Date(this.jobForm.applicationDeadline);
      const now = new Date();
      const minDate = new Date();
      const maxDate = new Date();
      
      minDate.setDate(now.getDate() + 7); // Tối thiểu 7 ngày
      maxDate.setDate(now.getDate() + 60); // Tối đa 2 tháng (60 ngày)

      // Reset time to start of day for accurate comparison
      selectedDate.setHours(0, 0, 0, 0);
      minDate.setHours(0, 0, 0, 0);
      maxDate.setHours(0, 0, 0, 0);

      if (selectedDate < minDate) {
        this.validationErrors['applicationDeadline'] = 'Hạn nộp hồ sơ phải ít nhất 7 ngày kể từ hôm nay';
      } else if (selectedDate > maxDate) {
        this.validationErrors['applicationDeadline'] = 'Hạn nộp hồ sơ không được vượt quá 2 tháng';
      }
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

  // Lấy ngày tối thiểu (hôm nay + 7 ngày)
  getMinApplicationDeadline(): string {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 7);
    return minDate.toISOString().split('T')[0];
  }

  // Lấy ngày tối đa (hôm nay + 60 ngày)
  getMaxApplicationDeadline(): string {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 60);
    return maxDate.toISOString().split('T')[0];
  }

  checkSidebarState(): void {
    const sidebar = document.querySelector('app-sidebar .sidebar');
    this.sidebarExpanded = !!sidebar?.classList.contains('show');
  }
  //#endregion
}