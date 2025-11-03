import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslationService } from '../../../../core/services/translation.service';
import { HeaderCvEditorComponent } from '../../../../shared/components/header-cv-editor/header-cv-editor';
import { ToastNotificationComponent } from '../../../../shared/components/toast-notification/toast-notification';
import { PdfViewerComponent } from '../../../../shared/components/pdf-viewer/pdf-viewer';
import { ModalUpdateNameCvComponent } from '../../../../shared/components/modal-update-name-cv/modal-update-name-cv';
import { ModalUpdatePhotoComponent } from '../../../../shared/components/modal-update-photo/modal-update-photo';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-write-cv',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderCvEditorComponent, ToastNotificationComponent, PdfViewerComponent, ModalUpdateNameCvComponent, ModalUpdatePhotoComponent],
  templateUrl: './write-cv.html',
  styleUrls: ['./write-cv.scss']
})
export class WriteCv implements OnInit {
  selectedLanguage: string = 'vi';
  templateType: string = '';
  cvName: string = 'CV chưa đặt tên';
  
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
    private translationService: TranslationService
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
    this.templateType = this.route.snapshot.paramMap.get('type') || 'standard';
    
    this.updateTranslations();
    
    this.translationService.currentLanguage$.subscribe(lang => {
      this.selectedLanguage = lang;
      this.updateTranslations();
    });
    
    // Initialize with empty CV state
    setTimeout(() => {
      this.saveToHistory();
    }, 100);
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
    this.previewData = this.getPreviewData();
    // Generate PDF URL for preview
    await this.generatePdfUrl();
    this.showPreviewDialog = true;
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
    const fullnameInput = document.querySelector('.fullname-input') as HTMLInputElement;
    const contactInputs = document.querySelectorAll('.contact-input') as NodeListOf<HTMLInputElement>;
    
    const fullname = fullnameInput?.value?.trim() || '';
    const phone = contactInputs[2]?.value?.trim() || '';
    const email = contactInputs[3]?.value?.trim() || '';
    const address = contactInputs[5]?.value?.trim() || '';
    
    this.nameError = !fullname;
    this.phoneError = !phone;
    this.emailError = !email;
    this.addressError = !address;

    if (this.nameError || this.phoneError || this.emailError || this.addressError) {
      this.toast = {
        show: true,
        type: 'warning',
        duration: 5000,
        message: this.translations.validationMessage
      };
      return;
    }
    
    this.modalCvName = this.cvName;
    this.showUpdateNameModal = true;
  }

  onModalClose() {
    this.showUpdateNameModal = false;
  }

  onModalContinue(newName: string) {
    this.cvName = newName || this.translations.modalInputPlaceholder;
    this.showUpdateNameModal = false;
    
    this.toast = { 
      show: true, 
      type: 'success', 
      duration: 3000, 
      message: this.translations.saveSuccess 
    };
    
    setTimeout(() => {
      this.router.navigate(['/candidate/cv-management']);
    }, 3000);
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
}
