import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../button/button';

@Component({
  selector: 'app-business-registration',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './business-registration.component.html',
  styleUrls: ['./business-registration.component.scss']
})
export class BusinessRegistrationComponent {
  @Input() documentType: string = 'business-cert'; // 'business-cert' or 'authorization'
  @Input() selectedFile: File | null = null;
  @Input() isSaving: boolean = false;
  @Input() legalStatus: string | null = null; // pending, approved, rejected
  @Input() documentUrl: string | null = null; // Link xem file đã nộp
  @Input() isEditing: boolean = false; // Chế độ chỉnh sửa (hiện form upload)

  @Output() documentTypeChange = new EventEmitter<string>();
  @Output() fileSelected = new EventEmitter<{type: string, file: File}>();
  @Output() save = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  // For authorization type: identification documents only (Giấy ủy quyền section is commented out)
  identificationFile: File | null = null;

  isDragOver: boolean = false; // For business-cert
  isDragOverIdentification: boolean = false;
  fileError: string = '';
  identificationError: string = '';
  maxFileSize: number = 5 * 1024 * 1024; // 5MB
  allowedTypes: string[] = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

  onDocumentTypeChange(type: string) {
    this.documentType = type;
    this.documentTypeChange.emit(type);
    this.selectedFile = null;
    this.identificationFile = null;
    this.fileError = '';
    this.identificationError = '';
  }

  // Business cert handlers
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0], 'business-cert');
    }
  }

  onFileSelect(event: any, type: string = 'business-cert') {
    const file = event.target.files[0];
    if (file) {
      this.handleFile(file, type);
    }
  }

  onSelectFileClick(event: Event, fileInput: HTMLInputElement) {
    event.preventDefault();
    event.stopPropagation();
    fileInput.click();
  }

  // Authorization handlers - only identification documents (Giấy ủy quyền handlers removed)
  onDragOverIdentification(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOverIdentification = true;
  }

  onDragLeaveIdentification(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOverIdentification = false;
  }

  onDropIdentification(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOverIdentification = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0], 'identification');
    }
  }

  handleFile(file: File, type: string) {
    // Validate file type
    if (!this.allowedTypes.includes(file.type)) {
      const errorMsg = 'Định dạng file không hợp lệ. Chỉ chấp nhận: jpeg, jpg, png, pdf';
      if (type === 'business-cert') {
        this.fileError = errorMsg;
      } else if (type === 'identification') {
        this.identificationError = errorMsg;
      }
      return;
    }

    // Validate file size
    if (file.size > this.maxFileSize) {
      const errorMsg = 'Dung lượng file vượt quá 5MB';
      if (type === 'business-cert') {
        this.fileError = errorMsg;
      } else if (type === 'identification') {
        this.identificationError = errorMsg;
      }
      return;
    }

    // Clear errors and set file
    if (type === 'business-cert') {
      this.fileError = '';
      this.selectedFile = file;
      this.fileSelected.emit({type: 'business-cert', file});
    } else if (type === 'identification') {
      this.identificationError = '';
      this.identificationFile = file;
      this.fileSelected.emit({type: 'identification', file});
    }
  }

  onEditClick() {
    this.edit.emit();
  }

  onCancelClick() {
    this.cancel.emit();
  }

  onSave() {
    if (this.documentType === 'business-cert') {
      if (!this.selectedFile) {
        this.fileError = 'Vui lòng chọn file';
        return;
      }
    } else {
      // Only check identification file (Giấy ủy quyền section is commented out)
      if (!this.identificationFile) {
        this.identificationError = 'Vui lòng chọn file Giấy tờ định danh';
        return;
      }
    }
    this.save.emit();
  }

  getStatusLabel(): string {
    if (!this.legalStatus) {
      return '';
    }

    switch (this.legalStatus) {
      case 'approved':
        return 'Đã duyệt';
      case 'rejected':
        return 'Bị từ chối';
      default:
        return 'Chờ duyệt';
    }
  }

  getStatusClass(): string {
    switch (this.legalStatus) {
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  }

  getIllustrationImage(): string {
    if (this.documentType === 'business-cert') {
      return 'assets/images/setting/sample-licence.png';
    } else {
      // Only identification documents illustration (Giấy ủy quyền section is commented out)
      return 'assets/images/setting/identity-sampl.png';
    }
  }
}

