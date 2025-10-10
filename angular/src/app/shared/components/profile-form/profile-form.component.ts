import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-profile-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './profile-form.component.html',
  styleUrls: ['./profile-form.component.scss']
})
export class ProfileFormComponent implements OnInit {
  @Input() profileData: any = {};
  @Input() isEditing: boolean = false;
  @Input() isLoading: boolean = false;

  @Output() onSave = new EventEmitter<any>();
  @Output() onCancel = new EventEmitter<void>();

  profileForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.initializeForm();
  }

  initializeForm() {
    this.profileForm = this.fb.group({
      firstName: [this.profileData.firstName || '', [Validators.required, Validators.minLength(2)]],
      lastName: [this.profileData.lastName || '', [Validators.required, Validators.minLength(2)]],
      email: [this.profileData.email || '', [Validators.required, Validators.email]],
      phone: [this.profileData.phone || '', [Validators.required, Validators.pattern(/^[0-9+\-\s()]+$/)]],
      dateOfBirth: [this.profileData.dateOfBirth || ''],
      gender: [this.profileData.gender || ''],
      address: [this.profileData.address || ''],
      city: [this.profileData.city || ''],
      country: [this.profileData.country || ''],
      bio: [this.profileData.bio || ''],
      website: [this.profileData.website || '', [Validators.pattern(/^https?:\/\/.+/)]],
      linkedin: [this.profileData.linkedin || '', [Validators.pattern(/^https?:\/\/.+/)]],
      github: [this.profileData.github || '', [Validators.pattern(/^https?:\/\/.+/)]]
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} là bắt buộc`;
      if (field.errors['minlength']) return `${this.getFieldLabel(fieldName)} phải có ít nhất ${field.errors['minlength'].requiredLength} ký tự`;
      if (field.errors['email']) return 'Email không hợp lệ';
      if (field.errors['pattern']) return `${this.getFieldLabel(fieldName)} không đúng định dạng`;
    }
    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      firstName: 'Tên',
      lastName: 'Họ',
      email: 'Email',
      phone: 'Số điện thoại',
      address: 'Địa chỉ',
      city: 'Thành phố',
      country: 'Quốc gia',
      website: 'Website',
      linkedin: 'LinkedIn',
      github: 'GitHub'
    };
    return labels[fieldName] || fieldName;
  }

  onSubmit() {
    if (this.profileForm.valid) {
      this.onSave.emit(this.profileForm.value);
    } else {
      this.profileForm.markAllAsTouched();
    }
  }

  onCancelClick() {
    this.onCancel.emit();
  }

  get fullName() {
    const firstName = this.profileForm.get('firstName')?.value || '';
    const lastName = this.profileForm.get('lastName')?.value || '';
    return `${firstName} ${lastName}`.trim();
  }
}
