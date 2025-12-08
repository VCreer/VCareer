# Hướng Dẫn Xử Lý Lỗi Full-Text Search

## ❌ Lỗi: "Full-Text Search is not installed"

Nếu bạn gặp lỗi này khi chạy script setup, đây là cách xử lý:

### Bước 1: Kiểm tra loại SQL Server

Chạy script `database/check-sql-server-type.sql` để kiểm tra:

```sql
-- Script sẽ hiển thị:
-- - Loại SQL Server (Express, Standard, Enterprise, LocalDB)
-- - Full-Text Search đã được cài đặt chưa
-- - Hướng dẫn cụ thể cho từng trường hợp
```

### Bước 2: Xử lý theo từng trường hợp

#### 🔴 Trường hợp 1: SQL Server Express LocalDB

**Đặc điểm:**
- Edition hiển thị: `Express LocalDB`
- **KHÔNG thể** cài Full-Text Search

**Giải pháp:**
- ✅ **Không cần làm gì!** Hệ thống sẽ tự động fallback về cách search thông thường
- ✅ Search vẫn hoạt động đầy đủ, chỉ chậm hơn một chút
- ⚠️ Nếu muốn dùng Full-Text Search, cần upgrade lên SQL Server Standard/Enterprise

#### 🟡 Trường hợp 2: SQL Server Express

**Đặc điểm:**
- Edition hiển thị: `Express`
- Có thể cài Full-Text Search nhưng cần cài đặt feature riêng

**Cách cài Full-Text Search:**

1. **Tải SQL Server Installation Media:**
   - Tải SQL Server Express từ Microsoft
   - Hoặc sử dụng SQL Server Installation Center nếu đã có

2. **Chạy Installation Center:**
   ```
   Start → SQL Server Installation Center
   ```

3. **Thêm Feature:**
   - Chọn "New SQL Server stand-alone installation" hoặc "Add features to an existing instance"
   - Chọn instance SQL Server của bạn
   - Trong "Feature Selection", chọn:
     - ✅ **Full-Text and Semantic Extractions for Search**
   - Hoàn tất installation

4. **Restart SQL Server Service:**
   ```
   SQL Server Configuration Manager → SQL Server Services
   → Right-click SQL Server instance → Restart
   ```

5. **Kiểm tra lại:**
   ```sql
   SELECT FULLTEXTSERVICEPROPERTY('IsFullTextInstalled')
   -- Phải trả về 1
   ```

6. **Chạy lại script setup:**
   ```sql
   -- Chạy lại database/fulltext-search-setup.sql
   ```

#### 🟢 Trường hợp 3: SQL Server Standard/Enterprise

**Đặc điểm:**
- Edition hiển thị: `Standard` hoặc `Enterprise`
- Full-Text Search nên có sẵn

**Cách enable Full-Text Search:**

1. **Kiểm tra SQL Server Full-Text Search Service:**
   ```
   SQL Server Configuration Manager → SQL Server Services
   → Tìm "SQL Server Full-Text Filter Daemon Launcher"
   → Đảm bảo service đang chạy (Started)
   ```

2. **Nếu service không có:**
   - Cần cài đặt lại SQL Server với Full-Text Search feature
   - Hoặc repair installation và chọn Full-Text Search

3. **Kiểm tra lại:**
   ```sql
   SELECT FULLTEXTSERVICEPROPERTY('IsFullTextInstalled')
   -- Phải trả về 1
   ```

4. **Chạy lại script setup:**
   ```sql
   -- Chạy lại database/fulltext-search-setup.sql
   ```

### Bước 3: Xác nhận hệ thống vẫn hoạt động

**Quan trọng:** Ngay cả khi không có Full-Text Search, hệ thống vẫn hoạt động bình thường!

- ✅ Search vẫn hoạt động đầy đủ
- ✅ Tất cả tính năng vẫn bình thường
- ⚠️ Chỉ chậm hơn một chút khi search với nhiều dữ liệu

**Kiểm tra:**
1. Restart backend server
2. Test search với keyword: `.Net,React`
3. Kiểm tra log để xem có message "fallback method" không

### Tóm tắt

| Loại SQL Server | Full-Text Search | Giải pháp |
|----------------|------------------|-----------|
| **LocalDB** | ❌ Không hỗ trợ | ✅ Dùng fallback (tự động) |
| **Express** | ⚠️ Cần cài | 📥 Cài feature Full-Text Search |
| **Standard/Enterprise** | ✅ Có sẵn | 🔧 Enable service hoặc repair installation |

### Liên hệ hỗ trợ

Nếu vẫn gặp vấn đề:
1. Chạy script `check-sql-server-type.sql` và gửi kết quả
2. Kiểm tra log của application để xem có lỗi gì không
3. Đảm bảo SQL Server service đang chạy

---

**Lưu ý:** Hệ thống được thiết kế để tự động fallback, nên bạn không cần lo lắng nếu không thể cài Full-Text Search ngay. Search vẫn hoạt động tốt!

