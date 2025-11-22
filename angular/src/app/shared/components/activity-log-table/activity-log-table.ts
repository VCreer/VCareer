import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ActivityLog {
  id: string;
  staffId: string;
  staffName: string;
  staffRole: string;
  activityType: string;
  detail: string;
  timestamp: Date;
}

@Component({
  selector: 'app-activity-log-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activity-log-table.html',
  styleUrls: ['./activity-log-table.scss']
})
export class ActivityLogTableComponent {
  @Input() activityLogs: ActivityLog[] = [];
}