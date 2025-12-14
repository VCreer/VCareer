import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PieChartData {
  label: string;
  value: number;
  color?: string;
}

@Component({
  selector: 'app-pie-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pie-chart.html',
  styleUrls: ['./pie-chart.scss']
})
export class PieChartComponent implements OnChanges {
  @Input() data: PieChartData[] = [];
  @Input() size: number = 200;
  @Input() showLegend: boolean = true;
  @Input() showValues: boolean = true;
  @Input() donut: boolean = false; // Enable donut chart mode
  @Input() donutSize: number = 0.6; // Inner radius ratio (0.6 = 60% of outer radius)

  totalValue: number = 0;
  chartData: PieChartData[] = [];
  segments: Array<{
    data: PieChartData;
    startAngle: number;
    endAngle: number;
    percentage: number;
    path: string;
  }> = [];
  
  // Tooltip
  showTooltip: boolean = false;
  tooltipText: string = '';
  tooltipX: number = 0;
  tooltipY: number = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['donut'] || changes['donutSize']) {
      this.updateChart();
    }
  }

  updateChart(): void {
    if (this.data && this.data.length > 0) {
      this.chartData = [...this.data];
      this.totalValue = this.data.reduce((sum, item) => sum + item.value, 0);
      this.calculateSegments();
    } else {
      this.chartData = [];
      this.totalValue = 0;
      this.segments = [];
    }
  }

  calculateSegments(): void {
    const outerRadius = this.size / 2;
    const innerRadius = this.donut ? outerRadius * this.donutSize : 0;
    const centerX = outerRadius;
    const centerY = outerRadius;
    let currentAngle = -90; // Start from top

    this.segments = this.chartData.map((item) => {
      const percentage = (item.value / this.totalValue) * 100;
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      // Calculate path for SVG arc
      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;

      let path = '';
      
      if (this.donut && innerRadius > 0) {
        // Donut chart - create arc path
        const x1Outer = centerX + outerRadius * Math.cos(startAngleRad);
        const y1Outer = centerY + outerRadius * Math.sin(startAngleRad);
        const x2Outer = centerX + outerRadius * Math.cos(endAngleRad);
        const y2Outer = centerY + outerRadius * Math.sin(endAngleRad);
        
        const x1Inner = centerX + innerRadius * Math.cos(endAngleRad);
        const y1Inner = centerY + innerRadius * Math.sin(endAngleRad);
        const x2Inner = centerX + innerRadius * Math.cos(startAngleRad);
        const y2Inner = centerY + innerRadius * Math.sin(startAngleRad);

        const largeArcFlag = angle > 180 ? 1 : 0;

        path = `M ${x1Outer} ${y1Outer} `;
        path += `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2Outer} ${y2Outer} `;
        path += `L ${x1Inner} ${y1Inner} `;
        path += `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x2Inner} ${y2Inner} Z`;
      } else {
        // Regular pie chart
        const x1 = centerX + outerRadius * Math.cos(startAngleRad);
        const y1 = centerY + outerRadius * Math.sin(startAngleRad);
        const x2 = centerX + outerRadius * Math.cos(endAngleRad);
        const y2 = centerY + outerRadius * Math.sin(endAngleRad);

        const largeArcFlag = angle > 180 ? 1 : 0;

        path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
      }

      currentAngle = endAngle;

      return {
        data: item,
        startAngle,
        endAngle,
        percentage,
        path
      };
    });
  }

  getSegmentColor(item: PieChartData, index: number): string {
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

  getLabelPosition(segment: any): { x: number; y: number } {
    const outerRadius = this.size / 2;
    const innerRadius = this.donut ? outerRadius * this.donutSize : 0;
    const centerX = outerRadius;
    const centerY = outerRadius;
    // Position label at middle of donut ring or 70% for pie chart
    const labelRadius = this.donut ? (outerRadius + innerRadius) / 2 : outerRadius * 0.7;
    
    const midAngle = (segment.startAngle + segment.endAngle) / 2;
    const midAngleRad = (midAngle * Math.PI) / 180;
    
    return {
      x: centerX + labelRadius * Math.cos(midAngleRad),
      y: centerY + labelRadius * Math.sin(midAngleRad)
    };
  }

  onSegmentHover(event: MouseEvent, segment: any): void {
    this.tooltipText = `${segment.data.label}: ${segment.data.value} (${segment.percentage.toFixed(1)}%)`;
    this.tooltipX = event.clientX;
    this.tooltipY = event.clientY - 40;
    this.showTooltip = true;
  }

  onSegmentLeave(): void {
    this.showTooltip = false;
  }
}

