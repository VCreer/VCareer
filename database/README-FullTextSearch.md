# SQL Server Full-Text Search Setup Guide

## Tổng quan

Đã implement **SQL Server Full-Text Search** để tối ưu hóa tìm kiếm ứng viên. Giải pháp này:
- ✅ **Nhanh hơn**: Sử dụng index chuyên dụng của SQL Server
- ✅ **Chính xác hơn**: Hỗ trợ tìm kiếm từ khóa phức tạp
- ✅ **Tự động fallback**: Nếu Full-Text Search không available, sẽ tự động dùng cách cũ

## Cài đặt

### Bước 1: Kiểm tra Full-Text Search đã được cài đặt

```sql
SELECT FULLTEXTSERVICEPROPERTY('IsFullTextInstalled') AS IsInstalled;
```

Nếu trả về `1` = đã cài đặt, `0` = chưa cài đặt.

**Nếu chưa cài đặt:**
- SQL Server Standard/Enterprise: Full-Text Search đã có sẵn
- SQL Server Express: Cần cài đặt Full-Text Search feature riêng
- SQL Server Express LocalDB: **KHÔNG hỗ trợ** Full-Text Search

### Bước 2: Chạy script setup

1. Mở SQL Server Management Studio (SSMS)
2. Kết nối đến database của bạn
3. Mở file `database/fulltext-search-setup.sql`
4. **Lưu ý**: Sửa tên database trong script nếu cần (dòng 6)
5. Chạy script

Script sẽ:
- Tạo Full-Text Catalog: `VCareerFTCatalog`
- Tạo Full-Text Index cho `CandidateProfile` (JobTitle, Skills, Location, WorkLocation)
- Tạo Full-Text Index cho `CandidateCvs` (DataJson)

### Bước 3: Kiểm tra kết quả

```sql
-- Kiểm tra Full-Text Index đã được tạo
SELECT 
    t.name AS TableName,
    fti.is_enabled AS IsEnabled,
    ftc.name AS CatalogName
FROM sys.fulltext_indexes fti
INNER JOIN sys.tables t ON fti.object_id = t.object_id
INNER JOIN sys.fulltext_catalogs ftc ON fti.fulltext_catalog_id = ftc.fulltext_catalog_id
WHERE t.name IN ('CandidateProfile', 'CandidateCvs');
```

## Cách hoạt động

### Khi có keyword search:

1. **Nếu Full-Text Search available:**
   - Sử dụng `CONTAINS` để tìm kiếm nhanh trong database
   - Hỗ trợ tìm kiếm nhiều từ khóa: `"keyword1" OR "keyword2"`
   - Tự động tìm trong các trường: JobTitle, Skills, Location, WorkLocation

2. **Nếu Full-Text Search không available:**
   - Tự động fallback về cách cũ (filter trong memory)
   - Vẫn hoạt động bình thường, chỉ chậm hơn một chút

### Tìm kiếm trong CV:

- Nếu không tìm thấy trong Profile, sẽ tìm trong CV mặc định
- Search trong tất cả các trường của CV: Skills, WorkExperiences, Educations, Projects, Certificates, Languages, PersonalInfo, CareerObjective

## Test

Sau khi setup xong, test search với:
- Keyword: `.Net,React` → Tìm ứng viên có kỹ năng .Net hoặc React
- Keyword: `Java Developer` → Tìm ứng viên có "Java" và "Developer"
- Keyword: `Hanoi` → Tìm ứng viên ở Hà Nội

## Troubleshooting

### Lỗi: "Full-Text Search is not installed"

**Giải pháp:**
- Nếu dùng SQL Server Express: Cài đặt Full-Text Search feature
- Nếu dùng LocalDB: **Không thể** sử dụng Full-Text Search, hệ thống sẽ tự động fallback

### Lỗi: "Cannot use a CONTAINS or FREETEXT predicate on table"

**Giải pháp:**
- Kiểm tra Full-Text Index đã được tạo chưa
- Chạy lại script setup
- Đợi vài phút để index được populate

### Search không hoạt động

**Giểm tra:**
1. Full-Text Index đã được populate chưa:
   ```sql
   SELECT FULLTEXTCATALOGPROPERTY('VCareerFTCatalog', 'PopulateStatus') AS Status;
   ```
   - `0` = Idle (đã xong)
   - `1` = Full population in progress
   - `2` = Paused
   - `3` = Throttled
   - `4` = Recovering
   - `5` = Shutdown
   - `6` = Incremental population in progress
   - `7` = Building index
   - `8` = Disk is full. Paused
   - `9` = Change tracking

2. Kiểm tra log trong application để xem có lỗi gì không

## So sánh với Elasticsearch

| Tiêu chí | SQL Server Full-Text Search | Elasticsearch |
|----------|----------------------------|---------------|
| **Setup** | ✅ Đơn giản (built-in) | ❌ Cần setup riêng |
| **Chi phí** | ✅ Miễn phí (đã có) | ❌ Cần server riêng |
| **Performance** | ✅ Tốt cho < 1M records | ✅✅ Rất tốt cho > 1M records |
| **Features** | ✅ Basic search | ✅✅ Advanced: fuzzy, synonyms, etc. |
| **Maintenance** | ✅ Tự động | ❌ Cần maintain riêng |

**Khuyến nghị:**
- **Hiện tại**: Dùng SQL Server Full-Text Search (đủ dùng, đơn giản)
- **Tương lai**: Nếu cần advanced features hoặc scale lớn, cân nhắc Elasticsearch

## Tài liệu tham khảo

- [SQL Server Full-Text Search](https://docs.microsoft.com/en-us/sql/relational-databases/search/full-text-search)
- [CONTAINS (Transact-SQL)](https://docs.microsoft.com/en-us/sql/t-sql/queries/contains-transact-sql)
- [CREATE FULLTEXT INDEX](https://docs.microsoft.com/en-us/sql/t-sql/statements/create-fulltext-index-transact-sql)

