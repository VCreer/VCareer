import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JobOptionsService } from '../../services/job-options.service';

export interface JobFormData {
  companyName: string;
  companySize: string;
  companyIndustry: string;
  companyLocation: string;
  companyWebsite: string;
  companyImage: File | null;
  companyImagePreview: string;
  positionLevel: string;
  education: string;
  quantity: string;
  employmentType: string;
  jobTitle: string;
  location: string;
  salary: string;
  experience: string;
  applicationDeadline: string;
  description: string;
  requirements: string;
  benefits: string;
  workLocation: string;
  applicationMethod: string;
  workTime:string;
}

@Component({
  selector: 'app-job-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './job-preview.html',
  styleUrls: ['./job-preview.scss']
})
export class JobPreviewComponent {
  @Input() jobData!: JobFormData;
  
  private jobOptionsService = inject(JobOptionsService);

  getSalaryLabel(): string {
    const label = this.jobOptionsService.getSalaryLabel(this.jobData.salary);
    if (label) {
      return label;
    }
    
    // Nếu không match với JobOptionsService, format lại với mệnh giá
    if (!this.jobData.salary || this.jobData.salary === 'negotiable') {
      return 'Thỏa thuận';
    }
    
    // Format salary range (ví dụ: "20-40" -> "20 - 40 triệu")
    if (this.jobData.salary.includes('-')) {
      const [min, max] = this.jobData.salary.split('-');
      const minNum = parseInt(min, 10);
      const maxNum = parseInt(max, 10);
      if (!isNaN(minNum) && !isNaN(maxNum)) {
        return `${minNum} - ${maxNum} triệu`;
      }
    }
    
    // Nếu là số đơn (ví dụ: "50" -> "50 triệu")
    const numValue = parseInt(this.jobData.salary, 10);
    if (!isNaN(numValue)) {
      return `${numValue} triệu`;
    }
    
    return this.jobData.salary;
  }

  getLocationLabel(): string {
    return this.jobOptionsService.getLocationLabel(this.jobData.location);
  }

  getExperienceLabel(): string {
    return this.jobOptionsService.getExperienceLabel(this.jobData.experience);
  }

  getCompanySizeLabel(): string {
    return this.jobOptionsService.getCompanySizeLabel(this.jobData.companySize);
  }

  getCompanyIndustryLabel(): string {
    return this.jobOptionsService.getCompanyIndustryLabel(this.jobData.companyIndustry);
  }

  getPositionLevelLabel(): string {
    return this.jobOptionsService.getPositionLevelLabel(this.jobData.positionLevel);
  }

  getEducationLabel(): string {
    return this.jobOptionsService.getEducationLabel(this.jobData.education);
  }

  getEmploymentTypeLabel(): string {
    return this.jobOptionsService.getEmploymentTypeLabel(this.jobData.employmentType);
  }

  formatDate(dateString: string): string {
    return this.jobOptionsService.formatDate(dateString);
  }
}

