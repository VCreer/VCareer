import { Component, OnInit, OnChanges, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CandidateCvService } from '../../../proxy/http-api/controllers/candidate-cv.service';
import type { CandidateCvDto, GetCandidateCvListDto } from '../../../proxy/cv/models';

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

  onlineCvs: CandidateCvDto[] = [];
  uploadCvs: CandidateCvDto[] = [];
  selectedCvIds: Set<string> = new Set();
  loading: boolean = false;

  constructor(private candidateCvService: CandidateCvService) {}

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
    
    // Load CV ONLINE (chỉ lấy CV đã tạo online)
    const onlineInput: GetCandidateCvListDto = {
      maxResultCount: 100,
      skipCount: 0,
      sorting: 'creationTime DESC'
    };
    
    this.candidateCvService.getList(onlineInput).subscribe({
      next: (response: any) => {
        // Extract data từ ActionResult
        let cvList: CandidateCvDto[] = [];
        if (response.result && Array.isArray(response.result)) {
          cvList = response.result;
        } else if (response.items && Array.isArray(response.items)) {
          cvList = response.items;
        } else if (Array.isArray(response)) {
          cvList = response;
        } else if (response.data && Array.isArray(response.data)) {
          cvList = response.data;
        }
        
        this.onlineCvs = cvList;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading online CVs:', error);
        this.onlineCvs = [];
        this.loading = false;
      }
    });

    // Load CV UPLOAD - tạm thời để trống vì chưa có API upload
    this.uploadCvs = [];
    this.loading = false;
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

  getCvName(cv: CandidateCvDto): string {
    return cv.cvName || 'CV không có tên';
  }

  getUpdateDate(cv: CandidateCvDto): string {
    return this.formatDate(cv.publishedAt);
  }
}

