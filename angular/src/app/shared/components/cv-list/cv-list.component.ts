import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cv } from '../../../proxy/api/cv.service';
import { ButtonComponent } from '../button/button.component';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-cv-list',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './cv-list.component.html',
  styleUrls: ['./cv-list.component.scss']
})
export class CvListComponent {
  @Input() cvs: Cv[] = [];
  @Input() loading = false;
  @Output() cvUpdated = new EventEmitter<string>();
  @Output() cvDeleted = new EventEmitter<string>();
  @Output() cvDuplicated = new EventEmitter<string>();
  @Output() cvSetDefault = new EventEmitter<string>();
  @Output() cvViewed = new EventEmitter<string>();
  @Output() cvEdited = new EventEmitter<string>();
  @Output() createCv = new EventEmitter<void>();

  hoveredCvId: string | null = null;
  showMoreMenu: string | null = null;

  constructor(private translationService: TranslationService) {}

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  onCvHover(cvId: string) {
    this.hoveredCvId = cvId;
  }

  onCvLeave(cvId: string) {
    this.hoveredCvId = null;
    this.showMoreMenu = null;
  }

  toggleMoreMenu(cvId: string) {
    this.showMoreMenu = this.showMoreMenu === cvId ? null : cvId;
  }

  onViewCv(cvId: string) {
    this.cvViewed.emit(cvId);
  }

  onEditCv(cvId: string) {
    this.cvEdited.emit(cvId);
  }

  onDuplicateCv(cvId: string) {
    this.cvDuplicated.emit(cvId);
  }

  onSetDefaultCv(cvId: string) {
    this.cvSetDefault.emit(cvId);
  }

  onDeleteCv(cvId: string) {
    this.cvDeleted.emit(cvId);
  }

  onCreateCv() {
    this.createCv.emit();
  }

  onDownloadCv(cvId: string) {
    // Emit download event
    console.log('Download CV:', cvId);
  }

  onPushToTop(cvId: string) {
    // Emit push to top event
    console.log('Push to top CV:', cvId);
  }

  onCopyLink(cvId: string) {
    // Copy CV link to clipboard
    const link = `${window.location.origin}/cv/${cvId}`;
    navigator.clipboard.writeText(link);
    console.log('Link copied:', link);
  }

  onShareFacebook(cvId: string) {
    // Share on Facebook
    const link = `${window.location.origin}/cv/${cvId}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
    window.open(facebookUrl, '_blank');
  }

  onRenameCv(cvId: string) {
    // Emit rename event
    console.log('Rename CV:', cvId);
  }

  onToggleStar(cvId: string) {
    console.log('Toggle star for CV:', cvId);
    this.cvSetDefault.emit(cvId);
  }
}
