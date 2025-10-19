import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-avatar.component.html',
  styleUrls: ['./profile-avatar.component.scss']
})
export class ProfileAvatarComponent {
  @Input() avatarUrl: string = '';
  @Input() name: string = '';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() showEditButton: boolean = true;
  @Input() isUploading: boolean = false;

  @Output() onAvatarChange = new EventEmitter<File>();
  @Output() onAvatarRemove = new EventEmitter<void>();

  get avatarSize() {
    const sizes = {
      small: '60px',
      medium: '120px',
      large: '180px'
    };
    return sizes[this.size];
  }

  get initials() {
    if (!this.name) return '?';
    return this.name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.onAvatarChange.emit(input.files[0]);
    }
  }

  onRemoveClick() {
    this.onAvatarRemove.emit();
  }
}
