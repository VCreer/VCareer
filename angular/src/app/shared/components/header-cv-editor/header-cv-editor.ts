import { Component, EventEmitter, Input, Output, ElementRef, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-header-cv-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header-cv-editor.html',
  styleUrls: ['./header-cv-editor.scss']
})
export class HeaderCvEditorComponent implements OnInit {
  @Input() cvName: string = 'CV chưa đặt tên';
  @Output() cvNameChange = new EventEmitter<string>();
  @Output() undo = new EventEmitter<void>();
  @Output() redo = new EventEmitter<void>();
  @Output() preview = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  isEditingName: boolean = false;
  internalCvName: string = this.cvName;
  
  previewText: string = 'Xem trước';
  saveText: string = 'Lưu CV';

  constructor(
    private elementRef: ElementRef,
    private translationService: TranslationService
  ) {}
  
  ngOnInit() {
    this.updateTranslations();
    this.translationService.currentLanguage$.subscribe(() => {
      this.updateTranslations();
    });
  }
  
  updateTranslations() {
    this.previewText = this.translationService.translate('write_cv.preview');
    this.saveText = this.translationService.translate('write_cv.save_cv');
    if (this.internalCvName === 'CV chưa đặt tên' || this.internalCvName === 'Unnamed CV') {
      this.internalCvName = this.translationService.translate('write_cv.unnamed_cv');
    }
  }

  onNameClick() {
    this.isEditingName = true;
    this.internalCvName = this.cvName;
  }

  onNameBlur() {
    this.isEditingName = false;
    if (!this.internalCvName || this.internalCvName.trim() === '') {
      this.internalCvName = this.translationService.translate('write_cv.unnamed_cv');
    }
    this.cvNameChange.emit(this.internalCvName);
  }

  onNameKeyup(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.onNameBlur();
    }
  }

  onUndo() {
    this.undo.emit();
  }

  onRedo() {
    this.redo.emit();
  }

  onPreview() {
    this.preview.emit();
  }

  onSave() {
    this.save.emit();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.isEditingName) {
      const target = event.target as HTMLElement;
      const isNameInput = target.closest('.cv-name-input') !== null || 
                         target.closest('.cv-name') !== null;
      
      if (!isNameInput) {
        this.onNameBlur();
      }
    }
  }
}
