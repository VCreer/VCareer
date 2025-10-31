# ❓ TẠI SAO `GetFilteredJobsAsync()` TRONG REPOSITORY KHÔNG ĐƯỢC GỌI?

## **VẤN ĐỀ BẠN PHÁT HIỆN:**

Bạn hoàn toàn đúng! ✅

- `JobPostingRepository.GetFilteredJobsAsync()` được implement đầy đủ
- Nhưng **KHÔNG có API nào gọi nó**
- Chỉ có `JobPostingAppService.SearchJobsAsync()` → Luôn dùng **Lucene**

---

## **GIẢI THÍCH:**

### **Kiến trúc hiện tại:**

```
FE Request → API Controller → AppService → Lucene → Repository (load by IDs)
                                   ↓
                            KHÔNG BAO GIỜ GỌI GetFilteredJobsAsync()
```

### **Tại sao không gọi?**

Có 2 lý do:

#### **1. Thiết kế ban đầu: Hybrid approach (nhưng chưa hoàn thiện)**

Ban đầu tôi dự định:
- **Có keyword** → Dùng Lucene (full-text search)
- **Không keyword** → Dùng Repository filter (database query)

Nhưng tôi chỉ implement phần Lucene, chưa implement phần logic quyết định dùng cái nào!

#### **2. Lucene nhanh hơn database LIKE**

Thực tế:
- Lucene với inverted index → Rất nhanh cho cả keyword search và filter
- Database LIKE %keyword% → Chậm hơn
- Lucene có thể handle cả filter (category, salary, experience...) mà không cần keyword

→ **Dùng Lucene cho mọi case là hợp lý!**

---

## **GIẢI PHÁP:**

### **OPTION 1: Xóa `GetFilteredJobsAsync()` (RECOMMEND ✅)**

**Lý do:**
- Đơn giản hơn
- Giảm code duplication
- Lucene đủ nhanh cho mọi trường hợp
- Dễ maintain

**Cách làm:**
```csharp
// XÓA method này trong IJobPostingRepository:
Task<(List<Job_Posting> Jobs, long TotalCount)> GetFilteredJobsAsync(...);

// XÓA implementation trong JobPostingRepository
```

---

### **OPTION 2: Giữ cả 2 - Hybrid approach**

**Khi nào dùng gì:**

```csharp
// JobPostingAppService.SearchJobsAsync()

public async Task<PagedResultDto<JobViewDto>> SearchJobsAsync(JobSearchInputDto input)
{
    // ============================================
    // CÓ KEYWORD → DÙNG LUCENE (full-text search)
    // ============================================
    if (!string.IsNullOrWhiteSpace(input.Keyword))
    {
        var jobIds = await _luceneIndexer.SearchJobIdsAsync(input);
        var jobs = await _jobPostingRepository.GetJobsByIdsAsync(jobIds);
        // ... map to DTO
    }
    
    // ============================================
    // KHÔNG CÓ KEYWORD → DÙNG DATABASE FILTER
    // ============================================
    else
    {
        // Convert từ ExperienceFilterType, SalaryFilterType sang min/max
        (var salaryMin, var salaryMax) = ConvertSalaryFilter(input.SalaryFilter);
        (var expMin, var expMax) = ConvertExperienceFilter(input.ExperienceFilter);
        
        var (jobs, totalCount) = await _jobPostingRepository.GetFilteredJobsAsync(
            keyword: null,
            categoryIds: input.CategoryIds,
            provinceIds: input.ProvinceIds,
            districtIds: input.DistrictIds,
            salaryMin: salaryMin,
            salaryMax: salaryMax,
            experienceMin: expMin,
            experienceMax: expMax,
            employmentTypes: input.EmploymentTypes,
            positionTypes: input.PositionTypes,
            isUrgent: input.IsUrgent,
            sortBy: input.SortBy,
            skipCount: input.SkipCount,
            maxResultCount: input.MaxResultCount
        );
        // ... map to DTO
    }
}

// Helper methods để convert enum sang min/max
private (decimal? min, decimal? max) ConvertSalaryFilter(SalaryFilterType? filter)
{
    if (!filter.HasValue || filter == SalaryFilterType.All)
        return (null, null);
        
    return filter.Value switch
    {
        SalaryFilterType.Under10 => (null, 10),
        SalaryFilterType.Range10To15 => (10, 15),
        SalaryFilterType.Range15To20 => (15, 20),
        SalaryFilterType.Range20To30 => (20, 30),
        SalaryFilterType.Range30To50 => (30, 50),
        SalaryFilterType.Over50 => (50, null),
        SalaryFilterType.Deal => (null, null), // Special case: filter by SalaryDeal = true
        _ => (null, null)
    };
}

private (int? min, int? max) ConvertExperienceFilter(ExperienceFilterType? filter)
{
    if (!filter.HasValue || filter == ExperienceFilterType.All)
        return (null, null);
        
    return filter.Value switch
    {
        ExperienceFilterType.None => (null, null), // Special case: filter by ExperienceRequired = false
        ExperienceFilterType.Under1 => (null, 1),
        ExperienceFilterType.OneYear => (1, 1),
        ExperienceFilterType.TwoYear => (2, 2),
        ExperienceFilterType.ThreeYear => (3, 3),
        ExperienceFilterType.FourYear => (4, 4),
        ExperienceFilterType.FiveYear => (5, 5),
        ExperienceFilterType.Over5 => (5, null),
        _ => (null, null)
    };
}
```

**Nhưng cần UPDATE `GetFilteredJobsAsync()` để support SalaryDeal và ExperienceRequired!**

---

## **RECOMMENDATION: DÙNG OPTION 1 ✅**

### **Lý do:**

1. **Đơn giản hơn:**
   - 1 luồng logic duy nhất (Lucene)
   - Không cần quyết định dùng Lucene hay Database
   - Ít code hơn → Ít bug hơn

2. **Performance tốt:**
   - Lucene với inverted index → Rất nhanh
   - Không cần optimize 2 luồng riêng biệt

3. **Consistency:**
   - Mọi search result đều qua Lucene
   - Relevance scoring nhất quán
   - Sort logic nhất quán

4. **Dễ maintain:**
   - Chỉ cần maintain 1 codebase (Lucene)
   - Update logic chỉ ở 1 chỗ

---

## **KẾT LUẬN:**

### **Hiện tại:**
```
✅ Lucene: Đã implement đầy đủ, support radio buttons UI mới
❌ GetFilteredJobsAsync(): Không được gọi → Có thể XÓA
```

### **Hành động:**

**CÁCH 1 (Recommend):**
```bash
# Xóa GetFilteredJobsAsync() khỏi:
- IJobPostingRepository.cs
- JobPostingRepository.cs

# Giữ lại:
- GetJobsByIdsAsync() (dùng để load từ Lucene results)
- GetByIdAsync() (dùng cho detail)
- GetRelatedJobsAsync() (dùng cho related jobs)
```

**CÁCH 2 (Nếu muốn giữ hybrid):**
```bash
# Implement logic quyết định trong JobPostingAppService.SearchJobsAsync()
# Update GetFilteredJobsAsync() để support SalaryDeal và ExperienceRequired
```

---

## **VÍ DỤ CỤ THỂ:**

### **User filter KHÔNG CÓ keyword:**

```json
POST /api/jobs/search
{
    "keyword": null,  // ← KHÔNG CÓ KEYWORD
    "categoryIds": ["guid-backend"],
    "provinceIds": [1],
    "salaryFilter": "Range10To15",
    "experienceFilter": "TwoYear"
}
```

**Hiện tại:**
```
→ Vẫn dùng Lucene (vì chỉ có 1 luồng)
→ Lucene filter theo category + province + salary range + experience
→ Trả về kết quả (KHÔNG CÓ relevance score vì không có keyword)
```

**Nếu dùng hybrid:**
```
→ Check: keyword == null
→ Gọi Repository.GetFilteredJobsAsync()
→ Database query với WHERE clauses
→ Trả về kết quả
```

Nhưng **Lucene vẫn nhanh hơn** trong trường hợp này! Nên không cần thiết.

---

## **TÓM TẮT ĐÁP ÁN:**

### **1. Tại sao GetFilteredJobsAsync() không được gọi?**
- Vì tôi chỉ implement phần Lucene
- Chưa implement logic quyết định dùng Lucene hay Database
- Lucene đủ nhanh cho mọi case nên không cần database filter

### **2. Nên làm gì?**
- **RECOMMEND:** Xóa `GetFilteredJobsAsync()` (không cần thiết)
- Chỉ dùng Lucene cho mọi search/filter
- Giữ các methods khác: `GetJobsByIdsAsync()`, `GetByIdAsync()`, `GetRelatedJobsAsync()`

### **3. Lucene có chậm không nếu không có keyword?**
- **KHÔNG!** Lucene vẫn nhanh vì:
  - Inverted index cho tất cả fields (không chỉ text)
  - Filter bằng exact term match (không phải full-text scan)
  - Có thể sort/paginate nhanh

→ **Dùng Lucene cho mọi trường hợp là hợp lý!** ✅




