import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bar-chart.html',
  styleUrls: ['./bar-chart.scss']
})
export class BarChartComponent implements OnChanges {
  @Input() data: BarChartData[] = [];
  @Input() height: number = 300;
  @Input() showValues: boolean = true;
  @Input() maxValue: number = 0;
  @Input() yAxisSteps: number = 5; // Number of grid lines

  maxBarValue: number = 0;
  chartData: BarChartData[] = [];
  yAxisLabels: number[] = [];
  
  // Tooltip
  showTooltip: boolean = false;
  tooltipText: string = '';
  tooltipX: number = 0;
  tooltipY: number = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['maxValue']) {
      this.updateChart();
    }
  }

  updateChart(): void {
    if (this.data && this.data.length > 0) {
      this.chartData = [...this.data];
      
      if (this.maxValue > 0) {
        this.maxBarValue = this.maxValue;
      } else {
        this.maxBarValue = Math.max(...this.data.map(d => d.value), 0);
      }

      // Calculate Y-axis labels
      this.calculateYAxisLabels();
    } else {
      this.chartData = [];
      this.maxBarValue = 0;
      this.yAxisLabels = [];
    }
  }

  calculateYAxisLabels(): void {
    if (this.maxBarValue === 0) {
      this.yAxisLabels = [];
      return;
    }

    // Round up to nearest nice number
    const roundedMax = this.roundToNiceNumber(this.maxBarValue);
    const step = roundedMax / this.yAxisSteps;
    
    this.yAxisLabels = [];
    for (let i = 0; i <= this.yAxisSteps; i++) {
      this.yAxisLabels.push(Math.round(step * i));
    }
  }

  roundToNiceNumber(value: number): number {
    const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
    const normalized = value / magnitude;
    
    let niceValue: number;
    if (normalized <= 1) niceValue = 1;
    else if (normalized <= 2) niceValue = 2;
    else if (normalized <= 5) niceValue = 5;
    else niceValue = 10;
    
    return niceValue * magnitude;
  }

  getBarHeight(value: number): number {
    if (this.maxBarValue === 0) return 0;
    const roundedMax = this.roundToNiceNumber(this.maxBarValue);
    return (value / roundedMax) * 100;
  }

  getYAxisPosition(value: number): number {
    if (this.maxBarValue === 0) return 100;
    const roundedMax = this.roundToNiceNumber(this.maxBarValue);
    // 0 at bottom (100%), max at top (0%)
    return 100 - (value / roundedMax) * 100;
  }

  getUniqueColors(): Array<{ label: string; color: string; index: number }> {
    const colorMap = new Map<string, { label: string; color: string; index: number }>();
    
    this.chartData.forEach((item, index) => {
      const color = this.getBarColor(item, index);
      if (!colorMap.has(color)) {
        colorMap.set(color, {
          label: item.label,
          color: color,
          index: index
        });
      }
    });
    
    return Array.from(colorMap.values());
  }

  getBarColor(item: BarChartData, index: number): string {
    if (item.color) return item.color;
    
    // Default color scheme
    const colors = [
      '#0F83BA',
      '#10b981',
      '#f59e0b',
      '#ef4444',
      '#8b5cf6',
      '#ec4899',
      '#06b6d4',
      '#84cc16'
    ];
    return colors[index % colors.length];
  }

  onBarHover(event: MouseEvent, item: BarChartData): void {
    this.tooltipText = `${item.label}: ${item.value}`;
    this.tooltipX = event.clientX;
    this.tooltipY = event.clientY - 40;
    this.showTooltip = true;
  }

  onBarLeave(): void {
    this.showTooltip = false;
  }
}

