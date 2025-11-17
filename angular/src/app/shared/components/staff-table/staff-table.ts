import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface HRStaff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  status: 'active' | 'inactive' | 'pending';
  joinDate: string;
  campaigns: number;
  candidates: number;
  avatar?: string;
}

@Component({
  selector: 'app-staff-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './staff-table.html',
  styleUrls: ['./staff-table.scss']
})
export class StaffTableComponent {
  @Input() staffList: HRStaff[] = [];
  @Output() viewStaff = new EventEmitter<HRStaff>();

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'pending':
        return 'status-pending';
      case 'inactive':
        return 'status-inactive';
      default:
        return 'status-inactive';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active':
        return 'Đang hoạt động';
      case 'pending':
        return 'Chờ duyệt';
      case 'inactive':
        return 'Ngừng hoạt động';
      default:
        return status;
    }
  }

  onViewStaff(staff: HRStaff): void {
    this.viewStaff.emit(staff);
  }
}