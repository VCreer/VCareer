import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslationService } from '../../../../core/services/translation.service';
import { HeaderCvEditorComponent } from '../../../../shared/components/header-cv-editor/header-cv-editor';
import { ToastNotificationComponent } from '../../../../shared/components/toast-notification/toast-notification';
import { PdfViewerComponent } from '../../../../shared/components/pdf-viewer/pdf-viewer';
import { ModalUpdateNameCvComponent } from '../../../../shared/components/modal-update-name-cv/modal-update-name-cv';
import { ModalUpdatePhotoComponent } from '../../../../shared/components/modal-update-photo/modal-update-photo';
import { CvTemplateService } from '../../../../proxy/http-api/controllers/cv-template.service';
import { CandidateCvService } from '../../../../proxy/http-api/controllers/candidate-cv.service';
import { CvTemplateDto } from '../../../../proxy/cv/models';
import { CvBlockEditorComponent } from '../../../../shared/components/cv-block-editor/cv-block-editor';
import { CvFormPreviewComponent } from '../../../../shared/components/cv-form-preview/cv-form-preview';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// === Block-based CV schema (hybrid model) ===
export type CvBlockType =
  | 'personal-info'
  | 'work-experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certificates'
  | 'languages'
  | 'custom-text';

export interface CvBlock {
  id: string;
  type: CvBlockType;
  title?: string;
  data: any;
  meta?: {
    pinned?: boolean;
    collapsed?: boolean;
  };
}

export interface PersonalInfoBlockData {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  gender?: boolean | null;
  profileImageUrl?: string;
  linkedIn?: string;
  gitHub?: string;
  website?: string;
}

export interface WorkExperienceItem {
  companyName?: string;
  position?: string;
  startDate?: string;
  endDate?: string;
  isCurrentJob?: boolean;
  description?: string;
  achievements?: string[];
}

export interface WorkExperienceBlockData {
  items: WorkExperienceItem[];
}

export interface CustomTextBlockData {
  html: string;
}

@Component({
  selector: 'app-write-cv',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    HeaderCvEditorComponent, 
    ToastNotificationComponent, 
    PdfViewerComponent, 
    ModalUpdateNameCvComponent, 
    ModalUpdatePhotoComponent,
    CvBlockEditorComponent,
    CvFormPreviewComponent
  ],
  templateUrl: './write-cv.html',
  styleUrls: ['./write-cv.scss']
})
export class WriteCv implements OnInit {
  selectedLanguage: string = 'vi';
  templateId: string = '';
  templateType: string = '';
  cvId: string = ''; // CV ID khi edit mode
  isEditMode: boolean = false; // Flag để biết là create hay edit
  cvName: string = 'CV chưa đặt tên';
  loading: boolean = false;
  
  // Template data
  currentTemplate: CvTemplateDto | null = null;
  templateHtml: string = '';
  templateStyles: string = '';
  
  // CV Data (sẽ được lưu vào DataJson)
  cvData: any = {
    personalInfo: {
      fullName: '',
      email: '',
      phoneNumber: '',
      dateOfBirth: '',
      address: '',
      gender: null,
      profileImageUrl: '',
      linkedIn: '',
      website: ''
    },
    careerObjective: '',
    workExperiences: [],
    educations: [],
    skills: [],
    projects: [],
    certificates: [],
    languages: []
  };

  /**
   * Danh sách block của CV theo schema mới (hybrid).
   * Hiện tại UI vẫn đang thao tác trực tiếp trên cvData,
   * nhưng blocks sẽ dần được đưa vào để hỗ trợ add/xóa/reorder linh hoạt.
   */
  blocks: CvBlock[] = [];
  
  // Block editor flag
  useBlockEditor: boolean = true; // Toggle giữa block editor và template form cũ
  templateSettings = {
    layout: 'two-column',
    accentColor: '#0F83BA',
    headingStyle: 'underline',
    skillStyle: 'list',
    timeline: false,
    cleanView: false
  };
  
  // Validation errors
  phoneError: boolean = false;
  emailError: boolean = false;
  addressError: boolean = false;
  nameError: boolean = false;
  positionError: boolean = false;
  birthdateError: boolean = false;
  genderError: boolean = false;
  websiteError: boolean = false;

  // Toast state
  toast: { show: boolean; message: string; type: 'success' | 'error' | 'warning' | 'info'; duration: number } = {
    show: false,
    message: '',
    type: 'info',
    duration: 3000
  };

  showEditPhoto: boolean = false;
  showPreviewDialog: boolean = false;
  showUpdateNameModal: boolean = false;
  showUpdatePhotoModal: boolean = false;
  modalCvName: string = '';
  canUndo: boolean = false;
  canRedo: boolean = false;
  
  // Translated text properties
  translations: any = {};
  
  // Preview data
  previewData: any = {};
  pdfPreviewUrl: string = '';
  cvHtmlPreview: string = '';
  
  // Undo/Redo history
  private cvHistory: any[] = [];
  private currentHistoryIndex: number = -1;
  private maxHistorySize: number = 50;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private translationService: TranslationService,
    private cvTemplateService: CvTemplateService,
    private candidateCvService: CandidateCvService
  ) {}

  onEditorInput(event: Event) {
    const editor = event.target as HTMLElement;
    editor.classList.remove('ql-blank');
    setTimeout(() => {
      this.saveToHistory();
    }, 500);
  }

  onEditorBlur(event: Event) {
    const editor = event.target as HTMLElement;
    if (!editor.textContent || editor.textContent.trim() === '' || editor.textContent.trim() === '\n') {
      editor.classList.add('ql-blank');
    }
    this.saveToHistory();
  }

  saveToHistory() {
    // Get all CV content
    const cvContent = this.getCvContent();
    
    // Only save if content has changed
    const lastSaved = this.cvHistory[this.currentHistoryIndex];
    if (!lastSaved || JSON.stringify(cvContent) !== JSON.stringify(lastSaved)) {
      // Remove any history after current index (for redo)
      this.cvHistory = this.cvHistory.slice(0, this.currentHistoryIndex + 1);
      
      // Add new state
      this.cvHistory.push(cvContent);
      
      // Limit history size
      if (this.cvHistory.length > this.maxHistorySize) {
        this.cvHistory.shift();
      } else {
        this.currentHistoryIndex++;
      }
      
      // Update button states
      this.updateButtonStates();
    }
  }

  getCvContent(): any {
    // Collect all CV content from the form
    const allEditors = document.querySelectorAll('.ql-editor');
    const content: any = {};
    
    allEditors.forEach((editor: any, index: number) => {
      content[`editor_${index}`] = editor.textContent || '';
    });
    
    // Get info-section fields
    const fullnameInput = document.querySelector('.fullname-input') as HTMLInputElement;
    const positionInput = document.querySelector('.position-input') as HTMLInputElement;
    const contactInputs = document.querySelectorAll('.contact-input') as NodeListOf<HTMLInputElement>;
    
    if (fullnameInput) content['fullname'] = fullnameInput.value || '';
    if (positionInput) content['position'] = positionInput.value || '';
    
    contactInputs.forEach((input, index) => {
      content[`contact_${index}`] = input.value || '';
    });
    
    return content;
  }

  updateButtonStates() {
    this.canUndo = this.currentHistoryIndex > 0;
    this.canRedo = this.currentHistoryIndex < this.cvHistory.length - 1;
  }

  ngOnInit() {
    // Lấy templateId từ route
    this.templateId = this.route.snapshot.paramMap.get('templateId') || '';
    
    // Kiểm tra xem có cvId trong queryParams không (edit mode)
    const cvId = this.route.snapshot.queryParamMap.get('cvId');
    const mode = this.route.snapshot.queryParamMap.get('mode');
    
    if (cvId && mode === 'edit') {
      this.cvId = cvId;
      this.isEditMode = true;
      console.log('Edit mode - CV ID:', this.cvId);
    }
    
    if (!this.templateId) {
      console.error('No templateId provided');
      this.showToast('Không tìm thấy template. Vui lòng chọn lại.', 'error');
      setTimeout(() => {
        this.router.navigate(['/candidate/cv-sample']);
      }, 2000);
      return;
    }
    
    this.updateTranslations();
    
    this.translationService.currentLanguage$.subscribe(lang => {
      this.selectedLanguage = lang;
      this.updateTranslations();
    });
    
    // Load template từ API
    this.loadTemplate();
    
    // Nếu là edit mode, load CV data sau khi template đã load
    if (this.isEditMode && this.cvId) {
      // Sẽ load CV data sau khi template render xong
    }
    
    // Initialize with empty CV state (sẽ được override nếu là edit mode)
    // Đồng thời khởi tạo danh sách blocks từ cvData hiện tại (schema hybrid)
    setTimeout(() => {
      this.blocks = this.buildBlocksFromCvData(this.cvData);
      this.saveToHistory();
    }, 100);
  }

  loadTemplate() {
    this.loading = true;
    
    this.cvTemplateService.get(this.templateId).subscribe({
      next: (response: any) => {
        console.log('Template Response:', response);
        
        // Extract template từ ActionResult
        let template: CvTemplateDto;
        if (response.result) {
          template = response.result;
        } else if (response.data) {
          template = response.data;
        } else {
          template = response;
        }
        
        if (!template || !template.layoutDefinition) {
          console.error('Template not found or invalid');
          this.showToast('Template không hợp lệ. Vui lòng chọn lại.', 'error');
          this.loading = false;
          setTimeout(() => {
            this.router.navigate(['/candidate/cv-sample']);
          }, 2000);
          return;
        }
        
        this.currentTemplate = template;
        this.templateType = template.category || 'standard';
        this.templateHtml = template.layoutDefinition;
        this.templateStyles = template.styles || '';
        
        // Map blocks theo template structure nếu đang dùng block editor
        if (this.useBlockEditor) {
          this.mapBlocksFromTemplate(template);
        }
        
        // Nếu là edit mode, load CV data trước khi render form
        if (this.isEditMode && this.cvId) {
          this.loadCvData();
        } else {
          // Render form với empty data
          this.renderTemplateForm();
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error loading template:', error);
        this.showToast('Không thể tải template. Vui lòng thử lại.', 'error');
        this.loading = false;
        setTimeout(() => {
          this.router.navigate(['/candidate/cv-sample']);
        }, 2000);
      }
    });
  }

  @ViewChild('templateFormContainer', { static: false }) templateFormContainer!: ElementRef<HTMLDivElement>;
  @ViewChild(CvFormPreviewComponent, { static: false }) cvFormPreviewComponent!: CvFormPreviewComponent;

  loadCvData() {
    console.log('Loading CV data for edit, CV ID:', this.cvId);
    
    this.candidateCvService.get(this.cvId).subscribe({
      next: (response: any) => {
        console.log('CV Data Response:', response);
        
        let cv: any;
        if (response.result) {
          cv = response.result;
        } else if (response.data) {
          cv = response.data;
        } else {
          cv = response;
        }
        
        // Load tên CV
        if (cv.cvName) {
          this.cvName = cv.cvName;
        }
        
        // Ưu tiên load từ BlocksJson nếu có (giữ nguyên structure blocks)
        if (cv.blocksJson) {
          try {
            console.log('Loading from BlocksJson:', cv.blocksJson);
            this.blocks = JSON.parse(cv.blocksJson);
            console.log('Loaded blocks:', this.blocks);
            
            // Build cvData từ blocks để đồng bộ
            this.cvData = this.buildCvDataFromBlocks(this.blocks);
            console.log('Built cvData from blocks:', this.cvData);
            
            // Render form với data đã load
            this.renderTemplateForm();
            this.loading = false;
          } catch (error) {
            console.error('Error parsing BlocksJson:', error);
            // Fallback về DataJson nếu parse BlocksJson thất bại
            this.loadFromDataJson(cv);
          }
        } else if (cv.dataJson) {
          // Fallback: Load từ DataJson và rebuild blocks
          this.loadFromDataJson(cv);
        } else {
          // Không có data, render form với empty data
          this.blocks = this.buildBlocksFromCvData(this.cvData);
          this.renderTemplateForm();
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error loading CV data:', error);
        this.showToast('Không thể tải dữ liệu CV. Vui lòng thử lại.', 'error');
        this.loading = false;
        // Render form với empty data
        this.blocks = this.buildBlocksFromCvData(this.cvData);
        this.renderTemplateForm();
      }
    });
  }

  /**
   * Load CV data từ DataJson (fallback khi không có BlocksJson)
   */
  private loadFromDataJson(cv: any) {
    try {
      const backendData = JSON.parse(cv.dataJson);
      console.log('Parsed backend data:', backendData);
      
      // Convert từ PascalCase (backend) sang camelCase (frontend)
      this.cvData = this.convertFromBackendFormat(backendData);
      console.log('Converted to frontend format:', this.cvData);

      // Khởi tạo danh sách blocks theo schema hybrid từ cvData hiện tại
      this.blocks = this.buildBlocksFromCvData(this.cvData);
      
      // Render form với data đã load
      this.renderTemplateForm();
      this.loading = false;
    } catch (error) {
      console.error('Error parsing DataJson:', error);
      this.showToast('Không thể tải dữ liệu CV. Vui lòng thử lại.', 'error');
      this.loading = false;
      // Render form với empty data
      this.renderTemplateForm();
    }
  }

  /**
   * Convert từ backend PascalCase format sang frontend camelCase format
   */
  private convertFromBackendFormat(backendData: any): any {
    const result: any = {
      personalInfo: {
        fullName: '',
        email: '',
        phoneNumber: '',
        dateOfBirth: '',
        address: '',
        gender: null,
        profileImageUrl: '',
        linkedIn: '',
        website: ''
      },
      careerObjective: '',
      workExperiences: [],
      educations: [],
      skills: [],
      projects: [],
      certificates: [],
      languages: []
    };
    
    // PersonalInfo
    if (backendData.PersonalInfo) {
      const pi = backendData.PersonalInfo;
      result.personalInfo = {
        fullName: pi.FullName || '',
        email: pi.Email || '',
        phoneNumber: pi.PhoneNumber || '',
        dateOfBirth: pi.DateOfBirth ? this.formatDateForInput(pi.DateOfBirth) : '',
        address: pi.Address || '',
        gender: pi.Gender !== null && pi.Gender !== undefined ? pi.Gender : null,
        profileImageUrl: pi.ProfileImageUrl || '',
        linkedIn: pi.LinkedIn || '',
        website: pi.Website || ''
      };
    }
    
    // CareerObjective
    result.careerObjective = backendData.CareerObjective || '';
    
    // WorkExperiences
    if (backendData.WorkExperiences && Array.isArray(backendData.WorkExperiences)) {
      result.workExperiences = backendData.WorkExperiences.map((exp: any) => ({
        companyName: exp.CompanyName || '',
        position: exp.Position || '',
        startDate: exp.StartDate ? this.formatDateForInput(exp.StartDate) : '',
        endDate: exp.EndDate ? this.formatDateForInput(exp.EndDate) : '',
        isCurrentJob: exp.IsCurrentJob || false,
        description: exp.Description || '',
        achievements: exp.Achievements && Array.isArray(exp.Achievements) ? exp.Achievements : []
      }));
    }
    
    // Educations
    if (backendData.Educations && Array.isArray(backendData.Educations)) {
      result.educations = backendData.Educations.map((edu: any) => ({
        institutionName: edu.InstitutionName || '',
        degree: edu.Degree || '',
        major: edu.Major || '',
        startDate: edu.StartDate ? this.formatDateForInput(edu.StartDate) : '',
        endDate: edu.EndDate ? this.formatDateForInput(edu.EndDate) : '',
        isCurrent: edu.IsCurrent || false,
        gpa: edu.Gpa || '',
        description: edu.Description || ''
      }));
    }
    
    // Skills
    if (backendData.Skills && Array.isArray(backendData.Skills)) {
      result.skills = backendData.Skills.map((skill: any) => ({
        skillName: skill.SkillName || '',
        level: skill.Level || '',
        category: skill.Category || ''
      }));
    }
    
    // Projects
    if (backendData.Projects && Array.isArray(backendData.Projects)) {
      result.projects = backendData.Projects.map((project: any) => ({
        projectName: project.ProjectName || '',
        description: project.Description || '',
        technologies: project.Technologies || '',
        projectUrl: project.ProjectUrl || '',
        startDate: project.StartDate ? this.formatDateForInput(project.StartDate) : '',
        endDate: project.EndDate ? this.formatDateForInput(project.EndDate) : ''
      }));
    }
    
    // Certificates
    if (backendData.Certificates && Array.isArray(backendData.Certificates)) {
      result.certificates = backendData.Certificates.map((cert: any) => ({
        certificateName: cert.CertificateName || '',
        issuingOrganization: cert.IssuingOrganization || '',
        issueDate: cert.IssueDate ? this.formatDateForInput(cert.IssueDate) : '',
        credentialId: cert.CredentialId || ''
      }));
    }
    
    // Languages
    if (backendData.Languages && Array.isArray(backendData.Languages)) {
      result.languages = backendData.Languages.map((lang: any) => ({
        languageName: lang.LanguageName || '',
        proficiencyLevel: lang.ProficiencyLevel || ''
      }));
    }
    
    return result;
  }

  /**
   * Format date từ ISO string hoặc Date object sang format YYYY-MM-DD cho input[type="date"]
   */
  private formatDateForInput(date: any): string {
    if (!date) return '';
    
    let dateObj: Date;
    if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      return '';
    }
    
    // Format: YYYY-MM-DD
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  renderTemplateForm() {
    if (!this.templateHtml || !this.templateFormContainer) {
      // Wait for ViewChild to be initialized
      setTimeout(() => this.renderTemplateForm(), 100);
      return;
    }

    console.log('Rendering template form from LayoutDefinition');
    
    // Clone HTML để không làm thay đổi template gốc
    let htmlContent = this.templateHtml;
    
    // Inject styles vào head hoặc đầu HTML
    if (this.templateStyles) {
      if (htmlContent.includes('<head>')) {
        htmlContent = htmlContent.replace('<head>', `<head><style>${this.templateStyles}</style>`);
      } else if (htmlContent.includes('</head>')) {
        htmlContent = htmlContent.replace('</head>', `<style>${this.templateStyles}</style></head>`);
      } else {
        htmlContent = `<style>${this.templateStyles}</style>${htmlContent}`;
      }
    }
    
    // Replace placeholders với input fields
    htmlContent = this.replacePlaceholdersWithInputs(htmlContent);
    
    // Render vào container
    if (this.templateFormContainer?.nativeElement) {
      this.templateFormContainer.nativeElement.innerHTML = htmlContent;
      
      // Setup event listeners cho các input fields
      this.setupInputListeners();
      
      // Expose methods to window for onclick handlers
      this.exposeMethodsToWindow();
    }
  }

  /**
   * Expose component methods to window object for onclick handlers
   */
  exposeMethodsToWindow() {
    (window as any).addWorkExperience = () => this.addWorkExperience();
    (window as any).removeWorkExperience = (index: number) => this.removeWorkExperience(index);
    (window as any).moveWorkExperienceUp = (index: number) => this.moveWorkExperienceUp(index);
    (window as any).moveWorkExperienceDown = (index: number) => this.moveWorkExperienceDown(index);
    
    (window as any).addEducation = () => this.addEducation();
    (window as any).removeEducation = (index: number) => this.removeEducation(index);
    (window as any).moveEducationUp = (index: number) => this.moveEducationUp(index);
    (window as any).moveEducationDown = (index: number) => this.moveEducationDown(index);
    
    (window as any).addSkill = () => this.addSkill();
    (window as any).removeSkill = (index: number) => this.removeSkill(index);
    (window as any).moveSkillUp = (index: number) => this.moveSkillUp(index);
    (window as any).moveSkillDown = (index: number) => this.moveSkillDown(index);
  }

  /**
   * Escape HTML để tránh XSS và các vấn đề với special characters trong value attribute
   */
  private escapeHtmlForValue(str: string): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  replacePlaceholdersWithInputs(html: string): string {
    // Personal Info placeholders - Wrap trong section container với hover buttons
    const fullName = this.escapeHtmlForValue(this.cvData.personalInfo?.fullName || '');
    const email = this.escapeHtmlForValue(this.cvData.personalInfo?.email || '');
    const phoneNumber = this.escapeHtmlForValue(this.cvData.personalInfo?.phoneNumber || '');
    const address = this.escapeHtmlForValue(this.cvData.personalInfo?.address || '');
    const dateOfBirth = this.cvData.personalInfo?.dateOfBirth || '';
    const profileImageUrl = this.escapeHtmlForValue(this.cvData.personalInfo?.profileImageUrl || '');
    const linkedIn = this.escapeHtmlForValue(this.cvData.personalInfo?.linkedIn || '');
    const website = this.escapeHtmlForValue(this.cvData.personalInfo?.website || '');
    const careerObjective = this.escapeHtmlForValue(this.cvData.careerObjective || '');
    
    // Wrap PersonalInfo section trong container với hover buttons
    // Profile không thể xóa (nghiệp vụ) nên chỉ có nút để edit fields
    if (html.includes('{{personalInfo.') || html.includes('personalInfo.')) {
      // Tìm và wrap toàn bộ personalInfo section
      html = html.replace(/(<div[^>]*class="[^"]*section[^"]*"[^>]*>[\s\S]*?)(\{\{personalInfo\.|personalInfo\.)/gi, 
        (match, before, placeholder) => {
          // Nếu chưa có section wrapper, thêm vào
          if (!before.includes('cv-section-item')) {
            return before + '<div class="cv-section-item cv-section-personal-info" data-section-type="personalInfo"><div class="cv-section-item-content">' + placeholder;
          }
          return match;
        });
    }
    
    html = html.replace(/\{\{personalInfo\.fullName\}\}/g, 
      `<input type="text" class="cv-input" data-field="personalInfo.fullName" placeholder="Họ và tên" value="${fullName}">`);
    
    html = html.replace(/\{\{personalInfo\.email\}\}/g, 
      `<input type="email" class="cv-input" data-field="personalInfo.email" placeholder="Email" value="${email}">`);
    
    html = html.replace(/\{\{personalInfo\.phoneNumber\}\}/g, 
      `<input type="tel" class="cv-input" data-field="personalInfo.phoneNumber" placeholder="Số điện thoại" value="${phoneNumber}">`);
    
    html = html.replace(/\{\{personalInfo\.address\}\}/g, 
      `<input type="text" class="cv-input" data-field="personalInfo.address" placeholder="Địa chỉ" value="${address}">`);
    
    html = html.replace(/\{\{personalInfo\.dateOfBirth\}\}/g, 
      `<input type="date" class="cv-input" data-field="personalInfo.dateOfBirth" value="${dateOfBirth}">`);
    
    html = html.replace(/\{\{personalInfo\.profileImageUrl\}\}/g, 
      `<input type="url" class="cv-input" data-field="personalInfo.profileImageUrl" placeholder="URL ảnh đại diện" value="${profileImageUrl}">`);
    
    html = html.replace(/\{\{personalInfo\.linkedIn\}\}/g, 
      `<input type="url" class="cv-input" data-field="personalInfo.linkedIn" placeholder="LinkedIn" value="${linkedIn}">`);
    
    html = html.replace(/\{\{personalInfo\.website\}\}/g, 
      `<input type="url" class="cv-input" data-field="personalInfo.website" placeholder="Website" value="${website}">`);
    
    // Gender - select field
    const gender = this.cvData.personalInfo?.gender;
    html = html.replace(/\{\{personalInfo\.gender\}\}/g, 
      `<select class="cv-input" data-field="personalInfo.gender">
        <option value="">Chọn giới tính</option>
        <option value="true" ${gender === true ? 'selected' : ''}>Nam</option>
        <option value="false" ${gender === false ? 'selected' : ''}>Nữ</option>
      </select>`);
    
    // Career Objective - Wrap trong section container (không thể xóa)
    html = html.replace(/(\{\{careerObjective\}\})/g, 
      `<div class="cv-section-item cv-section-career-objective" data-section-type="careerObjective">
        <div class="cv-section-item-content">
          <textarea class="cv-textarea" data-field="careerObjective" placeholder="Mục tiêu nghề nghiệp">${careerObjective}</textarea>
        </div>
        <div class="cv-section-item-actions">
          <!-- Career Objective không thể xóa, chỉ có thể edit -->
        </div>
      </div>`);
    
    // Work Experiences - handle loop pattern
    html = this.replaceWorkExperienceInputs(html);
    
    // Educations - handle loop pattern
    html = this.replaceEducationInputs(html);
    
    // Skills
    html = this.replaceSkillsInputs(html);
    
    // Projects
    html = this.replaceProjectsInputs(html);
    
    // Certificates
    html = this.replaceCertificatesInputs(html);
    
    // Languages
    html = this.replaceLanguagesInputs(html);
    
    return html;
  }

  replaceWorkExperienceInputs(html: string): string {
    // Check for loop pattern
    const loopPattern = /\{\{#foreach\s+workExperiences\}\}([\s\S]*?)\{\{\/foreach\}\}/gi;
    
    if (loopPattern.test(html)) {
      // Template has loop pattern
      html = html.replace(loopPattern, (match, templateContent) => {
        let result = '<div class="work-experiences-container" data-section="workExperiences">';
        
        // Render existing experiences
        if (this.cvData.workExperiences && this.cvData.workExperiences.length > 0) {
          this.cvData.workExperiences.forEach((exp: any, index: number) => {
            result += this.renderWorkExperienceInput(templateContent, exp, index);
          });
        } else {
          // Render empty one
          result += this.renderWorkExperienceInput(templateContent, null, 0);
        }
        
        result += '<button type="button" class="btn-add-experience" onclick="window.addWorkExperience()">+ Thêm kinh nghiệm</button>';
        result += '</div>';
        return result;
      });
    } else {
      // Simple placeholder
      html = html.replace(/\{\{workExperiences\}\}/g, () => {
        let result = '<div class="work-experiences-container" data-section="workExperiences">';
        if (this.cvData.workExperiences && this.cvData.workExperiences.length > 0) {
          this.cvData.workExperiences.forEach((exp: any, index: number) => {
            result += this.renderWorkExperienceForm(exp, index);
          });
        } else {
          result += this.renderWorkExperienceForm(null, 0);
        }
        result += '<button type="button" class="btn-add-experience" onclick="window.addWorkExperience()">+ Thêm kinh nghiệm</button>';
        result += '</div>';
        return result;
      });
    }
    
    return html;
  }

  renderWorkExperienceInput(template: string, exp: any, index: number): string {
    let html = template;
    const data = exp || {};
    
    const companyName = this.escapeHtmlForValue(data.companyName || '');
    const position = this.escapeHtmlForValue(data.position || '');
    const description = this.escapeHtmlForValue(data.description || '');
    
    html = html.replace(/\{\{workExperience\.companyName\}\}/g, 
      `<input type="text" class="cv-input" data-field="workExperiences.${index}.companyName" placeholder="Tên công ty" value="${companyName}">`);
    
    html = html.replace(/\{\{workExperience\.position\}\}/g, 
      `<input type="text" class="cv-input" data-field="workExperiences.${index}.position" placeholder="Vị trí" value="${position}">`);
    
    html = html.replace(/\{\{workExperience\.description\}\}/g, 
      `<textarea class="cv-textarea" data-field="workExperiences.${index}.description" placeholder="Mô tả">${description}</textarea>`);
    
    html = html.replace(/\{\{workExperience\.dateRange\}\}/g, 
      `<input type="date" class="cv-input" data-field="workExperiences.${index}.startDate" placeholder="Ngày bắt đầu" value="${data.startDate || ''}">
       <input type="date" class="cv-input" data-field="workExperiences.${index}.endDate" placeholder="Ngày kết thúc" value="${data.endDate || ''}">`);
    
    // Wrap trong section item với hover buttons
    const totalItems = this.cvData.workExperiences?.length || 1;
    const canMoveUp = index > 0;
    const canMoveDown = index < totalItems - 1;
    
    return `
      <div class="cv-section-item cv-section-work-experience-item" data-section-type="workExperience" data-index="${index}">
        <div class="cv-section-item-content">
          ${html}
        </div>
        <div class="cv-section-item-actions">
          <button type="button" class="btn-action btn-move-up" ${!canMoveUp ? 'disabled' : ''} onclick="window.moveWorkExperienceUp(${index})" title="Di chuyển lên">
            <i class="fa fa-arrow-up"></i>
          </button>
          <button type="button" class="btn-action btn-move-down" ${!canMoveDown ? 'disabled' : ''} onclick="window.moveWorkExperienceDown(${index})" title="Di chuyển xuống">
            <i class="fa fa-arrow-down"></i>
          </button>
          <button type="button" class="btn-action btn-delete" onclick="window.removeWorkExperience(${index})" title="Xóa">
            <i class="fa fa-times"></i>
          </button>
        </div>
      </div>
    `;
  }

  renderWorkExperienceForm(exp: any, index: number): string {
    const data = exp || {};
    const companyName = this.escapeHtmlForValue(data.companyName || '');
    const position = this.escapeHtmlForValue(data.position || '');
    const description = this.escapeHtmlForValue(data.description || '');
    
    const totalItems = this.cvData.workExperiences?.length || 1;
    const canMoveUp = index > 0;
    const canMoveDown = index < totalItems - 1;
    
    return `
      <div class="cv-section-item cv-section-work-experience-item" data-section-type="workExperience" data-index="${index}">
        <div class="cv-section-item-content">
          <input type="text" class="cv-input" data-field="workExperiences.${index}.companyName" placeholder="Tên công ty" value="${companyName}">
          <input type="text" class="cv-input" data-field="workExperiences.${index}.position" placeholder="Vị trí" value="${position}">
          <input type="date" class="cv-input" data-field="workExperiences.${index}.startDate" value="${data.startDate || ''}">
          <input type="date" class="cv-input" data-field="workExperiences.${index}.endDate" value="${data.endDate || ''}">
          <textarea class="cv-textarea" data-field="workExperiences.${index}.description" placeholder="Mô tả">${description}</textarea>
        </div>
        <div class="cv-section-item-actions">
          <button type="button" class="btn-action btn-move-up" ${!canMoveUp ? 'disabled' : ''} onclick="window.moveWorkExperienceUp(${index})" title="Di chuyển lên">
            <i class="fa fa-arrow-up"></i>
          </button>
          <button type="button" class="btn-action btn-move-down" ${!canMoveDown ? 'disabled' : ''} onclick="window.moveWorkExperienceDown(${index})" title="Di chuyển xuống">
            <i class="fa fa-arrow-down"></i>
          </button>
          <button type="button" class="btn-action btn-delete" onclick="window.removeWorkExperience(${index})" title="Xóa">
            <i class="fa fa-times"></i>
          </button>
        </div>
      </div>
    `;
  }

  replaceEducationInputs(html: string): string {
    const loopPattern = /\{\{#foreach\s+educations\}\}([\s\S]*?)\{\{\/foreach\}\}/gi;
    
    if (loopPattern.test(html)) {
      html = html.replace(loopPattern, (match, templateContent) => {
        let result = '<div class="educations-container" data-section="educations">';
        if (this.cvData.educations && this.cvData.educations.length > 0) {
          this.cvData.educations.forEach((edu: any, index: number) => {
            result += this.renderEducationInput(templateContent, edu, index);
          });
        } else {
          result += this.renderEducationInput(templateContent, null, 0);
        }
        result += `
          <div class="cv-section-header-actions">
            <button type="button" class="btn-action btn-add-section" onclick="window.addEducation()">
              <i class="fa fa-plus"></i> Thêm
            </button>
          </div>
        `;
        result += '</div>';
        return result;
      });
    } else {
      html = html.replace(/\{\{educations\}\}/g, () => {
        let result = '<div class="educations-container" data-section="educations">';
        if (this.cvData.educations && this.cvData.educations.length > 0) {
          this.cvData.educations.forEach((edu: any, index: number) => {
            result += this.renderEducationForm(edu, index);
          });
        } else {
          result += this.renderEducationForm(null, 0);
        }
        result += `
          <div class="cv-section-header-actions">
            <button type="button" class="btn-action btn-add-section" onclick="window.addEducation()">
              <i class="fa fa-plus"></i> Thêm
            </button>
          </div>
        `;
        result += '</div>';
        return result;
      });
    }
    
    return html;
  }

  renderEducationInput(template: string, edu: any, index: number): string {
    let html = template;
    const data = edu || {};
    
    const institutionName = this.escapeHtmlForValue(data.institutionName || '');
    const major = this.escapeHtmlForValue(data.major || '');
    const degree = this.escapeHtmlForValue(data.degree || '');
    
    html = html.replace(/\{\{education\.institutionName\}\}/g, 
      `<input type="text" class="cv-input" data-field="educations.${index}.institutionName" placeholder="Tên trường" value="${institutionName}">`);
    
    html = html.replace(/\{\{education\.major\}\}/g, 
      `<input type="text" class="cv-input" data-field="educations.${index}.major" placeholder="Ngành học" value="${major}">`);
    
    html = html.replace(/\{\{education\.degree\}\}/g, 
      `<input type="text" class="cv-input" data-field="educations.${index}.degree" placeholder="Bằng cấp" value="${degree}">`);
    
    html = html.replace(/\{\{education\.dateRange\}\}/g, 
      `<input type="date" class="cv-input" data-field="educations.${index}.startDate" value="${data.startDate || ''}">
       <input type="date" class="cv-input" data-field="educations.${index}.endDate" value="${data.endDate || ''}">`);
    
    // Wrap trong section item với hover buttons
    const totalItems = this.cvData.educations?.length || 1;
    const canMoveUp = index > 0;
    const canMoveDown = index < totalItems - 1;
    
    return `
      <div class="cv-section-item cv-section-education-item" data-section-type="education" data-index="${index}">
        <div class="cv-section-item-content">
          ${html}
        </div>
        <div class="cv-section-item-actions">
          <button type="button" class="btn-action btn-move-up" ${!canMoveUp ? 'disabled' : ''} onclick="window.moveEducationUp(${index})" title="Di chuyển lên">
            <i class="fa fa-arrow-up"></i>
          </button>
          <button type="button" class="btn-action btn-move-down" ${!canMoveDown ? 'disabled' : ''} onclick="window.moveEducationDown(${index})" title="Di chuyển xuống">
            <i class="fa fa-arrow-down"></i>
          </button>
          <button type="button" class="btn-action btn-delete" onclick="window.removeEducation(${index})" title="Xóa">
            <i class="fa fa-times"></i>
          </button>
        </div>
      </div>
    `;
  }

  renderEducationForm(edu: any, index: number): string {
    const data = edu || {};
    const institutionName = this.escapeHtmlForValue(data.institutionName || '');
    const major = this.escapeHtmlForValue(data.major || '');
    const degree = this.escapeHtmlForValue(data.degree || '');
    
    const totalItems = this.cvData.educations?.length || 1;
    const canMoveUp = index > 0;
    const canMoveDown = index < totalItems - 1;
    
    return `
      <div class="cv-section-item cv-section-education-item" data-section-type="education" data-index="${index}">
        <div class="cv-section-item-content">
          <input type="text" class="cv-input" data-field="educations.${index}.institutionName" placeholder="Tên trường" value="${institutionName}">
          <input type="text" class="cv-input" data-field="educations.${index}.major" placeholder="Ngành học" value="${major}">
          <input type="text" class="cv-input" data-field="educations.${index}.degree" placeholder="Bằng cấp" value="${degree}">
          <input type="date" class="cv-input" data-field="educations.${index}.startDate" value="${data.startDate || ''}">
          <input type="date" class="cv-input" data-field="educations.${index}.endDate" value="${data.endDate || ''}">
        </div>
        <div class="cv-section-item-actions">
          <button type="button" class="btn-action btn-move-up" ${!canMoveUp ? 'disabled' : ''} onclick="window.moveEducationUp(${index})" title="Di chuyển lên">
            <i class="fa fa-arrow-up"></i>
          </button>
          <button type="button" class="btn-action btn-move-down" ${!canMoveDown ? 'disabled' : ''} onclick="window.moveEducationDown(${index})" title="Di chuyển xuống">
            <i class="fa fa-arrow-down"></i>
          </button>
          <button type="button" class="btn-action btn-delete" onclick="window.removeEducation(${index})" title="Xóa">
            <i class="fa fa-times"></i>
          </button>
        </div>
      </div>
    `;
  }

  replaceSkillsInputs(html: string): string {
    // Simple placeholder replacement for skills
    html = html.replace(/\{\{skills\}\}/g, () => {
      let result = '<div class="skills-container" data-section="skills">';
      if (this.cvData.skills && this.cvData.skills.length > 0) {
        this.cvData.skills.forEach((skill: any, index: number) => {
          const skillName = this.escapeHtmlForValue(skill.skillName || '');
          const level = this.escapeHtmlForValue(skill.level || '');
          const totalItems = this.cvData.skills.length;
          const canMoveUp = index > 0;
          const canMoveDown = index < totalItems - 1;
          
          result += `
            <div class="cv-section-item cv-section-skill-item" data-section-type="skill" data-index="${index}">
              <div class="cv-section-item-content">
                <input type="text" class="cv-input" data-field="skills.${index}.skillName" placeholder="Tên kỹ năng" value="${skillName}">
                <input type="text" class="cv-input" data-field="skills.${index}.level" placeholder="Mức độ" value="${level}">
              </div>
              <div class="cv-section-item-actions">
                <button type="button" class="btn-action btn-move-up" ${!canMoveUp ? 'disabled' : ''} onclick="window.moveSkillUp(${index})" title="Di chuyển lên">
                  <i class="fa fa-arrow-up"></i>
                </button>
                <button type="button" class="btn-action btn-move-down" ${!canMoveDown ? 'disabled' : ''} onclick="window.moveSkillDown(${index})" title="Di chuyển xuống">
                  <i class="fa fa-arrow-down"></i>
                </button>
                <button type="button" class="btn-action btn-delete" onclick="window.removeSkill(${index})" title="Xóa">
                  <i class="fa fa-times"></i>
                </button>
              </div>
            </div>
          `;
        });
      } else {
        result += `
          <div class="cv-section-item cv-section-skill-item" data-section-type="skill" data-index="0">
            <div class="cv-section-item-content">
              <input type="text" class="cv-input" data-field="skills.0.skillName" placeholder="Tên kỹ năng">
              <input type="text" class="cv-input" data-field="skills.0.level" placeholder="Mức độ">
            </div>
            <div class="cv-section-item-actions">
              <button type="button" class="btn-action btn-delete" onclick="window.removeSkill(0)" title="Xóa">
                <i class="fa fa-times"></i>
              </button>
            </div>
          </div>
        `;
      }
      result += `
        <div class="cv-section-header-actions">
          <button type="button" class="btn-action btn-add-section" onclick="window.addSkill()">
            <i class="fa fa-plus"></i> Thêm
          </button>
        </div>
      `;
      result += '</div>';
      return result;
    });
    
    return html;
  }

  replaceProjectsInputs(html: string): string {
    html = html.replace(/\{\{projects\}\}/g, () => {
      let result = '<div class="projects-container" data-section="projects">';
      // Similar to skills
      result += '</div>';
      return result;
    });
    return html;
  }

  replaceCertificatesInputs(html: string): string {
    html = html.replace(/\{\{certificates\}\}/g, () => {
      let result = '<div class="certificates-container" data-section="certificates">';
      // Similar structure
      result += '</div>';
      return result;
    });
    return html;
  }

  replaceLanguagesInputs(html: string): string {
    html = html.replace(/\{\{languages\}\}/g, () => {
      let result = '<div class="languages-container" data-section="languages">';
      // Similar structure
      result += '</div>';
      return result;
    });
    return html;
  }

  setupInputListeners() {
    if (!this.templateFormContainer?.nativeElement) return;
    
    const container = this.templateFormContainer.nativeElement;
    const inputs = container.querySelectorAll('input, textarea, select');
    
    inputs.forEach((input: any) => {
      const field = input.getAttribute('data-field');
      if (!field) return;
      
      input.addEventListener('input', (e: any) => {
        this.updateCvData(field, e.target.value);
      });
      
      input.addEventListener('change', (e: any) => {
        this.updateCvData(field, e.target.value);
      });
    });
    
    // Setup global functions for add/remove buttons
    (window as any).addWorkExperience = () => this.addWorkExperience();
    (window as any).removeWorkExperience = (index: number) => this.removeWorkExperience(index);
    (window as any).addEducation = () => this.addEducation();
    (window as any).removeEducation = (index: number) => this.removeEducation(index);
    (window as any).addSkill = () => this.addSkill();
    (window as any).removeSkill = (index: number) => this.removeSkill(index);
  }

  updateCvData(field: string, value: any) {
    const keys = field.split('.');
    
    // Helper function to set nested value
    const setNestedValue = (obj: any, path: string[], val: any) => {
      let current = obj;
      
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        const nextKey = path[i + 1];
        
        // Check if next key is array index
        if (!isNaN(Number(nextKey))) {
          // Next is array, so current[key] should be array
          if (!current[key]) {
            current[key] = [];
          }
          const index = Number(nextKey);
          while (current[key].length <= index) {
            current[key].push({});
          }
          current = current[key][index];
          i++; // Skip next key as we already handled it
        } else {
          // Next is object property
          if (!current[key]) {
            current[key] = {};
          }
          current = current[key];
        }
      }
      
      // Set the final value
      const lastKey = path[path.length - 1];
      if (!isNaN(Number(lastKey))) {
        // Last key is array index - shouldn't happen, but handle it
        const index = Number(lastKey);
        if (!Array.isArray(current)) {
          current = [];
        }
        while (current.length <= index) {
          current.push({});
        }
        current[index] = val;
      } else {
        // Convert string to boolean for gender
        if (field.includes('gender') && typeof value === 'string') {
          current[lastKey] = value === 'true';
        } else {
          current[lastKey] = val;
        }
      }
    };
    
    setNestedValue(this.cvData, keys, value);
    
    console.log('CV Data updated:', JSON.stringify(this.cvData, null, 2));
    this.saveToHistory();
  }

  addWorkExperience() {
    if (!this.cvData.workExperiences) {
      this.cvData.workExperiences = [];
    }
    this.cvData.workExperiences.push({});
    this.renderTemplateForm();
  }

  removeWorkExperience(index: number) {
    if (this.cvData.workExperiences && this.cvData.workExperiences.length > index) {
      this.cvData.workExperiences.splice(index, 1);
      this.renderTemplateForm();
    }
  }

  addEducation() {
    if (!this.cvData.educations) {
      this.cvData.educations = [];
    }
    this.cvData.educations.push({});
    this.renderTemplateForm();
  }

  removeEducation(index: number) {
    if (this.cvData.educations && this.cvData.educations.length > index) {
      this.cvData.educations.splice(index, 1);
      this.renderTemplateForm();
    }
  }

  addSkill() {
    if (!this.cvData.skills) {
      this.cvData.skills = [];
    }
    this.cvData.skills.push({});
    this.renderTemplateForm();
  }

  removeSkill(index: number) {
    if (this.cvData.skills && this.cvData.skills.length > index) {
      this.cvData.skills.splice(index, 1);
      this.renderTemplateForm();
    }
  }

  moveWorkExperienceUp(index: number) {
    if (this.cvData.workExperiences && index > 0 && index < this.cvData.workExperiences.length) {
      const temp = this.cvData.workExperiences[index];
      this.cvData.workExperiences[index] = this.cvData.workExperiences[index - 1];
      this.cvData.workExperiences[index - 1] = temp;
      this.renderTemplateForm();
    }
  }

  moveWorkExperienceDown(index: number) {
    if (this.cvData.workExperiences && index >= 0 && index < this.cvData.workExperiences.length - 1) {
      const temp = this.cvData.workExperiences[index];
      this.cvData.workExperiences[index] = this.cvData.workExperiences[index + 1];
      this.cvData.workExperiences[index + 1] = temp;
      this.renderTemplateForm();
    }
  }

  moveEducationUp(index: number) {
    if (this.cvData.educations && index > 0 && index < this.cvData.educations.length) {
      const temp = this.cvData.educations[index];
      this.cvData.educations[index] = this.cvData.educations[index - 1];
      this.cvData.educations[index - 1] = temp;
      this.renderTemplateForm();
    }
  }

  moveEducationDown(index: number) {
    if (this.cvData.educations && index >= 0 && index < this.cvData.educations.length - 1) {
      const temp = this.cvData.educations[index];
      this.cvData.educations[index] = this.cvData.educations[index + 1];
      this.cvData.educations[index + 1] = temp;
      this.renderTemplateForm();
    }
  }

  moveSkillUp(index: number) {
    if (this.cvData.skills && index > 0 && index < this.cvData.skills.length) {
      const temp = this.cvData.skills[index];
      this.cvData.skills[index] = this.cvData.skills[index - 1];
      this.cvData.skills[index - 1] = temp;
      this.renderTemplateForm();
    }
  }

  moveSkillDown(index: number) {
    if (this.cvData.skills && index >= 0 && index < this.cvData.skills.length - 1) {
      const temp = this.cvData.skills[index];
      this.cvData.skills[index] = this.cvData.skills[index + 1];
      this.cvData.skills[index + 1] = temp;
      this.renderTemplateForm();
    }
  }

  showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
    this.toast = {
      show: true,
      message: message,
      type: type,
      duration: 3000
    };
    
    setTimeout(() => {
      this.toast.show = false;
    }, this.toast.duration);
  }
  
  updateTranslations() {
    this.translations = {
      editPhoto: this.translationService.translate('write_cv.edit_photo'),
      fullnamePlaceholder: this.translationService.translate('write_cv.fullname_placeholder'),
      positionPlaceholder: this.translationService.translate('write_cv.position_placeholder'),
      birthdateLabel: this.translationService.translate('write_cv.birthdate_label'),
      birthdatePlaceholder: this.translationService.translate('write_cv.birthdate_placeholder'),
      genderLabel: this.translationService.translate('write_cv.gender_label'),
      genderPlaceholder: this.translationService.translate('write_cv.gender_placeholder'),
      phoneLabel: this.translationService.translate('write_cv.phone_label'),
      phonePlaceholder: this.translationService.translate('write_cv.phone_placeholder'),
      emailLabel: this.translationService.translate('write_cv.email_label'),
      emailPlaceholder: this.translationService.translate('write_cv.email_placeholder'),
      websiteLabel: this.translationService.translate('write_cv.website_label'),
      websitePlaceholder: this.translationService.translate('write_cv.website_placeholder'),
      addressLabel: this.translationService.translate('write_cv.address_label'),
      addressPlaceholder: this.translationService.translate('write_cv.address_placeholder'),
      sectionCareerObjective: this.translationService.translate('write_cv.section_career_objective'),
      careerObjectivePlaceholder: this.translationService.translate('write_cv.career_objective_placeholder'),
      sectionEducation: this.translationService.translate('write_cv.section_education'),
      sectionWorkExperience: this.translationService.translate('write_cv.section_work_experience'),
      sectionActivities: this.translationService.translate('write_cv.section_activities'),
      sectionCertificates: this.translationService.translate('write_cv.section_certificates'),
      sectionAwards: this.translationService.translate('write_cv.section_awards'),
      sectionSkills: this.translationService.translate('write_cv.section_skills'),
      sectionReferences: this.translationService.translate('write_cv.section_references'),
      sectionHobbies: this.translationService.translate('write_cv.section_hobbies'),
      startDate: this.translationService.translate('write_cv.start_date'),
      endDate: this.translationService.translate('write_cv.end_date'),
      institutionPlaceholder: this.translationService.translate('write_cv.institution_placeholder'),
      majorPlaceholder: this.translationService.translate('write_cv.major_placeholder'),
      educationDescriptionPlaceholder: this.translationService.translate('write_cv.education_description'),
      companyPlaceholder: this.translationService.translate('write_cv.company_placeholder'),
      jobTitlePlaceholder: this.translationService.translate('write_cv.job_title_placeholder'),
      workDescriptionPlaceholder: this.translationService.translate('write_cv.work_description'),
      activityOrganizationPlaceholder: this.translationService.translate('write_cv.activity_organization_placeholder'),
      activityPositionPlaceholder: this.translationService.translate('write_cv.activity_position_placeholder'),
      activityDescriptionPlaceholder: this.translationService.translate('write_cv.activity_description'),
      certificateTime: this.translationService.translate('write_cv.certificate_time'),
      certificateNamePlaceholder: this.translationService.translate('write_cv.certificate_name_placeholder'),
      awardTime: this.translationService.translate('write_cv.award_time'),
      awardNamePlaceholder: this.translationService.translate('write_cv.award_name_placeholder'),
      skillNamePlaceholder: this.translationService.translate('write_cv.skill_name_placeholder'),
      skillDescriptionPlaceholder: this.translationService.translate('write_cv.skill_description_placeholder'),
      referencePlaceholder: this.translationService.translate('write_cv.reference_placeholder'),
      hobbyPlaceholder: this.translationService.translate('write_cv.hobby_placeholder'),
      previewDialogTitle: this.translationService.translate('write_cv.preview_dialog_title'),
      modalTitle: this.translationService.translate('write_cv.modal_title'),
      modalInfo: this.translationService.translate('write_cv.modal_info'),
      modalInputPlaceholder: this.translationService.translate('write_cv.modal_input_placeholder'),
      modalBackButton: this.translationService.translate('write_cv.modal_back_button'),
      modalContinueButton: this.translationService.translate('write_cv.modal_continue_button'),
      saveSuccess: this.translationService.translate('write_cv.save_success'),
      saveFailed: this.translationService.translate('write_cv.save_failed'),
      validationMessage: this.translationService.translate('write_cv.validation_message'),
      photoModalTitle: this.translationService.translate('write_cv.photo_modal_title'),
      photoModalInstruction: this.translationService.translate('write_cv.photo_modal_instruction'),
      photoModalNote: this.translationService.translate('write_cv.photo_modal_note'),
      photoModalCancel: this.translationService.translate('write_cv.photo_modal_cancel'),
      photoModalConfirm: this.translationService.translate('write_cv.photo_modal_confirm'),
      photoUpdateSuccess: this.translationService.translate('write_cv.photo_update_success')
    };
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  onUndo() {
    if (this.currentHistoryIndex > 0) {
      this.currentHistoryIndex--;
      this.restoreCvContent(this.cvHistory[this.currentHistoryIndex]);
      this.updateButtonStates();
    }
  }

  onRedo() {
    if (this.currentHistoryIndex < this.cvHistory.length - 1) {
      this.currentHistoryIndex++;
      this.restoreCvContent(this.cvHistory[this.currentHistoryIndex]);
      this.updateButtonStates();
    }
  }

  restoreCvContent(content: any) {
    // Restore ql-editor fields
    const allEditors = document.querySelectorAll('.ql-editor');
    
    allEditors.forEach((editor: any, index: number) => {
      const key = `editor_${index}`;
      if (content[key] !== undefined) {
        const newContent = content[key] || '';
        
        // Store current state
        const hasContent = editor.textContent && editor.textContent.trim() !== '';
        const isEmpty = !newContent || newContent.trim() === '';
        
        // Only update if content actually changed
        if (hasContent !== !isEmpty || editor.textContent !== newContent) {
          // Update text content only, preserve HTML structure
          if (isEmpty) {
            // Clear content but keep structure
            const firstP = editor.querySelector('p');
            if (firstP) {
              firstP.innerHTML = '<br>';
            }
            editor.classList.add('ql-blank');
          } else {
            // Set content
            const firstP = editor.querySelector('p');
            if (firstP) {
              firstP.textContent = newContent;
            } else {
              editor.textContent = newContent;
            }
            editor.classList.remove('ql-blank');
          }
        }
      }
    });
    
    // Restore info-section fields
    const fullnameInput = document.querySelector('.fullname-input') as HTMLInputElement;
    const positionInput = document.querySelector('.position-input') as HTMLInputElement;
    const contactInputs = document.querySelectorAll('.contact-input') as NodeListOf<HTMLInputElement>;
    
    if (fullnameInput && content['fullname'] !== undefined) {
      fullnameInput.value = content['fullname'];
    }
    if (positionInput && content['position'] !== undefined) {
      positionInput.value = content['position'];
    }
    
    contactInputs.forEach((input, index) => {
      const key = `contact_${index}`;
      if (content[key] !== undefined) {
        input.value = content[key];
      }
    });
  }

  getPreviewData() {
    const data: any = {
      fullname: '',
      position: '',
      birthdate: '',
      gender: '',
      phone: '',
      email: '',
      website: '',
      address: '',
      careerObjective: '',
      education: '',
      workExperience: '',
      activities: '',
      certificates: '',
      awards: '',
      skills: '',
      references: '',
      hobbies: ''
    };
    
    // Get name and position
    const fullnameInput = document.querySelector('.fullname-input') as HTMLInputElement;
    const positionInput = document.querySelector('.position-input') as HTMLInputElement;
    
    if (fullnameInput) data.fullname = fullnameInput.value || '';
    if (positionInput) data.position = positionInput.value || '';
    
    // Get contact information
    const contactInputs = document.querySelectorAll('.contact-input') as NodeListOf<HTMLInputElement>;
    if (contactInputs.length >= 1) data.birthdate = contactInputs[0].value || '';
    if (contactInputs.length >= 2) data.gender = contactInputs[1].value || '';
    if (contactInputs.length >= 3) data.phone = contactInputs[2].value || '';
    if (contactInputs.length >= 4) data.email = contactInputs[3].value || '';
    if (contactInputs.length >= 5) data.website = contactInputs[4].value || '';
    if (contactInputs.length >= 6) data.address = contactInputs[5].value || '';
    
    // Get all ql-editor content by their data-placeholder attributes
    const allEditors = document.querySelectorAll('.ql-editor');
    
    allEditors.forEach((editor: any) => {
      const placeholder = editor.getAttribute('data-placeholder');
      // Get innerHTML to preserve line breaks
      let content = editor.innerHTML?.trim() || '';
      if (content) {
        // Convert <br> tags to newlines
        content = content.replace(/<br\s*\/?>/gi, '\n');
        // Remove other HTML tags
        content = content.replace(/<[^>]*>/g, '');
      }
      
      if (!placeholder) return;
      
      // Get date range if exists in parent entry
      const parentEntry = editor.closest('.education-entry, .work-entry, .activity-entry');
      if (parentEntry) {
        const dateInputs = parentEntry.querySelectorAll('.date-input') as NodeListOf<HTMLInputElement>;
        if (dateInputs.length >= 2) {
          const startDate = dateInputs[0].value || '';
          const endDate = dateInputs[1].value || '';
          if (startDate || endDate) {
            const dateRange = `${startDate} - ${endDate}`;
            if (content) {
              content = `${content} (${dateRange})`;
            } else {
              content = dateRange;
            }
          }
        }
      }
      
      if (!content) return;
      
      // Map placeholders to data properties
      if (placeholder.includes('career') || placeholder.includes('mục tiêu')) {
        data.careerObjective = content;
      } else if (placeholder.includes('institution') || placeholder.includes('trường học')) {
        data.education = data.education ? data.education + '\n' + content : content;
      } else if (placeholder.includes('major') || placeholder.includes('ngành học') || placeholder.includes('môn học')) {
        data.education = data.education ? data.education + '\n' + content : content;
      } else if (placeholder.includes('description') && placeholder.includes('học tập')) {
        data.education = data.education ? data.education + '\n' + content : content;
      } else if (placeholder.includes('company') || placeholder.includes('công ty')) {
        data.workExperience = data.workExperience ? data.workExperience + '\n' + content : content;
      } else if (placeholder.includes('job_title') || placeholder.includes('vị trí công việc')) {
        data.workExperience = data.workExperience ? data.workExperience + '\n' + content : content;
      } else if (placeholder.includes('description') && placeholder.includes('kinh nghiệm')) {
        data.workExperience = data.workExperience ? data.workExperience + '\n' + content : content;
      } else if (placeholder.includes('organization') || placeholder.includes('tổ chức')) {
        data.activities = data.activities ? data.activities + '\n' + content : content;
      } else if (placeholder.includes('của bạn') && placeholder.includes('vị trí')) {
        data.activities = data.activities ? data.activities + '\n' + content : content;
      } else if (placeholder.includes('description') && placeholder.includes('hoạt động')) {
        data.activities = data.activities ? data.activities + '\n' + content : content;
      } else if (placeholder.includes('certificate') && placeholder.includes('Tên')) {
        data.certificates = data.certificates ? data.certificates + '\n' + content : content;
      } else if (placeholder.includes('Thời gian') && !data.certificates) {
        // Certificate time
      } else if (placeholder.includes('award') && placeholder.includes('Tên')) {
        data.awards = data.awards ? data.awards + '\n' + content : content;
      } else if (placeholder.includes('Thời gian') && !data.awards) {
        // Award time
      } else if (placeholder.includes('skill') && placeholder.includes('Tên')) {
        data.skills = data.skills ? data.skills + '\n' + content : content;
      } else if (placeholder.includes('description') && placeholder.includes('kỹ năng')) {
        data.skills = data.skills ? data.skills + '\n' + content : content;
      } else if (placeholder.includes('reference') || placeholder.includes('giới thiệu')) {
        data.references = content;
      } else if (placeholder.includes('hobby') || placeholder.includes('sở thích')) {
        data.hobbies = content;
      }
    });
    
    return data;
  }
  
  async onPreview() {
    // Nếu đang dùng block editor, preview từ blocks
    if (this.useBlockEditor) {
      await this.previewCvFromBlocks();
      return;
    }
    
    // Preview từ template form cũ
    this.previewData = this.getPreviewData();
    // Generate PDF URL for preview
    await this.generatePdfUrl();
    this.showPreviewDialog = true;
  }

  async onExportPdf() {
    // Nếu đang dùng block editor, export từ blocks
    if (this.useBlockEditor) {
      await this.exportPdfFromBlocks();
      return;
    }
    
    // Export từ template form cũ (fallback)
    try {
      await this.generatePdfUrl();
      const link = document.createElement('a');
      link.href = this.pdfPreviewUrl;
      link.download = `${this.cvName || 'CV'}.pdf`;
      link.click();
      this.showToast('Export PDF thành công!', 'success');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      this.showToast('Không thể export PDF. Vui lòng thử lại.', 'error');
    }
  }

  async generatePdfUrl() {
    try {
      const htmlContent = this.generateCvHtml();
      this.pdfPreviewUrl = await this.convertHtmlToPdf(htmlContent);
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.pdfPreviewUrl = '/assets/cv-sample-1.pdf';
    }
  }

  generateCvHtml(): string {
    const styles = `
      <style>
        .profile-header-section {
          display: flex;
          gap: 30px;
          margin-bottom: 30px;
          align-items: stretch;
        }
        .profile-picture {
          width: 200px;
          flex-shrink: 0;
          display: flex;
        }
        .avatar-placeholder {
          width: 100%;
          height: 100%;
          background: #e5e7eb;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .avatar-placeholder i {
          font-size: 80px;
          color: #9ca3af;
        }
        .info-section {
          flex: 1;
        }
        .preview-name {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 8px;
        }
        .preview-position {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 20px;
        }
        .contact-list {
          margin: 0;
        }
        .contact-item {
          display: flex;
          margin-bottom: 8px;
        }
        .contact-label {
          font-weight: 700;
          color: #1f2937;
          min-width: 120px;
          font-size: 14px;
        }
        .contact-value {
          color: #1f2937;
          font-size: 14px;
        }
        .cv-section {
          margin-bottom: 30px;
        }
        .section-header {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
        }
        .section-title {
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          unicode-bidi: embed;
        }
        .section-divider {
          height: 1px;
          background: #e5e7eb;
          margin: 0 0 30px 0;
        }
        .preview-content {
          font-size: 14px;
          line-height: 1.6;
          color: #374151;
          white-space: pre-wrap;
        }
        .preview-empty {
          font-size: 14px;
          line-height: 1.6;
          color: #9ca3af;
          white-space: pre-wrap;
        }
      </style>
    `;
    
    // Get uploaded photo if exists
    const avatarPlaceholder = document.querySelector('.avatar-placeholder');
    let avatarHtml = '<i class="fa fa-user"></i>';
    if (avatarPlaceholder) {
      const img = avatarPlaceholder.querySelector('img');
      if (img) {
        avatarHtml = `<img src="${img.src}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;" />`;
      }
    }
    
    let html = `
      ${styles}
      <div style="padding: 40px; background: white; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: ltr;" dir="ltr">
      <div class="profile-header-section">
        <div class="profile-picture">
          <div class="avatar-placeholder">
            ${avatarHtml}
          </div>
        </div>
        <div class="info-section">
          <div class="preview-name">${this.previewData.fullname || ''}</div>
          <div class="preview-position">${this.previewData.position || ''}</div>
          <div class="contact-list">
            <div class="contact-item">
              <span class="contact-label">${this.translations.birthdateLabel}:</span>
              <span class="contact-value">${this.previewData.birthdate || ''}</span>
            </div>
            <div class="contact-item">
              <span class="contact-label">${this.translations.genderLabel}:</span>
              <span class="contact-value">${this.previewData.gender || ''}</span>
            </div>
            <div class="contact-item">
              <span class="contact-label">${this.translations.phoneLabel}:</span>
              <span class="contact-value">${this.previewData.phone || ''}</span>
            </div>
            <div class="contact-item">
              <span class="contact-label">${this.translations.emailLabel}:</span>
              <span class="contact-value">${this.previewData.email || ''}</span>
            </div>
            <div class="contact-item">
              <span class="contact-label">${this.translations.websiteLabel}:</span>
              <span class="contact-value">${this.previewData.website || ''}</span>
            </div>
            <div class="contact-item">
              <span class="contact-label">${this.translations.addressLabel}:</span>
              <span class="contact-value">${this.previewData.address || ''}</span>
            </div>
          </div>
        </div>
      </div>
      ${this.generateSectionsHtml()}
      </div>
    `;
    return html;
  }

  generateSectionsHtml(): string {
    const sections = [
      { title: this.translations.sectionCareerObjective, content: this.previewData.careerObjective },
      { title: this.translations.sectionEducation, content: this.previewData.education },
      { title: this.translations.sectionWorkExperience, content: this.previewData.workExperience },
      { title: this.translations.sectionActivities, content: this.previewData.activities },
      { title: this.translations.sectionCertificates, content: this.previewData.certificates },
      { title: this.translations.sectionAwards, content: this.previewData.awards },
      { title: this.translations.sectionSkills, content: this.previewData.skills },
      { title: this.translations.sectionReferences, content: this.previewData.references },
      { title: this.translations.sectionHobbies, content: this.previewData.hobbies }
    ];

    let html = '';
    sections.forEach(section => {
      html += `
        <div class="cv-section">
          <div class="section-header">
            <h3 class="section-title">${section.title}</h3>
          </div>
          <div class="section-divider"></div>
          <div class="${section.content ? 'preview-content' : 'preview-empty'}">${section.content || ''}</div>
        </div>
      `;
    });
    return html;
  }

  async convertHtmlToPdf(htmlContent: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        // Revoke old URL if exists
        if (this.pdfPreviewUrl) {
          URL.revokeObjectURL(this.pdfPreviewUrl);
        }

        // Create a temporary div to render the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        tempDiv.className = 'cv-section-main standard';
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '900px'; // match cv-section-main max-width
        tempDiv.style.top = '0';
        tempDiv.style.backgroundColor = '#ffffff';
        document.body.appendChild(tempDiv);

        // Wait for styles to be applied and images to load
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Convert to canvas with explicit options
        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          allowTaint: false,
          onclone: (clonedDoc) => {
            // Ensure all styles are preserved in the clone
            const clonedBody = clonedDoc.body;
            clonedBody.style.backgroundColor = '#ffffff';
          }
        });

        // Remove temp div
        document.body.removeChild(tempDiv);

        // Create PDF with proper orientation
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        
        // Get PDF as blob URL
        const pdfBlob = pdf.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        resolve(url);
      } catch (error) {
        console.error('Error converting HTML to PDF:', error);
        reject(error);
      }
    });
  }

  closePreviewDialog() {
    this.showPreviewDialog = false;
  }

  onSave() {
    // Validate từ cvData thay vì query DOM
    const fullname = this.cvData.personalInfo?.fullName?.trim() || '';
    const phone = this.cvData.personalInfo?.phoneNumber?.trim() || '';
    const email = this.cvData.personalInfo?.email?.trim() || '';
    
    this.nameError = !fullname;
    this.phoneError = !phone;
    this.emailError = !email;

    if (this.nameError || this.phoneError || this.emailError) {
      this.showToast(this.translations.validationMessage || 'Vui lòng điền đầy đủ thông tin bắt buộc', 'warning');
      return;
    }
    
    // Show modal để đặt tên CV
    this.modalCvName = this.cvName;
    this.showUpdateNameModal = true;
  }

  onModalClose() {
    this.showUpdateNameModal = false;
  }

  onModalContinue(newName: string) {
    this.cvName = newName || 'CV chưa đặt tên';
    this.showUpdateNameModal = false;
    
    // Save CV to API
    this.saveCvToApi();
  }

  saveCvToApi() {
    if (!this.templateId || !this.currentTemplate) {
      this.showToast('Không tìm thấy template. Vui lòng thử lại.', 'error');
      return;
    }

    // Nếu đang dùng block editor, lấy dữ liệu từ blocks
    // Nếu không, lấy từ cvData (template form cũ)
    if (this.useBlockEditor) {
      // Build cvData từ blocks (nguồn dữ liệu chính khi dùng block editor)
      this.cvData = this.buildCvDataFromBlocks(this.blocks);
    } else {
      // Template form cũ: sync blocks từ cvData để giữ đồng bộ
      this.blocks = this.buildBlocksFromCvData(this.cvData);
    }

    // Convert cvData từ camelCase sang PascalCase để match với backend DTO
    const backendFormat = this.convertToBackendFormat(this.cvData);
    
    // Log để debug
    console.log('CV Data (camelCase):', JSON.stringify(this.cvData, null, 2));
    console.log('CV Data (PascalCase):', JSON.stringify(backendFormat, null, 2));
    
    // Convert to JSON string
    const dataJson = JSON.stringify(backendFormat);
    
    // Lưu blocks structure nếu đang dùng block editor
    const blocksJson = this.useBlockEditor ? JSON.stringify(this.blocks) : undefined;
    
    if (this.isEditMode && this.cvId) {
      // Update existing CV
      const updateDto = {
        templateId: this.templateId,
        cvName: this.cvName,
        dataJson: dataJson,
        blocksJson: blocksJson, // Lưu blocks structure
        notes: ''
      };

      console.log('Updating CV DTO:', updateDto);

      this.candidateCvService.update(this.cvId, updateDto).subscribe({
        next: async (response: any) => {
          console.log('CV updated successfully:', response);
          
          // Generate preview image sau khi save thành công
          const savedCvId = response?.result?.id || response?.id || this.cvId;
          if (savedCvId) {
            try {
              await this.generateAndSavePreviewImage(savedCvId);
            } catch (error) {
              console.error('Error generating preview (non-blocking):', error);
            }
          }
          
          this.showToast('Cập nhật CV thành công!', 'success');
          
          // Đợi thêm một chút để đảm bảo preview đã được lưu
          setTimeout(() => {
            this.router.navigate(['/candidate/cv-management']);
          }, 3000);
        },
        error: (error) => {
          console.error('Error updating CV:', error);
          let errorMessage = 'Cập nhật CV thất bại. Vui lòng thử lại.';
          
          if (error.error?.error?.message) {
            errorMessage = error.error.error.message;
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
          
          this.showToast(errorMessage, 'error');
        }
      });
    } else {
      // Create new CV
      const createDto = {
        templateId: this.templateId,
        cvName: this.cvName,
        dataJson: dataJson,
        blocksJson: blocksJson, // Lưu blocks structure
        isPublished: false,
        isDefault: false,
        isPublic: false,
        notes: ''
      };

      console.log('Saving CV DTO:', createDto);

      this.candidateCvService.create(createDto).subscribe({
        next: async (response: any) => {
          console.log('CV saved successfully:', response);
          
          // Generate preview image sau khi save thành công
          const savedCvId = response?.result?.id || response?.id || response?.value?.id;
          console.log('Saved CV ID for preview:', savedCvId);
          
          if (savedCvId) {
            try {
              await this.generateAndSavePreviewImage(savedCvId);
            } catch (error) {
              console.error('Error generating preview (non-blocking):', error);
            }
          } else {
            console.warn('Could not extract CV ID from response:', response);
          }
          
          this.showToast(this.translations.saveSuccess || 'Lưu CV thành công!', 'success');
          
          // Đợi thêm một chút để đảm bảo preview đã được lưu
          setTimeout(() => {
            this.router.navigate(['/candidate/cv-management']);
          }, 3000);
        },
        error: (error) => {
          console.error('Error saving CV:', error);
          let errorMessage = this.translations.saveFailed || 'Lưu CV thất bại. Vui lòng thử lại.';
          
          if (error.error?.error?.message) {
            errorMessage = error.error.error.message;
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
          
          this.showToast(errorMessage, 'error');
        }
      });
    }
  }

  onEditPhotoClick(event: MouseEvent) {
    event.stopPropagation();
    this.showUpdatePhotoModal = true;
  }

  onPhotoModalClose() {
    this.showUpdatePhotoModal = false;
  }

  onPhotoModalConfirm(file: File) {
    // TODO: Upload file to server
    console.log('Photo uploaded:', file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const imageUrl = e.target.result;
      
      // Update avatar placeholder with image
      const avatarPlaceholder = document.querySelector('.avatar-placeholder');
      if (avatarPlaceholder) {
        avatarPlaceholder.innerHTML = `<img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;" />`;
      }
    };
    reader.readAsDataURL(file);
    
    this.showUpdatePhotoModal = false;
    this.toast = {
      show: true,
      type: 'success',
      duration: 3000,
      message: this.translations.photoUpdateSuccess
    };
  }

  onInputChange() {
    setTimeout(() => {
      this.saveToHistory();
    }, 500);
  }

  /**
   * Xây dựng danh sách blocks từ cvData hiện tại.
   * Bước này giúp chúng ta có schema block-based nhưng vẫn giữ nguyên DataJson backend.
   */
  private buildBlocksFromCvData(cvData: any): CvBlock[] {
    const blocks: CvBlock[] = [];

    // Personal Info block (luôn có, pinned)
    blocks.push({
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      type: 'personal-info',
      title: 'Thông tin cá nhân',
      data: {
        ...(cvData.personalInfo || {})
      } as PersonalInfoBlockData,
      meta: {
        pinned: true
      }
    });

    // Career Objective → hiện tại map sang 1 custom-text block (sau này có thể tách riêng)
    if (cvData.careerObjective) {
      blocks.push({
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        type: 'custom-text',
        title: 'Mục tiêu nghề nghiệp',
        data: {
          html: cvData.careerObjective
        } as CustomTextBlockData
      });
    }

    // Work experiences
    blocks.push({
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      type: 'work-experience',
      title: 'Kinh nghiệm làm việc',
      data: {
        items: Array.isArray(cvData.workExperiences) ? [...cvData.workExperiences] : []
      } as WorkExperienceBlockData
    });

    // Education
    blocks.push({
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      type: 'education',
      title: 'Học vấn',
      data: {
        items: Array.isArray(cvData.educations) ? [...cvData.educations] : []
      }
    });

    // Skills
    blocks.push({
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      type: 'skills',
      title: 'Kỹ năng',
      data: {
        items: Array.isArray(cvData.skills) ? [...cvData.skills] : []
      }
    });

    // Projects
    blocks.push({
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      type: 'projects',
      title: 'Dự án',
      data: {
        items: Array.isArray(cvData.projects) ? [...cvData.projects] : []
      }
    });

    // Certificates
    blocks.push({
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      type: 'certificates',
      title: 'Chứng chỉ',
      data: {
        items: Array.isArray(cvData.certificates) ? [...cvData.certificates] : []
      }
    });

    // Languages
    blocks.push({
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      type: 'languages',
      title: 'Ngôn ngữ',
      data: {
        items: Array.isArray(cvData.languages) ? [...cvData.languages] : []
      }
    });

    return blocks;
  }

  /**
   * Xây dựng lại cvData từ danh sách blocks.
   * Hiện tại UI vẫn thao tác trên cvData, nên khi save mình sẽ:
   *   - build blocks từ cvData
   *   - sau đó build lại cvData từ blocks
   * để đảm bảo pipeline schema block hoạt động nhưng không thay đổi hành vi hiện tại.
   */
  private buildCvDataFromBlocks(blocks: CvBlock[]): any {
    const cvData: any = {
      personalInfo: {
        fullName: '',
        email: '',
        phoneNumber: '',
        dateOfBirth: '',
        address: '',
        gender: null,
        profileImageUrl: '',
        linkedIn: '',
        gitHub: '',
        website: ''
      },
      careerObjective: '',
      workExperiences: [],
      educations: [],
      skills: [],
      projects: [],
      certificates: [],
      languages: [],
      additionalInfo: this.cvData?.additionalInfo || ''
    };

    for (const block of blocks) {
      switch (block.type) {
        case 'personal-info':
          cvData.personalInfo = {
            ...cvData.personalInfo,
            ...(block.data as PersonalInfoBlockData)
          };
          break;
        case 'custom-text':
          // Nếu có nhiều custom-text blocks, merge chúng lại (thường chỉ có 1 cho careerObjective)
          const customTextHtml = (block.data as CustomTextBlockData).html || '';
          if (customTextHtml) {
            cvData.careerObjective = cvData.careerObjective 
              ? `${cvData.careerObjective}\n\n${customTextHtml}` 
              : customTextHtml;
          }
          break;
        case 'work-experience':
          // Merge items từ tất cả work-experience blocks
          const workItems = (block.data as WorkExperienceBlockData).items || [];
          cvData.workExperiences = [...cvData.workExperiences, ...workItems];
          break;
        case 'education':
          // Merge items từ tất cả education blocks
          const eduItems = (block.data as any).items || [];
          cvData.educations = [...cvData.educations, ...eduItems];
          break;
        case 'skills':
          // Merge items từ tất cả skills blocks
          const skillItems = (block.data as any).items || [];
          cvData.skills = [...cvData.skills, ...skillItems];
          break;
        case 'projects':
          // Merge items từ tất cả projects blocks
          const projectItems = (block.data as any).items || [];
          cvData.projects = [...cvData.projects, ...projectItems];
          break;
        case 'certificates':
          // Merge items từ tất cả certificates blocks
          const certItems = (block.data as any).items || [];
          cvData.certificates = [...cvData.certificates, ...certItems];
          break;
        case 'languages':
          // Merge items từ tất cả languages blocks
          const langItems = (block.data as any).items || [];
          cvData.languages = [...cvData.languages, ...langItems];
          break;
      }
    }

    return cvData;
  }

  /**
   * Convert frontend camelCase format sang backend PascalCase format
   */
  private convertToBackendFormat(frontendData: any): any {
    const result: any = {};
    
    // PersonalInfo
    if (frontendData.personalInfo) {
      result.PersonalInfo = {
        FullName: frontendData.personalInfo.fullName || null,
        Email: frontendData.personalInfo.email || null,
        PhoneNumber: frontendData.personalInfo.phoneNumber || null,
        DateOfBirth: frontendData.personalInfo.dateOfBirth ? new Date(frontendData.personalInfo.dateOfBirth) : null,
        Address: frontendData.personalInfo.address || null,
        Gender: frontendData.personalInfo.gender !== null && frontendData.personalInfo.gender !== undefined 
          ? frontendData.personalInfo.gender 
          : null,
        ProfileImageUrl: frontendData.personalInfo.profileImageUrl || null,
        LinkedIn: frontendData.personalInfo.linkedIn || null,
        GitHub: frontendData.personalInfo.gitHub || null,
        Website: frontendData.personalInfo.website || null
      };
    }
    
    // CareerObjective
    result.CareerObjective = frontendData.careerObjective || null;
    
    // WorkExperiences
    if (frontendData.workExperiences && Array.isArray(frontendData.workExperiences)) {
      result.WorkExperiences = frontendData.workExperiences.map((exp: any) => ({
        CompanyName: exp.companyName || null,
        Position: exp.position || null,
        StartDate: exp.startDate ? new Date(exp.startDate) : null,
        EndDate: exp.endDate ? new Date(exp.endDate) : null,
        IsCurrentJob: exp.isCurrentJob || false,
        Description: exp.description || null,
        Achievements: exp.achievements && Array.isArray(exp.achievements) ? exp.achievements : null
      })).filter((exp: any) => exp.CompanyName || exp.Position); // Chỉ giữ lại những item có ít nhất 1 field
    }
    
    // Educations
    if (frontendData.educations && Array.isArray(frontendData.educations)) {
      result.Educations = frontendData.educations.map((edu: any) => ({
        InstitutionName: edu.institutionName || null,
        Degree: edu.degree || null,
        Major: edu.major || null,
        StartDate: edu.startDate ? new Date(edu.startDate) : null,
        EndDate: edu.endDate ? new Date(edu.endDate) : null,
        IsCurrent: edu.isCurrent || false,
        Gpa: edu.gpa || null,
        Description: edu.description || null
      })).filter((edu: any) => edu.InstitutionName || edu.Major); // Chỉ giữ lại những item có ít nhất 1 field
    }
    
    // Skills
    if (frontendData.skills && Array.isArray(frontendData.skills)) {
      result.Skills = frontendData.skills.map((skill: any) => ({
        SkillName: skill.skillName || null,
        Level: skill.level || null,
        Category: skill.category || null
      })).filter((skill: any) => skill.SkillName);
    }
    
    // Projects
    if (frontendData.projects && Array.isArray(frontendData.projects)) {
      result.Projects = frontendData.projects.map((project: any) => ({
        ProjectName: project.projectName || null,
        Description: project.description || null,
        Technologies: project.technologies || null,
        ProjectUrl: project.projectUrl || null,
        StartDate: project.startDate ? new Date(project.startDate) : null,
        EndDate: project.endDate ? new Date(project.endDate) : null
      })).filter((project: any) => project.ProjectName);
    }
    
    // Certificates
    if (frontendData.certificates && Array.isArray(frontendData.certificates)) {
      result.Certificates = frontendData.certificates.map((cert: any) => ({
        CertificateName: cert.certificateName || null,
        IssuingOrganization: cert.issuingOrganization || null,
        IssueDate: cert.issueDate ? new Date(cert.issueDate) : null,
        CredentialId: cert.credentialId || null
      })).filter((cert: any) => cert.CertificateName);
    }
    
    // Languages
    if (frontendData.languages && Array.isArray(frontendData.languages)) {
      result.Languages = frontendData.languages.map((lang: any) => ({
        LanguageName: lang.languageName || null,
        ProficiencyLevel: lang.proficiencyLevel || null
      })).filter((lang: any) => lang.LanguageName);
    }
    
    // AdditionalInfo
    result.AdditionalInfo = frontendData.additionalInfo || null;
    
    return result;
  }

  /**
   * Handler khi blocks thay đổi từ cv-block-editor
   */
  onBlocksChange(newBlocks: CvBlock[]) {
    this.blocks = newBlocks;
    // Sync blocks về cvData để giữ tương thích với code cũ
    this.cvData = this.buildCvDataFromBlocks(this.blocks);
  }

  /**
   * Generate HTML từ blocks để preview/export
   */
  generateHtmlFromBlocks(blocks: CvBlock[]): string {
    let html = '<div class="cv-preview-container" style="font-family: Arial, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; background: white;">';
    
    blocks.forEach(block => {
      if (block.meta?.collapsed) return; // Skip collapsed blocks
      
      switch (block.type) {
        case 'personal-info':
          html += this.renderPersonalInfoBlock(block.data);
          break;
        case 'work-experience':
          html += this.renderWorkExperienceBlock(block.data);
          break;
        case 'education':
          html += this.renderEducationBlock(block.data);
          break;
        case 'skills':
          html += this.renderSkillsBlock(block.data);
          break;
        case 'projects':
          html += this.renderProjectsBlock(block.data);
          break;
        case 'certificates':
          html += this.renderCertificatesBlock(block.data);
          break;
        case 'languages':
          html += this.renderLanguagesBlock(block.data);
          break;
        case 'custom-text':
          html += this.renderCustomTextBlock(block.data);
          break;
      }
    });
    
    html += '</div>';
    return html;
  }

  private renderPersonalInfoBlock(data: PersonalInfoBlockData): string {
    return `
      <div class="cv-section personal-info-section" style="margin-bottom: 30px;">
        <div style="display: flex; gap: 30px; align-items: flex-start;">
          ${data.profileImageUrl ? `<img src="${this.escapeHtml(data.profileImageUrl)}" style="width: 150px; height: 150px; border-radius: 8px; object-fit: cover;">` : ''}
          <div style="flex: 1;">
            <h1 style="font-size: 28px; font-weight: 700; margin: 0 0 8px 0; color: #1f2937;">${this.escapeHtml(data.fullName || '')}</h1>
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
              ${data.email ? `<div><strong>Email:</strong> ${this.escapeHtml(data.email)}</div>` : ''}
              ${data.phoneNumber ? `<div><strong>Điện thoại:</strong> ${this.escapeHtml(data.phoneNumber)}</div>` : ''}
              ${data.address ? `<div><strong>Địa chỉ:</strong> ${this.escapeHtml(data.address)}</div>` : ''}
              ${data.dateOfBirth ? `<div><strong>Ngày sinh:</strong> ${this.escapeHtml(data.dateOfBirth)}</div>` : ''}
              ${data.linkedIn ? `<div><strong>LinkedIn:</strong> <a href="${this.escapeHtml(data.linkedIn)}">${this.escapeHtml(data.linkedIn)}</a></div>` : ''}
              ${data.gitHub ? `<div><strong>GitHub:</strong> <a href="${this.escapeHtml(data.gitHub)}">${this.escapeHtml(data.gitHub)}</a></div>` : ''}
              ${data.website ? `<div><strong>Website:</strong> <a href="${this.escapeHtml(data.website)}">${this.escapeHtml(data.website)}</a></div>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderWorkExperienceBlock(data: WorkExperienceBlockData): string {
    if (!data.items || data.items.length === 0) return '';
    
    let html = '<div class="cv-section work-experience-section" style="margin-bottom: 30px;">';
    html += '<h2 style="font-size: 20px; font-weight: 700; margin: 0 0 16px 0; color: #1f2937; border-bottom: 2px solid #0F83BA; padding-bottom: 8px;">KINH NGHIỆM LÀM VIỆC</h2>';
    
    data.items.forEach((item: WorkExperienceItem) => {
      if (!item.companyName && !item.position) return;
      
      const startDate = item.startDate ? new Date(item.startDate).toLocaleDateString('vi-VN') : '';
      const endDate = item.isCurrentJob ? 'Hiện tại' : (item.endDate ? new Date(item.endDate).toLocaleDateString('vi-VN') : '');
      const dateRange = startDate && endDate ? `${startDate} - ${endDate}` : (startDate || endDate);
      
      html += `
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 16px; font-weight: 600; margin: 0 0 4px 0; color: #1f2937;">${this.escapeHtml(item.position || '')}</h3>
          <div style="font-size: 14px; color: #0F83BA; margin-bottom: 4px;">${this.escapeHtml(item.companyName || '')}</div>
          ${dateRange ? `<div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">${dateRange}</div>` : ''}
          ${item.description ? `<div style="font-size: 14px; color: #374151; line-height: 1.6; margin-bottom: 8px;">${this.escapeHtml(item.description)}</div>` : ''}
          ${item.achievements && item.achievements.length > 0 ? `
            <ul style="margin: 8px 0; padding-left: 20px;">
              ${item.achievements.map((ach: string) => `<li style="font-size: 14px; color: #374151; margin-bottom: 4px;">${this.escapeHtml(ach)}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `;
    });
    
    html += '</div>';
    return html;
  }

  private renderEducationBlock(data: any): string {
    if (!data.items || data.items.length === 0) return '';
    
    let html = '<div class="cv-section education-section" style="margin-bottom: 30px;">';
    html += '<h2 style="font-size: 20px; font-weight: 700; margin: 0 0 16px 0; color: #1f2937; border-bottom: 2px solid #0F83BA; padding-bottom: 8px;">HỌC VẤN</h2>';
    
    data.items.forEach((item: any) => {
      if (!item.institutionName && !item.major) return;
      
      const startDate = item.startDate ? new Date(item.startDate).toLocaleDateString('vi-VN') : '';
      const endDate = item.isCurrent ? 'Hiện tại' : (item.endDate ? new Date(item.endDate).toLocaleDateString('vi-VN') : '');
      const dateRange = startDate && endDate ? `${startDate} - ${endDate}` : (startDate || endDate);
      
      html += `
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 16px; font-weight: 600; margin: 0 0 4px 0; color: #1f2937;">${this.escapeHtml(item.institutionName || '')}</h3>
          ${item.degree || item.major ? `<div style="font-size: 14px; color: #0F83BA; margin-bottom: 4px;">${this.escapeHtml([item.degree, item.major].filter(Boolean).join(' - '))}</div>` : ''}
          ${dateRange ? `<div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">${dateRange}</div>` : ''}
          ${item.gpa ? `<div style="font-size: 14px; color: #374151; margin-bottom: 4px;"><strong>GPA:</strong> ${this.escapeHtml(item.gpa)}</div>` : ''}
          ${item.description ? `<div style="font-size: 14px; color: #374151; line-height: 1.6;">${this.escapeHtml(item.description)}</div>` : ''}
        </div>
      `;
    });
    
    html += '</div>';
    return html;
  }

  private renderSkillsBlock(data: any): string {
    if (!data.items || data.items.length === 0) return '';
    
    let html = '<div class="cv-section skills-section" style="margin-bottom: 30px;">';
    html += '<h2 style="font-size: 20px; font-weight: 700; margin: 0 0 16px 0; color: #1f2937; border-bottom: 2px solid #0F83BA; padding-bottom: 8px;">KỸ NĂNG</h2>';
    html += '<div style="display: flex; flex-wrap: wrap; gap: 12px;">';
    
    data.items.forEach((item: any) => {
      if (!item.skillName) return;
      const levelText = item.level ? ` (${item.level})` : '';
      html += `<span style="display: inline-block; padding: 6px 12px; background: #f0f0f0; border-radius: 4px; font-size: 14px; color: #333;">${this.escapeHtml(item.skillName + levelText)}</span>`;
    });
    
    html += '</div></div>';
    return html;
  }

  private renderProjectsBlock(data: any): string {
    if (!data.items || data.items.length === 0) return '';
    
    let html = '<div class="cv-section projects-section" style="margin-bottom: 30px;">';
    html += '<h2 style="font-size: 20px; font-weight: 700; margin: 0 0 16px 0; color: #1f2937; border-bottom: 2px solid #0F83BA; padding-bottom: 8px;">DỰ ÁN</h2>';
    
    data.items.forEach((item: any) => {
      if (!item.projectName) return;
      html += `
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 16px; font-weight: 600; margin: 0 0 4px 0; color: #1f2937;">
            ${item.projectUrl ? `<a href="${this.escapeHtml(item.projectUrl)}" style="color: #0F83BA; text-decoration: none;">${this.escapeHtml(item.projectName)}</a>` : this.escapeHtml(item.projectName)}
          </h3>
          ${item.technologies ? `<div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">${this.escapeHtml(item.technologies)}</div>` : ''}
          ${item.description ? `<div style="font-size: 14px; color: #374151; line-height: 1.6;">${this.escapeHtml(item.description)}</div>` : ''}
        </div>
      `;
    });
    
    html += '</div>';
    return html;
  }

  private renderCertificatesBlock(data: any): string {
    if (!data.items || data.items.length === 0) return '';
    
    let html = '<div class="cv-section certificates-section" style="margin-bottom: 30px;">';
    html += '<h2 style="font-size: 20px; font-weight: 700; margin: 0 0 16px 0; color: #1f2937; border-bottom: 2px solid #0F83BA; padding-bottom: 8px;">CHỨNG CHỈ</h2>';
    
    data.items.forEach((item: any) => {
      if (!item.certificateName) return;
      html += `
        <div style="margin-bottom: 16px;">
          <h3 style="font-size: 16px; font-weight: 600; margin: 0 0 4px 0; color: #1f2937;">${this.escapeHtml(item.certificateName)}</h3>
          ${item.issuingOrganization ? `<div style="font-size: 14px; color: #0F83BA; margin-bottom: 4px;">${this.escapeHtml(item.issuingOrganization)}</div>` : ''}
          ${item.issueDate ? `<div style="font-size: 12px; color: #6b7280;">${new Date(item.issueDate).toLocaleDateString('vi-VN')}</div>` : ''}
        </div>
      `;
    });
    
    html += '</div>';
    return html;
  }

  private renderLanguagesBlock(data: any): string {
    if (!data.items || data.items.length === 0) return '';
    
    let html = '<div class="cv-section languages-section" style="margin-bottom: 30px;">';
    html += '<h2 style="font-size: 20px; font-weight: 700; margin: 0 0 16px 0; color: #1f2937; border-bottom: 2px solid #0F83BA; padding-bottom: 8px;">NGOẠI NGỮ</h2>';
    html += '<div style="display: flex; flex-wrap: wrap; gap: 12px;">';
    
    data.items.forEach((item: any) => {
      if (!item.languageName) return;
      const levelText = item.proficiencyLevel ? ` - ${item.proficiencyLevel}` : '';
      html += `<span style="display: inline-block; padding: 6px 12px; background: #f0f0f0; border-radius: 4px; font-size: 14px; color: #333;">${this.escapeHtml(item.languageName + levelText)}</span>`;
    });
    
    html += '</div></div>';
    return html;
  }

  private renderCustomTextBlock(data: any): string {
    if (!data.html) return '';
    return `
      <div class="cv-section custom-text-section" style="margin-bottom: 30px;">
        <div style="font-size: 14px; color: #374151; line-height: 1.6;">
          ${data.html}
        </div>
      </div>
    `;
  }

  private escapeHtml(text: string): string {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Preview CV từ blocks
   */
  async previewCvFromBlocks() {
    if (!this.blocks || this.blocks.length === 0) {
      this.showToast('Chưa có dữ liệu để preview. Vui lòng thêm thông tin.', 'warning');
      return;
    }

    const htmlContent = this.generateHtmlFromBlocks(this.blocks);
    this.cvHtmlPreview = htmlContent;
    
    // Generate PDF URL
    await this.generatePdfUrlFromHtml(htmlContent);
    this.showPreviewDialog = true;
  }

  /**
   * Generate PDF từ HTML blocks
   */
  async generatePdfUrlFromHtml(htmlContent: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // Create temporary div
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '900px';
        tempDiv.style.backgroundColor = '#ffffff';
        document.body.appendChild(tempDiv);

        await new Promise(r => setTimeout(r, 1500));

        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          allowTaint: false
        });

        document.body.removeChild(tempDiv);

        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        
        const pdfBlob = pdf.output('blob');
        this.pdfPreviewUrl = URL.createObjectURL(pdfBlob);
        resolve();
      } catch (error) {
        console.error('Error generating PDF from blocks:', error);
        reject(error);
      }
    });
  }

  /**
   * Export PDF từ blocks
   */
  async exportPdfFromBlocks() {
    if (!this.blocks || this.blocks.length === 0) {
      this.showToast('Chưa có dữ liệu để export. Vui lòng thêm thông tin.', 'warning');
      return;
    }

    try {
      const htmlContent = this.generateHtmlFromBlocks(this.blocks);
      await this.generatePdfUrlFromHtml(htmlContent);
      
      // Download PDF
      const link = document.createElement('a');
      link.href = this.pdfPreviewUrl;
      link.download = `${this.cvName || 'CV'}.pdf`;
      link.click();
      
      this.showToast('Export PDF thành công!', 'success');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      this.showToast('Không thể export PDF. Vui lòng thử lại.', 'error');
    }
  }

  /**
   * Map blocks từ template structure
   * Khi chọn template mới, sắp xếp lại blocks theo thứ tự trong template
   */
  mapBlocksFromTemplate(template: CvTemplateDto) {
    if (!template || !template.layoutDefinition) return;
    
    // Parse template HTML để tìm các section
    const parser = new DOMParser();
    const doc = parser.parseFromString(template.layoutDefinition, 'text/html');
    
    // Tìm các section trong template (dựa vào placeholder hoặc class)
    const sections = doc.querySelectorAll('[data-section], .section, [class*="section"]');
    
    // Map các block types theo thứ tự trong template
    const templateBlockOrder: CvBlockType[] = [];
    
    sections.forEach(section => {
      const sectionType = section.getAttribute('data-section') || 
                         section.className?.toLowerCase() || '';
      
      // Map section types to block types
      if (sectionType.includes('personal') || sectionType.includes('info')) {
        if (!templateBlockOrder.includes('personal-info')) {
          templateBlockOrder.push('personal-info');
        }
      } else if (sectionType.includes('work') || sectionType.includes('experience')) {
        if (!templateBlockOrder.includes('work-experience')) {
          templateBlockOrder.push('work-experience');
        }
      } else if (sectionType.includes('education') || sectionType.includes('học')) {
        if (!templateBlockOrder.includes('education')) {
          templateBlockOrder.push('education');
        }
      } else if (sectionType.includes('skill')) {
        if (!templateBlockOrder.includes('skills')) {
          templateBlockOrder.push('skills');
        }
      } else if (sectionType.includes('project')) {
        if (!templateBlockOrder.includes('projects')) {
          templateBlockOrder.push('projects');
        }
      } else if (sectionType.includes('certificate')) {
        if (!templateBlockOrder.includes('certificates')) {
          templateBlockOrder.push('certificates');
        }
      } else if (sectionType.includes('language')) {
        if (!templateBlockOrder.includes('languages')) {
          templateBlockOrder.push('languages');
        }
      } else if (sectionType.includes('career') || sectionType.includes('objective') || sectionType.includes('custom')) {
        if (!templateBlockOrder.includes('custom-text')) {
          templateBlockOrder.push('custom-text');
        }
      }
    });
    
    // Nếu không tìm thấy sections trong template, giữ nguyên thứ tự blocks hiện tại
    if (templateBlockOrder.length === 0) {
      return;
    }
    
    // Sắp xếp lại blocks theo thứ tự trong template
    const reorderedBlocks: CvBlock[] = [];
    const existingBlocksMap = new Map<string, CvBlock>();
    
    // Group existing blocks by type
    this.blocks.forEach(block => {
      if (!existingBlocksMap.has(block.type)) {
        existingBlocksMap.set(block.type, block);
      }
    });
    
    // Add blocks theo thứ tự template (personal-info luôn đầu tiên)
    if (existingBlocksMap.has('personal-info')) {
      reorderedBlocks.push(existingBlocksMap.get('personal-info')!);
    }
    
    // Add các blocks khác theo thứ tự template
    templateBlockOrder.forEach(blockType => {
      if (blockType !== 'personal-info' && existingBlocksMap.has(blockType)) {
        reorderedBlocks.push(existingBlocksMap.get(blockType)!);
      }
    });
    
    // Add các blocks không có trong template vào cuối
    this.blocks.forEach(block => {
      if (!reorderedBlocks.find(b => b.id === block.id)) {
        reorderedBlocks.push(block);
      }
    });
    
    this.blocks = reorderedBlocks;
    this.cvData = this.buildCvDataFromBlocks(this.blocks);
  }

  /**
   * Generate preview image từ CV preview và lưu vào backend
   */
  private async generateAndSavePreviewImage(cvId: string): Promise<void> {
    try {
      console.log('Starting preview image generation for CV:', cvId);
      
      // Gọi API render CV để lấy HTML đã render với template
      const renderResponse: any = await this.candidateCvService.renderCv(cvId).toPromise();
      
      if (!renderResponse) {
        console.warn('Could not get rendered CV HTML');
        return;
      }

      // Extract HTML content từ response
      // ABP framework có thể trả về nhiều format khác nhau
      let htmlContent = '';
      
      // Case 1: { htmlContent: "..." } - trực tiếp trong response (check trước vì đây là format phổ biến nhất)
      if (renderResponse?.htmlContent) {
        htmlContent = renderResponse.htmlContent;
        console.log('Found htmlContent directly in response');
      } 
      // Case 2: { value: { htmlContent: "..." } }
      else if (renderResponse?.value?.htmlContent) {
        htmlContent = renderResponse.value.htmlContent;
        console.log('Found htmlContent in response.value.htmlContent');
      } 
      // Case 3: { result: { htmlContent: "..." } }
      else if (renderResponse?.result?.htmlContent) {
        htmlContent = renderResponse.result.htmlContent;
        console.log('Found htmlContent in response.result.htmlContent');
      } 
      // Case 4: { value: "..." } - value là string trực tiếp
      else if (renderResponse?.value && typeof renderResponse.value === 'string') {
        htmlContent = renderResponse.value;
        console.log('Found htmlContent as response.value (string)');
      } 
      // Case 5: { result: "..." } - result là string trực tiếp
      else if (renderResponse?.result && typeof renderResponse.result === 'string') {
        htmlContent = renderResponse.result;
        console.log('Found htmlContent as response.result (string)');
      } 
      // Case 6: { data: { htmlContent: "..." } }
      else if (renderResponse?.data?.htmlContent) {
        htmlContent = renderResponse.data.htmlContent;
        console.log('Found htmlContent in response.data.htmlContent');
      }

      if (!htmlContent || htmlContent.trim() === '') {
        console.warn('Rendered CV HTML is empty. Response structure:', Object.keys(renderResponse || {}));
        console.warn('Full response:', renderResponse);
        return;
      }

      console.log('Got rendered CV HTML, length:', htmlContent.length);

      // Tạo một hidden container để render HTML
      const hiddenContainer = document.createElement('div');
      hiddenContainer.style.position = 'absolute';
      hiddenContainer.style.left = '-9999px';
      hiddenContainer.style.top = '-9999px';
      hiddenContainer.style.width = '210mm'; // A4 width
      hiddenContainer.style.backgroundColor = '#ffffff';
      hiddenContainer.innerHTML = htmlContent;
      document.body.appendChild(hiddenContainer);

      // Đợi images load xong
      await new Promise<void>((resolve) => {
        const images = hiddenContainer.querySelectorAll('img');
        if (images.length === 0) {
          resolve();
          return;
        }

        let loadedCount = 0;
        const totalImages = images.length;

        const checkComplete = () => {
          loadedCount++;
          if (loadedCount === totalImages) {
            resolve();
          }
        };

        images.forEach((img) => {
          if (img.complete) {
            checkComplete();
          } else {
            img.onload = checkComplete;
            img.onerror = checkComplete; // Continue even if image fails to load
          }
        });

        // Timeout sau 5 giây để tránh đợi quá lâu
        setTimeout(() => {
          resolve();
        }, 5000);
      });

      // Đợi thêm một chút để đảm bảo CSS đã apply
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('Rendering CV to canvas...');

      // Generate preview image bằng html2canvas
      const canvas = await html2canvas(hiddenContainer, {
        scale: 0.5, // Giảm scale để file nhỏ hơn
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: hiddenContainer.scrollWidth,
        height: hiddenContainer.scrollHeight,
        windowWidth: hiddenContainer.scrollWidth,
        windowHeight: hiddenContainer.scrollHeight
      });

      console.log('Canvas generated, size:', canvas.width, 'x', canvas.height);

      // Xóa hidden container
      document.body.removeChild(hiddenContainer);

      // Convert canvas thành base64
      const previewImageUrl = canvas.toDataURL('image/png', 0.8);
      console.log('Preview image URL length:', previewImageUrl.length);

      // Gọi API để lưu preview image
      return new Promise<void>((resolve, reject) => {
        this.candidateCvService.updatePreviewImage(cvId, { previewImageUrl }).subscribe({
          next: () => {
            console.log('Preview image saved successfully for CV:', cvId);
            resolve();
          },
          error: (error) => {
            console.error('Error saving preview image:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error('Error generating preview image:', error);
      throw error;
    }
  }
}
