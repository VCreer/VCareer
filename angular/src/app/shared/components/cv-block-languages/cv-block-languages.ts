import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormArray, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-cv-block-languages',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './cv-block-languages.html',
  styleUrls: ['./cv-block-languages.scss']
})
export class CvBlockLanguagesComponent implements OnInit {
  @Input() data: any = { items: [] };
  @Output() dataChange = new EventEmitter<any>();

  form: FormGroup;
  itemsFormArray: FormArray;

  proficiencyLevels = ['Basic', 'Intermediate', 'Advanced', 'Native'];

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
      languageName: [item?.languageName || ''],
      proficiencyLevel: [item?.proficiencyLevel || '']
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



