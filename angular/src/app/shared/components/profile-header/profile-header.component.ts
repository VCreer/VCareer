import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-header.component.html',
  styleUrls: ['./profile-header.component.scss']
})
export class ProfileHeaderComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() showBackButton: boolean = true;
  @Input() showSaveButton: boolean = true;
  @Input() saveButtonText: string = 'Lưu thay đổi';
  @Input() isSaving: boolean = false;
  @Input() isDisabled: boolean = false;

  @Output() onBack = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<void>();

  onBackClick() {
    this.onBack.emit();
  }

  onSaveClick() {
    this.onSave.emit();
  }
}
