# Auto-Index Logic cho Lucene Candidate Search

## ✅ Đã thêm auto-index logic

Hệ thống sẽ tự động index candidates vào Lucene khi có thay đổi. Không cần thao tác thủ công!

## 📍 Các điểm đã thêm auto-index

### 1. ProfileAppService

#### ✅ UpdateUserProfileAsync
- **Khi nào**: Khi candidate update profile (JobTitle, Skills, Experience, Location, etc.)
- **Hành động**: Tự động index lại candidate vào Lucene

#### ✅ UpdateProfileVisibilityAsync
- **Khi nào**: Khi candidate thay đổi profile visibility
- **Hành động**: 
  - Nếu `isVisible = true` và `Status = true` → Index vào Lucene
  - Nếu `isVisible = false` hoặc `Status = false` → Xóa khỏi Lucene index

#### ✅ DeleteUserAsync
- **Khi nào**: Khi user bị xóa
- **Hành động**: Xóa candidate khỏi Lucene index

### 2. CandidateCvAppService

#### ✅ CreateAsync
- **Khi nào**: Khi candidate tạo CV mới
- **Hành động**: Tự động index lại candidate (vì CV content đã thay đổi)

#### ✅ UpdateAsync
- **Khi nào**: Khi candidate update CV (DataJson, CvName, etc.)
- **Hành động**: Tự động index lại candidate (vì CV content đã thay đổi)

#### ✅ DeleteAsync
- **Khi nào**: Khi candidate xóa CV
- **Hành động**: Tự động index lại candidate (vì CV đã bị xóa, cần update index)

#### ✅ SetDefaultAsync
- **Khi nào**: Khi candidate set CV làm default
- **Hành động**: Tự động index lại candidate (vì default CV đã thay đổi)

#### ✅ PublishAsync
- **Khi nào**: Khi candidate publish/unpublish CV
- **Hành động**: Tự động index lại candidate (vì publish status đã thay đổi)

## 🔧 Cách hoạt động

### Error Handling

Tất cả auto-index logic đều được wrap trong `try-catch`:
- Nếu index thành công → Không có gì xảy ra
- Nếu index lỗi → Log warning nhưng **không throw exception**
- Đảm bảo flow chính (create/update/delete) không bị ảnh hưởng

### Example Code

```csharp
// Auto-index candidate vào Lucene
try
{
    await _candidateIndexService.IndexCandidateAsync(userId);
}
catch (Exception ex)
{
    Logger.LogWarning(ex, "Lỗi khi auto-index candidate {UserId} vào Lucene", userId);
}
```

## 📝 Lưu ý

### 1. Index khi CV thay đổi

Khi CV được tạo/cập nhật/xóa, hệ thống sẽ tự động index lại candidate vì:
- CV content được index trong Lucene
- Default CV có thể thay đổi
- CV content ảnh hưởng đến search results

### 2. Xóa khỏi index

Candidate sẽ bị xóa khỏi index khi:
- Profile visibility = false
- Status = false
- User bị xóa

### 3. Re-index toàn bộ

Nếu cần re-index toàn bộ (sau khi deploy, fix bug, etc.):
```bash
POST http://localhost:44385/api/candidate-search/reindex
```

## ✅ Kết quả

- ✅ **Tự động index** khi candidate update profile
- ✅ **Tự động index** khi CV được tạo/cập nhật/xóa
- ✅ **Tự động xóa** khỏi index khi profile visibility = false
- ✅ **Error handling** - không ảnh hưởng đến flow chính
- ✅ **Logging** - dễ debug nếu có vấn đề

## 🎯 Next Steps

1. **Re-index dữ liệu hiện có** (chỉ cần làm 1 lần):
   ```bash
   POST http://localhost:44385/api/candidate-search/reindex
   ```

2. **Test auto-index**:
   - Update một candidate profile → Kiểm tra log
   - Tạo một CV mới → Kiểm tra log
   - Test search → Xem kết quả có đúng không

3. **Monitor logs**:
   - Kiểm tra log để đảm bảo auto-index hoạt động tốt
   - Nếu có warning, kiểm tra và fix

## 🎉 Hoàn thành!

Auto-index logic đã được thêm vào tất cả các điểm cần thiết. Hệ thống sẽ tự động maintain Lucene index!

