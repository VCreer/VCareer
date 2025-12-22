import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { ProfileCardComponent } from '../../../../shared/components/profile-card/profile-card';
import { MultiSelectLocationComponent } from '../../../../shared/components/multi-select-location/multi-select-location';
import { JobOptionsService } from '../../../../shared/services/job-options.service';
import { SelectOption } from '../../../../shared/components/select-field/select-field';
import { AuthStateService } from '../../../../core/services/auth-Cookiebased/auth-state.service';
import { AuthFacadeService } from '../../../../core/services/auth-Cookiebased/auth-facade.service';
import { JobCategoryService } from '../../../../proxy/services/job/job-category.service';
import { GeoService } from '../../../../proxy/services/geo/geo.service';
import { ProfileService } from '../../../../proxy/profile/profile.service';
import type { CategoryTreeDto } from '../../../../proxy/dto/category/models';
import type { ProvinceDto } from '../../../../proxy/dto/geo-dto/models';
import type { UpdatePersonalInfoDto, ProfileDto } from '../../../../proxy/dto/profile/models';

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
export class JobSuggestionSettingsComponent implements OnInit {
  // Thông tin cá nhân đơn giản cho phần giới tính
  gender: 'male' | 'female' | 'unspecified' = 'male';
  formSubmitted = false;
  isSaving: boolean = false;
  currentProfile: ProfileDto | null = null;

  // Options cho dropdown
  positionOptions: SelectOption[] = [];
  skillOptions: SelectOption[] = [];
  experienceOptions: SelectOption[] = [];
  locationOptions: SelectOption[] = [];

  // Data từ API
  categoryTree: CategoryTreeDto[] = [];
  provinces: ProvinceDto[] = [];
  
  // Loading states
  isLoadingCategories: boolean = false;
  isLoadingLocations: boolean = false;
  categoriesLoaded: boolean = false;
  locationsLoaded: boolean = false;

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
    name: '',
    accountStatus: 'Tài khoản đã xác thực',
    jobSearchEnabled: false,
    allowRecruiterSearch: true,
  };
  isLoadingProfile: boolean = false;

  constructor(
    private router: Router,
    private jobOptionsService: JobOptionsService,
    private http: HttpClient,
    private authStateService: AuthStateService,
    private authFacadeService: AuthFacadeService,
    private jobCategoryService: JobCategoryService,
    private geoService: GeoService,
    private profileService: ProfileService
  ) {}

  ngOnInit(): void {
    this.loadExperienceOptions();
    // Load categories và locations trước, sau đó mới load profile để pre-fill form
    this.loadJobCategories();
    this.loadLocations();
    // Load profile ngay, nhưng sẽ pre-fill sau khi options đã load
    this.loadProfileData();

    // Đồng bộ trạng thái "Đang bật/tắt tìm việc" từ localStorage (FE-only)
    const savedJobSearch = localStorage.getItem('vcareer_job_search_enabled');
    if (savedJobSearch !== null) {
      this.profileUser.jobSearchEnabled = savedJobSearch === 'true';
    }
  }

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

    // Gọi API để cập nhật profile
    this.savePreferencesToApi();
  }

  /**
   * Lưu thông tin vào CandidateProfile qua API
   */
  private savePreferencesToApi(): void {
    this.isSaving = true;

    // Lấy tên vị trí từ selectedPositions
    const positionNames: string[] = [];
    this.selectedPositions.forEach(positionId => {
      const position = this.positionOptions.find(p => p.value === positionId);
      if (position) {
        positionNames.push(position.label);
      }
    });

    // Thêm custom positions nếu có
    if (this.jobPreference.customPosition) {
      const customPositions = this.jobPreference.customPosition
        .split(',')
        .map(p => p.trim())
        .filter(p => !!p);
      positionNames.push(...customPositions);
    }

    // Lấy tên kỹ năng từ skillsText (categoryId)
    let skillName = '';
    if (this.jobPreference.skillsText) {
      const skill = this.skillOptions.find(s => s.value === this.jobPreference.skillsText);
      if (skill) {
        skillName = skill.label;
      }
    }

    // Lấy tên địa điểm từ selectedLocations
    const locationNames: string[] = [];
    this.selectedLocations.forEach(locationCode => {
      const location = this.locationOptions.find(l => l.value === locationCode);
      if (location) {
        locationNames.push(location.label);
      }
    });

    // Convert gender
    let genderValue: boolean | undefined = undefined;
    if (this.gender === 'male') {
      genderValue = true;
    } else if (this.gender === 'female') {
      genderValue = false;
    }

    // Convert experience level từ string sang number
    // Form value = số năm, cần convert sang enum value để lưu vào DB
    let experienceValue: number | undefined = undefined;
    if (this.jobPreference.experienceLevel) {
      const formValue = parseInt(this.jobPreference.experienceLevel, 10);
      experienceValue = this.convertYearsToExperienceEnum(formValue);
    }

    // Build UpdatePersonalInfoDto
    const updateDto: UpdatePersonalInfoDto = {
      name: this.currentProfile?.name || this.profileUser.name.split(' ')[0] || '',
      surname: this.currentProfile?.surname || this.profileUser.name.split(' ').slice(1).join(' ') || '',
      email: this.currentProfile?.email,
      phoneNumber: this.currentProfile?.phoneNumber,
      gender: genderValue,
      jobTitle: positionNames.length > 0 ? positionNames.join(', ') : undefined,
      skills: skillName || undefined,
      experience: experienceValue,
      salary: this.jobPreference.salaryFrom > 0 ? this.jobPreference.salaryFrom : undefined,
      workLocation: locationNames.length > 0 ? locationNames.join(', ') : undefined,
      location: this.currentProfile?.location, // Giữ nguyên location hiện tại nếu có
    };

    // Gọi API
    this.profileService.updatePersonalInfo(updateDto).subscribe({
      next: () => {
        this.isSaving = false;
        this.savePreferences(); // Hiển thị thông báo thành công
        // Reload profile để cập nhật dữ liệu mới nhất
        this.loadProfileDataInternal();
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.isSaving = false;
        this.lastSavedMessage = 'Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại.';
        // Reset message sau 5 giây
        setTimeout(() => {
          this.lastSavedMessage = '';
        }, 5000);
      }
    });
  }

  onJobSearchToggle(enabled: boolean): void {
    // Cập nhật trạng thái tìm việc trực tiếp (không mở modal ở màn này)
    this.profileService.updateJobStatus(enabled).subscribe({
      next: () => {
        this.profileUser = { ...this.profileUser, jobSearchEnabled: enabled };
        localStorage.setItem('vcareer_job_search_enabled', String(enabled));
        this.lastSavedMessage = enabled
          ? 'Đã bật tìm việc thành công!'
          : 'Đã tắt tìm việc thành công';
      },
      error: () => {
        // Revert UI nếu lỗi
        this.profileUser = { ...this.profileUser, jobSearchEnabled: !enabled };
        this.lastSavedMessage = 'Không thể cập nhật trạng thái tìm việc. Vui lòng thử lại.';
      }
    });
  }

  onRecruiterSearchToggle(enabled: boolean): void {
    this.profileUser = { ...this.profileUser, allowRecruiterSearch: enabled };

    // Gọi API để update ProfileVisibility
    this.profileService.updateProfileVisibility(enabled).subscribe({
      next: () => {
        const message = enabled
          ? 'Đã bật cho phép NTD tìm kiếm hồ sơ'
          : 'Đã tắt cho phép NTD tìm kiếm hồ sơ';
        this.lastSavedMessage = message;
      },
      error: (error) => {
        console.error('Error updating profile visibility:', error);
        // Revert UI nếu lỗi
        this.profileUser = { ...this.profileUser, allowRecruiterSearch: !enabled };
        this.lastSavedMessage = 'Không thể cập nhật cài đặt. Vui lòng thử lại.';
      }
    });
  }

  onUpgradeAccount(): void {
    this.router.navigate(['/candidate/upgrade-account/pay']);
  }

  loadProfileData(): void {
    this.isLoadingProfile = true;
    
    // Với cookies, kiểm tra user từ AuthStateService
    if (!this.authStateService.user) {
      this.authFacadeService.loadCurrentUser().subscribe({
        next: (user) => {
          // Đã có user, tiếp tục load profile
          this.loadProfileDataInternal();
        },
        error: (err) => {
          // Không có cookies hợp lệ, không load profile
          this.isLoadingProfile = false;
        }
      });
      return;
    }

    // Đã có user, load profile
    this.loadProfileDataInternal();
  }

  private loadProfileDataInternal(): void {
    this.isLoadingProfile = true;
    
    this.profileService.getCurrentUserProfile().subscribe({
      next: (response: any) => {
        // Handle response structure
        const profile: ProfileDto = response?.result || response?.data || response;
        
        if (!profile) {
          this.profileUser = {
            name: '',
            accountStatus: 'Tài khoản đã xác thực',
            jobSearchEnabled: false,
            allowRecruiterSearch: true,
          };
          this.isLoadingProfile = false;
          return;
        }

        this.currentProfile = profile;

        const fullName = `${profile.name || ''} ${profile.surname || ''}`.trim() || 'User';
        this.profileUser = {
          name: fullName,
          accountStatus: 'Tài khoản đã xác thực',
          jobSearchEnabled: false,
          allowRecruiterSearch: profile.profileVisibility ?? true,
        };

        // Pre-fill form với dữ liệu từ profile
        this.loadFormDataFromProfile(profile);

        this.isLoadingProfile = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.profileUser = {
          name: '',
          accountStatus: 'Tài khoản đã xác thực',
          jobSearchEnabled: false,
          allowRecruiterSearch: true,
        };
        this.isLoadingProfile = false;
      }
    });
  }

  /**
   * Load dữ liệu từ profile để pre-fill form
   */
  private loadFormDataFromProfile(profile: ProfileDto): void {
    // Chỉ pre-fill nếu categories và locations đã load xong
    if (!this.categoriesLoaded || !this.locationsLoaded) {
      return;
    }

    // Gender
    if (profile.gender !== null && profile.gender !== undefined) {
      this.gender = profile.gender ? 'male' : 'female';
    }

    // JobTitle - có thể là từ jobTitle hoặc cần parse từ skills
    if (profile.jobTitle && this.positionOptions.length > 0) {
      // Nếu jobTitle có nhiều giá trị, split và set vào selectedPositions
      const jobTitles = profile.jobTitle.split(',').map(t => t.trim()).filter(t => !!t);
      // Tìm matching category IDs từ positionOptions
      jobTitles.forEach(title => {
        const matchingPosition = this.positionOptions.find(p => p.label === title);
        if (matchingPosition) {
          if (!this.selectedPositions.includes(matchingPosition.value)) {
            this.selectedPositions.push(matchingPosition.value);
          }
        } else {
          // Nếu không tìm thấy trong danh mục, thêm vào customPosition
          if (this.jobPreference.customPosition) {
            this.jobPreference.customPosition += ', ' + title;
          } else {
            this.jobPreference.customPosition = title;
          }
        }
      });
    }

    // Skills - cần đợi skillOptions được cập nhật sau khi selectedPositions đã set
    // Sẽ được xử lý sau khi updateSkillOptions được gọi

    // Experience
    // Profile.experience là enum value, cần convert ngược lại sang số năm để hiển thị trong form
    if (profile.experience !== null && profile.experience !== undefined) {
      const enumValue = profile.experience;
      // Convert enum value sang số năm (ngược lại với convertYearsToExperienceEnum)
      // Enum: None=0, Under1=1, Year1=2, Year2=3, Year3=4, Year4=5, Year5=6, Year6=7, Year7=8, Year8=9, Year9=10, Year10=11, Over10=12
      const reverseMapping: { [key: number]: number } = {
        0: 0,   // None = 0 -> 0 năm
        1: 1,   // Under1 = 1 -> 1 năm (dưới 1 năm)
        2: 2,   // Year1 = 2 -> 1 năm
        3: 3,   // Year2 = 3 -> 2 năm
        4: 4,   // Year3 = 4 -> 3 năm
        5: 5,   // Year4 = 5 -> 4 năm
        6: 6,   // Year5 = 6 -> 5 năm
        7: 7,   // Year6 = 7 -> 6 năm
        8: 8,   // Year7 = 8 -> 7 năm
        9: 9,   // Year8 = 9 -> 8 năm
        10: 10, // Year9 = 10 -> 9 năm
        11: 11, // Year10 = 11 -> 10 năm
        12: 12  // Over10 = 12 -> >10 năm
      };
      const formValue = reverseMapping[enumValue] ?? 0;
      this.jobPreference.experienceLevel = formValue.toString();
    }

    // Salary
    if (profile.salary !== null && profile.salary !== undefined) {
      this.jobPreference.salaryFrom = profile.salary;
    }

    // WorkLocation
    if (profile.workLocation && this.locationOptions.length > 0) {
      const locations = profile.workLocation.split(',').map(l => l.trim()).filter(l => !!l);
      // Tìm matching location codes từ locationOptions
      locations.forEach(location => {
        const matchingLocation = this.locationOptions.find(l => l.label === location);
        if (matchingLocation && !this.selectedLocations.includes(matchingLocation.value)) {
          this.selectedLocations.push(matchingLocation.value);
        }
      });
    }

    // Cập nhật skillOptions sau khi đã set selectedPositions
    if (this.selectedPositions.length > 0) {
      this.updateSkillOptions();
      
      // Sau khi skillOptions đã được cập nhật, set skills từ profile
      if (profile.skills && this.skillOptions.length > 0) {
        const skills = profile.skills.split(',').map(s => s.trim()).filter(s => !!s);
        skills.forEach(skill => {
          const matchingSkill = this.skillOptions.find(s => s.label === skill);
          if (matchingSkill) {
            this.jobPreference.skillsText = matchingSkill.value;
          }
        });
      }
    }
  }

  /**
   * Load JobCategory tree từ API
   * Parent categories sẽ là "Vị trí chuyên môn"
   * Children của parent sẽ là "Kỹ năng"
   */
  loadJobCategories(): void {
    this.isLoadingCategories = true;
    this.jobCategoryService.getCategoryTree().subscribe({
      next: (response: any) => {
        // Handle response structure
        const categories: CategoryTreeDto[] = response?.result || response?.data || response || [];
        this.categoryTree = categories;
        
        // Tạo positionOptions từ parent categories (categories không có parent)
        this.positionOptions = categories
          .filter(cat => cat.children && cat.children.length > 0) // Chỉ lấy categories có children
          .map(cat => ({
            value: cat.categoryId || '',
            label: cat.categoryName || ''
          }));

        // Cập nhật skillOptions khi có selectedPositions
        this.updateSkillOptions();
        
        this.isLoadingCategories = false;
        this.categoriesLoaded = true;
        
        // Nếu profile đã load, pre-fill lại form
        if (this.currentProfile) {
          this.loadFormDataFromProfile(this.currentProfile);
        }
      },
      error: (error) => {
        console.error('Error loading job categories:', error);
        this.isLoadingCategories = false;
        // Fallback to default options
        this.positionOptions = this.jobOptionsService.JOB_POSITION_OPTIONS;
      }
    });
  }

  /**
   * Cập nhật skillOptions dựa trên selectedPositions
   * Lấy tất cả children của các position đã chọn
   */
  updateSkillOptions(): void {
    if (!this.selectedPositions.length || !this.categoryTree.length) {
      this.skillOptions = [];
      return;
    }

    const allSkills: SelectOption[] = [];
    
    // Duyệt qua các position đã chọn
    this.selectedPositions.forEach(positionId => {
      // Tìm category trong tree
      const findCategory = (categories: CategoryTreeDto[]): CategoryTreeDto | null => {
        for (const cat of categories) {
          if (cat.categoryId === positionId) {
            return cat;
          }
          if (cat.children && cat.children.length > 0) {
            const found = findCategory(cat.children);
            if (found) return found;
          }
        }
        return null;
      };

      const category = findCategory(this.categoryTree);
      if (category && category.children && category.children.length > 0) {
        // Thêm tất cả children vào skillOptions
        category.children.forEach(child => {
          // Tránh duplicate
          if (!allSkills.find(s => s.value === child.categoryId)) {
            allSkills.push({
              value: child.categoryId || '',
              label: child.categoryName || ''
            });
          }
        });
      }
    });

    this.skillOptions = allSkills;
  }

  /**
   * Load địa điểm từ GeoService
   */
  loadLocations(): void {
    this.isLoadingLocations = true;
    this.geoService.getProvinces().subscribe({
      next: (response: any) => {
        // Handle response structure
        const provinces: ProvinceDto[] = response?.result || response?.data || response || [];
        this.provinces = provinces;
        
        // Tạo locationOptions từ provinces
        this.locationOptions = provinces.map(province => ({
          value: province.code?.toString() || '',
          label: province.name || ''
        }));
        
        this.isLoadingLocations = false;
        this.locationsLoaded = true;
        
        // Nếu profile đã load, pre-fill lại form
        if (this.currentProfile) {
          this.loadFormDataFromProfile(this.currentProfile);
        }
      },
      error: (error) => {
        console.error('Error loading locations:', error);
        this.isLoadingLocations = false;
        // Fallback to default options
        this.locationOptions = this.jobOptionsService.PROVINCE_OPTIONS;
      }
    });
  }

  /**
   * Tạo options cho kinh nghiệm từ ExperienceLevel enum
   * Mapping: value = số năm tương ứng (để dễ hiểu), sau đó convert sang enum khi save
   * Note: Enum ExperienceLevel: None=0, Under1=1, Year1=2, Year2=3, Year3=4, Year4=5, Year5=6, Year6=7, Year7=8, Year8=9, Year9=10, Year10=11, Over10=12
   * 
   * User muốn: chọn "6 năm" -> lưu 6 vào DB (không phải 7)
   * Vậy cần mapping: value = số năm, sau đó convert sang enum khi save
   */
  loadExperienceOptions(): void {
    // ✅ FIX: value = số năm tương ứng (để user chọn "6 năm" thì value = '6')
    // Khi save sẽ convert sang enum value (6 -> enum 7 = Year6)
    // Note: Enum ExperienceLevel: None=0, Under1=1, Year1=2, Year2=3, Year3=4, Year4=5, Year5=6, Year6=7, Year7=8, Year8=9, Year9=10, Year10=11, Over10=12
    this.experienceOptions = [
      { value: '0', label: 'Không yêu cầu kinh nghiệm' },  // 0 năm -> enum 0 (None)
      { value: '1', label: 'Dưới 1 năm' },                 // 1 năm (dưới) -> enum 1 (Under1)
      { value: '2', label: '1 năm' },                      // 1 năm -> enum 2 (Year1)
      { value: '3', label: '2 năm' },                      // 2 năm -> enum 3 (Year2)
      { value: '4', label: '3 năm' },                      // 3 năm -> enum 4 (Year3)
      { value: '5', label: '4 năm' },                      // 4 năm -> enum 5 (Year4)
      { value: '6', label: '5 năm' },                      // 5 năm -> enum 6 (Year5)
      { value: '7', label: '6 năm' },                      // 6 năm -> enum 7 (Year6)
      { value: '8', label: '7 năm' },                      // 7 năm -> enum 8 (Year7)
      { value: '9', label: '8 năm' },                      // 8 năm -> enum 9 (Year8)
      { value: '10', label: '9 năm' },                     // 9 năm -> enum 10 (Year9)
      { value: '11', label: '10 năm' },                    // 10 năm -> enum 11 (Year10)
      { value: '12', label: 'Trên 10 năm' }                // >10 năm -> enum 12 (Over10)
    ];
  }

  /**
   * Convert số năm (từ form value) sang ExperienceLevel enum value
   * Form value = số năm hiển thị, cần convert sang enum value để lưu vào DB
   * Mapping: 
   *   0 năm -> 0 (None)
   *   1 năm -> 1 (Under1) hoặc 2 (Year1) - dùng 1 cho "Dưới 1 năm", 2 cho "1 năm"
   *   2 năm -> 3 (Year2)
   *   3 năm -> 4 (Year3)
   *   4 năm -> 5 (Year4)
   *   5 năm -> 6 (Year5)
   *   6 năm -> 7 (Year6)
   *   7 năm -> 8 (Year7)
   *   8 năm -> 9 (Year8)
   *   9 năm -> 10 (Year9)
   *   10 năm -> 11 (Year10)
   *   >10 năm -> 12 (Over10)
   */
  private convertYearsToExperienceEnum(formValue: number): number {
    // Mapping từ số năm (form value) sang enum value
    // formValue = số năm hiển thị trong form (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12)
    // enum value = ExperienceLevel enum (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12)
    // Enum: None=0, Under1=1, Year1=2, Year2=3, Year3=4, Year4=5, Year5=6, Year6=7, Year7=8, Year8=9, Year9=10, Year10=11, Over10=12
    const mapping: { [key: number]: number } = {
      0: 0,   // 0 năm -> None = 0
      1: 1,   // 1 năm (dưới 1 năm) -> Under1 = 1
      2: 2,   // 1 năm -> Year1 = 2
      3: 3,   // 2 năm -> Year2 = 3
      4: 4,   // 3 năm -> Year3 = 4
      5: 5,   // 4 năm -> Year4 = 5
      6: 6,   // 5 năm -> Year5 = 6
      7: 7,   // 6 năm -> Year6 = 7
      8: 8,   // 7 năm -> Year7 = 8
      9: 9,   // 8 năm -> Year8 = 9
      10: 10, // 9 năm -> Year9 = 10
      11: 11, // 10 năm -> Year10 = 11
      12: 12  // >10 năm -> Over10 = 12
    };
    
    if (formValue >= 0 && formValue <= 12) {
      return mapping[formValue] ?? 0;
    }
    return 0; // Default
  }

  /**
   * Handler khi selectedPositions thay đổi
   * Cập nhật lại skillOptions
   */
  onPositionsChange(positions: string[]): void {
    this.selectedPositions = positions;
    this.updateSkillOptions();
  }
}


