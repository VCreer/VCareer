# Hướng Dẫn Sử Dụng Lucene Search cho Candidate Search

## ✅ Đã hoàn thành

1. ✅ Tạo `ILuceneCandidateIndexer` và `LuceneCandidateIndexer`
2. ✅ Tạo `CandidateIndexService` để quản lý index
3. ✅ Thêm endpoints để re-index
4. ✅ Update `CandidateSearchAppService` để sử dụng Lucene
5. ✅ Build thành công

## 🚀 Cách sử dụng

### Bước 1: Re-index tất cả candidates hiện có

**Cách 1: Dùng API endpoint (Khuyến nghị)**

```bash
POST http://localhost:44385/api/candidate-search/reindex
```

**Cách 2: Dùng code**

```csharp
// Trong một service hoặc command
var candidateIndexService = serviceProvider.GetRequiredService<CandidateIndexService>();
await candidateIndexService.ReIndexAllCandidatesAsync();
```

### Bước 2: Test search

Sau khi index xong, test search:

```bash
POST http://localhost:44385/api/candidate-search/search
Content-Type: application/json

{
  "keyword": ".Net,React",
  "maxResultCount": 10,
  "skipCount": 0
}
```

### Bước 3: Auto-index khi update (Quan trọng!)

Cần thêm logic để tự động index khi candidate được tạo/cập nhật.

**Ví dụ trong CandidateProfileAppService:**

```csharp
private readonly CandidateIndexService _candidateIndexService;

public async Task<CandidateProfileDto> UpdateAsync(...)
{
    var candidate = await _repository.UpdateAsync(...);
    
    // Index vào Lucene
    await _candidateIndexService.IndexCandidateAsync(candidate.UserId);
    
    return ObjectMapper.Map<CandidateProfile, CandidateProfileDto>(candidate);
}
```

## 📁 Files đã tạo

1. `src/VCareer.Application/Services/LuceneService/CandidateSearch/ILuceneCandidateIndexer.cs`
2. `src/VCareer.Application/Services/LuceneService/CandidateSearch/LuceneCandidateIndexer.cs`
3. `src/VCareer.Application/Services/LuceneService/CandidateSearch/CandidateIndexService.cs`
4. `src/VCareer.HttpApi/Controllers/CandidateSearchController.cs` (đã thêm endpoints)

## 🔧 API Endpoints

### 1. Re-index tất cả candidates

```
POST /api/candidate-search/reindex
```

**Response:**
```json
{
  "message": "Re-index thành công"
}
```

### 2. Index một candidate cụ thể

```
POST /api/candidate-search/index/{userId}
```

**Ví dụ:**
```
POST /api/candidate-search/index/3fa85f64-5717-4562-b3fc-2c963f66afa6
```

### 3. Search candidates

```
POST /api/candidate-search/search
```

**Request body:**
```json
{
  "keyword": ".Net,React",
  "searchInJobTitle": true,
  "searchInSkills": true,
  "maxResultCount": 10,
  "skipCount": 0
}
```

## 📝 Lưu ý quan trọng

### 1. Index Location

Index được lưu tại: `App_Data/LuceneCandidateIndex/`

### 2. Auto-index

**Hiện tại chưa có auto-index!** Cần thêm logic để:
- Index khi candidate được tạo/cập nhật
- Index khi CV được tạo/cập nhật
- Xóa khỏi index khi candidate bị xóa hoặc status = false

### 3. Re-index

Nếu cần re-index toàn bộ:
- Gọi endpoint `/api/candidate-search/reindex`
- Hoặc gọi `CandidateIndexService.ReIndexAllCandidatesAsync()`

### 4. CV Content Search

Lucene đã tự động index CV content từ `CandidateCv.DataJson`, bao gồm:
- Skills
- WorkExperiences
- Educations
- Projects
- CareerObjective
- PersonalInfo

## 🎯 Next Steps

1. **Re-index dữ liệu hiện có:**
   ```bash
   POST http://localhost:44385/api/candidate-search/reindex
   ```

2. **Thêm auto-index logic:**
   - Trong `CandidateProfileAppService` khi create/update
   - Trong `CandidateCvAppService` khi create/update CV

3. **Test search:**
   - Test với keyword: `.Net,React`
   - Test với các filter khác

## ✅ Kết luận

Lucene Search đã sẵn sàng sử dụng! Chỉ cần:
1. Re-index dữ liệu hiện có
2. Thêm auto-index logic
3. Test và enjoy! 🎉

