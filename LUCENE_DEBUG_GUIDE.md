# 🐛 LUCENE - HƯỚNG DẪN DEBUG & VERIFY

## 📌 MỤC LỤC
1. [Kiểm tra Index đã được tạo chưa](#1-kiểm-tra-index-đã-được-tạo-chưa)
2. [Xem nội dung của 1 Document](#2-xem-nội-dung-của-1-document)
3. [Test Query trực tiếp](#3-test-query-trực-tiếp)
4. [Debug tại sao không tìm thấy kết quả](#4-debug-tại-sao-không-tìm-thấy-kết-quả)
5. [Công cụ debug Lucene](#5-công-cụ-debug-lucene)

---

## 1. KIỂM TRA INDEX ĐÃ ĐƯỢC TẠO CHƯA

### 📂 **Vị trí Index:**
```
D:\Angular_2023\VCareer\src\VCareer.HttpApi.Host\bin\Debug\net8.0\App_Data\LuceneIndex\
```

### ✅ **Kiểm tra thư mục:**
```
LuceneIndex/
  ├── segments_1           ← Metadata file
  ├── _0.cfs               ← Compound file (chứa data)
  ├── _0.cfe               ← Compound file entries
  └── write.lock           ← Lock file (đang mở)
```

**Nếu thư mục rỗng hoặc không có file:**
→ Index chưa được tạo! Cần gọi API rebuild index.

---

## 2. XEM NỘI DUNG CỦA 1 DOCUMENT

### 📝 **Thêm method debug vào `LuceneJobIndexer.cs`:**

```csharp
/// <summary>
/// DEBUG: Xem nội dung của 1 document trong index
/// </summary>
public async Task<Dictionary<string, string>> GetDocumentFieldsAsync(Guid jobId)
{
    using var reader = DirectoryReader.Open(_directory);
    var searcher = new IndexSearcher(reader);
    
    // Tìm document theo JobId
    var query = new TermQuery(new Term("JobId", jobId.ToString()));
    var hits = searcher.Search(query, 1);
    
    if (hits.TotalHits == 0)
        return new Dictionary<string, string> { { "Error", "Document not found" } };
    
    // Lấy document
    var doc = searcher.Doc(hits.ScoreDocs[0].Doc);
    
    // Extract tất cả fields
    var fields = new Dictionary<string, string>();
    foreach (var field in doc.Fields)
    {
        fields[field.Name] = field.GetStringValue() ?? field.GetNumericValue()?.ToString() ?? "NULL";
    }
    
    return fields;
}
```

### 🔍 **Gọi từ API (Controller):**

```csharp
[HttpGet("debug/{jobId}")]
public async Task<Dictionary<string, string>> DebugDocument(Guid jobId)
{
    return await _luceneJobIndexer.GetDocumentFieldsAsync(jobId);
}
```

### 📤 **Test:**
```http
GET https://localhost:5001/api/jobs/debug/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

### 📋 **Response:**
```json
{
    "JobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "Title": "Tuyển Backend Developer PHP Laravel",
    "Description": "Công ty ABC tuyển lập trình viên...",
    "Experience": "3",
    "ExperienceText": "2 năm kinh nghiệm",
    "SalaryMin": "15.0",
    "SalaryMax": "25.0",
    "SalaryDeal": "False",
    "SalaryText": "Lương từ 15 đến 25 triệu",
    "EmploymentType": "2",
    "PositionType": "1",
    "IsUrgent": "True"
}
```

**✅ Kiểm tra:**
- Tất cả fields đã được index?
- Giá trị đúng chưa?
- `Experience` = "3" (string) hay 3 (number)?

---

## 3. TEST QUERY TRỰC TIẾP

### 🧪 **Thêm method test query:**

```csharp
/// <summary>
/// DEBUG: Test query trực tiếp (không qua filters)
/// </summary>
public async Task<List<(Guid JobId, float Score)>> TestQueryAsync(string rawQuery)
{
    using var reader = DirectoryReader.Open(_directory);
    var searcher = new IndexSearcher(reader);
    
    // Parse query string
    var parser = new QueryParser(AppLuceneVersion, "Title", _analyzer);
    var query = parser.Parse(rawQuery);
    
    Console.WriteLine($"[DEBUG] Parsed Query: {query}");
    
    // Execute search
    var hits = searcher.Search(query, 20);
    
    // Extract results
    var results = new List<(Guid JobId, float Score)>();
    foreach (var hit in hits.ScoreDocs)
    {
        var doc = searcher.Doc(hit.Doc);
        var jobId = Guid.Parse(doc.Get("JobId"));
        results.Add((jobId, hit.Score));
    }
    
    return results;
}
```

### 🔍 **Các query test:**

#### **Test 1: Tìm từ đơn**
```csharp
var results = await TestQueryAsync("backend");
// Kỳ vọng: Tìm thấy tất cả jobs có "backend" trong Title
```

#### **Test 2: Tìm nhiều từ (AND)**
```csharp
var results = await TestQueryAsync("backend AND php");
// Kỳ vọng: Chỉ tìm jobs có CẢ "backend" VÀ "php"
```

#### **Test 3: Tìm nhiều từ (OR)**
```csharp
var results = await TestQueryAsync("backend OR php");
// Kỳ vọng: Tìm jobs có "backend" HOẶC "php"
```

#### **Test 4: Tìm theo field cụ thể**
```csharp
var results = await TestQueryAsync("Title:backend");
// Kỳ vọng: Chỉ tìm trong Title (không tìm Description)
```

#### **Test 5: Tìm theo Experience**
```csharp
var results = await TestQueryAsync("Experience:3");
// Kỳ vọng: Tìm jobs có Experience = 3 (Year2)
```

#### **Test 6: Tìm ExperienceText**
```csharp
var results = await TestQueryAsync("ExperienceText:\"2 năm\"");
// Kỳ vọng: Tìm jobs có "2 năm" trong ExperienceText
```

---

## 4. DEBUG TẠI SAO KHÔNG TÌM THẤY KẾT QUẢ

### 🔴 **Vấn đề 1: Gõ "it" không ra kết quả**

#### **Nguyên nhân:**
- `StandardAnalyzer` có stop words tiếng Anh
- "it" bị coi là stop word → BỎ QUA khi index

#### **Giải pháp:**
```csharp
// ❌ SAI:
_analyzer = new StandardAnalyzer(AppLuceneVersion);

// ✅ ĐÚNG:
_analyzer = new StandardAnalyzer(AppLuceneVersion, CharArraySet.EMPTY_SET);
```

#### **Verify:**
```csharp
// Test analyzer
var stream = _analyzer.GetTokenStream("Title", "Tuyển IT Developer");
stream.Reset();
while (stream.IncrementToken())
{
    var term = stream.GetAttribute<ICharTermAttribute>();
    Console.WriteLine($"Token: {term}");
}
// Output:
// Token: tuyển
// Token: it      ← Có "it" → OK!
// Token: developer
```

---

### 🔴 **Vấn đề 2: Search "2 năm" không ra kết quả**

#### **Nguyên nhân:**
- `Experience` dùng **StringField** (không tách từ)
- Không thể search "2 năm" trong StringField
- Phải search trong **ExperienceText** (TextField)

#### **Giải pháp:**
```csharp
// ❌ SAI: Tìm trong Experience (StringField)
var query = new TermQuery(new Term("Experience", "2 năm"));

// ✅ ĐÚNG: Tìm trong ExperienceText (TextField)
var parser = new QueryParser(AppLuceneVersion, "ExperienceText", _analyzer);
var query = parser.Parse("\"2 năm\"");
```

---

### 🔴 **Vấn đề 3: Filter Experience = 10 nhưng match cả Experience = 1**

#### **Nguyên nhân:**
- `Experience` dùng **TextField** (tách từ)
- "10" bị tách thành ["1", "0"]
- Filter Experience = 1 → Match cả "10" (vì có token "1")

#### **Giải pháp:**
```csharp
// ❌ SAI: Dùng TextField
doc.Add(new TextField("Experience", "10", Field.Store.YES));

// ✅ ĐÚNG: Dùng StringField (nguyên khối)
doc.Add(new StringField("Experience", "10", Field.Store.YES));
```

---

### 🔴 **Vấn đề 4: Lương từ 15-25 triệu, nhưng filter "10-15 triệu" không match**

#### **Nguyên nhân:**
- Logic filter sai (chỉ kiểm tra `SalaryMin` hoặc `SalaryMax`)
- Phải kiểm tra **overlap** (giao nhau)

#### **Giải pháp:**
```csharp
// ❌ SAI: Chỉ kiểm tra SalaryMin
query.Add(NumericRangeQuery.NewDoubleRange("SalaryMin", 10.0, 15.0, true, true));

// ✅ ĐÚNG: Kiểm tra overlap
// Job (SalaryMin=15, SalaryMax=25) overlap với filter (10-15)?
// → 15 nằm trong [10, 15] → MATCH!
var salaryQuery = new BooleanQuery();
salaryQuery.Add(
    NumericRangeQuery.NewDoubleRange("SalaryMin", null, 15.0, true, false),  // Min <= 15
    Occur.MUST
);
salaryQuery.Add(
    NumericRangeQuery.NewDoubleRange("SalaryMax", 10.0, null, true, true),   // Max >= 10
    Occur.MUST
);
```

---

### 🔴 **Vấn đề 5: Rebuild index nhưng vẫn thấy data cũ**

#### **Nguyên nhân:**
- Index file bị cache
- Lock file còn tồn tại

#### **Giải pháp:**
```bash
# 1. Dừng application
# 2. Xóa toàn bộ thư mục index
rm -rf D:\Angular_2023\VCareer\src\VCareer.HttpApi.Host\bin\Debug\net8.0\App_Data\LuceneIndex\*

# 3. Chạy lại application
# 4. Gọi API rebuild index
```

---

## 5. CÔNG CỤ DEBUG LUCENE

### 🔧 **Tool 1: Luke (Lucene Index Toolbox)**

**Download:** https://github.com/DmitryKey/luke/releases

**Cách dùng:**
1. Mở Luke
2. Browse → Chọn thư mục `LuceneIndex`
3. Xem:
   - **Documents:** Tất cả documents trong index
   - **Search:** Test query trực tiếp
   - **Analyzer:** Test analyzer (phân tách từ)

**Screenshot:**
```
┌─────────────────────────────────────────────────────┐
│ Luke - Lucene Index Toolbox                         │
├─────────────────────────────────────────────────────┤
│ Documents: 150                                       │
│ Fields: JobId, Title, Description, Experience...    │
├─────────────────────────────────────────────────────┤
│ Search:                                              │
│   Query: Title:backend                               │
│   Results: 25 documents                              │
├─────────────────────────────────────────────────────┤
│ Document #5:                                         │
│   JobId: a1b2c3d4-e5f6-7890-abcd-ef1234567890      │
│   Title: Tuyển Backend Developer PHP Laravel        │
│   Experience: 3                                      │
│   ExperienceText: 2 năm kinh nghiệm                 │
└─────────────────────────────────────────────────────┘
```

---

### 🔧 **Tool 2: Custom Debug Endpoint**

**Thêm vào Controller:**
```csharp
[HttpGet("lucene/stats")]
public async Task<object> GetLuceneStats()
{
    using var reader = DirectoryReader.Open(_directory);
    
    return new
    {
        TotalDocs = reader.NumDocs,
        MaxDoc = reader.MaxDoc,
        HasDeletions = reader.HasDeletions,
        Version = reader.Version,
        Fields = GetAllFields(reader)
    };
}

private List<string> GetAllFields(DirectoryReader reader)
{
    var fields = new HashSet<string>();
    for (int i = 0; i < reader.MaxDoc; i++)
    {
        if (reader.IsDeleted(i)) continue;
        
        var doc = reader.Document(i);
        foreach (var field in doc.Fields)
        {
            fields.Add(field.Name);
        }
    }
    return fields.ToList();
}
```

**Response:**
```json
{
    "totalDocs": 150,
    "maxDoc": 150,
    "hasDeletions": false,
    "version": 1,
    "fields": [
        "JobId",
        "Title",
        "Description",
        "Experience",
        "ExperienceText",
        "SalaryMin",
        "SalaryMax",
        "SalaryText",
        "EmploymentType",
        "PositionType"
    ]
}
```

---

### 🔧 **Tool 3: Log Query & Results**

**Thêm log vào `SearchAsync()`:**
```csharp
public async Task<(List<Guid> jobIds, long totalCount)> SearchAsync(...)
{
    // ... build query
    
    // LOG QUERY
    Console.WriteLine("========================================");
    Console.WriteLine($"[LUCENE] Query: {searchQuery}");
    Console.WriteLine($"[LUCENE] Sort: {sortBy}");
    Console.WriteLine("========================================");
    
    // Execute search
    var hits = searcher.Search(searchQuery, maxResults, sort);
    
    // LOG RESULTS
    Console.WriteLine($"[LUCENE] Total Hits: {hits.TotalHits}");
    for (int i = 0; i < Math.Min(5, hits.ScoreDocs.Length); i++)
    {
        var doc = searcher.Doc(hits.ScoreDocs[i].Doc);
        Console.WriteLine($"[LUCENE]   #{i+1}: {doc.Get("Title")} (Score: {hits.ScoreDocs[i].Score})");
    }
    Console.WriteLine("========================================");
    
    // ... extract jobIds
}
```

**Console Output:**
```
========================================
[LUCENE] Query: +(Title:backend Description:backend) +(Experience:3)
[LUCENE] Sort: relevance
========================================
[LUCENE] Total Hits: 15
[LUCENE]   #1: Tuyển Backend Developer PHP Laravel (Score: 9.5)
[LUCENE]   #2: Senior Backend Developer (Score: 7.2)
[LUCENE]   #3: Backend Developer (Java/PHP) (Score: 5.8)
[LUCENE]   #4: Fullstack Developer (Backend focus) (Score: 4.1)
[LUCENE]   #5: Backend Intern (Score: 3.2)
========================================
```

---

## 🎯 CHECKLIST DEBUG

### ✅ **Khi search không ra kết quả:**

- [ ] Index đã được tạo chưa? (Kiểm tra thư mục `LuceneIndex`)
- [ ] Document đã được index chưa? (Gọi API debug document)
- [ ] Query đúng chưa? (Log query ra console)
- [ ] Analyzer có stop words không? (Test tokenize)
- [ ] Field type đúng chưa? (TextField vs StringField)
- [ ] Field có `Store.YES` không? (Nếu cần hiển thị)
- [ ] Filter logic đúng chưa? (Overlap cho range queries)

### ✅ **Khi kết quả sai thứ tự:**

- [ ] Sort đúng field chưa? (Score, Salary, Date?)
- [ ] Repository giữ nguyên thứ tự từ Lucene chưa?
- [ ] Score calculation đúng chưa? (Boost các fields)

### ✅ **Khi performance chậm:**

- [ ] Index có quá nhiều documents? (> 1 triệu)
- [ ] Query có quá nhiều OR clauses? (> 1000)
- [ ] Có dùng Wildcard query không? (`*backend*` → chậm)
- [ ] Có dùng Fuzzy search không? (`backend~` → chậm)

---

🐛 **Giờ bạn có thể debug Lucene một cách chuyên nghiệp!**


