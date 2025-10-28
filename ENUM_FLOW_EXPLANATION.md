# 📚 ENUM FLOW - Giải thích chi tiết

## 🎯 Tổng quan

**Enums** được dùng để định nghĩa các giá trị cố định (constants) cho các filter như:
- Hình thức làm việc (EmploymentType)
- Kinh nghiệm (ExperienceLevel)
- Cấp bậc (PositionType)
- Mức lương (SalaryFilterType)

---

## 1️⃣ BACKEND ENUMS (C# - .NET)

### File: `src/VCareer.Domain.Shared/Model/Job.cs`

```csharp
public enum ExperienceLevel
{
    None = 0,           // Không yêu cầu
    Under1 = 1,         // Dưới 1 năm
    Year1 = 2,          // 1 năm
    Year2 = 3,          // 2 năm
    Year3 = 4,          // 3 năm
    Year4 = 5,          // 4 năm
    Year5 = 6,          // 5 năm
    Year6 = 7,          // 6 năm
    Year7 = 8,          // 7 năm
    Year8 = 9,          // 8 năm
    Year9 = 10,         // 9 năm
    Year10 = 11,        // 10 năm
    Over10 = 12         // Trên 10 năm
}

public enum EmploymentType
{
    PartTime = 1,       // Bán thời gian
    FullTime = 2,       // Toàn thời gian
    Internship = 3,     // Thực tập
    Contract = 4,       // Hợp đồng
    Freelance = 5,      // Freelance
    Other = 6           // Khác
}

public enum PositionType
{
    Employee = 1,       // Nhân viên
    TeamLead = 2,       // Trưởng nhóm
    Manager = 3,        // Quản lý
    // ... (12 values total)
}

public enum SalaryFilterType
{
    All = 0,
    Under10 = 1,        // Dưới 10 triệu
    Range10To15 = 2,    // 10-15 triệu
    Range15To20 = 3,    // 15-20 triệu
    Range20To30 = 4,    // 20-30 triệu
    Range30To50 = 5,    // 30-50 triệu
    Over50 = 6,         // Trên 50 triệu
    Deal = 7            // Thỏa thuận
}
```

---

## 2️⃣ FRONTEND ENUMS (TypeScript - Angular)

### File: `angular/src/app/proxy/api/job.service.ts`

**✅ Copy chính xác từ backend:**

```typescript
export enum ExperienceLevel {
  None = 0,
  Under1 = 1,
  Year1 = 2,
  Year2 = 3,
  Year3 = 4,
  Year4 = 5,
  Year5 = 6,
  Year6 = 7,
  Year7 = 8,
  Year8 = 9,
  Year9 = 10,
  Year10 = 11,
  Over10 = 12
}

export enum EmploymentType {
  PartTime = 1,
  FullTime = 2,
  Internship = 3,
  Contract = 4,
  Freelance = 5,
  Other = 6
}

// ... tương tự cho PositionType, SalaryFilterType
```

---

## 3️⃣ DISPLAY TRONG UI - JobFilterComponent

### File: `angular/src/app/shared/components/job-filter/job-filter.ts`

**✅ Tạo interface để map enum value → label tiếng Việt:**

```typescript
interface FilterOption {
  value: number | null;  // Enum value (hoặc null cho "Tất cả")
  label: string;         // Text hiển thị trên UI
  checked: boolean;      // Radio button state
}

// Map ExperienceLevel → FilterOption[]
experienceLevels: FilterOption[] = [
  { value: null, label: 'Tất cả', checked: true },
  { value: ExperienceLevel.None, label: 'Không yêu cầu', checked: false },
  { value: ExperienceLevel.Under1, label: 'Dưới 1 năm', checked: false },
  { value: ExperienceLevel.Year1, label: '1 năm', checked: false },
  { value: ExperienceLevel.Year2, label: '2 năm', checked: false },
  // ...
  { value: ExperienceLevel.Over10, label: 'Trên 10 năm', checked: false }
];
```

**✅ HTML Template render radio buttons:**

```html
<div class="filter-section">
  <h4>Kinh nghiệm:</h4>
  <div class="radio-list">
    <label *ngFor="let option of experienceLevels" class="radio-item">
      <input 
        type="radio"
        name="experience"
        [value]="option.value"
        [checked]="option.checked"
        (change)="onExperienceChange(option)">
      <span>{{ option.label }}</span>
    </label>
  </div>
</div>
```

**Kết quả UI:**
```
○ Tất cả
○ Không yêu cầu
○ Dưới 1 năm
● 2 năm              ← User chọn (checked: true)
○ 3 năm
...
```

---

## 4️⃣ USER CHỌN FILTER → EMIT EVENT

### File: `job-filter.ts`

```typescript
onExperienceChange(option: FilterOption) {
  // Uncheck tất cả (radio button logic)
  this.experienceLevels.forEach(o => o.checked = false);
  
  // Check option được chọn
  option.checked = true;
  
  // Emit event
  this.emitFilterChange();
}

private emitFilterChange() {
  const selectedExperience = this.experienceLevels.find(o => o.checked);

  const filters = {
    experienceLevel: selectedExperience && selectedExperience.value !== null 
      ? selectedExperience.value   // ← GỬI ENUM VALUE (VD: 3 = Year2)
      : null                        // ← "Tất cả" → null
  };
  
  console.log('🔧 JobFilter emitting:', filters);
  this.filterChange.emit(filters);  // ← Gửi lên JobComponent
}
```

**Console output khi user chọn "2 năm":**
```
🔧 JobFilter emitting: {
  experienceLevel: 3,        ← ExperienceLevel.Year2 = 3
  employmentTypes: [],
  positionTypes: [],
  salaryFilter: null
}
```

---

## 5️⃣ JOBCOMPONENT NHẬN EVENT → CALL API

### File: `job.ts`

```typescript
onFilterChange(filters: any) {
  console.log('🔧 LEFT-SIDE FILTER CHANGED');
  console.log('   📊 Experience Level:', filters.experienceLevel, '(2 năm)');
  
  // Lưu vào component state
  this.selectedExperienceLevel = filters.experienceLevel;  // = 3
  
  // Gọi API
  this.performJobSearch();
}

performJobSearch() {
  const searchInput: JobSearchInputDto = {
    keyword: this.searchKeyword,
    categoryIds: this.selectedCategoryIds,
    experienceFilter: this.selectedExperienceLevel,  // ← GỬI 3 LÊN BACKEND
    // ...
  };
  
  console.log('📤 REQUEST PAYLOAD:');
  console.log(JSON.stringify(searchInput, null, 2));
  
  // POST /api/jobs/search
  this.jobApi.searchJobs(searchInput).subscribe(...);
}
```

**Console output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 PERFORMING JOB SEARCH - START
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 CURRENT FILTERS:
   🔤 Keyword: (none)
   📂 Category IDs: []
   📍 Province IDs: []
   🏘️  District IDs: []
   💼 Employment Types: []
   📊 Experience Level: 3               ← Enum value
   💰 Salary Filter: null
   🎯 Position Types: []

📤 REQUEST PAYLOAD (JobSearchInputDto):
{
  "experienceFilter": 3,                ← Gửi lên backend
  "sortBy": "relevance",
  "skipCount": 0,
  "maxResultCount": 20
}

🌐 API ENDPOINT: POST /api/jobs/search
🔗 Full URL: http://localhost:44336/api/jobs/search
```

---

## 6️⃣ BACKEND NHẬN REQUEST → XỬ LÝ

### File: `JobPostingController.cs`

```csharp
[HttpPost("search")]
public async Task<PagedResultDto<JobViewDto>> SearchJobsAsync(
    [FromBody] JobSearchInputDto input)
{
    // input.ExperienceFilter = 3  (ExperienceLevel.Year2)
    
    var result = await _jobPostingService.SearchJobsAsync(input);
    return result;
}
```

### File: `JobPostingAppService.cs`

```csharp
public async Task<PagedResultDto<JobViewDto>> SearchJobsAsync(
    JobSearchInputDto input)
{
    // Filter jobs based on experienceFilter
    if (input.ExperienceFilter.HasValue)
    {
        var experienceValue = (int)input.ExperienceFilter.Value;  // = 3
        
        // Lucene search với filter experience = 3
        // ...
    }
    
    return new PagedResultDto<JobViewDto>
    {
        TotalCount = totalCount,
        Items = jobs
    };
}
```

---

## 7️⃣ RESPONSE TRẢ VỀ → DISPLAY UI

### Console output:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ SEARCH SUCCESS - RESPONSE RECEIVED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📥 RESPONSE DATA:
   📊 Total Count: 5
   📦 Items Returned: 5

📄 JOB ITEMS:
   1. Backend Developer - 15-20 triệu
      Category: Công nghệ thông tin
      Location: Hà Nội
      Experience: 2 năm kinh nghiệm      ← MATCH!
      Posted: 2025-10-20
      Urgent: No
   
   2. Frontend Developer - 12-18 triệu
      Category: Công nghệ thông tin
      Location: Hồ Chí Minh
      Experience: 2 năm kinh nghiệm      ← MATCH!
      Posted: 2025-10-19
      Urgent: 🔥 YES

✅ UI Updated with results!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🎯 TÓM TẮT FLOW

```
1. User chọn radio button "2 năm"
   ↓
2. JobFilterComponent: option.value = ExperienceLevel.Year2 = 3
   ↓
3. Emit event: filterChange({ experienceLevel: 3 })
   ↓
4. JobComponent nhận event: selectedExperienceLevel = 3
   ↓
5. Build DTO: { experienceFilter: 3 }
   ↓
6. POST /api/jobs/search với payload
   ↓
7. Backend filter jobs có experience = 3
   ↓
8. Return kết quả
   ↓
9. Display jobs trong UI
```

---

## 🔍 DEBUG - Cách xem Console Log

### Mở Browser DevTools:
1. **Chrome/Edge:** Press `F12` hoặc `Ctrl+Shift+I`
2. Click tab **Console**

### Khi nhấn nút Tìm kiếm ở trang Job, bạn sẽ thấy:

```
┌─────────────────────────────────────────┐
│ 🔧 LEFT-SIDE FILTER CHANGED           │
└─────────────────────────────────────────┘
📦 Received filters: {...}
   💼 Employment Types: []
   📊 Experience Level: 3 (2 năm)
   💰 Salary Filter: null
   🎯 Position Types: []
✅ Filters updated! Triggering search...


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 PERFORMING JOB SEARCH - START
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 CURRENT FILTERS:
   ...

📤 REQUEST PAYLOAD (JobSearchInputDto):
{
  "experienceFilter": 3,
  "sortBy": "relevance",
  ...
}

🌐 API ENDPOINT: POST /api/jobs/search
🔗 Full URL: http://localhost:44336/api/jobs/search
```

---

## ✅ CHECKLIST

- [ ] Backend enums đã defined (`Job.cs`)
- [ ] Frontend enums copy chính xác (`job.service.ts`)
- [ ] JobFilterComponent map enum → FilterOption[] (`job-filter.ts`)
- [ ] HTML template render radio buttons (`job-filter.html`)
- [ ] Event handler emit enum value (`emitFilterChange()`)
- [ ] JobComponent nhận event (`onFilterChange()`)
- [ ] Build JobSearchInputDto với enum value (`performJobSearch()`)
- [ ] Call API POST `/api/jobs/search`
- [ ] Backend filter dựa trên enum value
- [ ] Response trả về và display UI

---

**🎉 DONE! Enum flow hoạt động end-to-end!**


