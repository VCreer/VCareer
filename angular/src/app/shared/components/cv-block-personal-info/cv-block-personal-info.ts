import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PersonalInfoBlockData } from '../../../features/dashboard/write-cv/candidate/write-cv';

@Component({
  selector: 'app-cv-block-personal-info',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './cv-block-personal-info.html',
  styleUrls: ['./cv-block-personal-info.scss']
})
export class CvBlockPersonalInfoComponent implements OnInit {
  @Input() data: PersonalInfoBlockData = {};
  @Output() dataChange = new EventEmitter<PersonalInfoBlockData>();

  form: FormGroup;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  isDragOver = false;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', Validators.required],
      dateOfBirth: [''],
      address: [''],
      gender: [null],
      profileImageUrl: [''],
      linkedIn: [''],
      gitHub: [''],
      website: ['']
    });
  }

  ngOnInit() {
    // Load data into form
    if (this.data) {
      this.form.patchValue({
        fullName: this.data.fullName || '',
        email: this.data.email || '',
        phoneNumber: this.data.phoneNumber || '',
        dateOfBirth: this.data.dateOfBirth || '',
        address: this.data.address || '',
        gender: this.data.gender ?? null,
        profileImageUrl: this.data.profileImageUrl || '',
        linkedIn: this.data.linkedIn || '',
        gitHub: this.data.gitHub || '',
        website: this.data.website || ''
      });
    }

    // Emit changes when form values change
    this.form.valueChanges.subscribe(value => {
      this.dataChange.emit(value);
    });
  }

  onUploadClick() {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.loadFile(file);
    // reset input to allow re-upload same file name
    input.value = '';
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.loadFile(file);
      event.dataTransfer.clearData();
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onRemoveImage() {
    this.form.get('profileImageUrl')?.setValue('');
  }

  private loadFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.form.get('profileImageUrl')?.setValue(dataUrl);
    };
    reader.readAsDataURL(file);
  }
}



