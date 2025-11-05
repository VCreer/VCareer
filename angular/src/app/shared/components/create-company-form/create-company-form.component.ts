import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../button/button';

@Component({
  selector: 'app-create-company-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './create-company-form.component.html',
  styleUrls: ['./create-company-form.component.scss']
})
export class CreateCompanyFormComponent {
  @Input() formData: any = {
    companyType: 'enterprise',
    taxId: '',
    website: '',
    scale: '',
    email: '',
    companyName: '',
    industry: '',
    address: '',
    phone: '',
    description: ''
  };
  
  @Input() logoPreview: string | null = null;
  @Input() formErrors: any = {};
  @Input() isSaving: boolean = false;

  @Output() logoSelected = new EventEmitter<any>();
  @Output() fieldValidate = new EventEmitter<string>();
  @Output() save = new EventEmitter<void>();

  onLogoSelected(event: any) {
    this.logoSelected.emit(event);
  }

  onFieldBlur(fieldName: string) {
    this.fieldValidate.emit(fieldName);
  }

  onSave(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.save.emit();
  }
}

