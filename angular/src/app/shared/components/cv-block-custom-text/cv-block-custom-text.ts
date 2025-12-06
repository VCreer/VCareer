import { Component, Input, Output, EventEmitter, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Quill editor (fallback to contenteditable if Quill not installed)
declare var Quill: any;

@Component({
  selector: 'app-cv-block-custom-text',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cv-block-custom-text.html',
  styleUrls: ['./cv-block-custom-text.scss']
})
export class CvBlockCustomTextComponent implements OnInit, AfterViewInit {
  @Input() data: any = { html: '' };
  @Output() dataChange = new EventEmitter<any>();

  @ViewChild('editorContainer', { static: false }) editorContainer?: any;

  htmlContent: string = '';
  quillEditor: any = null;
  useQuill: boolean = false;

  ngOnInit() {
    this.htmlContent = this.data?.html || '';
    // Check if Quill is available
    this.useQuill = typeof Quill !== 'undefined';
  }

  ngAfterViewInit() {
    if (this.useQuill && this.editorContainer?.nativeElement) {
      try {
        this.quillEditor = new Quill(this.editorContainer.nativeElement, {
          theme: 'snow',
          modules: {
            toolbar: [
              ['bold', 'italic', 'underline', 'strike'],
              ['blockquote', 'code-block'],
              [{ 'header': 1 }, { 'header': 2 }],
              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
              [{ 'script': 'sub'}, { 'script': 'super' }],
              [{ 'indent': '-1'}, { 'indent': '+1' }],
              [{ 'direction': 'rtl' }],
              [{ 'size': ['small', false, 'large', 'huge'] }],
              [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
              [{ 'color': [] }, { 'background': [] }],
              [{ 'font': [] }],
              [{ 'align': [] }],
              ['clean'],
              ['link']
            ]
          },
          placeholder: 'Nhập nội dung văn bản tùy chỉnh...'
        });

        // Set initial content
        if (this.htmlContent) {
          this.quillEditor.root.innerHTML = this.htmlContent;
        }

        // Listen for text changes
        this.quillEditor.on('text-change', () => {
          this.htmlContent = this.quillEditor.root.innerHTML;
          this.dataChange.emit({ html: this.htmlContent });
        });
      } catch (error) {
        console.warn('Quill initialization failed, falling back to textarea:', error);
        this.useQuill = false;
      }
    }
  }

  onContentChange(event: Event) {
    if (!this.useQuill) {
      const target = event.target as HTMLTextAreaElement;
      this.htmlContent = target.value;
      this.dataChange.emit({ html: this.htmlContent });
    }
  }
}

