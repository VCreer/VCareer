import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslationService } from '../../../../core/services/translation.service';
import { CvTemplateService } from '../../../../proxy/http-api/controllers/cv-template.service';
import { CvTemplateDto, GetCvTemplateListDto } from '../../../../proxy/cv/models';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-cv-sample',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cv-sample.html',
  styleUrls: ['./cv-sample.scss']
})
export class CvSampleComponent implements OnInit {
  selectedLanguage: string = 'vi';
  selectedFilter: string = 'all';
  loading: boolean = false;
  
  filters = [
    { id: 'all', label: 'cv_sample.filter.all', icon: 'fa fa-th', category: null },
    { id: 'simple', label: 'cv_sample.filter.simple', icon: 'fa fa-circle-o', category: 'Simple' },
    { id: 'professional', label: 'cv_sample.filter.professional', icon: 'fa fa-briefcase', category: 'Professional' },
    { id: 'modern', label: 'cv_sample.filter.modern', icon: 'fa fa-cube', category: 'Modern' }
  ];

  templates: CvTemplateDto[] = [];
  filteredTemplates: CvTemplateDto[] = [];
  
  get hasResults(): boolean {
    return this.filteredTemplates.length > 0;
  }

  constructor(
    private router: Router,
    private translationService: TranslationService,
    private cvTemplateService: CvTemplateService
  ) {}

  ngOnInit() {
    this.translationService.currentLanguage$.subscribe(lang => {
      this.selectedLanguage = lang;
    });
    
    this.loadTemplates();
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  loadTemplates() {
    this.loading = true;
    
    const input: GetCvTemplateListDto = {
      isActive: true, // Chỉ lấy template đang active
      skipCount: 0,
      maxResultCount: 100,
      sorting: 'sortOrder ASC'
    };

    this.cvTemplateService.getList(input).subscribe({
      next: (response: any) => {
        console.log('Templates Response:', response);
        
        // Extract templates từ ActionResult
        let templateList: CvTemplateDto[] = [];
        if (response.result?.items && Array.isArray(response.result.items)) {
          templateList = response.result.items;
        } else if (response.result && Array.isArray(response.result)) {
          templateList = response.result;
        } else if (response.items && Array.isArray(response.items)) {
          templateList = response.items;
        } else if (Array.isArray(response)) {
          templateList = response;
        } else if (response.value?.items && Array.isArray(response.value.items)) {
          templateList = response.value.items;
        } else if (response.data?.items && Array.isArray(response.data.items)) {
          templateList = response.data.items;
        }
        
        this.templates = templateList;
        this.filteredTemplates = templateList;
        this.loading = false;
        
        console.log('Loaded templates:', this.templates);
      },
      error: (error) => {
        console.error('Error loading templates:', error);
        this.templates = [];
        this.filteredTemplates = [];
        this.loading = false;
      }
    });
  }

  selectFilter(filterId: string) {
    this.selectedFilter = filterId;
    const filter = this.filters.find(f => f.id === filterId);
    
    if (filterId === 'all') {
      this.filteredTemplates = this.templates;
    } else if (filter?.category) {
      // Filter theo category
      this.filteredTemplates = this.templates.filter(template => 
        template.category?.toLowerCase() === filter.category?.toLowerCase()
      );
    } else {
      this.filteredTemplates = this.templates;
    }
  }

  useTemplate(templateId: string) {
    // Navigate đến write-cv với templateId
    this.router.navigate(['/candidate/write-cv', templateId]);
  }

  getTemplatePreviewImage(template: CvTemplateDto): string {
    // Nếu có previewImageUrl thì dùng (có thể là base64 hoặc URL)
    if (template.previewImageUrl) {
      // Nếu là base64 string (bắt đầu bằng data:image)
      if (template.previewImageUrl.startsWith('data:image')) {
        return template.previewImageUrl;
      }
      
      // Nếu là đường dẫn tương đối (bắt đầu bằng /), thêm base URL
      if (template.previewImageUrl.startsWith('/')) {
        // Lấy base URL từ environment (ví dụ: http://localhost:44385)
        const baseUrl = environment.apis?.default?.url || '';
        // Loại bỏ trailing slash nếu có
        const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        return `${cleanBaseUrl}${template.previewImageUrl}`;
      }
      
      // Nếu là URL đầy đủ (http:// hoặc https://)
      if (template.previewImageUrl.startsWith('http://') || template.previewImageUrl.startsWith('https://')) {
        return template.previewImageUrl;
      }
      
      // Nếu là URL tương đối khác, trả về như cũ
      return template.previewImageUrl;
    }
    // Fallback về placeholder (dùng file có sẵn)
    return 'assets/images/cv-sample/not-cv-sample.png';
  }

  onImageError(event: any) {
    // Nếu image load lỗi, fallback về placeholder (dùng file có sẵn)
    const placeholder = 'assets/images/cv-sample/not-cv-sample.png';
    // Tránh lặp vô hạn nếu placeholder cũng lỗi
    if (event.target.src !== placeholder && !event.target.src.includes(placeholder)) {
      event.target.src = placeholder;
    }
  }

  getTemplateTags(template: CvTemplateDto): string[] {
    const tags: string[] = [];
    
    if (template.category) {
      tags.push(template.category);
    }
    
    if (template.supportedFields) {
      // Parse supportedFields nếu cần
      const fields = template.supportedFields.split(',').map(f => f.trim());
      tags.push(...fields.slice(0, 2)); // Chỉ lấy 2 fields đầu
    }
    
    return tags.length > 0 ? tags : ['Tiêu chuẩn'];
  }
}
