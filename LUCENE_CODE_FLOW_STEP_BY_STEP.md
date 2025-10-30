# 🔄 LUCENE - LUỒNG CODE CHI TIẾT (Step by Step)

## 🎯 VÍ DỤ: User search "backend php" với filter "2 năm kinh nghiệm"

---

## 📥 REQUEST TỪ FRONTEND

```http
POST https://localhost:5001/api/jobs/search
Content-Type: application/json

{
    "keyword": "backend php",
    "experienceFilter": 3,  // ExperienceLevel.Year2
    "salaryFilter": null,
    "categoryIds": null,
    "provinceIds": null,
    "districtIds": null,
    "positionTypes": null,
    "employmentTypes": null,
    "isUrgent": null,
    "sortBy": "relevance",
    "skipCount": 0,
    "maxResultCount": 20
}
```

---

## 🔁 LUỒNG XỬ LÝ

### ⚡ **STEP 1: Controller nhận request**

📂 **File:** `src/VCareer.HttpApi/Controllers/Job/JobPostingController.cs`

```csharp
[HttpPost("search")]
public async Task<PagedResultDto<JobViewDto>> SearchJobsAsync(
    [FromBody] JobSearchInputDto input)
{
    // ✅ INPUT ĐÃ ĐƯỢC BIND TỰ ĐỘNG:
    // input.Keyword = "backend php"
    // input.ExperienceFilter = ExperienceLevel.Year2 (value = 3)
    // input.MaxResultCount = 20
    
    // Gọi AppService
    return await _jobPostingAppService.SearchJobsAsync(input);
}
```

---

### 🎯 **STEP 2: AppService điều phối**

📂 **File:** `src/VCareer.Application/Job/JobPosting/Services/JobPostingAppService.cs`

```csharp
public async Task<PagedResultDto<JobViewDto>> SearchJobsAsync(JobSearchInputDto input)
{
    // ========================================
    // 2.1. GỌI LUCENE ĐỂ SEARCH
    // ========================================
    var (jobIds, totalCount) = await _luceneJobIndexer.SearchAsync(
        keyword: input.Keyword,              // "backend php"
        categoryIds: input.CategoryIds,      // null
        provinceIds: input.ProvinceIds,      // null
        districtIds: input.DistrictIds,      // null
        salaryFilter: input.SalaryFilter,    // null
        experienceFilter: input.ExperienceFilter,  // Year2 (3)
        positionTypes: input.PositionTypes,  // null
        employmentTypes: input.EmploymentTypes, // null
        isUrgent: input.IsUrgent,           // null
        sortBy: input.SortBy,               // "relevance"
        skipCount: input.SkipCount,         // 0
        maxResultCount: input.MaxResultCount // 20
    );
    
    // ✅ LUCENE TRẢ VỀ:
    // jobIds = [guid1, guid2, guid3, ...]  (ĐÃ SORT THEO RELEVANCE)
    // totalCount = 15
    
    // ========================================
    // 2.2. LOAD JOBS TỪ DATABASE
    // ========================================
    if (!jobIds.Any())
    {
        return new PagedResultDto<JobViewDto>(0, new List<JobViewDto>());
    }
    
    var jobs = await _jobPostingRepository.GetByIdsAsync(
        ids: jobIds,              // [guid1, guid2, ...]
        includeDetails: true      // Load JobCategory, Province, District
    );
    
    // ✅ REPOSITORY TRẢ VỀ:
    // jobs = List<Job_Posting> (GIỮ NGUYÊN thứ tự từ Lucene)
    
    // ========================================
    // 2.3. MAP SANG DTO
    // ========================================
    var dtos = jobs.Select(job => MapToJobViewDto(job)).ToList();
    
    // ✅ DTOs:
    // [
    //   { Id, Title, SalaryText, ExperienceText, ... },
    //   { Id, Title, SalaryText, ExperienceText, ... },
    //   ...
    // ]
    
    return new PagedResultDto<JobViewDto>(totalCount, dtos);
}
```

---

### 🔍 **STEP 3: LuceneJobIndexer.SearchAsync()**

📂 **File:** `src/VCareer.Application/Job/Search/LuceneJobIndexer.cs`

```csharp
public async Task<(List<Guid> jobIds, long totalCount)> SearchAsync(
    string? keyword = null,
    List<Guid>? categoryIds = null,
    List<int>? provinceIds = null,
    List<int>? districtIds = null,
    SalaryFilterType? salaryFilter = null,
    ExperienceLevel? experienceFilter = null,  // ← Year2 (3)
    List<PositionType>? positionTypes = null,
    List<EmploymentType>? employmentTypes = null,
    bool? isUrgent = null,
    string sortBy = "relevance",
    int skipCount = 0,
    int maxResultCount = 20)
{
    // ========================================
    // 3.1. MỞ INDEX READER
    // ========================================
    using var reader = DirectoryReader.Open(_directory);
    var searcher = new IndexSearcher(reader);
    
    // ========================================
    // 3.2. BUILD QUERY
    // ========================================
    var searchQuery = BuildSearchQuery(new JobSearchInputDto
    {
        Keyword = keyword,              // "backend php"
        ExperienceFilter = experienceFilter,  // Year2 (3)
        // ... other params
    });
    
    // ✅ searchQuery sẽ là:
    // BooleanQuery {
    //     MUST: (Title:backend OR Description:backend OR ...)
    //           AND (Title:php OR Description:php OR ...)
    //     MUST: Experience:"3"
    // }
    
    // ========================================
    // 3.3. BUILD SORT
    // ========================================
    var sort = BuildSortOrder(sortBy);  // sortBy = "relevance"
    
    // ✅ sort = Sort.RELEVANCE (default Lucene score)
    
    // ========================================
    // 3.4. EXECUTE SEARCH
    // ========================================
    var maxResults = skipCount + maxResultCount;  // 0 + 20 = 20
    var hits = searcher.Search(searchQuery, maxResults, sort);
    
    // ✅ hits.ScoreDocs:
    // [
    //   { Doc: 5, Score: 2.5 },   ← Job có CẢ "backend" và "php" trong Title
    //   { Doc: 12, Score: 1.8 },  ← Job có "backend" trong Description
    //   { Doc: 3, Score: 1.2 },   ← Job có "php" trong Requirements
    //   ...
    // ]
    
    // ========================================
    // 3.5. EXTRACT JOB IDs
    // ========================================
    var jobIds = new List<Guid>();
    for (int i = skipCount; i < hits.ScoreDocs.Length; i++)
    {
        var doc = searcher.Doc(hits.ScoreDocs[i].Doc);
        var jobId = Guid.Parse(doc.Get("JobId"));
        jobIds.Add(jobId);
    }
    
    // ✅ jobIds:
    // [guid1, guid2, guid3, ...] (ĐÃ SORT THEO SCORE)
    
    return (jobIds, hits.TotalHits);
}
```

---

### 🏗️ **STEP 3.2 (Chi tiết): BuildSearchQuery()**

📂 **File:** `src/VCareer.Application/Job/Search/LuceneJobIndexer.cs`

```csharp
private Query BuildSearchQuery(JobSearchInputDto input)
{
    var boolQuery = new BooleanQuery();
    
    // ========================================
    // A. KEYWORD SEARCH
    // ========================================
    if (!string.IsNullOrWhiteSpace(input.Keyword))
    {
        // keyword = "backend php"
        var keywordQuery = BuildKeywordQuery(input.Keyword);
        
        // ✅ keywordQuery:
        // BooleanQuery {
        //     SHOULD: Title:backend
        //     SHOULD: Title:php
        //     SHOULD: Description:backend
        //     SHOULD: Description:php
        //     SHOULD: Requirements:backend
        //     SHOULD: Requirements:php
        //     ...
        // }
        
        boolQuery.Add(keywordQuery, Occur.MUST);
    }
    
    // ========================================
    // B. EXPERIENCE FILTER
    // ========================================
    AddExperienceFilter(boolQuery, input.ExperienceFilter);
    
    // ✅ Thêm vào boolQuery:
    // MUST: Experience:"3"
    
    // ========================================
    // C. OTHER FILTERS (category, location, salary...)
    // ========================================
    AddCategoryFilter(boolQuery, input.CategoryIds);      // null → skip
    AddLocationFilter(boolQuery, input.ProvinceIds, input.DistrictIds); // null → skip
    AddSalaryFilter(boolQuery, input.SalaryFilter);       // null → skip
    // ...
    
    // ========================================
    // FINAL QUERY
    // ========================================
    // BooleanQuery {
    //     MUST: (keyword search)
    //     MUST: Experience:"3"
    // }
    
    return boolQuery;
}
```

---

### 🔤 **STEP 3.2.A (Chi tiết): BuildKeywordQuery()**

```csharp
private Query BuildKeywordQuery(string keyword)
{
    // keyword = "backend php"
    
    try
    {
        var parser = new MultiFieldQueryParser(
            AppLuceneVersion,
            new[] {
                "Title",
                "Description",
                "Requirements",
                "Benefits",
                "WorkLocation",
                "SalaryText",
                "ExperienceText"
            },
            _analyzer  // StandardAnalyzer (KHÔNG có stop words)
        );
        
        parser.DefaultOperator = Operator.OR;  // Tìm "backend" OR "php"
        
        // Parse "backend php"
        var query = parser.Parse(EscapeSpecialCharacters(keyword));
        
        // ✅ Query được build:
        // (Title:backend OR Title:php)
        // OR (Description:backend OR Description:php)
        // OR (Requirements:backend OR Requirements:php)
        // OR (Benefits:backend OR Benefits:php)
        // OR (WorkLocation:backend OR WorkLocation:php)
        // OR (SalaryText:backend OR SalaryText:php)
        // OR (ExperienceText:backend OR ExperienceText:php)
        
        return query;
    }
    catch (ParseException)
    {
        // Fallback: Wildcard search
        return new WildcardQuery(new Term("Title", $"*{keyword.ToLower()}*"));
    }
}
```

**❓ Tại sao dùng OR?**
- User search "backend php"
- Lucene tìm jobs có **ít nhất 1 trong 2 từ**
- Job có CẢ 2 từ → **Score cao hơn** → Lên đầu

---

### 🎯 **STEP 3.2.B (Chi tiết): AddExperienceFilter()**

```csharp
private void AddExperienceFilter(BooleanQuery boolQuery, ExperienceLevel? experienceFilter)
{
    if (!experienceFilter.HasValue)
        return;  // Không có filter → skip
    
    // experienceFilter = ExperienceLevel.Year2 (value = 3)
    
    // Match EXACT với enum value
    var termQuery = new TermQuery(new Term("Experience", "3"));
    
    // ✅ TermQuery tìm trong Inverted Index:
    // Inverted Index - Experience (StringField):
    //   "0" → [Doc1, Doc2]
    //   "1" → [Doc5]
    //   "2" → [Doc7, Doc8]
    //   "3" → [Doc10, Doc15, Doc20]  ← MATCH!
    //   "4" → [Doc25]
    
    boolQuery.Add(termQuery, Occur.MUST);  // MUST = Bắt buộc phải match
}
```

**❗ Quan trọng:**
- `StringField("Experience", "3")` → Lưu **NGUYÊN KHỐI** "3"
- `TermQuery(new Term("Experience", "3"))` → Tìm **CHÍNH XÁC** "3"
- Không bị nhầm với "13", "30", "103"...

---

### 🔎 **STEP 3.4 (Chi tiết): searcher.Search()**

```csharp
var hits = searcher.Search(searchQuery, maxResults, sort);
```

**Lucene thực hiện:**

#### **A. Tìm documents match query:**

```
Query: 
  MUST: (Title:backend OR Description:backend OR ...) 
        AND (Title:php OR Description:php OR ...)
  MUST: Experience:"3"

↓ Tìm trong Inverted Index

Step 1: Tìm "backend"
  Title:backend → [Doc5, Doc12, Doc20, Doc33]
  Description:backend → [Doc5, Doc8, Doc15]
  → Merged: [Doc5, Doc8, Doc12, Doc15, Doc20, Doc33]

Step 2: Tìm "php"
  Title:php → [Doc5, Doc10, Doc20]
  Description:php → [Doc3, Doc5, Doc12]
  → Merged: [Doc3, Doc5, Doc10, Doc12, Doc20]

Step 3: Combine (OR)
  → [Doc3, Doc5, Doc8, Doc10, Doc12, Doc15, Doc20, Doc33]

Step 4: Filter Experience:"3"
  Experience:"3" → [Doc5, Doc10, Doc15, Doc20, Doc30]
  
Step 5: Intersect (MUST)
  [Doc3, Doc5, Doc8, Doc10, Doc12, Doc15, Doc20, Doc33]
  ∩
  [Doc5, Doc10, Doc15, Doc20, Doc30]
  
  → FINAL: [Doc5, Doc10, Doc15, Doc20]
```

#### **B. Tính Score (Relevance):**

```
Doc5:
  - Có "backend" trong Title (boost 3.0) → +3.0
  - Có "php" trong Title (boost 3.0) → +3.0
  - Có "backend" trong Description (boost 1.5) → +1.5
  - Có "php" trong Description (boost 1.5) → +1.5
  → Score = 9.0

Doc10:
  - Có "backend" trong Description (boost 1.5) → +1.5
  - Có "php" trong Requirements (boost 1.0) → +1.0
  → Score = 2.5

Doc15:
  - Có "php" trong Title (boost 3.0) → +3.0
  → Score = 3.0

Doc20:
  - Có "backend" trong Requirements (boost 1.0) → +1.0
  - Có "php" trong Benefits (boost 1.0) → +1.0
  → Score = 2.0
```

#### **C. Sort theo Score:**

```
Sorted Results:
  1. Doc5  (Score: 9.0)
  2. Doc15 (Score: 3.0)
  3. Doc10 (Score: 2.5)
  4. Doc20 (Score: 2.0)
```

---

### 🗂️ **STEP 4: Repository.GetByIdsAsync()**

📂 **File:** `src/VCareer.EntityFrameworkCore/Repositories/Job/JobPostingRepository.cs`

```csharp
public async Task<List<Job_Posting>> GetByIdsAsync(List<Guid> ids, bool includeDetails = true)
{
    // ids = [guid_Doc5, guid_Doc15, guid_Doc10, guid_Doc20]
    
    var dbContext = await GetDbContextAsync();
    
    var query = dbContext.JobPostings
        .Where(j => ids.Contains(j.Id));  // Lọc theo IDs
    
    if (includeDetails)
    {
        query = query
            .Include(j => j.JobCategory)
            .Include(j => j.Province)
            .Include(j => j.District);
    }
    
    var jobs = await query.ToListAsync();
    
    // ✅ jobs:
    // [
    //   Job { Id = guid_Doc15, ... },  ← KHÔNG đúng thứ tự!
    //   Job { Id = guid_Doc5, ... },
    //   Job { Id = guid_Doc20, ... },
    //   Job { Id = guid_Doc10, ... }
    // ]
    
    // ========================================
    // GIỮ NGUYÊN THỨ TỰ TỪ LUCENE (quan trọng!)
    // ========================================
    var orderedJobs = ids
        .Select(id => jobs.First(j => j.Id == id))
        .ToList();
    
    // ✅ orderedJobs:
    // [
    //   Job { Id = guid_Doc5, ... },   ← Score: 9.0 (cao nhất)
    //   Job { Id = guid_Doc15, ... },  ← Score: 3.0
    //   Job { Id = guid_Doc10, ... },  ← Score: 2.5
    //   Job { Id = guid_Doc20, ... }   ← Score: 2.0
    // ]
    
    return orderedJobs;
}
```

**❗ Quan trọng:**
- EF Core `ToListAsync()` KHÔNG giữ thứ tự `ids`
- Phải **manually sort** theo thứ tự của `ids` (từ Lucene)

---

### 📦 **STEP 5: Map sang DTO**

📂 **File:** `src/VCareer.Application/Job/JobPosting/Services/JobPostingAppService.cs`

```csharp
private JobViewDto MapToJobViewDto(Job_Posting job)
{
    return new JobViewDto
    {
        Id = job.Id,
        Title = job.Title,
        SalaryText = job.SalaryText,        // "Lương từ 15 đến 25 triệu"
        ExperienceText = job.ExperienceText, // "2 năm kinh nghiệm"
        CategoryName = job.JobCategory?.Name,
        ProvinceName = job.Province?.Name,
        DistrictName = job.District?.Name,
        WorkLocation = job.WorkLocation,
        EmploymentType = job.EmploymentType,
        PositionType = job.PositionType,
        IsUrgent = job.IsUrgent,
        PostedAt = job.PostedAt,
        ExpiresAt = job.ExpiresAt.Value
    };
}
```

---

### 📤 **STEP 6: Response về Frontend**

```json
{
    "totalCount": 4,
    "items": [
        {
            "id": "guid_Doc5",
            "title": "Tuyển Backend Developer PHP Laravel",
            "salaryText": "Lương từ 15 đến 25 triệu",
            "experienceText": "2 năm kinh nghiệm",
            "categoryName": "Công nghệ thông tin",
            "provinceName": "Hà Nội",
            "workLocation": "Cầu Giấy, Hà Nội",
            "isUrgent": true
        },
        {
            "id": "guid_Doc15",
            "title": "PHP Developer (Laravel, Symfony)",
            "salaryText": "Lương từ 12 đến 20 triệu",
            "experienceText": "2 năm kinh nghiệm",
            // ...
        },
        {
            "id": "guid_Doc10",
            "title": "Senior Developer - Java/PHP",
            "salaryText": "Lương từ 20 đến 30 triệu",
            "experienceText": "2 năm kinh nghiệm",
            // ...
        },
        {
            "id": "guid_Doc20",
            "title": "Fullstack Developer (NodeJS/PHP)",
            "salaryText": "Lương thỏa thuận",
            "experienceText": "2 năm kinh nghiệm",
            // ...
        }
    ]
}
```

---

## 🎯 TÓM TẮT LUỒNG

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. FRONTEND                                                      │
│    POST /api/jobs/search                                         │
│    { keyword: "backend php", experienceFilter: 3 }              │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. CONTROLLER (JobPostingController)                            │
│    Nhận request → Gọi AppService                                │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. APP SERVICE (JobPostingAppService)                           │
│    a. Gọi Lucene search → Nhận jobIds [guid1, guid2, ...]      │
│    b. Gọi Repository → Load jobs từ DB (giữ nguyên thứ tự)     │
│    c. Map jobs → DTOs                                           │
│    d. Return PagedResultDto                                     │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. LUCENE (LuceneJobIndexer)                                    │
│    a. Build query:                                               │
│       - Keyword: (Title:backend OR Title:php OR ...)            │
│       - Filter: Experience:"3"                                   │
│    b. Search trong Inverted Index                               │
│    c. Tính Score (relevance)                                    │
│    d. Sort theo Score                                            │
│    e. Return jobIds theo thứ tự relevance                       │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. REPOSITORY (JobPostingRepository)                            │
│    a. Load jobs theo IDs từ database                            │
│    b. Include related entities (Category, Province...)          │
│    c. Sort lại theo thứ tự IDs (giữ relevance từ Lucene)       │
│    d. Return List<Job_Posting>                                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. RESPONSE                                                      │
│    { totalCount: 4, items: [DTO1, DTO2, DTO3, DTO4] }         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔥 ĐIỂM QUAN TRỌNG

### ✅ **Tại sao phải có 2 bước (Lucene → Database)?**

| **Bước** | **Làm gì?** | **Tại sao?** |
|----------|-------------|--------------|
| **Lucene** | Full-text search + Filter | Nhanh (O(1) tìm từ), có relevance score |
| **Database** | Load full entities | Có relationships (Category, Province...) |

### ✅ **Tại sao phải giữ nguyên thứ tự từ Lucene?**
- Lucene sort theo **relevance** (Score)
- Job có "backend php" trong **Title** → Score cao → Lên đầu
- Job chỉ có "backend" trong **Description** → Score thấp → Xuống dưới

### ✅ **Tại sao Experience dùng StringField?**
- Để match **CHÍNH XÁC** enum value
- "3" ≠ "13" ≠ "30" (không bị nhầm)

### ✅ **Tại sao ExperienceText dùng TextField?**
- Để search keyword: "2 năm", "kinh nghiệm"
- Phân tách: "2 năm kinh nghiệm" → ["2", "năm", "kinh", "nghiệm"]

---

🚀 **Giờ bạn có thể trace code từng bước khi debug!**


