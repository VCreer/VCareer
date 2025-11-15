import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface MetricData {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

@Component({
  selector: 'app-report-metric-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-metric-card.html',
  styleUrls: ['./report-metric-card.scss']
})
export class ReportMetricCardComponent {
  @Input() metric!: MetricData;
}
