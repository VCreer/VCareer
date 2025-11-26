import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { ProfileCardComponent } from '../../../../shared/components/profile-card/profile-card';
import { MultiSelectLocationComponent } from '../../../../shared/components/multi-select-location/multi-select-location';
import { JobOptionsService } from '../../../../shared/services/job-options.service';
import { SelectOption } from '../../../../shared/components/select-field/select-field';

@Component({
  selector: 'app-job-suggestion-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    ProfileCardComponent,
     MultiSelectLocationComponent,
  ],
  templateUrl: './job-suggestion-settings.html',
  styleUrls: ['./job-suggestion-settings.scss'],
})
export class JobSuggestionSettingsComponent {
  // Thông tin cá nhân đơn giản cho phần giới tính
  gender: 'male' | 'female' | 'unspecified' = 'male';
  formSubmitted = false;

  // Options cho dropdown
  positionOptions: SelectOption[] = this.jobOptionsService.JOB_POSITION_OPTIONS;

  skillOptions: string[] = [
    'Angular',
    'TypeScript',
    'React',
    'UI/UX',
    'REST API',
  ];

  // Địa điểm và vị trí dùng multi-select-location
  locationOptions: SelectOption[] = this.jobOptionsService.PROVINCE_OPTIONS;
  selectedPositions: string[] = [];
  selectedLocations: string[] = [];
  positionError: string = '';
  locationError: string = '';

  jobPreference = {
    desiredPosition: '',
    customPosition: '',
    skillsText: '',
    experienceLevel: '',
    workType: 'hybrid',
    salaryFrom: 0,
    mainLocation: '',
    canChangeLocation: false,
    frequencyPerWeek: 3,
  };

  lastSavedMessage: string = '';
  customPositionError: string = '';
  profileUser = {
    name: 'Uông Hoàng Duy',
    accountStatus: 'Tài khoản đã xác thực',
    jobSearchEnabled: true,
    allowRecruiterSearch: true,
  };

  constructor(
    private router: Router,
    private jobOptionsService: JobOptionsService
  ) {}

  resetPreferences(): void {
    this.jobPreference = {
      desiredPosition: '',
      customPosition: '',
      skillsText: '',
      experienceLevel: '',
      workType: 'hybrid',
      salaryFrom: 0,
      mainLocation: '',
      canChangeLocation: false,
      frequencyPerWeek: 3,
    };
    this.selectedPositions = [];
    this.selectedLocations = [];
    this.customPositionError = '';
    this.positionError = '';
    this.locationError = '';
    this.lastSavedMessage = 'Đã khôi phục thiết lập mặc định.';
  }

  private savePreferences(): void {
    const timestamp = new Date();
    const formatted = timestamp.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    this.lastSavedMessage = `Đã lưu thay đổi lúc ${formatted}.`;
  }

  onSubmit(form: NgForm): void {
    this.formSubmitted = true;
    let hasError = false;

    if (form.invalid) {
      hasError = true;
    }

    // Validate custom position: tối đa 5 vị trí, phân tách bằng dấu phẩy
    if (this.jobPreference.customPosition) {
      const parts = this.jobPreference.customPosition
        .split(',')
        .map(p => p.trim())
        .filter(p => !!p);
      if (parts.length > 5) {
        this.customPositionError = 'Chỉ được nhập tối đa 5 vị trí chuyên môn.';
        hasError = true;
      } else {
        this.customPositionError = '';
      }
    }

    // Validate vị trí chuyên môn chọn từ danh mục (multi-select)
    if (!this.selectedPositions.length) {
      this.positionError = 'Vui lòng chọn ít nhất một vị trí chuyên môn.';
      hasError = true;
    } else {
      this.positionError = '';
    }

    if (!this.selectedLocations.length) {
      this.locationError = 'Vui lòng chọn ít nhất một địa điểm làm việc.';
      hasError = true;
    } else {
      this.locationError = '';
    }

    if (hasError) {
      return;
    }

    // Gộp các lựa chọn vào jobPreference để gửi về backend nếu cần
    this.jobPreference.desiredPosition = this.selectedPositions.join(', ');
    this.jobPreference.mainLocation = this.selectedLocations.join(', ');

    this.savePreferences();
  }

  onJobSearchToggle(enabled: boolean): void {
    this.profileUser = { ...this.profileUser, jobSearchEnabled: enabled };
  }

  onRecruiterSearchToggle(enabled: boolean): void {
    this.profileUser = { ...this.profileUser, allowRecruiterSearch: enabled };
  }

  onUpgradeAccount(): void {
    this.router.navigate(['/candidate/upgrade-account/pay']);
  }
}


