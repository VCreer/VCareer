import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-uploaded-cv-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './uploaded-cv-card.html',
  styleUrls: ['./uploaded-cv-card.scss']
})
export class UploadedCvCard {
  @Input() cvName: string = '';
  @Input() uploadDate: string = '';
  @Input() isStarred: boolean = false;
  @Output() download = new EventEmitter<void>();
  @Output() toggleStar = new EventEmitter<void>();
  @Output() copyLink = new EventEmitter<void>();
  @Output() shareFacebook = new EventEmitter<void>();
  @Output() rename = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();

  showDropdown = false;

  constructor(private translationService: TranslationService) {}

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  onDownload() {
    this.download.emit();
  }

  onToggleStar() {
    this.toggleStar.emit();
  }

  onCopyLink() {
    this.copyLink.emit();
    this.showDropdown = false;
  }

  onShareFacebook() {
    this.shareFacebook.emit();
    this.showDropdown = false;
  }

  onRename() {
    this.rename.emit();
    this.showDropdown = false;
  }

  onDelete() {
    this.delete.emit();
    this.showDropdown = false;
  }

  onMoreOptions() {
    this.showDropdown = !this.showDropdown;
  }

  onCloseDropdown() {
    this.showDropdown = false;
  }
}
