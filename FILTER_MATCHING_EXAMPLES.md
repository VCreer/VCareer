# 🎯 GIẢI THÍCH FILTER MATCHING - VÍ DỤ CỤ THỂ

## **❓ CÂU HỎI CỦA BẠN:**

1. **Job có lương 9-12 triệu** → Sẽ match filter nào?
2. **Job "Lương thỏa thuận"** → Sẽ match filter nào?
3. **Job "Không yêu cầu kinh nghiệm"** → Sẽ match filter nào?
4. **Có cần thiết kế lại `Job_Posting` không?**

---

## ✅ **THIẾT KẾ HIỆN TẠI ĐÃ ĐÚNG - KHÔNG CẦN THAY ĐỔI!**

### **Model `Job_Posting` hiện tại:**

```csharp
public class Job_Posting
{
    // ============================================
    // ✅ LƯƠNG - ĐÃ SUPPORT ĐẦY ĐỦ
    // ============================================
    public decimal? SalaryMin { get; set; }      // Dùng để filter
    public decimal? SalaryMax { get; set; }      // Dùng để filter
    public bool SalaryDeal { get; set; }         // TRUE = "Thỏa thuận"
    public string SalaryText { get; set; }       // Text hiển thị (auto-generated)
    
    // ============================================
    // ✅ KINH NGHIỆM - ĐÃ SUPPORT ĐẦY ĐỦ
    // ============================================
    public int? ExperienceYearsMin { get; set; } // Dùng để filter
    public int? ExperienceYearsMax { get; set; } // Dùng để filter
    public bool ExperienceRequired { get; set; } // FALSE = "Không yêu cầu"
    public string ExperienceText { get; set; }   // Text hiển thị (auto-generated)
    
    // Helper methods
    public void GenerateSalaryText() { ... }
    public void GenerateExperienceText() { ... }
}
```

### **👉 KẾT LUẬN: KHÔNG CẦN THIẾT KẾ LẠI!**

Thiết kế này:
- ✅ Support cả "Thỏa thuận" và "Cụ thể"
- ✅ Support cả "Không yêu cầu" và "Cụ thể"
- ✅ Có text hiển thị sẵn (`SalaryText`, `ExperienceText`)
- ✅ Có min/max để filter chính xác

---

## 📊 **VÍ DỤ 1: JOB LƯƠNG 9-12 TRIỆU**

### **Recruiter tạo job:**

```csharp
POST /api/admin/jobs/create
{
    "title": "Backend Developer",
    "salaryMin": 9,
    "salaryMax": 12,
    "salaryDeal": false,  // KHÔNG thỏa thuận
    ...
}

// Server tự động generate:
job.GenerateSalaryText(); 
// → SalaryText = "Lương từ 9 đến 12 triệu"
```

### **Job được lưu trong DB:**

| Field | Value |
|-------|-------|
| `SalaryMin` | 9 |
| `SalaryMax` | 12 |
| `SalaryDeal` | false |
| `SalaryText` | "Lương từ 9 đến 12 triệu" |

### **Lucene index:**

```
JobId: guid-123
Title: "Backend Developer"
SalaryMin: 9.0 (DoubleField)
SalaryMax: 12.0 (DoubleField)
SalaryDeal: "False" (StringField)
SalaryText: "Lương từ 9 đến 12 triệu" (TextField - cho hiển thị)
```

### **User filter - Job này sẽ match:**

| User chọn | Job 9-12 match? | Logic |
|-----------|----------------|-------|
| **Tất cả** | ✅ YES | Không filter → match tất cả |
| **Dưới 10 triệu** | ✅ YES | `SalaryMax < 10` OR `SalaryDeal = true`<br/>→ 12 < 10? NO, nhưng overlap với dưới 10<br/>→ **Logic sai! Cần fix!** |
| **10 - 15 triệu** | ✅ YES | `SalaryMax >= 10 AND SalaryMin <= 15`<br/>→ 12 >= 10 ✅ AND 9 <= 15 ✅ → **MATCH** |
| **15 - 20 triệu** | ❌ NO | `SalaryMax >= 15 AND SalaryMin <= 20`<br/>→ 12 >= 15? ❌ → **NO MATCH** |
| **20 - 30 triệu** | ❌ NO | `SalaryMax >= 20 AND SalaryMin <= 30`<br/>→ 12 >= 20? ❌ → **NO MATCH** |
| **Trên 50 triệu** | ❌ NO | `SalaryMin >= 50`<br/>→ 9 >= 50? ❌ → **NO MATCH** |
| **Thỏa thuận** | ❌ NO | `SalaryDeal = true`<br/>→ false = true? ❌ → **NO MATCH** |

### **⚠️ VẤN ĐỀ VỚI "DƯỚI 10 TRIỆU":**

**Logic hiện tại (SAI):**
```csharp
case SalaryFilterType.Under10:
    // SalaryMax < 10 HOẶC SalaryDeal = true
    salaryQuery.Add(new TermQuery(new Term("SalaryDeal", "True")), Occur.SHOULD);
    salaryQuery.Add(NumericRangeQuery.NewDoubleRange("SalaryMax", null, 10.0, true, false), Occur.SHOULD);
    break;
```

**Vấn đề:**
- Job 9-12: SalaryMax = 12 > 10 → KHÔNG MATCH
- Nhưng job này có lương từ 9 (< 10) → NÊN MATCH!

**Logic đúng phải là:**
```csharp
case SalaryFilterType.Under10:
    // Job có một phần lương < 10 (overlap)
    // Logic: SalaryMin < 10 OR SalaryDeal = true
    salaryQuery.Add(new TermQuery(new Term("SalaryDeal", "True")), Occur.SHOULD);
    salaryQuery.Add(NumericRangeQuery.NewDoubleRange("SalaryMin", null, 10.0, true, false), Occur.SHOULD);
    break;
```

---

## 📊 **VÍ DỤ 2: JOB "LƯƠNG THỎA THUẬN"**

### **Recruiter tạo job:**

```csharp
POST /api/admin/jobs/create
{
    "title": "Senior Manager",
    "salaryMin": null,     // KHÔNG nhập
    "salaryMax": null,     // KHÔNG nhập
    "salaryDeal": true,    // ✅ CHECK "Thỏa thuận"
    ...
}

// Server tự động generate:
job.GenerateSalaryText(); 
// → SalaryText = "Lương thỏa thuận"
```

### **Job được lưu trong DB:**

| Field | Value |
|-------|-------|
| `SalaryMin` | NULL |
| `SalaryMax` | NULL |
| `SalaryDeal` | **true** |
| `SalaryText` | "Lương thỏa thuận" |

### **User filter - Job này sẽ match:**

| User chọn | Job "Thỏa thuận" match? | Logic |
|-----------|------------------------|-------|
| **Tất cả** | ✅ YES | Không filter |
| **Dưới 10 triệu** | ✅ YES | `SalaryDeal = true` → **MATCH** |
| **10 - 15 triệu** | ✅ YES | `SalaryDeal = true` → **MATCH** |
| **15 - 20 triệu** | ✅ YES | `SalaryDeal = true` → **MATCH** |
| **20 - 30 triệu** | ✅ YES | `SalaryDeal = true` → **MATCH** |
| **30 - 50 triệu** | ✅ YES | `SalaryDeal = true` → **MATCH** |
| **Trên 50 triệu** | ✅ YES | `SalaryDeal = true` → **MATCH** |
| **Thỏa thuận** | ✅ YES | `SalaryDeal = true` → **MATCH** |

**👉 Job "Thỏa thuận" match TẤT CẢ filters!** (Đúng logic!)

---

## 📊 **VÍ DỤ 3: JOB "KHÔNG YÊU CẦU KINH NGHIỆM"**

### **Recruiter tạo job:**

```csharp
POST /api/admin/jobs/create
{
    "title": "Internship",
    "experienceYearsMin": null,      // KHÔNG nhập
    "experienceYearsMax": null,      // KHÔNG nhập
    "experienceRequired": false,     // ✅ KHÔNG YÊU CẦU
    ...
}

// Server tự động generate:
job.GenerateExperienceText(); 
// → ExperienceText = "Không yêu cầu kinh nghiệm"
```

### **Job được lưu trong DB:**

| Field | Value |
|-------|-------|
| `ExperienceYearsMin` | NULL |
| `ExperienceYearsMax` | NULL |
| `ExperienceRequired` | **false** |
| `ExperienceText` | "Không yêu cầu kinh nghiệm" |

### **User filter - Job này sẽ match:**

| User chọn | Job "Không yêu cầu" match? | Logic |
|-----------|---------------------------|-------|
| **Tất cả** | ✅ YES | Không filter |
| **Không yêu cầu** | ✅ YES | `ExperienceRequired = false` → **MATCH** |
| **Dưới 1 năm** | ✅ YES | `ExperienceRequired = false` → **MATCH** |
| **1 năm** | ✅ YES | `ExperienceRequired = false` → **MATCH** |
| **2 năm** | ✅ YES | `ExperienceRequired = false` → **MATCH** |
| **3 năm** | ✅ YES | `ExperienceRequired = false` → **MATCH** |
| **4 năm** | ✅ YES | `ExperienceRequired = false` → **MATCH** |
| **5 năm** | ✅ YES | `ExperienceRequired = false` → **MATCH** |
| **Trên 5 năm** | ❌ NO | `ExperienceMin > 5` → NULL > 5? ❌ → **NO MATCH** |

**👉 Job "Không yêu cầu" match hầu hết filters (trừ "Trên 5 năm")!** (Đúng logic!)

---

## 📊 **VÍ DỤ 4: JOB KINH NGHIỆM 2-5 NĂM**

### **Recruiter tạo job:**

```csharp
POST /api/admin/jobs/create
{
    "title": "Senior Developer",
    "experienceYearsMin": 2,
    "experienceYearsMax": 5,
    "experienceRequired": true,    // ✅ YÊU CẦU
    ...
}

// Server tự động generate:
job.GenerateExperienceText(); 
// → ExperienceText = "Kinh nghiệm từ 2 đến 5 năm"
```

### **Job được lưu trong DB:**

| Field | Value |
|-------|-------|
| `ExperienceYearsMin` | 2 |
| `ExperienceYearsMax` | 5 |
| `ExperienceRequired` | **true** |
| `ExperienceText` | "Kinh nghiệm từ 2 đến 5 năm" |

### **User filter - Job này sẽ match:**

| User chọn | Job 2-5 năm match? | Logic |
|-----------|-------------------|-------|
| **Tất cả** | ✅ YES | Không filter |
| **Không yêu cầu** | ❌ NO | `ExperienceRequired = false` → true ≠ false → **NO MATCH** |
| **Dưới 1 năm** | ❌ NO | `ExperienceMax < 1` → 5 < 1? ❌ → **NO MATCH** |
| **1 năm** | ❌ NO | `ExperienceMin <= 1 AND ExperienceMax >= 1` → 2 <= 1? ❌ → **NO MATCH** |
| **2 năm** | ✅ YES | `ExperienceMin <= 2 AND ExperienceMax >= 2` → 2 <= 2 ✅ AND 5 >= 2 ✅ → **MATCH** |
| **3 năm** | ✅ YES | `ExperienceMin <= 3 AND ExperienceMax >= 3` → 2 <= 3 ✅ AND 5 >= 3 ✅ → **MATCH** |
| **4 năm** | ✅ YES | `ExperienceMin <= 4 AND ExperienceMax >= 4` → 2 <= 4 ✅ AND 5 >= 4 ✅ → **MATCH** |
| **5 năm** | ✅ YES | `ExperienceMin <= 5 AND ExperienceMax >= 5` → 2 <= 5 ✅ AND 5 >= 5 ✅ → **MATCH** |
| **Trên 5 năm** | ❌ NO | `ExperienceMin > 5` → 2 > 5? ❌ → **NO MATCH** |

---

## 🔧 **CẦN FIX LOGIC "DƯỚI 10 TRIỆU"**

### **Vấn đề:**

Job lương 9-12 triệu:
- ❌ Hiện tại: KHÔNG match "Dưới 10 triệu" (vì SalaryMax = 12 > 10)
- ✅ Nên: MATCH "Dưới 10 triệu" (vì SalaryMin = 9 < 10)

### **Fix code:**

```csharp
case SalaryFilterType.Under10:
    // Job có lương MIN < 10 (tức có một phần < 10)
    // HOẶC SalaryDeal = true
    salaryQuery.Add(new TermQuery(new Term("SalaryDeal", "True")), Occur.SHOULD);
    salaryQuery.Add(NumericRangeQuery.NewDoubleRange("SalaryMin", null, 10.0, true, false), Occur.SHOULD);
    break;
```

Tương tự cho các range khác nếu cần!

---

## 📋 **BẢNG TỔNG HỢP MATCHING**

### **LƯƠNG:**

| Job | Tất cả | <10 | 10-15 | 15-20 | 20-30 | 30-50 | >50 | Thỏa thuận |
|-----|--------|-----|-------|-------|-------|-------|-----|-----------|
| **9-12 triệu** | ✅ | ✅* | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **15-25 triệu** | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Thỏa thuận** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

*Cần fix logic!

### **KINH NGHIỆM:**

| Job | Tất cả | Không YC | <1 | 1 | 2 | 3 | 4 | 5 | >5 |
|-----|--------|----------|----|----|---|---|---|---|-----|
| **Không yêu cầu** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **2-5 năm** | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **6-10 năm** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## ✅ **KẾT LUẬN:**

### **1. Thiết kế Job_Posting:**
**✅ KHÔNG CẦN THAY ĐỔI!** Model hiện tại đã perfect:
- `SalaryDeal` (bool) cho "Thỏa thuận"
- `SalaryMin/Max` cho "Cụ thể"
- `ExperienceRequired` (bool) cho "Không yêu cầu"
- `ExperienceYearsMin/Max` cho "Cụ thể"

### **2. Filter logic:**
**✅ ĐÃ ĐÚNG** (chỉ cần fix nhỏ cho "Dưới 10 triệu")

### **3. Lucene index:**
**✅ ĐÃ ĐÚNG** - Index đầy đủ các fields cần thiết

### **4. Cần làm:**
**🔧 FIX LOGIC "DƯỚI 10 TRIỆU"** trong Lucene filter

---

## 🎯 **HÀNH ĐỘNG TIẾP THEO:**

1. ✅ Giữ nguyên thiết kế `Job_Posting`
2. 🔧 Fix logic "Dưới 10 triệu" trong Lucene
3. ✅ Test kỹ các cases edge (9-12, thỏa thuận, không yêu cầu...)




