import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button';

@Component({
  selector: 'app-password-form-actions',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './password-form-actions.component.html',
  styleUrls: ['./password-form-actions.component.scss']
})
export class PasswordFormActionsComponent {
  @Input() cancelText: string = 'Hủy';
  @Input() saveText: string = 'Cập nhật';
  @Input() isSaving: boolean = false;
  @Input() disabled: boolean = false;
  
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  onCancel(): void {
    this.cancel.emit();
  }

  onSave(): void {
    this.save.emit();
  }
}

