import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-profile-picture-edit-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-picture-edit-modal.html',
  styleUrl: './profile-picture-edit-modal.scss'
})
export class ProfilePictureEditModal {
  @Output() close = new EventEmitter<void>();
  @Output() changePicture = new EventEmitter<void>();
  @Output() deletePicture = new EventEmitter<void>();
  @Output() imageSelected = new EventEmitter<File>();

  previewImage: string | null = null;

  constructor(private translationService: TranslationService) {}

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  onClose() {
    this.close.emit();
  }

  onChangePicture() {
    // Trigger file input
    const fileInput = document.getElementById('avatar-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onImageSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewImage = e.target.result;
        this.imageSelected.emit(file);
      };
      reader.readAsDataURL(file);
    }
  }

  onDeletePicture() {
    this.previewImage = null;
    this.deletePicture.emit();
    console.log('Delete picture clicked');
  }

  onDone() {
    this.close.emit();
    console.log('Done clicked');
  }
}
