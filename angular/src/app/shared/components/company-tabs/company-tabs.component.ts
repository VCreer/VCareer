import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-company-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './company-tabs.component.html',
  styleUrls: ['./company-tabs.component.scss']
})
export class CompanyTabsComponent {
  @Input() activeTab: string = 'search';
  @Output() tabChange = new EventEmitter<string>();

  setTab(tab: string) {
    this.activeTab = tab;
    this.tabChange.emit(tab);
  }
}

