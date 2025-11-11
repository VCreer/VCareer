import { Component, Input, Output, EventEmitter, HostListener, ElementRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface CvFilterData {
  searchKeyword: string;
  campaignId: string;
  statusId: string;
  sourceId: string;
  displayAll: boolean;
  labelId: string;
  timeRange: string;
}

@Component({
  selector: 'app-cv-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cv-filter-bar.component.html',
  styleUrls: ['./cv-filter-bar.component.scss'],
  encapsulation: ViewEncapsulation.Emulated // Use emulated encapsulation to scope styles
})
export class CvFilterBarComponent {
  @Input() campaigns: { id: string; name: string }[] = [];
  @Input() statuses: { id: string; name: string }[] = [];
  @Input() sources: { id: string; name: string }[] = [];
  @Input() labels: { id: string; name: string }[] = [];
  @Input() timeRanges: { id: string; name: string }[] = [
    { id: 'all', name: 'Tất cả thời gian' },
    { id: 'today', name: 'Hôm nay' },
    { id: 'week', name: 'Tuần này' },
    { id: 'month', name: 'Tháng này' },
    { id: 'year', name: 'Năm nay' }
  ];

  @Output() filterChange = new EventEmitter<CvFilterData>();

  // Filter values
  searchKeyword = '';
  selectedCampaign = '';
  selectedStatus = '';
  selectedSource = '';
  displayAll = true;
  selectedLabel = '';
  selectedTimeRange = '';
  
  // Date Range Picker
  dateRange = {
    startDate: null as Date | null,
    endDate: null as Date | null
  };
  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();
  nextCalendarMonth = new Date().getMonth() + 1;
  nextCalendarYear = new Date().getFullYear();
  weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  calendarDays: any[] = [];
  nextCalendarDays: any[] = [];
  tempStartDate: Date | null = null;
  tempEndDate: Date | null = null;

  // Dropdown states
  showCampaignDropdown = false;
  showStatusDropdown = false;
  showSourceDropdown = false;
  showDisplayAllDropdown = false;
  showLabelDropdown = false;
  showTimeRangeDropdown = false;

  constructor(private elementRef: ElementRef) {
    this.generateCalendar();
    this.generateNextCalendar();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeAllDropdowns();
    }
  }

  closeAllDropdowns(): void {
    this.showCampaignDropdown = false;
    this.showStatusDropdown = false;
    this.showSourceDropdown = false;
    this.showDisplayAllDropdown = false;
    this.showLabelDropdown = false;
    this.showTimeRangeDropdown = false;
  }

  toggleDropdown(dropdown: 'campaign' | 'status' | 'source' | 'displayAll' | 'label' | 'timeRange'): void {
    // Close all other dropdowns
    this.closeAllDropdowns();
    
    // Toggle the selected dropdown
    switch (dropdown) {
      case 'campaign':
        this.showCampaignDropdown = !this.showCampaignDropdown;
        break;
      case 'status':
        this.showStatusDropdown = !this.showStatusDropdown;
        break;
      case 'source':
        this.showSourceDropdown = !this.showSourceDropdown;
        break;
      case 'displayAll':
        this.showDisplayAllDropdown = !this.showDisplayAllDropdown;
        break;
      case 'label':
        this.showLabelDropdown = !this.showLabelDropdown;
        break;
      case 'timeRange':
        this.showTimeRangeDropdown = !this.showTimeRangeDropdown;
        if (this.showTimeRangeDropdown) {
          // Initialize temp dates when opening
          this.tempStartDate = this.dateRange.startDate ? new Date(this.dateRange.startDate) : null;
          this.tempEndDate = this.dateRange.endDate ? new Date(this.dateRange.endDate) : null;
          // Set current month to start date or today
          if (this.tempStartDate) {
            this.currentMonth = this.tempStartDate.getMonth();
            this.currentYear = this.tempStartDate.getFullYear();
          } else {
            this.currentMonth = new Date().getMonth();
            this.currentYear = new Date().getFullYear();
          }
          
          // Update next month to be one month after current
          if (this.currentMonth === 11) {
            this.nextCalendarMonth = 0;
            this.nextCalendarYear = this.currentYear + 1;
          } else {
            this.nextCalendarMonth = this.currentMonth + 1;
            this.nextCalendarYear = this.currentYear;
          }
          
          this.generateCalendar();
          this.generateNextCalendar();
        }
        break;
    }
  }

  onSearchChange(): void {
    this.emitFilterChange();
  }

  selectCampaign(campaignId: string): void {
    this.selectedCampaign = campaignId;
    this.showCampaignDropdown = false;
    this.emitFilterChange();
  }

  selectStatus(statusId: string): void {
    this.selectedStatus = statusId;
    this.showStatusDropdown = false;
    this.emitFilterChange();
  }

  selectSource(sourceId: string): void {
    this.selectedSource = sourceId;
    this.showSourceDropdown = false;
    this.emitFilterChange();
  }

  toggleDisplayAll(): void {
    this.displayAll = !this.displayAll;
    this.emitFilterChange();
  }

  clearDisplayAllFilter(): void {
    this.displayAll = true;
    this.emitFilterChange();
  }

  selectLabel(labelId: string): void {
    this.selectedLabel = labelId;
    this.showLabelDropdown = false;
    this.emitFilterChange();
  }

  selectTimeRange(timeRangeId: string): void {
    this.selectedTimeRange = timeRangeId;
    
    // Set temp date range based on preset (chưa apply, chỉ set temp)
    const today = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    
    switch (timeRangeId) {
      case 'all':
        startDate = null;
        endDate = null;
        break;
      case 'today':
        startDate = new Date(today);
        endDate = new Date(today);
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        startDate = weekStart;
        endDate = new Date(today);
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today);
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today);
        break;
    }
    
    // Chỉ set temp dates, chưa apply vào dateRange
    this.tempStartDate = startDate ? new Date(startDate) : null;
    this.tempEndDate = endDate ? new Date(endDate) : null;
    
    // Update calendar month to show start date
    if (startDate) {
      this.currentMonth = startDate.getMonth();
      this.currentYear = startDate.getFullYear();
      
      // Update next month to be one month after current
      if (this.currentMonth === 11) {
        this.nextCalendarMonth = 0;
        this.nextCalendarYear = this.currentYear + 1;
      } else {
        this.nextCalendarMonth = this.currentMonth + 1;
        this.nextCalendarYear = this.currentYear;
      }
    }
    
    // Không đóng dropdown và không emit change, chỉ update calendar
    this.generateCalendar();
    this.generateNextCalendar();
  }
  
  generateCalendar(): void {
    this.calendarDays = [];
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      this.calendarDays.push({ date: '', disabled: true });
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(this.currentYear, this.currentMonth, day);
      this.calendarDays.push({
        date: day,
        fullDate: date,
        disabled: false
      });
    }
  }
  
  generateNextCalendar(): void {
    this.nextCalendarDays = [];
    const firstDay = new Date(this.nextCalendarYear, this.nextCalendarMonth, 1);
    const lastDay = new Date(this.nextCalendarYear, this.nextCalendarMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      this.nextCalendarDays.push({ date: '', disabled: true });
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(this.nextCalendarYear, this.nextCalendarMonth, day);
      this.nextCalendarDays.push({
        date: day,
        fullDate: date,
        disabled: false
      });
    }
  }
  
  getNextMonthYear(): string {
    const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
                    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    return `${months[this.nextCalendarMonth]} ${this.nextCalendarYear}`;
  }
  
  nextNextMonth(): void {
    if (this.nextCalendarMonth === 11) {
      this.nextCalendarMonth = 0;
      this.nextCalendarYear++;
    } else {
      this.nextCalendarMonth++;
    }
    // Update current month to be one month before next
    if (this.nextCalendarMonth === 0) {
      this.currentMonth = 11;
      this.currentYear = this.nextCalendarYear - 1;
    } else {
      this.currentMonth = this.nextCalendarMonth - 1;
      this.currentYear = this.nextCalendarYear;
    }
    this.generateCalendar();
    this.generateNextCalendar();
  }
  
  getCurrentMonthYear(): string {
    const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
                    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    return `${months[this.currentMonth]} ${this.currentYear}`;
  }
  
  previousMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    
    // Update next month to be one month after current
    if (this.currentMonth === 11) {
      this.nextCalendarMonth = 0;
      this.nextCalendarYear = this.currentYear + 1;
    } else {
      this.nextCalendarMonth = this.currentMonth + 1;
      this.nextCalendarYear = this.currentYear;
    }
    
    this.generateCalendar();
    this.generateNextCalendar();
  }
  
  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    
    // Update next month to be one month after current
    if (this.currentMonth === 11) {
      this.nextCalendarMonth = 0;
      this.nextCalendarYear = this.currentYear + 1;
    } else {
      this.nextCalendarMonth = this.currentMonth + 1;
      this.nextCalendarYear = this.currentYear;
    }
    
    this.generateCalendar();
    this.generateNextCalendar();
  }
  
  selectDate(day: any): void {
    if (day.disabled || !day.fullDate) return;
    
    // Clear preset selection when selecting custom date
    this.selectedTimeRange = '';
    
    if (!this.tempStartDate || (this.tempStartDate && this.tempEndDate)) {
      // Start new selection
      this.tempStartDate = day.fullDate;
      this.tempEndDate = null;
    } else {
      // Complete selection
      if (day.fullDate < this.tempStartDate!) {
        this.tempEndDate = this.tempStartDate;
        this.tempStartDate = day.fullDate;
      } else {
        this.tempEndDate = day.fullDate;
      }
    }
    this.generateCalendar();
    this.generateNextCalendar();
  }
  
  isDateSelected(day: any): boolean {
    if (!day.fullDate) return false;
    const date = day.fullDate;
    return (this.tempStartDate && this.isSameDay(date, this.tempStartDate)) ||
           (this.tempEndDate && this.isSameDay(date, this.tempEndDate));
  }
  
  isDateInRange(day: any): boolean {
    if (!day.fullDate || !this.tempStartDate || !this.tempEndDate) return false;
    const date = day.fullDate;
    return date >= this.tempStartDate && date <= this.tempEndDate;
  }
  
  isStartDate(day: any): boolean {
    if (!day.fullDate || !this.tempStartDate) return false;
    return this.isSameDay(day.fullDate, this.tempStartDate);
  }
  
  isEndDate(day: any): boolean {
    if (!day.fullDate || !this.tempEndDate) return false;
    return this.isSameDay(day.fullDate, this.tempEndDate);
  }
  
  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }
  
  applyDateRange(): void {
    // Apply temp dates to actual dateRange
    this.dateRange.startDate = this.tempStartDate;
    this.dateRange.endDate = this.tempEndDate;
    
    // Nếu có selectedTimeRange preset, giữ nguyên
    // Nếu không có preset nhưng có temp dates, clear preset
    if (!this.selectedTimeRange && (this.tempStartDate || this.tempEndDate)) {
      // Custom date range selected
    }
    
    this.showTimeRangeDropdown = false;
    this.emitFilterChange();
  }
  
  cancelDateRange(): void {
    this.tempStartDate = this.dateRange.startDate;
    this.tempEndDate = this.dateRange.endDate;
    this.showTimeRangeDropdown = false;
    this.generateCalendar();
    this.generateNextCalendar();
  }

  clearFilter(filterType: 'campaign' | 'status' | 'source' | 'label' | 'timeRange' | 'search'): void {
    switch (filterType) {
      case 'campaign':
        this.selectedCampaign = '';
        break;
      case 'status':
        this.selectedStatus = '';
        break;
      case 'source':
        this.selectedSource = '';
        break;
      case 'label':
        this.selectedLabel = '';
        break;
      case 'timeRange':
        this.selectedTimeRange = '';
        this.dateRange.startDate = null;
        this.dateRange.endDate = null;
    this.tempStartDate = null;
    this.tempEndDate = null;
    this.generateCalendar();
    this.generateNextCalendar();
        break;
      case 'search':
        this.searchKeyword = '';
        break;
    }
    this.emitFilterChange();
  }

  getSelectedCampaignName(): string {
    const campaign = this.campaigns.find(c => c.id === this.selectedCampaign);
    return campaign ? campaign.name : 'Chọn chiến dịch tuyển dụng';
  }

  getSelectedStatusName(): string {
    const status = this.statuses.find(s => s.id === this.selectedStatus);
    return status ? status.name : 'Nhập trạng thái CV';
  }

  getSelectedSourceName(): string {
    const source = this.sources.find(s => s.id === this.selectedSource);
    return source ? source.name : 'Nhập nguồn CV';
  }

  getSelectedLabelName(): string {
    const label = this.labels.find(l => l.id === this.selectedLabel);
    return label ? label.name : 'Tất cả nhãn';
  }

  getSelectedTimeRangeName(): string {
    if (this.dateRange.startDate && this.dateRange.endDate) {
      const start = this.formatDate(this.dateRange.startDate);
      const end = this.formatDate(this.dateRange.endDate);
      return `${start} - ${end}`;
    }
    const timeRange = this.timeRanges.find(t => t.id === this.selectedTimeRange);
    return timeRange ? timeRange.name : 'Tất cả thời gian';
  }
  
  isTimeRangeSelected(timeRangeId: string): boolean {
    // Check if this range is currently selected (either in selectedTimeRange or matches temp dates)
    if (this.selectedTimeRange === timeRangeId) {
      return true;
    }
    
    // Also check if temp dates match this preset
    const today = new Date();
    let matches = false;
    
    switch (timeRangeId) {
      case 'all':
        matches = !this.tempStartDate && !this.tempEndDate;
        break;
      case 'today':
        if (this.tempStartDate && this.tempEndDate) {
          matches = this.isSameDay(this.tempStartDate, today) && this.isSameDay(this.tempEndDate, today);
        }
        break;
      case 'week':
        if (this.tempStartDate && this.tempEndDate) {
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          matches = this.isSameDay(this.tempStartDate, weekStart) && this.isSameDay(this.tempEndDate, today);
        }
        break;
      case 'month':
        if (this.tempStartDate && this.tempEndDate) {
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          matches = this.isSameDay(this.tempStartDate, monthStart) && this.isSameDay(this.tempEndDate, today);
        }
        break;
      case 'year':
        if (this.tempStartDate && this.tempEndDate) {
          const yearStart = new Date(today.getFullYear(), 0, 1);
          matches = this.isSameDay(this.tempStartDate, yearStart) && this.isSameDay(this.tempEndDate, today);
        }
        break;
    }
    
    return matches;
  }
  
  formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  }

  private emitFilterChange(): void {
    const filterData: CvFilterData = {
      searchKeyword: this.searchKeyword,
      campaignId: this.selectedCampaign,
      statusId: this.selectedStatus,
      sourceId: this.selectedSource,
      displayAll: this.displayAll,
      labelId: this.selectedLabel,
      timeRange: this.selectedTimeRange
    };
    this.filterChange.emit(filterData);
  }
}

