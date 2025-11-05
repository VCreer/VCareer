import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../button/button';

@Component({
  selector: 'app-search-company',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './search-company.component.html',
  styleUrls: ['./search-company.component.scss']
})
export class SearchCompanyComponent implements OnChanges {
  @Input() searchKeyword: string = '';
  @Input() companyList: any[] = [];
  @Input() isSearching: boolean = false;
  
  @Output() search = new EventEmitter<string>();
  @Output() selectCompany = new EventEmitter<any>();
  @Output() searchKeywordChange = new EventEmitter<string>();

  localKeyword: string = '';

  ngOnChanges() {
    this.localKeyword = this.searchKeyword;
  }

  onSearch() {
    this.search.emit(this.localKeyword);
  }

  onSelect(company: any) {
    this.selectCompany.emit(company);
  }
}

