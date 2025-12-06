import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-cv-block-education',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './cv-block-education.html',
  styleUrls: ['./cv-block-education.scss']
})
export class CvBlockEducationComponent implements OnInit {
  @Input() data: any = { items: [] };
  @Output() dataChange = new EventEmitter<any>();

  form: FormGroup;
  itemsFormArray: FormArray;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      items: this.fb.array([])
    });
    this.itemsFormArray = this.form.get('items') as FormArray;
  }

  ngOnInit() {
    if (this.data?.items && this.data.items.length > 0) {
      this.data.items.forEach((item: any) => this.addItem(item));
    } else {
      this.addItem();
    }

    this.form.valueChanges.subscribe(value => {
      this.dataChange.emit({ items: value.items });
    });
  }

  addItem(item?: any) {
    const itemForm = this.fb.group({
      institutionName: [item?.institutionName || '', Validators.required],
      degree: [item?.degree || ''],
      major: [item?.major || ''],
      startDate: [item?.startDate || ''],
      endDate: [item?.endDate || ''],
      isCurrent: [item?.isCurrent || false],
      gpa: [item?.gpa || ''],
      description: [item?.description || '']
    });
    this.itemsFormArray.push(itemForm);
  }

  removeItem(index: number) {
    if (this.itemsFormArray.length > 1) {
      this.itemsFormArray.removeAt(index);
    }
  }

  trackByIndex(index: number): number {
    return index;
  }
}





