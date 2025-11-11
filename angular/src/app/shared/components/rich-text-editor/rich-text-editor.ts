import { Component, Input, Output, EventEmitter, forwardRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rich-text-editor.html',
  styleUrls: ['./rich-text-editor.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditorComponent),
      multi: true
    }
  ]
})
export class RichTextEditorComponent implements ControlValueAccessor, AfterViewInit {
  @Input() label: string = '';
  @Input() placeholder: string = 'Nhập nội dung...';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() minHeight: string = '150px';

  @Output() contentChange = new EventEmitter<string>();

  @ViewChild('editorContent', { static: false }) editorContent!: ElementRef<HTMLElement>;

  value: string = '';
  private onChange = (value: string) => {};
  private onTouched = () => {};

  ngAfterViewInit(): void {
    if (this.value && this.editorContent) {
      this.editorContent.nativeElement.innerHTML = this.value;
    }
  }

  formatText(command: string): void {
    if (this.disabled || !this.editorContent) return;
    
    this.editorContent.nativeElement.focus();
    document.execCommand(command, false, '');
    this.updateValue();
  }

  onEditorInput(event: Event): void {
    if (this.disabled) return;
    this.updateValue();
  }

  onEditorBlur(event: Event): void {
    if (this.disabled) return;
    
    if (this.editorContent && (!this.editorContent.nativeElement.textContent || 
        this.editorContent.nativeElement.textContent.trim() === '')) {
      this.value = '';
    } else {
      this.updateValue();
    }
    this.onTouched();
  }

  private updateValue(): void {
    if (!this.editorContent) return;
    
    this.value = this.editorContent.nativeElement.innerHTML;
    this.onChange(this.value);
    this.contentChange.emit(this.value);
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
    if (this.editorContent) {
      this.editorContent.nativeElement.innerHTML = this.value;
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (this.editorContent) {
      this.editorContent.nativeElement.contentEditable = isDisabled ? 'false' : 'true';
    }
  }
}

