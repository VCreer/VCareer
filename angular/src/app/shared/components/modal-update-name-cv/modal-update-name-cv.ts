import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal-update-name-cv',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-update-name-cv.html',
  styleUrls: ['./modal-update-name-cv.scss']
})
export class ModalUpdateNameCvComponent {
  @Input() cvName: string = '';
  @Input() title: string = '';
  @Input() infoMessage: string = '';
  @Input() inputPlaceholder: string = '';
  @Input() backButtonText: string = '';
  @Input() continueButtonText: string = '';
  
  @Output() close = new EventEmitter<void>();
  @Output() continue = new EventEmitter<string>();

  onClose() {
    this.close.emit();
  }

  onContinue() {
    this.continue.emit(this.cvName);
  }
}
