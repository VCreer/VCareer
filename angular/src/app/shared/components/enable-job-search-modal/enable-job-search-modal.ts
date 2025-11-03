import { Component, OnInit, OnChanges, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CVService } from '../../../proxy/cv/cv.service';
import type { CVDto, GetCVListDto } from '../../../proxy/cv/models';

@Component({
  selector: 'app-enable-job-search-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './enable-job-search-modal.html',
  styleUrls: ['./enable-job-search-modal.scss']
})
export class EnableJobSearchModalComponent implements OnInit, OnChanges {
  @Input() show: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() enableJobSearch = new EventEmitter<string[]>();

  onlineCvs: CVDto[] = [];
  uploadCvs: CVDto[] = [];
  selectedCvIds: Set<string> = new Set();
  loading: boolean = false;

  constructor(private cvService: CVService) {}

  ngOnInit() {
    if (this.show) {
      this.loadCVs();
    }
  }

  ngOnChanges() {
    if (this.show) {
      this.loadCVs();
    }
  }

  loadCVs() {
    this.loading = true;
    
    // Load CV ONLINE
    const onlineInput: GetCVListDto = {
      cvType: 'Online',
      maxResultCount: 100,
      skipCount: 0
    };
    
    this.cvService.getCVList(onlineInput).subscribe({
      next: (result) => {
        this.onlineCvs = result.items || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading online CVs:', error);
        this.onlineCvs = [];
        this.loading = false;
      }
    });

    // Load CV UPLOAD
    const uploadInput: GetCVListDto = {
      cvType: 'Upload',
      maxResultCount: 100,
      skipCount: 0
    };
    
    this.cvService.getCVList(uploadInput).subscribe({
      next: (result) => {
        this.uploadCvs = result.items || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading upload CVs:', error);
        this.uploadCvs = [];
        this.loading = false;
      }
    });
  }

  onClose() {
    this.close.emit();
  }

  onToggleCv(cvId: string) {
    if (this.selectedCvIds.has(cvId)) {
      this.selectedCvIds.delete(cvId);
    } else {
      this.selectedCvIds.add(cvId);
    }
  }

  onEnableJobSearch() {
    if (this.selectedCvIds.size > 0) {
      this.enableJobSearch.emit(Array.from(this.selectedCvIds));
      this.onClose();
    }
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  getCvName(cv: CVDto): string {
    return cv.cvName || cv.originalFileName || 'CV không có tên';
  }

  getUpdateDate(cv: CVDto): string {
    return this.formatDate(cv.lastModificationTime || cv.creationTime);
  }
}

