import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-form-input',
  standalone: true,
  template: `
    <div class="form-group">
      <label class="form-label" [class.required]="required">{{ label }}</label>
      <input 
        [type]="type"
        [class]="'form-input' + (error ? ' error' : '') + (value && !error ? ' valid' : '')"
        [value]="value"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [required]="required"
        [pattern]="pattern"
        [title]="title"
        (input)="onInput($event)"
        (blur)="onBlur()"
        (focus)="onFocus()">
      <span class="error-message" *ngIf="error">{{ error }}</span>
    </div>
  `,
  styleUrls: ['./form-input.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormInputComponent),
      multi: true
    }
  ]
})
export class FormInputComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() type: string = 'text';
  @Input() placeholder: string = '';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() error: string = '';
  @Input() pattern: string = '';
  @Input() title: string = '';

  @Output() valueChange = new EventEmitter<string>();

  value: string = '';
  private onChange = (value: string) => {};
  private onTouched = () => {};

  onInput(event: any) {
    this.value = event.target.value;
    this.onChange(this.value);
    this.valueChange.emit(this.value);
  }

  onBlur() {
    this.onTouched();
  }

  onFocus() {
    // Handle focus if needed
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
