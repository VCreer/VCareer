import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { WorkExperienceItem, WorkExperienceBlockData } from '../../../features/dashboard/write-cv/candidate/write-cv';

@Component({
  selector: 'app-cv-block-work-experience',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './cv-block-work-experience.html',
  styleUrls: ['./cv-block-work-experience.scss']
})
export class CvBlockWorkExperienceComponent implements OnInit {
  @Input() data: WorkExperienceBlockData = { items: [] };
  @Output() dataChange = new EventEmitter<WorkExperienceBlockData>();

  form: FormGroup;
  itemsFormArray: FormArray;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      items: this.fb.array([])
    });
    this.itemsFormArray = this.form.get('items') as FormArray;
  }

  ngOnInit() {
    // Load existing items
    if (this.data?.items && this.data.items.length > 0) {
      this.data.items.forEach(item => this.addItem(item));
    } else {
      // Add one empty item by default
      this.addItem();
    }

    // Emit changes when form values change
    this.form.valueChanges.subscribe(value => {
      this.dataChange.emit({ items: value.items });
    });
  }

  addItem(item?: WorkExperienceItem) {
    const itemForm = this.fb.group({
      companyName: [item?.companyName || '', Validators.required],
      position: [item?.position || '', Validators.required],
      startDate: [item?.startDate || ''],
      endDate: [item?.endDate || ''],
      isCurrentJob: [item?.isCurrentJob || false],
      description: [item?.description || ''],
      achievements: [item?.achievements || []]
    });

    this.itemsFormArray.push(itemForm);
  }

  removeItem(index: number) {
    if (this.itemsFormArray.length > 1) {
      this.itemsFormArray.removeAt(index);
    }
  }

  addAchievement(itemIndex: number) {
    const itemForm = this.itemsFormArray.at(itemIndex) as FormGroup;
    const achievements = itemForm.get('achievements')?.value || [];
    achievements.push('');
    itemForm.patchValue({ achievements });
  }

  removeAchievement(itemIndex: number, achievementIndex: number) {
    const itemForm = this.itemsFormArray.at(itemIndex) as FormGroup;
    const achievements = itemForm.get('achievements')?.value || [];
    achievements.splice(achievementIndex, 1);
    itemForm.patchValue({ achievements });
  }

  updateAchievement(itemIndex: number, achievementIndex: number, event: Event) {
    const itemForm = this.itemsFormArray.at(itemIndex) as FormGroup;
    const achievements = [...(itemForm.get('achievements')?.value || [])];
    achievements[achievementIndex] = (event.target as HTMLInputElement).value;
    itemForm.patchValue({ achievements });
  }

  trackByIndex(index: number): number {
    return index;
  }
}

