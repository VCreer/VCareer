# 🔍 LUCENE - GIẢI THÍCH CHI TIẾT

## 📌 MỤC LỤC
1. [Cấu trúc Lucene Index](#1-cấu-trúc-lucene-index)
2. [Các loại Field trong Lucene](#2-các-loại-field-trong-lucene)
3. [Ví dụ cụ thể: Index 1 Job](#3-ví-dụ-cụ-thể-index-1-job)
4. [Luồng hoạt động khi gọi API](#4-luồng-hoạt-động-khi-gọi-api)
5. [Tại sao Experience dùng StringField, ExperienceText dùng TextField?](#5-tại-sao-experience-dùng-stringfield-experiencetext-dùng-textfield)

---

## 1. CẤU TRÚC LUCENE INDEX

### 🗂️ **Lucene Index giống như một cuốn từ điển khổng lồ:**

```
📁 LuceneIndex/
  ├── segments_1              ← Metadata
  ├── _0.cfs                  ← Compound file (chứa toàn bộ data)
  ├── _0.cfe                  ← Compound file entries
  └── write.lock              ← Lock file
```

### 🔑 **Khái niệm cơ bản:**

| **Khái niệm** | **Giải thích** | **Ví dụ** |
|---------------|----------------|-----------|
| **Document** | 1 bản ghi (1 job) | Job "Tuyển Backend Developer" |
| **Field** | 1 trường trong document | Title, Description, Salary... |
| **Term** | 1 từ đã được phân tách | "backend", "developer", "tuyển" |
| **Token** | Term + vị trí | "backend" (vị trí 2 trong Title) |
| **Inverted Index** | Từ điển: Từ → Danh sách documents chứa từ đó | "backend" → [Doc1, Doc5, Doc12] |

---

## 2. CÁC LOẠI FIELD TRONG LUCENE

### 📋 **So sánh TextField, StringField, NumericField:**

| **Field Type** | **Phân tách từ?** | **Store value?** | **Khi nào dùng?** | **Ví dụ** |
|----------------|-------------------|------------------|-------------------|-----------|
| **TextField** | ✅ CÓ | Tùy chọn | Nội dung cần search từng từ | Title, Description |
| **StringField** | ❌ KHÔNG | Tùy chọn | Giá trị nguyên khối (ID, enum) | JobId, Status, Experience |
| **Int32Field** | ❌ KHÔNG | Tùy chọn | Số nguyên (để filter, sort) | Quantity, ViewCount |
| **DoubleField** | ❌ KHÔNG | Tùy chọn | Số thập phân (để filter, sort) | SalaryMin, SalaryMax |
| **StoredField** | ❌ KHÔNG | ✅ LUÔN | Chỉ lưu, không search | SalaryText (chỉ để hiển thị) |

### 🔍 **Field.Store.YES vs Field.Store.NO:**

| **Option** | **Lưu giá trị gốc?** | **Khi nào dùng?** |
|------------|----------------------|-------------------|
| **Field.Store.YES** | ✅ CÓ | Cần lấy lại giá trị khi search (để hiển thị) |
| **Field.Store.NO** | ❌ KHÔNG | Chỉ cần index để search/filter, không cần hiển thị |

---

## 3. VÍ DỤ CỤ THỂ: INDEX 1 JOB

### 📝 **Dữ liệu Job trong Database:**

```json
{
  "Id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "Title": "Tuyển Backend Developer PHP Laravel",
  "Description": "Công ty ABC tuyển lập trình viên PHP có kinh nghiệm Laravel",
  "SalaryMin": 15000000,
  "SalaryMax": 25000000,
  "SalaryText": "Lương từ 15 đến 25 triệu",
  "Experience": 3,  // ExperienceLevel.Year2 (2 năm)
  "ExperienceText": "2 năm kinh nghiệm",
  "EmploymentType": 2,  // FullTime
  "PositionType": 1,    // Employee
  "IsUrgent": true,
  "ProvinceId": 1,
  "DistrictId": 5
}
```

---

### 🔨 **Bước 1: Tạo Lucene Document**

```csharp
var doc = new Document();

// ========================================
// 1. TEXTFIELD - Phân tách từ để search
// ========================================
doc.Add(new TextField("Title", "Tuyển Backend Developer PHP Laravel", Field.Store.YES));
```

**Lucene xử lý:**
```
Input: "Tuyển Backend Developer PHP Laravel"

↓ StandardAnalyzer phân tách (tokenize)

Tokens: ["tuyển", "backend", "developer", "php", "laravel"]

↓ Lưu vào Inverted Index

Inverted Index:
  "tuyển"    → [Doc_a1b2c3d4]  (vị trí 0)
  "backend"  → [Doc_a1b2c3d4]  (vị trí 1)
  "developer"→ [Doc_a1b2c3d4]  (vị trí 2)
  "php"      → [Doc_a1b2c3d4]  (vị trí 3)
  "laravel"  → [Doc_a1b2c3d4]  (vị trí 4)

↓ Lưu giá trị gốc (vì Store.YES)

Stored Values:
  Doc_a1b2c3d4 → Title = "Tuyển Backend Developer PHP Laravel"
```

---

```csharp
// ========================================
// 2. STRINGFIELD - KHÔNG phân tách từ
// ========================================
doc.Add(new StringField("Experience", "3", Field.Store.YES));
```

**Lucene xử lý:**
```
Input: "3"

↓ KHÔNG phân tách (coi như 1 từ nguyên khối)

Inverted Index:
  "3" → [Doc_a1b2c3d4]  (nguyên khối)

↓ Lưu giá trị gốc (vì Store.YES)

Stored Values:
  Doc_a1b2c3d4 → Experience = "3"
```

**❓ Tại sao KHÔNG phân tách?**
- Vì `Experience` là **enum value** (0, 1, 2, 3...)
- Nếu phân tách, "10" sẽ thành ["1", "0"] → SAI!
- Ta cần match **CHÍNH XÁC** "3" (không phải "1" hay "0")

---

```csharp
// ========================================
// 3. TEXTFIELD - Phân tách từ để search (ExperienceText)
// ========================================
doc.Add(new TextField("ExperienceText", "2 năm kinh nghiệm", Field.Store.YES));
```

**Lucene xử lý:**
```
Input: "2 năm kinh nghiệm"

↓ StandardAnalyzer phân tách

Tokens: ["2", "năm", "kinh", "nghiệm"]

↓ Lưu vào Inverted Index

Inverted Index:
  "2"        → [Doc_a1b2c3d4]
  "năm"      → [Doc_a1b2c3d4]
  "kinh"     → [Doc_a1b2c3d4]
  "nghiệm"   → [Doc_a1b2c3d4]

↓ Lưu giá trị gốc (vì Store.YES)

Stored Values:
  Doc_a1b2c3d4 → ExperienceText = "2 năm kinh nghiệm"
```

**❓ Tại sao cần phân tách?**
- User có thể search: "2 năm", "kinh nghiệm", "năm kinh nghiệm"
- Lucene sẽ match từng từ riêng lẻ

---

```csharp
// ========================================
// 4. DOUBLEFIELD - Số để filter/sort
// ========================================
doc.Add(new DoubleField("SalaryMin", 15.0, Field.Store.NO));
doc.Add(new DoubleField("SalaryMax", 25.0, Field.Store.NO));
```

**Lucene xử lý:**
```
Input: 15.0, 25.0

↓ Lưu dạng numeric (để filter range nhanh)

Numeric Index:
  SalaryMin: [15.0] → Doc_a1b2c3d4
  SalaryMax: [25.0] → Doc_a1b2c3d4

↓ KHÔNG lưu giá trị gốc (vì Store.NO - không cần hiển thị)
```

**❓ Tại sao Store.NO?**
- Vì ta đã có `SalaryText` để hiển thị
- `SalaryMin/Max` chỉ dùng để **filter** (VD: lương >= 15 triệu)

---

```csharp
// ========================================
// 5. STOREDFIELD - Chỉ lưu, không index
// ========================================
doc.Add(new StoredField("SalaryText", "Lương từ 15 đến 25 triệu"));
```

**Lucene xử lý:**
```
Input: "Lương từ 15 đến 25 triệu"

↓ KHÔNG tạo inverted index (không search được)

↓ CHỈ lưu giá trị gốc

Stored Values:
  Doc_a1b2c3d4 → SalaryText = "Lương từ 15 đến 25 triệu"
```

**❓ Tại sao không index?**
- Vì ta đã có `SalaryMin/Max` để filter
- `SalaryText` chỉ để **HIỂN THỊ** khi trả kết quả

---

### 🗄️ **Tổng kết: Document cuối cùng trong Index**

```
Document ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
┌───────────────────────────────────────────────────────────────┐
│ INVERTED INDEX (để search/filter)                             │
├───────────────────────────────────────────────────────────────┤
│ Title:                                                         │
│   "tuyển"    → [Doc_a1b2c3d4]                                 │
│   "backend"  → [Doc_a1b2c3d4]                                 │
│   "developer"→ [Doc_a1b2c3d4]                                 │
│   "php"      → [Doc_a1b2c3d4]                                 │
│   "laravel"  → [Doc_a1b2c3d4]                                 │
│                                                                │
│ ExperienceText:                                                │
│   "2"        → [Doc_a1b2c3d4]                                 │
│   "năm"      → [Doc_a1b2c3d4]                                 │
│   "kinh"     → [Doc_a1b2c3d4]                                 │
│   "nghiệm"   → [Doc_a1b2c3d4]                                 │
│                                                                │
│ Experience (StringField):                                      │
│   "3"        → [Doc_a1b2c3d4]  (nguyên khối)                 │
│                                                                │
│ SalaryMin (Numeric):                                           │
│   15.0       → [Doc_a1b2c3d4]                                 │
│                                                                │
│ SalaryMax (Numeric):                                           │
│   25.0       → [Doc_a1b2c3d4]                                 │
├───────────────────────────────────────────────────────────────┤
│ STORED VALUES (để hiển thị kết quả)                          │
├───────────────────────────────────────────────────────────────┤
│ Title           = "Tuyển Backend Developer PHP Laravel"       │
│ Experience      = "3"                                          │
│ ExperienceText  = "2 năm kinh nghiệm"                        │
│ SalaryText      = "Lương từ 15 đến 25 triệu"                │
└───────────────────────────────────────────────────────────────┘
```

---

## 4. LUỒNG HOẠT ĐỘNG KHI GỌI API

### 🚀 **Scenario: User search "backend php"**

```http
POST /api/jobs/search
{
    "keyword": "backend php",
    "experienceFilter": 3,  // Year2 (2 năm)
    "salaryFilter": 2,      // Range10To15 (10-15 triệu)
    "skipCount": 0,
    "maxResultCount": 20
}
```

---

### 📊 **BƯỚC 1: Controller nhận request**

```csharp
[HttpPost("search")]
public async Task<PagedResultDto<JobViewDto>> SearchJobsAsync(JobSearchInputDto input)
{
    // Gọi AppService
    return await _jobPostingAppService.SearchJobsAsync(input);
}
```

---

### 🔧 **BƯỚC 2: AppService gọi Lucene**

```csharp
public async Task<PagedResultDto<JobViewDto>> SearchJobsAsync(JobSearchInputDto input)
{
    // Gọi Lucene để search
    var (jobIds, totalCount) = await _luceneJobIndexer.SearchAsync(
        keyword: input.Keyword,
        categoryIds: input.CategoryIds,
        provinceIds: input.ProvinceIds,
        districtIds: input.DistrictIds,
        salaryFilter: input.SalaryFilter,
        experienceFilter: input.ExperienceFilter,
        positionTypes: input.PositionTypes,
        employmentTypes: input.EmploymentTypes,
        isUrgent: input.IsUrgent,
        sortBy: input.SortBy,
        skipCount: input.SkipCount,
        maxResultCount: input.MaxResultCount
    );
    
    // Lucene trả về LIST GUIDs (theo thứ tự relevance)
    // jobIds = [guid1, guid2, guid3, ...]
    
    // Lấy job từ database theo GUIDs (GIỮ NGUYÊN thứ tự)
    var jobs = await _jobPostingRepository.GetByIdsAsync(jobIds, includeDetails: true);
    
    // Map sang DTO
    var dtos = jobs.Select(MapToJobViewDto).ToList();
    
    return new PagedResultDto<JobViewDto>(totalCount, dtos);
}
```

---

### 🔍 **BƯỚC 3: Lucene xử lý query**

#### **3.1. Build Search Query**

```csharp
private Query BuildSearchQuery(JobSearchInputDto input)
{
    var boolQuery = new BooleanQuery();
    
    // ========================================
    // A. KEYWORD SEARCH
    // ========================================
    if (!string.IsNullOrWhiteSpace(input.Keyword))
    {
        // Parse keyword thành query
        var keywordQuery = BuildKeywordQuery("backend php");
        boolQuery.Add(keywordQuery, Occur.MUST);
    }
}
```

**Lucene phân tách keyword:**
```
Input keyword: "backend php"

↓ MultiFieldQueryParser phân tách

Query được build:
  (Title:backend OR Title:php)
  OR (Description:backend OR Description:php)
  OR (Requirements:backend OR Requirements:php)
  ...
  
↓ Tìm trong Inverted Index

Match Title:
  "backend" → [Doc_a1b2c3d4, Doc_xyz123, ...]
  "php"     → [Doc_a1b2c3d4, Doc_abc456, ...]
  
→ Kết quả: Doc_a1b2c3d4 có CẢ 2 từ → Score cao!
```

---

#### **3.2. Add Experience Filter**

```csharp
private void AddExperienceFilter(BooleanQuery boolQuery, ExperienceLevel? filter)
{
    if (!filter.HasValue) return;
    
    // Match CHÍNH XÁC enum value
    boolQuery.Add(
        new TermQuery(new Term("Experience", "3")),  // Tìm "3" nguyên khối
        Occur.MUST
    );
}
```

**Lucene tìm trong StringField:**
```
Filter: Experience = 3

↓ Tìm trong Inverted Index (StringField)

Inverted Index - Experience:
  "0" → [Doc1, Doc5]
  "1" → [Doc2]
  "2" → [Doc7, Doc9]
  "3" → [Doc_a1b2c3d4, Doc10]  ← Match!
  
→ Chỉ lấy docs có Experience = "3"
```

**❗ Lưu ý:**
- Nếu dùng **TextField** cho Experience, "10" sẽ bị tách thành ["1", "0"]
- Khi filter Experience = 1, sẽ match cả "10" → **SAI!**
- Vì thế phải dùng **StringField** (không tách từ)

---

#### **3.3. Add Salary Filter**

```csharp
private void AddSalaryFilter(BooleanQuery boolQuery, SalaryFilterType? filter)
{
    if (filter == SalaryFilterType.Range10To15)
    {
        var salaryQuery = new BooleanQuery();
        
        // Job KHÔNG phải "Thỏa thuận"
        salaryQuery.Add(new TermQuery(new Term("SalaryDeal", "False")), Occur.MUST);
        
        // Lương min >= 10 AND <= 15
        salaryQuery.Add(
            NumericRangeQuery.NewDoubleRange("SalaryMin", 10.0, 15.0, true, false),
            Occur.MUST
        );
        
        boolQuery.Add(salaryQuery, Occur.MUST);
    }
}
```

**Lucene tìm trong Numeric Index:**
```
Filter: Salary 10-15 triệu

↓ Tìm trong Numeric Index

SalaryMin Numeric Index:
  8.0  → [Doc1]
  10.0 → [Doc2]
  12.0 → [Doc3]
  15.0 → [Doc_a1b2c3d4]  ← Match! (15 trong khoảng 10-15)
  20.0 → [Doc5]
  
→ Chỉ lấy docs có SalaryMin trong [10.0, 15.0]
```

---

#### **3.4. Execute Search**

```csharp
// Execute search với query đã build
var hits = searcher.Search(finalQuery, maxResults, sort);

// Lấy document IDs
List<Guid> jobIds = new List<Guid>();
foreach (var hit in hits.ScoreDocs)
{
    var doc = searcher.Doc(hit.Doc);
    var jobId = Guid.Parse(doc.Get("JobId"));
    jobIds.Add(jobId);
}

return (jobIds, hits.TotalHits);
```

**Lucene tính score và sort:**
```
Matched Documents:
  Doc_a1b2c3d4 (Score: 2.5)  ← Có cả "backend" và "php" trong Title
  Doc_xyz123   (Score: 1.8)  ← Chỉ có "backend" trong Description
  Doc_abc456   (Score: 1.2)  ← Chỉ có "php" trong Requirements
  
↓ Sort theo score (relevance)

Final Result:
  [a1b2c3d4, xyz123, abc456]
```

---

### 🗂️ **BƯỚC 4: Load jobs từ Database**

```csharp
// Lucene trả về: [guid1, guid2, guid3]
var jobs = await _jobPostingRepository.GetByIdsAsync(jobIds, includeDetails: true);
```

**Repository giữ nguyên thứ tự:**
```csharp
public async Task<List<Job_Posting>> GetByIdsAsync(List<Guid> ids, bool includeDetails)
{
    var jobs = await query
        .Where(j => ids.Contains(j.Id))
        .ToListAsync();
    
    // GIỮ NGUYÊN thứ tự từ Lucene (theo relevance)
    return ids.Select(id => jobs.First(j => j.Id == id)).ToList();
}
```

---

### 📦 **BƯỚC 5: Map sang DTO**

```csharp
private JobViewDto MapToJobViewDto(Job_Posting job)
{
    return new JobViewDto
    {
        Id = job.Id,
        Title = job.Title,
        SalaryText = job.SalaryText,        // Lấy từ Stored Field
        ExperienceText = job.ExperienceText, // Lấy từ Stored Field
        // ...
    };
}
```

---

### 📤 **BƯỚC 6: Trả response về Frontend**

```json
{
    "totalCount": 3,
    "items": [
        {
            "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            "title": "Tuyển Backend Developer PHP Laravel",
            "salaryText": "Lương từ 15 đến 25 triệu",
            "experienceText": "2 năm kinh nghiệm",
            "isUrgent": true
        },
        // ...
    ]
}
```

---

## 5. TẠI SAO EXPERIENCE DÙNG STRINGFIELD, EXPERIENCETEXT DÙNG TEXTFIELD?

### 🔢 **Experience (StringField + Store.YES)**

```csharp
doc.Add(new StringField("Experience", "3", Field.Store.YES));
```

| **Mục đích** | **Lý do** |
|--------------|-----------|
| **Filter chính xác** | Match EXACT enum value (3 = Year2) |
| **Không phân tách** | "10" không bị tách thành ["1", "0"] |
| **Store.YES** | Để hiển thị enum value nếu cần |

**Ví dụ:**
```
User chọn filter: Experience = Year2 (value = 3)

Query: Experience = "3"

Match:
  ✅ Job có Experience = 3
  ❌ Job có Experience = 1
  ❌ Job có Experience = 10 (vì "10" ≠ "3")
```

---

### 📝 **ExperienceText (TextField + Store.YES)**

```csharp
doc.Add(new TextField("ExperienceText", "2 năm kinh nghiệm", Field.Store.YES));
```

| **Mục đích** | **Lý do** |
|--------------|-----------|
| **Keyword search** | User search "2 năm", "kinh nghiệm" |
| **Phân tách từ** | "2 năm kinh nghiệm" → ["2", "năm", "kinh", "nghiệm"] |
| **Store.YES** | Để hiển thị text đẹp trong kết quả |

**Ví dụ:**
```
User search keyword: "2 năm"

Query: ExperienceText: "2" AND "năm"

Match:
  ✅ Job có ExperienceText = "2 năm kinh nghiệm"
  ✅ Job có ExperienceText = "Trên 2 năm"
  ❌ Job có ExperienceText = "Không yêu cầu kinh nghiệm"
```

---

### 🎯 **Kết hợp cả 2:**

| **Scenario** | **Dùng field nào?** | **Kết quả** |
|--------------|---------------------|-------------|
| User **filter** "2 năm" | `Experience = 3` | Chỉ lấy job ĐÚNG 2 năm |
| User **search** "2 năm kinh nghiệm" | `ExperienceText: "2 năm"` | Lấy job có từ "2 năm" trong text |
| User search "kinh nghiệm" | `ExperienceText: "kinh nghiệm"` | Lấy TẤT CẢ job có từ "kinh nghiệm" |

---

## 📊 TỔNG KẾT

### ✅ **Khi nào dùng TextField?**
- Nội dung dài, cần search từng từ
- VD: Title, Description, Requirements, Benefits, ExperienceText

### ✅ **Khi nào dùng StringField?**
- Giá trị nguyên khối, không tách từ
- VD: JobId, Status, Experience (enum), IsUrgent

### ✅ **Khi nào dùng NumericField?**
- Số, cần filter range hoặc sort
- VD: SalaryMin, SalaryMax, ViewCount, Quantity

### ✅ **Khi nào dùng StoredField?**
- Chỉ lưu để hiển thị, không search
- VD: SalaryText (vì đã có SalaryMin/Max để filter)

### ✅ **Store.YES vs Store.NO?**
- **Store.YES**: Lưu để hiển thị (Title, ExperienceText, SalaryText)
- **Store.NO**: Chỉ index để filter (SalaryMin, EmploymentType)

---

## 🎓 KẾT LUẬN

**Lucene = Từ điển khổng lồ:**
1. **Index** = Tạo từ điển (Từ → Documents)
2. **Search** = Tra từ điển (Từ → Tìm documents chứa từ đó)
3. **Filter** = Lọc documents theo điều kiện (Salary, Experience)
4. **Sort** = Sắp xếp theo score (relevance) hoặc field (salary, date)

**Quy trình:**
```
User search "backend php" 
→ Lucene tra từ điển 
→ Tìm docs chứa "backend" và "php" 
→ Tính score (relevance) 
→ Sort theo score 
→ Trả về list GUIDs 
→ Load jobs từ DB 
→ Map sang DTO 
→ Trả về FE
```

🚀 **Lucene = NHANH vì tìm từ trong từ điển (O(1)), không cần scan toàn bộ database!**


