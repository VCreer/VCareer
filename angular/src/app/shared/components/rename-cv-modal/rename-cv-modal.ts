import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-rename-cv-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rename-cv-modal.html',
  styleUrl: './rename-cv-modal.scss'
})
export class RenameCvModal implements OnInit {
  @Input() currentName: string = '';
  @Output() close = new EventEmitter<void>();
  @Output() rename = new EventEmitter<string>();

  newName: string = '';

  constructor(private translationService: TranslationService) {}

  ngOnInit() {
    this.newName = this.currentName;
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  onClose() {
    this.close.emit();
  }

  onRename() {
    if (this.newName.trim()) {
      this.rename.emit(this.newName.trim());
    }
  }
}
