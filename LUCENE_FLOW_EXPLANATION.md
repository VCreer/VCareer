# 📚 GIẢI THÍCH LUỒNG HOẠT ĐỘNG LUCENE - VÍ DỤ CỤ THỂ

## 🎯 **KHI NÀO DÙNG LUCENE vs FILTER REPO?**

### **A. DÙNG LUCENE (Full-Text Search):**
✅ **Khi có từ khóa search (keyword):**
- User gõ: `"backend developer"`, `"tuyển dụng python"`, `"java spring"`
- Lucene search trong: **Title, Description, Requirements, Benefits, CategoryPath, ProvinceName...**
- **Ưu điểm:** Tìm kiếm mờ (fuzzy), xếp hạng theo độ liên quan (relevance score)

✅ **Khi cần sắp xếp phức tạp:**
- Sort by relevance (Lucene score)
- Sort by salary, experience, urgent, updated

✅ **Khi cần filter kết hợp nhiều điều kiện:**
- Keyword + Category + Province + Salary range + Experience range...

---

### **B. DÙNG FILTER REPO (Database Query):**
✅ **Khi KHÔNG có keyword search:**
- Chỉ filter theo: Category, Province, Salary, Experience...
- Ví dụ: "Lấy tất cả jobs ở Hà Nội, category IT, lương > 15 triệu"

✅ **Khi cần data chính xác từ DB:**
- Load job detail, related jobs, count jobs...

✅ **Khi cần JOIN với bảng khác:**
- Load job với thông tin company, applications...

---

## 🔄 **LUỒNG HOẠT ĐỘNG LUCENE - VÍ DỤ CỤ THỂ**

### **BƯỚC 1: RECRUITER TẠO JOB MỚI**

```csharp
// 1. Recruiter tạo job mới qua API (chưa có trong scope này)
POST /api/jobs/create
{
    "title": "Tuyển Backend Developer Python Django",
    "description": "<p>Chúng tôi cần tuyển 1 Backend Developer có kinh nghiệm với Python, Django...</p>",
    "requirements": "<p>- 2-3 năm kinh nghiệm Python\n- Biết Django, Flask\n- Hiểu về REST API...</p>",
    "benefits": "<p>- Lương 15-25 triệu\n- Thưởng tháng 13...</p>",
    "jobCategoryId": "guid-of-backend-category",
    "provinceId": 1, // Hà Nội
    "districtId": 5, // Cầu Giấy
    "salaryMin": 15,
    "salaryMax": 25,
    "salaryDeal": false, // Không thỏa thuận
    "experienceYearsMin": 2,
    "experienceYearsMax": 3,
    "experienceRequired": true, // Yêu cầu kinh nghiệm
    "employmentType": 1, // Full-time
    "positionType": 2, // Junior
    "isUrgent": true,
    "expiresAt": "2025-12-31"
}

// 2. Server lưu vào DB (JobPostingRepository)
var job = new Job_Posting { ... };
job.GenerateSalaryText();    // → "Lương từ 15 đến 25 triệu"
job.GenerateExperienceText(); // → "Kinh nghiệm từ 2 đến 3 năm"
await _jobPostingRepository.InsertAsync(job);

// 3. ✨ INDEX VÀO LUCENE (Tự động hoặc gọi API)
await _jobPostingService.IndexJobAsync(job.Id);
```

---

### **BƯỚC 2: INDEX JOB VÀO LUCENE**

```csharp
// LuceneJobIndexer.IndexJobAsync()

public async Task IndexJobAsync(Job_Posting job)
{
    // 1. Load đầy đủ thông tin job (include Category, Province, District)
    var fullJob = await _jobPostingRepository.GetByIdAsync(job.Id);
    
    // 2. Tạo Lucene Document
    var doc = await CreateLuceneDocumentAsync(fullJob);
    
    // 3. Mở Writer (IndexWriter - ghi vào index)
    using var writer = GetWriter();
    
    // 4. Xóa document cũ (nếu update)
    writer.DeleteDocuments(new Term("JobId", job.Id.ToString()));
    
    // 5. Thêm document mới vào index
    writer.AddDocument(doc);
    
    // 6. Commit changes
    writer.Commit();
}
```

**Document được tạo ra như thế nào?**

```csharp
// CreateLuceneDocumentAsync()

var doc = new Document();

// ==================================
// TRƯỜNG CƠ BẢN (Exact match)
// ==================================
doc.Add(new StringField("JobId", job.Id.ToString(), Field.Store.YES));
doc.Add(new StringField("Slug", job.Slug, Field.Store.YES));
doc.Add(new StringField("Status", ((int)job.Status).ToString(), Field.Store.YES));

// ==================================
// TRƯỜNG FULL-TEXT (Analyzed - tách từ, loại bỏ stopwords)
// ==================================
// Title - boost 3.0 (quan trọng nhất)
doc.Add(new TextField("Title", job.Title, Field.Store.YES) { Boost = 3.0f });

// Description - strip HTML tags trước khi index
var cleanDescription = StripHtmlTags(job.Description);
doc.Add(new TextField("Description", cleanDescription, Field.Store.NO) { Boost = 1.5f });

// CategoryPath - ví dụ: "Công nghệ thông tin > Backend Developer"
var categoryPath = await _jobCategoryRepository.GetCategoryPathAsync(job.JobCategoryId);
doc.Add(new TextField("CategoryPath", categoryPath, Field.Store.YES) { Boost = 2.0f });

// ProvinceName, DistrictName
doc.Add(new TextField("ProvinceName", provinceName, Field.Store.YES) { Boost = 1.5f });
doc.Add(new TextField("DistrictName", districtName, Field.Store.YES));

// ==================================
// TRƯỜNG FILTER (Exact match - cho filter)
// ==================================
doc.Add(new StringField("CategoryId", job.JobCategoryId.ToString(), Field.Store.YES));
doc.Add(new StringField("ProvinceId", job.ProvinceId.ToString(), Field.Store.YES));
doc.Add(new StringField("DistrictId", job.DistrictId?.ToString() ?? "0", Field.Store.YES));

// ==================================
// TRƯỜNG NUMERIC (Cho range filter)
// ==================================
doc.Add(new DoubleField("SalaryMin", (double)job.SalaryMin, Field.Store.YES));
doc.Add(new DoubleField("SalaryMax", (double)job.SalaryMax, Field.Store.YES));
doc.Add(new Int32Field("ExperienceMin", job.ExperienceYearsMin ?? 0, Field.Store.YES));
doc.Add(new Int32Field("ExperienceMax", job.ExperienceYearsMax ?? 0, Field.Store.YES));

// ==================================
// TRƯỜNG BOOLEAN (Cho filter)
// ==================================
doc.Add(new StringField("SalaryDeal", job.SalaryDeal.ToString(), Field.Store.YES)); // True/False
doc.Add(new StringField("ExperienceRequired", job.ExperienceRequired.ToString(), Field.Store.YES));
doc.Add(new StringField("IsUrgent", job.IsUrgent.ToString(), Field.Store.YES));

// ==================================
// TRƯỜNG DATE/TIME (Cho sort và filter)
// ==================================
doc.Add(new Int64Field("PostedAt", job.PostedAt.Ticks, Field.Store.YES));
doc.Add(new Int64Field("ExpiresAt", job.ExpiresAt.Ticks, Field.Store.YES));
doc.Add(new Int64Field("LastModifiedAt", job.LastModificationTime?.Ticks ?? 0, Field.Store.YES));

return doc;
```

**🎯 Sau khi index, job này nằm trong file `lucene_index/` trên disk!**

---

### **BƯỚC 3: USER TÌM KIẾM JOB**

```csharp
// User gõ search trên FE:
POST /api/jobs/search
{
    "keyword": "backend python",
    "categoryIds": ["guid-of-backend-category"],
    "provinceIds": [1], // Hà Nội
    "salaryMin": 10,
    "salaryMax": 30,
    "experienceYearsMin": 1,
    "experienceYearsMax": 5,
    "sortBy": "relevance",
    "skipCount": 0,
    "maxResultCount": 20
}
```

---

### **BƯỚC 4: LUCENE SEARCH QUERY**

```csharp
// LuceneJobIndexer.SearchJobIdsAsync()

public async Task<List<Guid>> SearchJobIdsAsync(JobSearchInputDto input)
{
    // 1. Build Query từ input
    var query = BuildSearchQuery(input);
    
    // 2. Build Sort order
    var sort = BuildSortOrder(input.SortBy);
    
    // 3. Mở Searcher (IndexSearcher - đọc từ index)
    using var searcher = GetSearcher();
    
    // 4. Execute search
    var topDocs = searcher.Search(query, input.MaxResultCount, sort);
    
    // 5. Extract JobIds từ kết quả
    var jobIds = new List<Guid>();
    foreach (var scoreDoc in topDocs.ScoreDocs)
    {
        var doc = searcher.Doc(scoreDoc.Doc);
        var jobId = Guid.Parse(doc.Get("JobId"));
        jobIds.Add(jobId);
    }
    
    return jobIds; // Trả về list Guid theo thứ tự relevance
}
```

**Query được build như thế nào?**

```csharp
// BuildSearchQuery()

var boolQuery = new BooleanQuery();

// ==================================
// MUST: Job đang OPEN và chưa hết hạn
// ==================================
boolQuery.Add(new TermQuery(new Term("Status", "1")), Occur.MUST); // Status = Open
boolQuery.Add(
    NumericRangeQuery.NewInt64Range("ExpiresAt", DateTime.UtcNow.Ticks, null, true, true), 
    Occur.MUST
);

// ==================================
// KEYWORD Search (Full-text)
// ==================================
if (keyword == "backend python")
{
    var parser = new MultiFieldQueryParser(
        ["Title", "Description", "Requirements", "CategoryPath", "ProvinceName"],
        _analyzer
    );
    var keywordQuery = parser.Parse("backend python");
    boolQuery.Add(keywordQuery, Occur.MUST);
    
    // Lucene sẽ tìm:
    // - Title chứa "backend" HOẶC "python"
    // - Description chứa "backend" HOẶC "python"
    // - Requirements chứa "backend" HOẶC "python"
    // - CategoryPath chứa "backend" HOẶC "python"
    // → Tính SCORE dựa trên:
    //    + Số lần xuất hiện của keyword
    //    + Boost của field (Title = 3.0, Description = 1.5...)
    //    + TF-IDF (Term Frequency - Inverse Document Frequency)
}

// ==================================
// FILTER: Category
// ==================================
var categoryQuery = new BooleanQuery();
categoryQuery.Add(new TermQuery(new Term("CategoryId", "guid-of-backend-category")), Occur.SHOULD);
boolQuery.Add(categoryQuery, Occur.MUST);

// ==================================
// FILTER: Province
// ==================================
var provinceQuery = new BooleanQuery();
provinceQuery.Add(new TermQuery(new Term("ProvinceId", "1")), Occur.SHOULD);
boolQuery.Add(provinceQuery, Occur.MUST);

// ==================================
// FILTER: Salary Range (10-30 triệu)
// ==================================
var salaryQuery = new BooleanQuery();

// Option 1: Job có SalaryDeal = true (luôn match)
salaryQuery.Add(new TermQuery(new Term("SalaryDeal", "True")), Occur.SHOULD);

// Option 2: Job có lương trong range [10, 30]
// Logic: SalaryMax >= 10 AND SalaryMin <= 30
var rangeQuery = new BooleanQuery();
rangeQuery.Add(NumericRangeQuery.NewDoubleRange("SalaryMax", 10.0, null, true, true), Occur.MUST);
rangeQuery.Add(NumericRangeQuery.NewDoubleRange("SalaryMin", null, 30.0, true, true), Occur.MUST);
salaryQuery.Add(rangeQuery, Occur.SHOULD);

boolQuery.Add(salaryQuery, Occur.MUST);

// ==================================
// FILTER: Experience Range (1-5 năm)
// ==================================
var experienceQuery = new BooleanQuery();

// Option 1: Job KHÔNG yêu cầu kinh nghiệm (ExperienceRequired = false) → Luôn match
experienceQuery.Add(new TermQuery(new Term("ExperienceRequired", "False")), Occur.SHOULD);

// Option 2: Job yêu cầu kinh nghiệm trong range [1, 5]
// Logic: ExperienceMin >= 1 AND ExperienceMax <= 5
var rangeQuery = new BooleanQuery();
rangeQuery.Add(NumericRangeQuery.NewInt32Range("ExperienceMin", 1, null, true, true), Occur.MUST);
rangeQuery.Add(NumericRangeQuery.NewInt32Range("ExperienceMax", null, 5, true, true), Occur.MUST);
experienceQuery.Add(rangeQuery, Occur.SHOULD);

boolQuery.Add(experienceQuery, Occur.MUST);

// ==================================
// SORT BY RELEVANCE (Lucene score)
// ==================================
// Lucene tự động tính score dựa trên:
// - Keyword match trong Title (boost 3.0)
// - Keyword match trong Description (boost 1.5)
// - TF-IDF
// → Job nào match nhiều keyword hơn, title chứa keyword → score cao hơn → lên đầu
```

**Kết quả trả về:**
```csharp
// Lucene trả về list Guid theo thứ tự relevance:
[
    "guid-job-1",  // Score: 8.5 (Title: "Backend Developer Python Django")
    "guid-job-2",  // Score: 6.2 (Title: "Python Developer")
    "guid-job-3",  // Score: 5.8 (Description chứa "backend python")
    ...
]
```

---

### **BƯỚC 5: LOAD JOBS TỪ DATABASE**

```csharp
// JobPostingAppService.SearchJobsAsync()

public async Task<PagedResultDto<JobViewDto>> SearchJobsAsync(JobSearchInputDto input)
{
    // 1. Lucene search → Get list of Guid
    var jobIds = await _luceneIndexer.SearchJobIdsAsync(input);
    // → ["guid-job-1", "guid-job-2", "guid-job-3"]
    
    // 2. Load jobs từ DB theo IDs (giữ nguyên thứ tự của Lucene)
    var jobs = await _jobPostingRepository.GetJobsByIdsAsync(jobIds);
    
    // 3. Map sang DTO
    var jobViewDtos = jobs.Select(MapToJobViewDto).ToList();
    
    return new PagedResultDto<JobViewDto>(jobViewDtos, jobIds.Count);
}
```

---

### **BƯỚC 6: TRẢ KẾT QUẢ CHO FE**

```json
{
    "items": [
        {
            "id": "guid-job-1",
            "slug": "backend-developer-python-django",
            "title": "Tuyển Backend Developer Python Django",
            "companyName": "ABC Tech",
            "salaryText": "Lương từ 15 đến 25 triệu",
            "experienceText": "Kinh nghiệm từ 2 đến 3 năm",
            "categoryName": "Backend Developer",
            "provinceName": "Hà Nội",
            "districtName": "Cầu Giấy",
            "employmentType": 1,
            "positionType": 2,
            "isUrgent": true,
            "postedAt": "2025-10-25T10:00:00Z",
            "expiresAt": "2025-12-31T23:59:59Z"
        },
        ...
    ],
    "totalCount": 15
}
```

---

## 🔄 **KHI NÀO UPDATE INDEX?**

### **1. Recruiter UPDATE Job:**
```csharp
// Sau khi update job trong DB
await _jobPostingService.IndexJobAsync(job.Id);
// → Xóa document cũ → Thêm document mới
```

### **2. Recruiter DELETE Job:**
```csharp
// Sau khi delete job trong DB
await _jobPostingService.RemoveJobFromIndexAsync(job.Id);
// → Xóa document khỏi index
```

### **3. Admin REINDEX tất cả jobs:**
```csharp
// Khi cần rebuild toàn bộ index (ví dụ: thay đổi logic index)
POST /api/jobs/reindex

// → Clear index cũ
// → Load tất cả jobs active từ DB
// → Index lại toàn bộ
```

---

## 📊 **SO SÁNH: LUCENE vs DATABASE FILTER**

| Tiêu chí | Lucene | Database Filter (Repo) |
|----------|--------|------------------------|
| **Keyword search** | ✅ Mạnh (full-text, fuzzy, boost) | ❌ Chỉ có LIKE |
| **Performance với text** | ✅ Nhanh (inverted index) | ❌ Chậm với LIKE %keyword% |
| **Relevance ranking** | ✅ Có (TF-IDF score) | ❌ Không có |
| **Filter chính xác** | ✅ Có | ✅ Có |
| **Join với bảng khác** | ❌ Không | ✅ Có |
| **Real-time data** | ⚠️ Cần reindex | ✅ Luôn chính xác |
| **Setup phức tạp** | ⚠️ Cần maintain index | ✅ Đơn giản |

---

## 🎯 **KẾT LUẬN:**

### **✅ DÙNG LUCENE KHI:**
- User nhập **keyword search** (tìm kiếm mờ, full-text)
- Cần **xếp hạng theo độ liên quan** (relevance score)
- Cần **performance cao** với text search

### **✅ DÙNG FILTER REPO KHI:**
- **Không có keyword**, chỉ filter theo field cụ thể
- Cần **data chính xác real-time** từ DB
- Cần **JOIN** với bảng khác (company, applications...)

### **🔥 BEST PRACTICE:**
**Kết hợp cả 2:**
1. **Lucene search** → Lấy list IDs (với relevance score)
2. **Load từ DB** → Lấy full data (với JOIN nếu cần)
3. **Giữ nguyên thứ tự** của Lucene ranking

→ Đây chính là cách code của chúng ta đang làm! 🎯





