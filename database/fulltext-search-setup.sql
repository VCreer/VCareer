-- =============================================
-- SQL Server Full-Text Search Setup Script
-- =============================================
-- Chạy script này để enable Full-Text Search cho CandidateProfile và CandidateCv
-- 
-- LƯU Ý: 
-- 1. Full-Text Search chỉ hoạt động trên SQL Server (không phải SQL Server Express LocalDB)
-- 2. Cần quyền sysadmin hoặc db_owner để chạy script này
-- 3. Nếu dùng SQL Server Express, cần cài đặt Full-Text Search feature riêng

USE [VCareer] -- Thay đổi tên database nếu cần
GO

-- Kiểm tra xem Full-Text Search đã được enable chưa
DECLARE @IsFullTextInstalled INT
SET @IsFullTextInstalled = (SELECT FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'))

IF @IsFullTextInstalled = 0
BEGIN
    PRINT '============================================='
    PRINT 'CẢNH BÁO: Full-Text Search chưa được cài đặt!'
    PRINT '============================================='
    PRINT ''
    PRINT 'Nguyên nhân có thể:'
    PRINT '1. SQL Server Express LocalDB - KHÔNG hỗ trợ Full-Text Search'
    PRINT '2. SQL Server Express - Cần cài đặt Full-Text Search feature'
    PRINT '3. SQL Server Standard/Enterprise - Cần enable Full-Text Search'
    PRINT ''
    PRINT 'Giải pháp:'
    PRINT '1. Nếu dùng LocalDB: Hệ thống sẽ tự động fallback về cách search thông thường'
    PRINT '2. Nếu dùng SQL Server Express: Cài đặt Full-Text Search từ SQL Server Installation Center'
    PRINT '3. Nếu dùng SQL Server Standard/Enterprise: Enable Full-Text Search trong SQL Server Configuration Manager'
    PRINT ''
    PRINT 'Kiểm tra loại SQL Server:'
    SELECT 
        @@VERSION AS SQLServerVersion,
        SERVERPROPERTY('Edition') AS Edition,
        SERVERPROPERTY('ProductVersion') AS ProductVersion
    PRINT ''
    PRINT 'Script sẽ dừng tại đây. Hệ thống vẫn hoạt động bình thường với fallback method.'
    RETURN
END

PRINT 'Full-Text Search đã được cài đặt. Tiếp tục setup...'
PRINT ''

-- Tạo Full-Text Catalog nếu chưa có
IF NOT EXISTS (SELECT * FROM sys.fulltext_catalogs WHERE name = 'VCareerFTCatalog')
BEGIN
    CREATE FULLTEXT CATALOG VCareerFTCatalog
    WITH ACCENT_SENSITIVITY = ON
    PRINT 'Đã tạo Full-Text Catalog: VCareerFTCatalog'
END
ELSE
BEGIN
    PRINT 'Full-Text Catalog đã tồn tại: VCareerFTCatalog'
END
GO

-- Tạo Full-Text Index cho CandidateProfile
-- Index trên các trường: JobTitle, Skills, Location, WorkLocation
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'CandidateProfile')
BEGIN
    -- Drop index cũ nếu có
    IF EXISTS (SELECT * FROM sys.fulltext_indexes WHERE object_id = OBJECT_ID('CandidateProfile'))
    BEGIN
        DROP FULLTEXT INDEX ON CandidateProfile
        PRINT 'Đã xóa Full-Text Index cũ trên CandidateProfile'
    END

    -- Tạo Full-Text Index
    -- Lưu ý: Cần có unique index trên primary key trước
    CREATE FULLTEXT INDEX ON CandidateProfile
    (
        JobTitle LANGUAGE 1033,  -- English
        Skills LANGUAGE 1033,
        Location LANGUAGE 1033,
        WorkLocation LANGUAGE 1033
    )
    KEY INDEX PK_CandidateProfile  -- Thay đổi tên index nếu cần (thường là PK_TableName)
    ON VCareerFTCatalog
    WITH (CHANGE_TRACKING AUTO, STOPLIST SYSTEM)
    
    PRINT 'Đã tạo Full-Text Index cho CandidateProfile'
END
ELSE
BEGIN
    PRINT 'Bảng CandidateProfile không tồn tại'
END
GO

-- Tạo Full-Text Index cho CandidateCv (trên DataJson)
-- Lưu ý: Full-Text Search trên JSON cần SQL Server 2016+
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'CandidateCvs')
BEGIN
    -- Drop index cũ nếu có
    IF EXISTS (SELECT * FROM sys.fulltext_indexes WHERE object_id = OBJECT_ID('CandidateCvs'))
    BEGIN
        DROP FULLTEXT INDEX ON CandidateCvs
        PRINT 'Đã xóa Full-Text Index cũ trên CandidateCvs'
    END

    -- Tạo Full-Text Index trên DataJson
    CREATE FULLTEXT INDEX ON CandidateCvs
    (
        DataJson LANGUAGE 1033
    )
    KEY INDEX PK_CandidateCvs  -- Thay đổi tên index nếu cần
    ON VCareerFTCatalog
    WITH (CHANGE_TRACKING AUTO, STOPLIST SYSTEM)
    
    PRINT 'Đã tạo Full-Text Index cho CandidateCvs'
END
ELSE
BEGIN
    PRINT 'Bảng CandidateCvs không tồn tại'
END
GO

-- Kiểm tra kết quả
SELECT 
    t.name AS TableName,
    fti.is_enabled AS IsEnabled,
    ftc.name AS CatalogName
FROM sys.fulltext_indexes fti
INNER JOIN sys.tables t ON fti.object_id = t.object_id
INNER JOIN sys.fulltext_catalogs ftc ON fti.fulltext_catalog_id = ftc.fulltext_catalog_id
WHERE t.name IN ('CandidateProfile', 'CandidateCvs')

PRINT '============================================='
PRINT 'Full-Text Search setup hoàn tất!'
PRINT '============================================='

