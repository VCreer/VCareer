import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CandidateSearchService } from '../../../../proxy/profile/candidate-search.service';
import { SearchCandidateInputDto, CandidateSearchResultDto } from '../../../../proxy/dto/profile/models';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { ToastNotificationComponent } from '../../../../shared/components/toast-notification/toast-notification';

export interface CandidateSearchResult {
  id: string;
  candidateUserId?: string;
  defaultCvId?: string;
  name: string;
  avatar?: string;
  jobTitle?: string;
  location?: string;
  updatedTime?: string;
  salary?: string;
  experience?: number;
  skills?: string[];
  education?: string;
  isSeekingJob: boolean;
  viewCount: number;
  contactOpenCount: number;
  experienceDetails?: {
    company: string;
    position: string;
    duration?: string;
  }[];
  experienceEntries?: {
    position: string;
    company?: string;
  }[];
}

@Component({
  selector: 'app-find-candidate',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    ToastNotificationComponent
  ],
  templateUrl: './find-candidate.html',
  styleUrls: ['./find-candidate.scss']
})
export class FindCandidateComponent implements OnInit {
  // Search filters
  keyword: string = '';
  searchScope = {
    appliedPosition: false,
    activity: false,
    education: false,
    experience: false,
    skills: false
  };
  location: string = '';
  cvClassification: 'all' | 'unseen' | 'seen' = 'all';
  
  // Saved filters
  savedFilters: any[] = [];
  selectedSavedFilter: string = '';
  showSavedFilterDropdown: boolean = false;

  // Display priority
  displayPriority: 'newest' | 'seeking' | 'experienced' | 'suitable' = 'newest';

  // Search results
  candidates: CandidateSearchResult[] = [];
  loading: boolean = false;
  totalResults: number = 0;

  // Toast
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' | 'warning' = 'success';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;

  constructor(
    private router: Router,
    private candidateSearchService: CandidateSearchService
  ) {}

  ngOnInit() {
    // Không tự động search khi load, để user nhập filter trước
  }

  onSavedFilterChange() {
    // TODO: Load saved filter
  }

  onCreateNewFilter() {
    // TODO: Open modal to create new filter
  }

  onUpdateFilter() {
    // TODO: Open modal to update current filter
  }

  onSearchScopeChange() {
    // Handle search scope checkbox changes
  }

  onCvClassificationChange() {
    // Handle CV classification radio changes
  }

  onDisplayPriorityChange() {
    // Handle display priority radio changes
    this.performSearch();
  }

  performSearch() {
    this.loading = true;
    
    const searchInput: SearchCandidateInputDto = {
      keyword: this.keyword && this.keyword.trim() ? this.keyword.trim() : undefined,
      workLocation: this.location && this.location.trim() ? this.location.trim() : undefined,
      searchInJobTitle: false,
      searchInActivity: false,
      searchInEducation: false,
      searchInExperience: false,
      searchInSkills: false,
      cvClassification: this.cvClassification === 'all' ? undefined : this.cvClassification,
      displayPriority: this.displayPriority,
      skipCount: (this.currentPage - 1) * this.itemsPerPage,
      maxResultCount: this.itemsPerPage,
      sorting: this.getSortingFromPriority(this.displayPriority)
    };

    const hasCustomScope = Object.values(this.searchScope).some(isChecked => isChecked);
    if (hasCustomScope) {
      searchInput.searchInJobTitle = this.searchScope.appliedPosition;
      searchInput.searchInActivity = this.searchScope.activity;
      searchInput.searchInEducation = this.searchScope.education;
      searchInput.searchInExperience = this.searchScope.experience;
      searchInput.searchInSkills = this.searchScope.skills;
    } else {
      searchInput.searchInJobTitle = true;
      searchInput.searchInActivity = true;
      searchInput.searchInEducation = true;
      searchInput.searchInExperience = true;
      searchInput.searchInSkills = true;
    }

    this.candidateSearchService.searchCandidates(searchInput).subscribe({
      next: (response) => {
        try {
          // Response có thể là ActionResult<PagedResultDto> hoặc PagedResultDto trực tiếp
          let pagedResult: any = null;
          
          if (response && typeof response === 'object') {
            // Nếu có property 'value', đó là ActionResult
            if ('value' in response) {
              pagedResult = response.value;
            } 
            // Nếu có property 'items' và 'totalCount', đó là PagedResultDto trực tiếp
            else if ('items' in response && 'totalCount' in response) {
              pagedResult = response;
            }
          }

          if (pagedResult && pagedResult.items) {
            this.totalResults = pagedResult.totalCount || 0;
            this.candidates = (pagedResult.items || []).map((candidate: CandidateSearchResultDto) => 
              this.mapCandidateToResult(candidate)
            );
            this.applyClientSorting();
          } else {
            this.totalResults = 0;
            this.candidates = [];
          }
        } catch (error) {
          console.error('Error parsing response:', error);
          this.totalResults = 0;
          this.candidates = [];
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error searching candidates:', error);
        this.showToastMessage('Có lỗi xảy ra khi tìm kiếm ứng viên', 'error');
        this.loading = false;
        this.candidates = [];
        this.totalResults = 0;
      }
    });
  }

  private mapCandidateToResult(candidate: CandidateSearchResultDto): CandidateSearchResult {
    return {
      id: candidate.id || '',
      candidateUserId: candidate.candidateUserId,
      defaultCvId: candidate.defaultCvId,
      name: candidate.name || 'N/A',
      avatar: candidate.avatarUrl || this.getInitials(candidate.name || ''),
      jobTitle: candidate.jobTitle,
      location: candidate.workLocation || candidate.location,
      updatedTime: this.formatTimeAgo(candidate.lastUpdatedTime),
      salary: this.formatSalary(candidate.salary),
      experience: candidate.experience,
      skills: candidate.skills ? this.parseSkills(candidate.skills) : [],
      education: candidate.education,
      isSeekingJob: candidate.isSeekingJob,
      viewCount: candidate.viewCount || 0,
      contactOpenCount: candidate.contactOpenCount || 0,
      experienceDetails: candidate.experienceDetails?.map(exp => ({
        company: exp.company || '',
        position: exp.position || '',
        duration: exp.duration
      })) || [],
      experienceEntries: this.buildExperienceEntries(candidate)
    };
  }

  private buildExperienceEntries(candidate: CandidateSearchResultDto): { position: string; company?: string }[] {
    const detailEntries =
      candidate.experienceDetails?.map(exp => ({
        position: exp.position || 'Chưa cập nhật',
        company: exp.company
      })) || [];

    if (detailEntries.length > 0) {
      return detailEntries;
    }

    if (candidate.jobTitle) {
      return [{ position: candidate.jobTitle }];
    }

    return [{ position: 'Chưa cập nhật' }];
  }

  private parseSkills(skills: string): string[] {
    if (!skills) return [];
    // Split by comma, semicolon, or newline
    return skills.split(/[,;\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  private formatSalary(salary?: number): string {
    if (!salary) return '';
    if (salary >= 1000000) {
      const millions = salary / 1000000;
      return `${millions.toFixed(0)} triệu`;
    }
    return `${salary.toLocaleString('vi-VN')} VNĐ`;
  }

  private formatTimeAgo(dateString?: string): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      const diffWeeks = Math.floor(diffDays / 7);
      const diffMonths = Math.floor(diffDays / 30);
      const diffYears = Math.floor(diffDays / 365);

      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays < 7) return `${diffDays} ngày trước`;
      if (diffWeeks < 4) return `${diffWeeks} tuần trước`;
      if (diffMonths < 12) return `${diffMonths} tháng trước`;
      return `${diffYears} năm trước`;
    } catch {
      return '';
    }
  }

  private getSortingFromPriority(priority?: string): string {
    switch (priority) {
      case 'newest':
        return 'LastModificationTime DESC, CreationTime DESC';
      case 'seeking':
        return 'Status DESC, ProfileVisibility DESC, LastModificationTime DESC';
      case 'experienced':
        return 'Experience DESC, LastModificationTime DESC';
      case 'suitable':
        return 'LastModificationTime DESC, Experience DESC';
      default:
        return 'LastModificationTime DESC, CreationTime DESC';
    }
  }

  private applyClientSorting(): void {
    this.candidates = [...this.candidates];

    if (this.keyword && this.keyword.trim()) {
      const keywordNormalized = this.keyword.trim().toLowerCase();
      const keywordFullyNumeric = /^[0-9]+$/.test(keywordNormalized);
      const keywordAsNumber = keywordFullyNumeric ? parseInt(keywordNormalized, 10) : undefined;

      this.candidates.sort((a, b) => {
        const expA = this.calculateExperienceScore(a, keywordNormalized, keywordAsNumber);
        const expB = this.calculateExperienceScore(b, keywordNormalized, keywordAsNumber);
        if (expA !== expB) {
          return expB - expA;
        }
        return (b.experience ?? 0) - (a.experience ?? 0);
      });
      return;
    }

    if (this.displayPriority === 'experienced') {
      this.candidates.sort((a, b) => {
        const expA = a.experience ?? 0;
        const expB = b.experience ?? 0;
        return expB - expA;
      });
    }
  }

  private calculateExperienceScore(
    candidate: CandidateSearchResult,
    keyword: string,
    keywordAsNumber?: number
  ): number {
    const baseExperience = candidate.experience ?? 0;
    let score = baseExperience;

    if (keywordAsNumber !== undefined && candidate.experience !== undefined) {
      const expDiff = Math.abs(candidate.experience - keywordAsNumber);
      score += Math.max(0, 50 - expDiff * 10);
    }

    const keywordsToCheck = [
      candidate.jobTitle,
      ...(candidate.skills || []),
      candidate.education,
      ...(candidate.experienceEntries?.map(e => e.position) || [])
    ];

    const matchesKeyword = keywordsToCheck.some(field =>
      field?.toLowerCase().includes(keyword)
    );

    if (matchesKeyword) {
      score += 100;
    }

    return score;
  }

  onSearchClick() {
    this.currentPage = 1; // Reset to first page when searching
    this.performSearch();
  }

  onCandidateClick(candidate: CandidateSearchResult) {
    if (!candidate?.id) {
      return;
    }

    const queryParams: any = {};
    if (candidate.defaultCvId) {
      queryParams.cvId = candidate.defaultCvId;
    }

    this.router.navigate(
      ['/recruiter/find-cv/detail', candidate.id],
      {
        queryParams,
        state: { candidate }
      }
    );
  }

  onBookmarkClick(candidateId: string, event: Event) {
    event.stopPropagation();
    // TODO: Toggle bookmark
  }

  showToastMessage(message: string, type: 'success' | 'error' | 'warning' = 'success') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  onToastClose() {
    this.showToast = false;
  }

  getInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  formatExperience(experience?: number): string {
    if (!experience) return '';
    const years = Math.floor(experience);
    const months = Math.round((experience - years) * 12);
    if (months > 0) {
      return `${years} năm ${months} tháng`;
    }
    return `${years} năm`;
  }
}

