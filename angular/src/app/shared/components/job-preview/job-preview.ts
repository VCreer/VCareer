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
    return this.jobOptionsService.getSalaryLabel(this.jobData.salary);
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

