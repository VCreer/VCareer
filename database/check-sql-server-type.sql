-- =============================================
-- Script kiểm tra loại SQL Server và Full-Text Search
-- =============================================
-- Chạy script này để kiểm tra xem SQL Server của bạn có hỗ trợ Full-Text Search không

PRINT '============================================='
PRINT 'THÔNG TIN SQL SERVER'
PRINT '============================================='
PRINT ''

-- Kiểm tra version và edition
SELECT 
    @@VERSION AS SQLServerVersion,
    SERVERPROPERTY('Edition') AS Edition,
    SERVERPROPERTY('ProductVersion') AS ProductVersion,
    SERVERPROPERTY('ProductLevel') AS ProductLevel,
    SERVERPROPERTY('EngineEdition') AS EngineEdition

PRINT ''
PRINT '============================================='
PRINT 'KIỂM TRA FULL-TEXT SEARCH'
PRINT '============================================='
PRINT ''

-- Kiểm tra Full-Text Search
DECLARE @IsFullTextInstalled INT
SET @IsFullTextInstalled = (SELECT FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'))

IF @IsFullTextInstalled = 1
BEGIN
    PRINT '✅ Full-Text Search ĐÃ ĐƯỢC CÀI ĐẶT'
    PRINT ''
    PRINT 'Bạn có thể chạy script fulltext-search-setup.sql để tạo index.'
END
ELSE
BEGIN
    PRINT '❌ Full-Text Search CHƯA ĐƯỢC CÀI ĐẶT'
    PRINT ''
    
    -- Kiểm tra loại SQL Server
    DECLARE @Edition NVARCHAR(128)
    SET @Edition = CAST(SERVERPROPERTY('Edition') AS NVARCHAR(128))
    
    IF @Edition LIKE '%LocalDB%' OR @Edition LIKE '%Express%'
    BEGIN
        PRINT '⚠️  BẠN ĐANG DÙNG SQL SERVER EXPRESS/LOCALDB'
        PRINT ''
        PRINT 'SQL Server Express LocalDB KHÔNG hỗ trợ Full-Text Search.'
        PRINT 'SQL Server Express có thể cài Full-Text Search nhưng cần cài đặt feature riêng.'
        PRINT ''
        PRINT 'Giải pháp:'
        PRINT '1. Hệ thống sẽ tự động fallback về cách search thông thường (vẫn hoạt động tốt)'
        PRINT '2. Nếu muốn dùng Full-Text Search, cần upgrade lên SQL Server Standard/Enterprise'
        PRINT '   hoặc cài đặt Full-Text Search feature cho SQL Server Express'
        PRINT ''
        PRINT 'Cách cài Full-Text Search cho SQL Server Express:'
        PRINT '1. Mở SQL Server Installation Center'
        PRINT '2. Chọn "New SQL Server stand-alone installation"'
        PRINT '3. Chọn "Add features to an existing instance"'
        PRINT '4. Chọn instance của bạn'
        PRINT '5. Trong "Feature Selection", chọn "Full-Text and Semantic Extractions for Search"'
        PRINT '6. Hoàn tất installation và restart SQL Server service'
    END
    ELSE
    BEGIN
        PRINT '⚠️  BẠN ĐANG DÙNG SQL SERVER STANDARD/ENTERPRISE'
        PRINT ''
        PRINT 'Full-Text Search nên có sẵn nhưng chưa được enable.'
        PRINT ''
        PRINT 'Cách enable Full-Text Search:'
        PRINT '1. Mở SQL Server Configuration Manager'
        PRINT '2. Chọn "SQL Server Services"'
        PRINT '3. Right-click vào SQL Server instance → Properties'
        PRINT '4. Tab "Service" → Đảm bảo "Full-Text Search" service đang chạy'
        PRINT '5. Nếu không có, cần cài đặt lại SQL Server với Full-Text Search feature'
    END
END

PRINT ''
PRINT '============================================='
PRINT 'KẾT LUẬN'
PRINT '============================================='
PRINT ''
PRINT 'Hệ thống vẫn hoạt động bình thường với fallback method.'
PRINT 'Search sẽ chậm hơn một chút nhưng vẫn đầy đủ tính năng.'
PRINT ''

