import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-card.html',
  styleUrls: ['./profile-card.scss']
})
export class ProfileCardComponent {
  @Input() userName: string = 'Nguyễn Văn A';
  @Input() userEmail: string = 'user@example.com';
  @Input() avatarUrl?: string;
  @Input() accountStatus: string = 'Tài khoản đã xác thực';
  @Input() jobSearchEnabled: boolean = false;
  @Input() allowRecruiterSearch: boolean = true;
  
  @Output() avatarClick = new EventEmitter<void>();
  @Output() upgradeClick = new EventEmitter<void>();
  @Output() jobSearchToggle = new EventEmitter<boolean>();
  @Output() recruiterSearchToggle = new EventEmitter<boolean>();

  onAvatarClick(): void {
    this.avatarClick.emit();
  }

  onUpgradeClick(): void {
    this.upgradeClick.emit();
  }

  onJobSearchToggle(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.jobSearchEnabled = target.checked;
    this.jobSearchToggle.emit(this.jobSearchEnabled);
  }

  onAllowRecruiterSearchToggle(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.allowRecruiterSearch = target.checked;
    this.recruiterSearchToggle.emit(this.allowRecruiterSearch);
  }
}
