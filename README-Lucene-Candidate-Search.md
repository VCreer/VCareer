# Lucene Search Engine cho Candidate Search

## ✅ Đã triển khai Lucene.NET cho Candidate Search

Thay vì SQL Server Full-Text Search (không cài đặt được), hệ thống đã được chuyển sang sử dụng **Lucene.NET** - một search engine mạnh mẽ và không cần cài đặt database feature.

## 🎯 Ưu điểm của Lucene

- ✅ **Không cần cài đặt database feature** - Chỉ cần file system
- ✅ **Nhanh hơn** - Index được lưu trên disk, search rất nhanh
- ✅ **Mạnh mẽ** - Hỗ trợ fuzzy search, relevance scoring, etc.
- ✅ **Đã có sẵn** - Project đã dùng Lucene cho Job Search
- ✅ **Tự động index CV content** - Tìm kiếm cả trong CV mặc định

## 📁 Files đã tạo

1. `src/VCareer.Application/Services/LuceneService/CandidateSearch/ILuceneCandidateIndexer.cs`
   - Interface cho Lucene Candidate Indexer

2. `src/VCareer.Application/Services/LuceneService/CandidateSearch/LuceneCandidateIndexer.cs`
   - Implementation của Lucene Candidate Indexer
   - Index các fields: JobTitle, Skills, Location, WorkLocation, Experience, Salary
   - Index CV content từ CandidateCv.DataJson

3. `src/VCareer.Application/Services/Profile/CandidateSearchAppService.cs`
   - Đã được update để sử dụng Lucene thay vì Full-Text Search

## 🔧 Cách hoạt động

### 1. Index Candidates

Khi candidate được tạo/cập nhật, cần gọi:
```csharp
await _luceneIndexer.UpsertCandidateAsync(candidate);
```

### 2. Search

Khi user search với keyword, hệ thống sẽ:
1. Gọi `_luceneIndexer.SearchCandidateIdsAsync(input)`
2. Lucene trả về list UserIds đã được sắp xếp theo relevance
3. Load candidates từ database theo IDs
4. Sắp xếp lại theo thứ tự từ Lucene

### 3. Index Location

Index được lưu tại: `App_Data/LuceneCandidateIndex/`

## 🚀 Next Steps

### Bước 1: Index dữ liệu hiện có

Cần tạo một service/command để index tất cả candidates hiện có:

```csharp
// Ví dụ: Tạo một background job hoặc admin command
var allCandidates = await _candidateProfileRepository.GetListAsync(
    c => c.Status && c.ProfileVisibility
);
await _luceneIndexer.IndexMultipleCandidatesAsync(allCandidates);
```

### Bước 2: Auto-index khi update

Cần thêm logic để tự động index khi:
- Candidate profile được tạo/cập nhật
- Candidate CV được tạo/cập nhật
- Profile visibility thay đổi

**Ví dụ trong CandidateProfileAppService:**
```csharp
public async Task<CandidateProfileDto> UpdateAsync(...)
{
    var candidate = await _repository.UpdateAsync(...);
    
    // Index vào Lucene
    await _luceneIndexer.UpsertCandidateAsync(candidate);
    
    return ObjectMapper.Map<CandidateProfile, CandidateProfileDto>(candidate);
}
```

### Bước 3: Test

1. Index một vài candidates
2. Test search với keyword: `.Net,React`
3. Kiểm tra kết quả có đúng không

## 📝 Lưu ý

- **Index location**: `App_Data/LuceneCandidateIndex/` (riêng biệt với Job index)
- **Auto-index**: Hiện tại chưa có auto-index, cần thêm logic
- **Re-index**: Nếu cần re-index toàn bộ, gọi `ClearIndexAsync()` rồi `IndexMultipleCandidatesAsync()`

## 🔍 So sánh với Full-Text Search

| Tính năng | SQL Server Full-Text Search | Lucene.NET |
|-----------|----------------------------|------------|
| Setup | ❌ Cần cài database feature | ✅ Chỉ cần file system |
| Performance | ✅ Tốt | ✅✅ Rất tốt |
| Relevance Scoring | ⚠️ Basic | ✅✅ Advanced |
| Fuzzy Search | ❌ Không có | ✅ Có |
| CV Content Search | ⚠️ Phức tạp | ✅ Dễ dàng |
| Maintenance | ✅ Tự động | ⚠️ Cần index manually |

## ✅ Kết luận

Lucene.NET là lựa chọn tốt hơn cho project này vì:
- Không cần cài đặt database feature
- Đã có sẵn trong project (dùng cho Job Search)
- Mạnh mẽ và linh hoạt hơn
- Dễ maintain và scale

