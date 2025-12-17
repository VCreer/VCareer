# Hướng Dẫn Khắc Phục Lỗi Lucene Search Sau Khi Merge

## 🔍 Vấn Đề
Sau khi merge code từ nhánh khác về, chức năng tìm kiếm Lucene không hoạt động mặc dù code đã hoạt động tốt trước đó.

## ✅ Các Bước Khắc Phục

### 1. Kiểm Tra và Sửa Duplicate Imports
**File:** `src/VCareer.Application/VCareerApplicationModule.cs`

✅ **Đã sửa:** Loại bỏ các dòng import trùng lặp (dòng 4-17).

### 2. Kiểm Tra Dependency Injection
Đảm bảo `ILuceneCandidateIndexer` đã được đăng ký trong DI container:

```csharp
// File: src/VCareer.Application/VCareerApplicationModule.cs
context.Services.AddSingleton<ILuceneCandidateIndexer, LuceneCandidateIndexer>();
```

✅ **Đã kiểm tra:** Service đã được đăng ký đúng.

### 3. **QUAN TRỌNG: Re-index Lucene Index**

Sau khi merge, **Lucene index có thể chưa được tạo hoặc bị rỗng**. Cần re-index lại:

#### Cách 1: Sử dụng API Endpoint (Khuyến nghị)
```bash
POST http://localhost:44385/api/app/candidate-index/re-index-all-candidates
```

Hoặc trong Postman:
- Method: `POST`
- URL: `http://localhost:44385/api/app/candidate-index/re-index-all-candidates`
- Headers: `Authorization: Bearer {token}` (nếu có)

**Lưu ý:** Endpoint đúng là `/api/app/candidate-index/re-index-all-candidates` (không phải `/api/candidate-search/reindex`)

#### Cách 2: Kiểm Tra Index Directory
Index được lưu tại: `{AppDomain.CurrentDomain.BaseDirectory}/App_Data/LuceneCandidateIndex/`

Kiểm tra:
1. Mở thư mục `bin/Debug/net8.0/App_Data/` (hoặc `bin/Release/net8.0/App_Data/`)
2. Xem có thư mục `LuceneCandidateIndex` không
3. Nếu không có hoặc rỗng → Cần re-index

### 4. Kiểm Tra Logs
Khi search, kiểm tra logs để xem có lỗi gì:

```csharp
// Trong CandidateSearchAppService.cs
Logger.LogInformation("Lucene search returned {Count} matched user IDs", matchedUserIds.Count);
Logger.LogWarning("Lucene search returned no results (index may be empty), falling back to database search");
```

Nếu thấy warning "index may be empty" → **Cần re-index**.

### 5. Kiểm Tra Exception Handling
Code đã có fallback mechanism:
- Nếu Lucene search trả về empty → Fallback về database search
- Nếu Lucene có lỗi → Fallback về database search

Nhưng để Lucene hoạt động đúng, **cần có index**.

### 6. Build và Restart Application
Sau khi sửa code:
1. **Clean solution**
2. **Rebuild solution**
3. **Restart application**
4. **Re-index** (bước 3)

## 🎯 Checklist Khắc Phục

- [x] Sửa duplicate imports trong `VCareerApplicationModule.cs`
- [x] Sửa method `GetIndexedCountAsync()` để đếm thực tế số documents trong index
- [ ] Re-index Lucene index (POST `/api/app/candidate-index/re-index-all-candidates`)
- [ ] Kiểm tra số lượng index: GET `/api/app/candidate-index/indexed-count` (phải > 0)
- [ ] Kiểm tra thư mục `App_Data/LuceneCandidateIndex` có tồn tại
- [ ] Kiểm tra logs khi search
- [ ] Build và restart application

## 🔧 Test Sau Khi Sửa

1. **Kiểm Tra Index Count (Trước khi re-index):**
   ```bash
   GET /api/app/candidate-index/indexed-count
   ```
   Response: `0` (nếu index rỗng)

2. **Test Re-index:**
   ```bash
   POST /api/app/candidate-index/re-index-all-candidates
   ```
   Response: `{ "message": "Re-index thành công" }` hoặc status 200

3. **Kiểm Tra Index Count (Sau khi re-index):**
   ```bash
   GET /api/app/candidate-index/indexed-count
   ```
   Response: Số lượng > 0 (ví dụ: `150` nếu có 150 candidates được index)

4. **Test Search:**
   ```bash
   POST /api/candidate-search/search
   Body: {
     "keyword": "Java",
     "maxResultCount": 10,
     "skipCount": 0
   }
   ```
   Kiểm tra logs: Không còn warning "index may be empty"
   - Logs sẽ hiển thị: "Lucene search returned X matched user IDs"

## ⚠️ Lưu Ý

1. **Index Directory:** Index được tạo tại `App_Data/LuceneCandidateIndex/` trong thư mục bin khi chạy
2. **Auto-index:** Hệ thống tự động index khi:
   - Tạo/update candidate profile
   - Tạo/update/delete CV
   - Thay đổi profile visibility
3. **Sau khi merge:** Luôn cần re-index vì index có thể không được commit vào git (thường trong `.gitignore`)

## 📝 Nguyên Nhân Có Thể

1. ✅ **Duplicate imports** → Đã sửa
2. ⚠️ **Index chưa được tạo** → Cần re-index
3. ⚠️ **Index directory không tồn tại** → Tự động tạo khi khởi tạo `LuceneCandidateIndexer`
4. ⚠️ **Index bị corrupt sau merge** → Cần clear và re-index

## 🚀 Quick Fix

Nếu cần fix nhanh, chạy các lệnh này trong Postman hoặc browser console:

**Bước 1: Kiểm tra index count (hiện tại)**
```javascript
fetch('http://localhost:44385/api/app/candidate-index/indexed-count')
  .then(r => r.json())
  .then(count => console.log('Index count:', count));
```

**Bước 2: Re-index tất cả candidates**
```javascript
fetch('http://localhost:44385/api/app/candidate-index/re-index-all-candidates', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(console.log);
```

**Bước 3: Kiểm tra lại index count (sau khi re-index)**
```javascript
fetch('http://localhost:44385/api/app/candidate-index/indexed-count')
  .then(r => r.json())
  .then(count => console.log('Index count sau re-index:', count));
```

Sau đó test search lại. Index count phải > 0.

