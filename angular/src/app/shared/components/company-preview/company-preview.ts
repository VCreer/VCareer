import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ContactInfo {
  name: string;
  address: string;
}

export interface CompanyFormData {
  companyName: string;
  numberOfEmployees: string;
  website: string;
  overview: string;
}

@Component({
  selector: 'app-company-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './company-preview.html',
  styleUrls: ['./company-preview.scss']
})
export class CompanyPreviewComponent {
  @Input() companyForm: CompanyFormData = {
    companyName: '',
    numberOfEmployees: '',
    website: '',
    overview: ''
  };
  
  @Input() contactInfo: ContactInfo = {
    name: '',
    address: ''
  };
  
  @Input() employeeRangeMap: { [key: string]: string } = {};
  @Input() defaultEmployeeRange: string = '';

  getEmployeeRange(): string {
    return this.employeeRangeMap[this.companyForm.numberOfEmployees] || 
           this.companyForm.numberOfEmployees || 
           this.defaultEmployeeRange;
  }
}

