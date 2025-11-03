import { Component, EventEmitter, Input, Output, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-update-photo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-update-photo.html',
  styleUrls: ['./modal-update-photo.scss']
})
export class ModalUpdatePhotoComponent {
  @Input() title: string = '';
  @Input() uploadInstruction: string = '';
  @Input() note: string = '';
  @Input() cancelButtonText: string = '';
  @Input() confirmButtonText: string = '';
  
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<File>();
  
  @ViewChild('fileInput') fileInput!: ElementRef;
  
  previewUrl: string = '';
  selectedFile: File | null = null;
  isDragOver: boolean = false;

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onConfirm() {
    if (this.selectedFile) {
      this.confirm.emit(this.selectedFile);
    }
  }

  onClose() {
    this.close.emit();
  }

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
    
    const file = event.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }
}
