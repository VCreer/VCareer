import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslationService } from '../../../../core/services/translation.service';

@Component({
  selector: 'app-cv-sample',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cv-sample.html',
  styleUrls: ['./cv-sample.scss']
})
export class CvSampleComponent implements OnInit {
  selectedLanguage: string = 'vi';
  selectedFilter: string = 'all';
  
  filters = [
    { id: 'all', label: 'cv_sample.filter.all', icon: 'fa fa-th' },
    { id: 'simple', label: 'cv_sample.filter.simple', icon: 'fa fa-circle-o' },
    { id: 'professional', label: 'cv_sample.filter.professional', icon: 'fa fa-briefcase' },
    { id: 'modern', label: 'cv_sample.filter.modern', icon: 'fa fa-cube' }
  ];

  cvSamples = [
    {
      id: 1,
      name: 'CV Tiêu chuẩn',
      preview: 'assets/images/cv-sample/cv-sample-1.png',
      type: 'cv_sample.type.standard',
      tags: ['cv_sample.tag.simple']
    }
  ];

  filteredCvSamples = [...this.cvSamples];
  
  get hasResults(): boolean {
    return this.filteredCvSamples.length > 0;
  }

  constructor(
    private router: Router,
    private translationService: TranslationService
  ) {}

  ngOnInit() {
    this.translationService.currentLanguage$.subscribe(lang => {
      this.selectedLanguage = lang;
    });
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  selectFilter(filterId: string) {
    this.selectedFilter = filterId;
    this.filteredCvSamples = this.cvSamples.filter(sample => {
      if (filterId === 'all') return true;
      return sample.tags.some(tag => tag.includes(filterId));
    });
  }

  useTemplate(templateId: number) {
    this.router.navigate(['/candidate/write-cv/standard-cv']);
  }
}
