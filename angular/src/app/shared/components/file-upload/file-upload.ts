import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="form-group">
      <label class="form-label" [class.required]="required" *ngIf="label">{{ label }}</label>
      <div class="file-upload-container">
        <input 
          type="file" 
          [id]="inputId"
          class="file-input" 
          [accept]="accept"
          (change)="onFileSelect($event)">
        <label [for]="inputId" class="file-upload-button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14,2 14,8 20,8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10,9 9,9 8,9"></polyline>
          </svg>
          {{ buttonText }}
        </label>
        <span class="file-name" *ngIf="fileName">{{ fileName }}</span>
        <span class="error-message" *ngIf="error">{{ error }}</span>
      </div>
    </div>
  `,
  styleUrls: ['./file-upload.scss']
})
export class FileUploadComponent {
  @Input() label: string = 'Upload File';
  @Input() buttonText: string = 'Chọn file';
  @Input() accept: string = '*';
  @Input() required: boolean = false;
  @Input() error: string = '';
  @Input() fileName: string = '';
  @Input() inputId: string = 'file-upload';

  @Output() fileSelected = new EventEmitter<File>();

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.fileName = file.name;
      this.fileSelected.emit(file);
    }
  }
}
