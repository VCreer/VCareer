# 👨‍💼 LUỒNG RECRUITER TẠO JOB - UI & LOGIC

## **📝 FORM TẠO JOB (UI)**

### **1. PHẦN LƯƠNG:**

```
┌─────────────────────────────────────────────┐
│ MỨC LƯƠNG:                                  │
│                                             │
│ ☐ Lương thỏa thuận                         │
│                                             │
│ ☐ Mức lương cụ thể:                        │
│   ┌──────────┐         ┌──────────┐       │
│   │ Từ: ____ │ triệu - │ Đến: ___ │ triệu │
│   └──────────┘         └──────────┘       │
└─────────────────────────────────────────────┘
```

### **2. PHẦN KINH NGHIỆM:**

```
┌─────────────────────────────────────────────┐
│ KINH NGHIỆM:                                │
│                                             │
│ ☐ Không yêu cầu kinh nghiệm                │
│                                             │
│ ☐ Yêu cầu kinh nghiệm:                     │
│   ┌──────────┐         ┌──────────┐       │
│   │ Từ: ____ │ năm   - │ Đến: ___ │ năm   │
│   └──────────┘         └──────────┘       │
└─────────────────────────────────────────────┘
```

---

## **📊 CASE 1: LƯƠNG THỎA THUẬN**

### **Recruiter chọn:**
```
✅ Lương thỏa thuận
☐ Mức lương cụ thể: [disabled]
```

### **FE gửi API:**
```json
POST /api/admin/jobs/create
{
    "title": "Senior Manager",
    "salaryMin": null,
    "salaryMax": null,
    "salaryDeal": true,    // ← KEY: TRUE
    ...
}
```

### **BE xử lý:**
```csharp
var job = new Job_Posting
{
    Title = "Senior Manager",
    SalaryMin = null,
    SalaryMax = null,
    SalaryDeal = true,     // ← Thỏa thuận
    ...
};

// Auto-generate text
job.GenerateSalaryText();
// → SalaryText = "Lương thỏa thuận"

await _repository.InsertAsync(job);
await _luceneIndexer.IndexJobAsync(job);
```

### **DB lưu:**
| SalaryMin | SalaryMax | SalaryDeal | SalaryText |
|-----------|-----------|------------|------------|
| NULL | NULL | **TRUE** | "Lương thỏa thuận" |

### **Lucene index:**
```
SalaryMin: 0.0 (default)
SalaryMax: 0.0 (default)
SalaryDeal: "True"
SalaryText: "Lương thỏa thuận"
```

### **User filter → Job này match:**
- ✅ Tất cả
- ✅ Dưới 10 triệu
- ✅ 10-15 triệu
- ✅ 15-20 triệu
- ✅ 20-30 triệu
- ✅ 30-50 triệu
- ✅ Trên 50 triệu
- ✅ Thỏa thuận

**👉 Job "Thỏa thuận" xuất hiện ở MỌI filter!** (Logic: vì không biết lương thực tế)

---

## **📊 CASE 2: LƯƠNG CỤ THỂ 9-12 TRIỆU**

### **Recruiter nhập:**
```
☐ Lương thỏa thuận
✅ Mức lương cụ thể:
   Từ: [9] triệu - Đến: [12] triệu
```

### **FE gửi API:**
```json
POST /api/admin/jobs/create
{
    "title": "Backend Developer",
    "salaryMin": 9,         // ← Nhập cụ thể
    "salaryMax": 12,        // ← Nhập cụ thể
    "salaryDeal": false,    // ← KEY: FALSE
    ...
}
```

### **BE xử lý:**
```csharp
var job = new Job_Posting
{
    Title = "Backend Developer",
    SalaryMin = 9,
    SalaryMax = 12,
    SalaryDeal = false,    // ← KHÔNG thỏa thuận
    ...
};

// Auto-generate text
job.GenerateSalaryText();
// → SalaryText = "Lương từ 9 đến 12 triệu"

await _repository.InsertAsync(job);
await _luceneIndexer.IndexJobAsync(job);
```

### **DB lưu:**
| SalaryMin | SalaryMax | SalaryDeal | SalaryText |
|-----------|-----------|------------|------------|
| **9** | **12** | FALSE | "Lương từ 9 đến 12 triệu" |

### **Lucene index:**
```
SalaryMin: 9.0
SalaryMax: 12.0
SalaryDeal: "False"
SalaryText: "Lương từ 9 đến 12 triệu"
```

### **User filter → Job này match:**
- ✅ Tất cả
- ✅ Dưới 10 triệu (SalaryMin=9 < 10)
- ✅ 10-15 triệu (overlap [9,12] ∩ [10,15] = [10,12])
- ❌ 15-20 triệu
- ❌ 20-30 triệu
- ❌ 30-50 triệu
- ❌ Trên 50 triệu
- ❌ Thỏa thuận (SalaryDeal = false)

**👉 Job chỉ match filters có overlap với [9, 12]**

---

## **📊 CASE 3: KHÔNG YÊU CẦU KINH NGHIỆM**

### **Recruiter chọn:**
```
✅ Không yêu cầu kinh nghiệm
☐ Yêu cầu kinh nghiệm: [disabled]
```

### **FE gửi API:**
```json
POST /api/admin/jobs/create
{
    "title": "Internship",
    "experienceYearsMin": null,
    "experienceYearsMax": null,
    "experienceRequired": false,  // ← KEY: FALSE
    ...
}
```

### **BE xử lý:**
```csharp
var job = new Job_Posting
{
    Title = "Internship",
    ExperienceYearsMin = null,
    ExperienceYearsMax = null,
    ExperienceRequired = false,  // ← Không yêu cầu
    ...
};

// Auto-generate text
job.GenerateExperienceText();
// → ExperienceText = "Không yêu cầu kinh nghiệm"

await _repository.InsertAsync(job);
await _luceneIndexer.IndexJobAsync(job);
```

### **DB lưu:**
| ExperienceYearsMin | ExperienceYearsMax | ExperienceRequired | ExperienceText |
|--------------------|--------------------|--------------------|----------------|
| NULL | NULL | **FALSE** | "Không yêu cầu kinh nghiệm" |

### **User filter → Job này match:**
- ✅ Tất cả
- ✅ Không yêu cầu
- ✅ Dưới 1 năm
- ✅ 1 năm
- ✅ 2 năm
- ✅ 3 năm
- ✅ 4 năm
- ✅ 5 năm
- ❌ Trên 5 năm (logic riêng)

**👉 Job "Không yêu cầu" match hầu hết filters!** (Logic: ai cũng apply được)

---

## **📊 CASE 4: KINH NGHIỆM 2-5 NĂM**

### **Recruiter nhập:**
```
☐ Không yêu cầu kinh nghiệm
✅ Yêu cầu kinh nghiệm:
   Từ: [2] năm - Đến: [5] năm
```

### **FE gửi API:**
```json
POST /api/admin/jobs/create
{
    "title": "Senior Developer",
    "experienceYearsMin": 2,
    "experienceYearsMax": 5,
    "experienceRequired": true,  // ← KEY: TRUE
    ...
}
```

### **BE xử lý:**
```csharp
var job = new Job_Posting
{
    Title = "Senior Developer",
    ExperienceYearsMin = 2,
    ExperienceYearsMax = 5,
    ExperienceRequired = true,  // ← Yêu cầu
    ...
};

// Auto-generate text
job.GenerateExperienceText();
// → ExperienceText = "Kinh nghiệm từ 2 đến 5 năm"

await _repository.InsertAsync(job);
await _luceneIndexer.IndexJobAsync(job);
```

### **DB lưu:**
| ExperienceYearsMin | ExperienceYearsMax | ExperienceRequired | ExperienceText |
|--------------------|--------------------|--------------------|----------------|
| **2** | **5** | TRUE | "Kinh nghiệm từ 2 đến 5 năm" |

### **User filter → Job này match:**
- ✅ Tất cả
- ❌ Không yêu cầu (ExperienceRequired = true)
- ❌ Dưới 1 năm
- ❌ 1 năm
- ✅ 2 năm (overlap [2,5] ∩ [2,2] = [2])
- ✅ 3 năm (overlap [2,5] ∩ [3,3] = [3])
- ✅ 4 năm (overlap [2,5] ∩ [4,4] = [4])
- ✅ 5 năm (overlap [2,5] ∩ [5,5] = [5])
- ❌ Trên 5 năm (ExperienceMin=2 not > 5)

**👉 Job chỉ match filters có overlap với [2, 5]**

---

## **🎨 UI VALIDATION**

### **JavaScript validation (FE):**

```javascript
// Khi toggle "Lương thỏa thuận"
function onSalaryDealChange(checked) {
    if (checked) {
        // Disable input lương cụ thể
        document.getElementById('salaryMin').disabled = true;
        document.getElementById('salaryMax').disabled = true;
        document.getElementById('salaryMin').value = '';
        document.getElementById('salaryMax').value = '';
    } else {
        // Enable input lương cụ thể
        document.getElementById('salaryMin').disabled = false;
        document.getElementById('salaryMax').disabled = false;
    }
}

// Khi toggle "Không yêu cầu kinh nghiệm"
function onExperienceRequiredChange(checked) {
    if (!checked) {  // Không yêu cầu
        // Disable input kinh nghiệm cụ thể
        document.getElementById('experienceMin').disabled = true;
        document.getElementById('experienceMax').disabled = true;
        document.getElementById('experienceMin').value = '';
        document.getElementById('experienceMax').value = '';
    } else {
        // Enable input kinh nghiệm cụ thể
        document.getElementById('experienceMin').disabled = false;
        document.getElementById('experienceMax').disabled = false;
    }
}
```

### **Submit logic:**

```javascript
function submitJob() {
    const salaryDeal = document.getElementById('salaryDeal').checked;
    const experienceRequired = document.getElementById('experienceRequired').checked;
    
    const jobData = {
        title: document.getElementById('title').value,
        
        // LƯƠNG
        salaryDeal: salaryDeal,
        salaryMin: salaryDeal ? null : parseFloat(document.getElementById('salaryMin').value),
        salaryMax: salaryDeal ? null : parseFloat(document.getElementById('salaryMax').value),
        
        // KINH NGHIỆM
        experienceRequired: experienceRequired,
        experienceYearsMin: experienceRequired ? parseInt(document.getElementById('experienceMin').value) : null,
        experienceYearsMax: experienceRequired ? parseInt(document.getElementById('experienceMax').value) : null,
        
        // ... other fields
    };
    
    // Validation
    if (!salaryDeal) {
        if (!jobData.salaryMin || !jobData.salaryMax) {
            alert('Vui lòng nhập mức lương!');
            return;
        }
        if (jobData.salaryMin > jobData.salaryMax) {
            alert('Lương tối thiểu phải nhỏ hơn lương tối đa!');
            return;
        }
    }
    
    if (experienceRequired) {
        if (!jobData.experienceYearsMin || !jobData.experienceYearsMax) {
            alert('Vui lòng nhập số năm kinh nghiệm!');
            return;
        }
        if (jobData.experienceYearsMin > jobData.experienceYearsMax) {
            alert('Kinh nghiệm tối thiểu phải nhỏ hơn kinh nghiệm tối đa!');
            return;
        }
    }
    
    // Call API
    fetch('/api/admin/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData)
    });
}
```

---

## **✅ KẾT LUẬN:**

### **Thiết kế Job_Posting HOÀN HẢO - KHÔNG CẦN SỬA!**

```csharp
public class Job_Posting
{
    // ✅ Support cả "Thỏa thuận" và "Cụ thể"
    public decimal? SalaryMin { get; set; }
    public decimal? SalaryMax { get; set; }
    public bool SalaryDeal { get; set; }        // ← KEY
    public string SalaryText { get; set; }      // ← Auto-generated
    
    // ✅ Support cả "Không yêu cầu" và "Cụ thể"
    public int? ExperienceYearsMin { get; set; }
    public int? ExperienceYearsMax { get; set; }
    public bool ExperienceRequired { get; set; } // ← KEY
    public string ExperienceText { get; set; }   // ← Auto-generated
}
```

### **Logic filter trong Lucene ĐÃ ĐÚNG:**
- ✅ `SalaryDeal = true` → Match MỌI filters
- ✅ `ExperienceRequired = false` → Match hầu hết filters
- ✅ Range overlap logic → Match chính xác

### **Đã fix:**
- 🔧 Logic "Dưới 10 triệu" → Dùng `SalaryMin < 10` thay vì `SalaryMax < 10`




