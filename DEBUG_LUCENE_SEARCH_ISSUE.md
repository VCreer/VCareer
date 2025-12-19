# Debug Lucene Search - Index Có Data Nhưng Search Không Ra Kết Quả

## 🔍 Vấn Đề
- Index count = 23 (có 23 documents)
- Nhưng khi search với keyword không ra kết quả

## ✅ Đã Thêm Debug Logging

Đã thêm debug logging vào `LuceneCandidateIndexer.cs` để theo dõi:
- Query được build như thế nào
- Số documents trong index
- Số hits từ search
- Lỗi nếu có

## 🔧 Các Nguyên Nhân Có Thể

### 1. **Status/ProfileVisibility Filter Quá Nghiêm**
Query luôn filter `Status = "1"` và `ProfileVisibility = "1"`. Nếu documents trong index không có các field này hoặc giá trị khác, sẽ không match.

**Kiểm tra:**
- Xem documents trong index có field `Status` và `ProfileVisibility` không
- Giá trị có phải là `"1"` không (StringField, không phải boolean)

### 2. **Data Trong Index Rỗng**
Các field searchable (JobTitle, Skills, Location, CvContent) có thể là empty string, nên keyword search không match.

**Kiểm tra:**
- Xem documents có data trong các field: JobTitle, Skills, Location, WorkLocation, CvContent không

### 3. **Analyzer Xử Lý Keyword Sai**
StandardAnalyzer có thể đang xử lý keyword không đúng (lowercase, tokenize, etc.)

### 4. **Query Parser Lỗi**
MultiFieldQueryParser có thể parse keyword sai, đặc biệt với special characters.

## 🧪 Các Bước Debug

### Bước 1: Kiểm Tra Logs
Khi search, xem Output/Debug console hoặc logs:
```
[Lucene] Search query: ...
[Lucene] Index has 23 documents
[Lucene] Search returned X total hits
[Lucene] Parsed X candidate IDs from search results
```

### Bước 2: Test Với MatchAllDocsQuery
Tạm thời comment filter Status/ProfileVisibility để test:

```csharp
// Tạm thời comment để test
// boolQuery.Add(new TermQuery(new Term("Status", "1")), Occur.MUST);
// boolQuery.Add(new TermQuery(new Term("ProfileVisibility", "1")), Occur.MUST);
```

Nếu search ra kết quả → Vấn đề là filter Status/ProfileVisibility

### Bước 3: Test Với Wildcard Query
Thử search với keyword `"*"` (match all):
```json
{
  "keyword": "*",
  "maxResultCount": 10,
  "skipCount": 0
}
```

Nếu ra kết quả → Vấn đề là keyword parsing

### Bước 4: Kiểm Tra Data Trong Index
Xem một document trong index có data gì:

**Cách 1: Thêm method debug vào LuceneCandidateIndexer**
```csharp
public Task<List<Dictionary<string, string>>> GetSampleDocumentsAsync(int count = 5)
{
    try
    {
        using var reader = DirectoryReader.Open(_directory);
        var searcher = new IndexSearcher(reader);
        var docs = new List<Dictionary<string, string>>();
        
        for (int i = 0; i < Math.Min(count, reader.NumDocs); i++)
        {
            var doc = searcher.Doc(i);
            var docDict = new Dictionary<string, string>();
            foreach (var field in doc.Fields)
            {
                docDict[field.Name] = doc.Get(field.Name) ?? "";
            }
            docs.Add(docDict);
        }
        
        return Task.FromResult(docs);
    }
    catch
    {
        return Task.FromResult(new List<Dictionary<string, string>>());
    }
}
```

**Cách 2: Sử dụng Luke (Lucene Index Tool)**
- Download Luke: https://github.com/DmitryKey/luke
- Mở index directory: `bin/Debug/net8.0/App_Data/LuceneCandidateIndex/`
- Xem documents và fields

### Bước 5: Test Với Simple Query
Thử search với query đơn giản:

```csharp
// Trong BuildKeywordQuery, thử return simple query:
return new TermQuery(new Term("JobTitle", keyword.ToLower()));
```

## 🔧 Fix Nhanh - Tạm Thời Bỏ Filter Status/ProfileVisibility

Nếu muốn test nhanh, tạm thời comment filter:

```csharp
private Query BuildSearchQuery(SearchCandidateInputDto input)
{
    var boolQuery = new BooleanQuery();

    // TẠM THỜI COMMENT ĐỂ TEST
    // boolQuery.Add(new TermQuery(new Term("Status", "1")), Occur.MUST);
    // boolQuery.Add(new TermQuery(new Term("ProfileVisibility", "1")), Occur.MUST);

    // ... rest of code
}
```

**Lưu ý:** Chỉ để test, sau đó phải uncomment lại.

## 🔧 Fix Vĩnh Viễn - Kiểm Tra Data Khi Index

Đảm bảo khi index, Status và ProfileVisibility được set đúng:

```csharp
// Trong CreateLuceneDocumentAsync
doc.Add(new StringField("Status", candidate.Status ? "1" : "0", Field.Store.NO));
doc.Add(new StringField("ProfileVisibility", candidate.ProfileVisibility ? "1" : "0", Field.Store.NO));
```

Kiểm tra:
- `candidate.Status` có phải `true` không?
- `candidate.ProfileVisibility` có phải `true` không?

## 📝 Checklist Debug

- [ ] Kiểm tra logs khi search
- [ ] Test với MatchAllDocsQuery (bỏ filter Status/ProfileVisibility)
- [ ] Test với wildcard keyword `"*"`
- [ ] Kiểm tra data trong index (JobTitle, Skills có data không)
- [ ] Kiểm tra Status và ProfileVisibility trong index
- [ ] Test với simple TermQuery thay vì MultiFieldQueryParser
- [ ] Re-index lại để đảm bảo data đúng

## 🎯 Giải Pháp Khả Dĩ

### Giải Pháp 1: Sửa Filter Logic
Nếu documents trong index không có Status/ProfileVisibility đúng, có thể:
- Bỏ filter này trong Lucene (filter ở database level thay vì Lucene)
- Hoặc đảm bảo khi index, chỉ index candidates có Status=true và ProfileVisibility=true

### Giải Pháp 2: Sửa Query Builder
Nếu keyword không match, có thể:
- Sử dụng WildcardQuery thay vì MultiFieldQueryParser
- Hoặc sử dụng FuzzyQuery để match gần đúng

### Giải Pháp 3: Re-index Với Data Đúng
Đảm bảo khi re-index:
- Chỉ index candidates có `Status = true` và `ProfileVisibility = true`
- Đảm bảo các field searchable (JobTitle, Skills, etc.) có data

## 🚀 Quick Test

1. **Test search không có keyword (MatchAllDocsQuery):**
```json
POST /api/candidate-search/search
{
  "keyword": null,
  "maxResultCount": 10,
  "skipCount": 0
}
```

2. **Test search với wildcard:**
```json
POST /api/candidate-search/search
{
  "keyword": "*",
  "maxResultCount": 10,
  "skipCount": 0
}
```

3. **Test search với keyword cụ thể:**
```json
POST /api/candidate-search/search
{
  "keyword": "Java",
  "maxResultCount": 10,
  "skipCount": 0
}
```

Xem logs để biết query được build như thế nào và tại sao không match.














