-- =============================================
-- Script: Insert Job Categories (Cấp 1, 2, 3)
-- Tổng: 25 categories
-- Bao gồm đầy đủ các trường từ FullAuditedAggregateRoot
-- =============================================

-- Xóa dữ liệu cũ nếu cần (uncomment nếu muốn reset)
-- DELETE FROM JobPostings WHERE CategoryId IS NOT NULL;
-- DELETE FROM JobCategories;

-- =============================================
-- CẤP 1: NGÀNH NGHỀ CHÍNH (6 categories)
-- =============================================

-- 1. Công nghệ thông tin
DECLARE @IT_ID UNIQUEIDENTIFIER = NEWID();
INSERT INTO JobCategories (Id, Name, Slug, ParentId, IsActive, ExtraProperties, ConcurrencyStamp, 
    CreationTime, CreatorId, LastModificationTime, LastModifierId, IsDeleted, DeleterId, DeletionTime, 
    Description, JobCount, SortOrder)
VALUES (@IT_ID, N'Công nghệ thông tin', 'cong-nghe-thong-tin', NULL, 1, NULL, NEWID(), 
    GETDATE(), NULL, NULL, NULL, 0, NULL, NULL, 
    N'Các công việc liên quan đến phát triển phần mềm, hệ thống IT', 0, 1);

-- 2. Kinh doanh & Bán hàng
DECLARE @SALES_ID UNIQUEIDENTIFIER = NEWID();
INSERT INTO JobCategories (Id, Name, Slug, ParentId, IsActive, ExtraProperties, ConcurrencyStamp, 
    CreationTime, CreatorId, LastModificationTime, LastModifierId, IsDeleted, DeleterId, DeletionTime, 
    Description, JobCount, SortOrder)
VALUES (@SALES_ID, N'Kinh doanh & Bán hàng', 'kinh-doanh-ban-hang', NULL, 1, NULL, NEWID(), 
    GETDATE(), NULL, NULL, NULL, 0, NULL, NULL, 
    N'Các vị trí kinh doanh, bán hàng và phát triển thị trường', 0, 2);

-- 3. Marketing & Truyền thông
DECLARE @MARKETING_ID UNIQUEIDENTIFIER = NEWID();
INSERT INTO JobCategories (Id, Name, Slug, ParentId, IsActive, ExtraProperties, ConcurrencyStamp, 
    CreationTime, CreatorId, LastModificationTime, LastModifierId, IsDeleted, DeleterId, DeletionTime, 
    Description, JobCount, SortOrder)
VALUES (@MARKETING_ID, N'Marketing & Truyền thông', 'marketing-truyen-thong', NULL, 1, NULL, NEWID(), 
    GETDATE(), NULL, NULL, NULL, 0, NULL, NULL, 
    N'Marketing, quảng cáo, PR và truyền thông', 0, 3);

-- 4. Tài chính & Kế toán
DECLARE @FINANCE_ID UNIQUEIDENTIFIER = NEWID();
INSERT INTO JobCategories (Id, Name, Slug, ParentId, IsActive, ExtraProperties, ConcurrencyStamp, 
    CreationTime, CreatorId, LastModificationTime, LastModifierId, IsDeleted, DeleterId, DeletionTime, 
    Description, JobCount, SortOrder)
VALUES (@FINANCE_ID, N'Tài chính & Kế toán', 'tai-chinh-ke-toan', NULL, 1, NULL, NEWID(), 
    GETDATE(), NULL, NULL, NULL, 0, NULL, NULL, 
    N'Kế toán, tài chính, kiểm toán và thuế', 0, 4);

-- 5. Nhân sự
DECLARE @HR_ID UNIQUEIDENTIFIER = NEWID();
INSERT INTO JobCategories (Id, Name, Slug, ParentId, IsActive, ExtraProperties, ConcurrencyStamp, 
    CreationTime, CreatorId, LastModificationTime, LastModifierId, IsDeleted, DeleterId, DeletionTime, 
    Description, JobCount, SortOrder)
VALUES (@HR_ID, N'Nhân sự', 'nhan-su', NULL, 1, NULL, NEWID(), 
    GETDATE(), NULL, NULL, NULL, 0, NULL, NULL, 
    N'Quản lý nhân sự, tuyển dụng và đào tạo', 0, 5);

-- 6. Thiết kế & Sáng tạo
DECLARE @DESIGN_ID UNIQUEIDENTIFIER = NEWID();
INSERT INTO JobCategories (Id, Name, Slug, ParentId, IsActive, ExtraProperties, ConcurrencyStamp, 
    CreationTime, CreatorId, LastModificationTime, LastModifierId, IsDeleted, DeleterId, DeletionTime, 
    Description, JobCount, SortOrder)
VALUES (@DESIGN_ID, N'Thiết kế & Sáng tạo', 'thiet-ke-sang-tao', NULL, 1, NULL, NEWID(), 
    GETDATE(), NULL, NULL, NULL, 0, NULL, NULL, 
    N'Thiết kế đồ họa, UI/UX, nội dung sáng tạo', 0, 6);


-- =============================================
-- CẤP 2: NHÓM NGHỀ (12 categories)
-- =============================================

-- NHÓM IT
-- 2.1 Phát triển phần mềm
DECLARE @DEV_ID UNIQUEIDENTIFIER = NEWID();
INSERT INTO JobCategories (Id, Name, Slug, ParentId, IsActive, ExtraProperties, ConcurrencyStamp, 
    CreationTime, CreatorId, LastModificationTime, LastModifierId, IsDeleted, DeleterId, DeletionTime, 
    Description, JobCount, SortOrder)
VALUES (@DEV_ID, N'Phát triển phần mềm', 'phat-trien-phan-mem', @IT_ID, 1, NULL, NEWID(), 
    GETDATE(), NULL, NULL, NULL, 0, NULL, NULL, 
    N'Lập trình viên, developer các ngôn ngữ', 0, 1);

-- 2.2 Data & AI
DECLARE @DATA_ID UNIQUEIDENTIFIER = NEWID();
INSERT INTO JobCategories (Id, Name, Slug, ParentId, IsActive, ExtraProperties, ConcurrencyStamp, 
    CreationTime, CreatorId, LastModificationTime, LastModifierId, IsDeleted, DeleterId, DeletionTime, 
    Description, JobCount, SortOrder)
VALUES (@DATA_ID, N'Data & AI', 'data-ai', @IT_ID, 1, NULL, NEWID(), 
    GETDATE(), NULL, NULL, NULL, 0, NULL, NULL, 
    N'Data Science, Machine Learning, Big Data', 0, 2);

-- 2.3 QA & Testing
DECLARE @QA_ID UNIQUEIDENTIFIER = NEWID();
INSERT INTO JobCategories (Id, Name, Slug, ParentId, IsActive, ExtraProperties, ConcurrencyStamp, 
    CreationTime, CreatorId, LastModificationTime, LastModifierId, IsDeleted, DeleterId, DeletionTime, 
    Description, JobCount, SortOrder)
VALUES (@QA_ID, N'QA & Testing', 'qa-testing', @IT_ID, 1, NULL, NEWID(), 
    GETDATE(), NULL, NULL, NULL, 0, NULL, NULL, 
    N'Kiểm thử phần mềm, QA, QC', 0, 3);

-- NHÓM KINH DOANH
-- 2.4 Bán hàng B2B
DECLARE @B2B_ID UNIQUEIDENTIFIER = NEWID();
INSERT INTO JobCategories (Id, Name, Slug, ParentId, IsActive, ExtraProperties, ConcurrencyStamp, 
    CreationTime, CreatorId, LastModificationTime, LastModifierId, IsDeleted, DeleterId, DeletionTime, 
    Description, JobCount, SortOrder)
VALUES (@B2B_ID, N'Bán hàng B2B', 'ban-hang-b2b', @SALES_ID, 1, NULL, NEWID(), 
    GETDATE(), NULL, NULL, NULL, 0, NULL, NULL, 
    N'Bán hàng doanh nghiệp, key account', 0, 1);

-- 2.5 Bán hàng B2C
DECLARE @B2C_ID UNIQUEIDENTIFIER = NEWID();
INSERT INTO JobCategories (Id, Name, Slug, ParentId, IsActive, ExtraProperties, ConcurrencyStamp, 
    CreationTime, CreatorId, LastModificationTime, LastModifierId, IsDeleted, DeleterId, DeletionTime, 
    Description, JobCount, SortOrder)
VALUES (@B2C_ID, N'Bán hàng B2C', 'ban-hang-b2c', @SALES_ID, 1, NULL, NEWID(), 
    GETDATE(), NULL, NULL, NULL, 0, NULL, NULL, 
    N'Bán lẻ, tư vấn khách hàng cá nhân', 0, 2);

-- NHÓM MARKETING
-- 2.6 Digital Marketing
DECLARE @DIGITAL_MKT_ID UNIQUEIDENTIFIER = NEWID();
INSERT INTO JobCategories (Id, Name, Slug, ParentId, IsActive, ExtraProperties, ConcurrencyStamp, 
    CreationTime, CreatorId, LastModificationTime, LastModifierId, IsDeleted, DeleterId, DeletionTime, 
    Description, JobCount, SortOrder)
VALUES (@DIGITAL_MKT_ID, N'Digital Marketing', 'digital-marketing', @MARKETING_ID, 1, NULL, NEWID(), 
    GETDATE(), NULL, NULL, NULL, 0, NULL, NULL, 
    N'Marketing online, SEO, SEM, Social Media', 0, 1);

-- 2.7 Content Marketing
DECLARE @CONTENT_MKT_ID UNIQUEIDENTIFIER = NEWID();
INSERT INTO JobCategories (Id, Name, Slug, ParentId, IsActive, ExtraProperties, ConcurrencyStamp, 
    CreationTime, CreatorId, LastModificationTime, LastModifierId, IsDeleted, DeleterId, DeletionTime, 
    Description, JobCount, SortOrder)
VALUES (@CONTENT_MKT_ID, N'Content Marketing', 'content-marketing', @MARKETING_ID, 1, NULL, NEWID(), 
    GETDATE(), NULL, NULL, NULL, 0, NULL, NULL, 
    N'Viết nội dung, copywriting, content creator', 0, 2);

-- NHÓM TÀI CHÍNH
-- 2.8 Kế toán
DECLARE @ACCOUNTING_ID UNIQUEIDENTIFIER = NEWID();
INSERT INTO JobCategories (Id, Name, Slug, ParentId, IsActive, ExtraProperties, ConcurrencyStamp, 
    CreationTime, CreatorId, LastModificationTime, LastModifierId, IsDeleted, DeleterId, DeletionTime, 
    Description, JobCount, SortOrder)
VALUES (@ACCOUNTING_ID, N'Kế toán', 'ke-toan', @FINANCE_ID, 1, NULL, NEWID(), 
    GETDATE(), NULL, NULL, NULL, 0, NULL, NULL, 
    N'Kế toán tổng hợp, kế toán trưởng', 0, 1);

-- 2.9 Tài chính doanh nghiệp
DECLARE @CORP_FIN_ID UNIQUEIDENTIFIER = NEWID();
INSERT INTO JobCategories (Id, Name, Slug, ParentId, IsActive, ExtraProperties, ConcurrencyStamp, 
    CreationTime, CreatorId, LastModificationTime, LastModifierId, IsDeleted, DeleterId, DeletionTime, 
    Description, JobCount, SortOrder)
VALUES (@CORP_FIN_ID, N'Tài chính doanh nghiệp', 'tai-chinh-doanh-nghiep', @FINANCE_ID, 1, NULL, NEWID(), 
    GETDATE(), NULL, NULL, NULL, 0, NULL, NULL, 
    N'Phân tích tài chính, quản lý vốn', 0, 2);

-- NHÓM NHÂN SỰ
-- 2.10 Tuyển dụng
DECLARE @RECRUIT_ID UNIQUEIDENTIFIER = NEWID();
INSERT INTO JobCategories (Id, Name, Slug, ParentId, IsActive, ExtraProperties, ConcurrencyStamp, 
    CreationTime, CreatorId, LastModificationTime, LastModifierId, IsDeleted, DeleterId, DeletionTime, 
    Description, JobCount, SortOrder)
VALUES (@RECRUIT_ID, N'Tuyển dụng', 'tuyen-dung', @HR_ID, 1, NULL, NEWID(), 
    GETDATE(), NULL, NULL, NULL, 0, NULL, NULL, 
    N'Chuyên viên tuyển dụng, headhunter', 0, 1);

-- NHÓM THIẾT KẾ
-- 2.11 UI/UX Design
DECLARE @UIUX_ID UNIQUEIDENTIFIER = NEWID();
INSERT INTO JobCategories (Id, Name, Slug, ParentId, IsActive, ExtraProperties, ConcurrencyStamp, 
    CreationTime, CreatorId, LastModificationTime, LastModifierId, IsDeleted, DeleterId, DeletionTime, 
    Description, JobCount, SortOrder)
VALUES (@UIUX_ID, N'UI/UX Design', 'ui-ux-design', @DESIGN_ID, 1, NULL, NEWID(), 
    GETDATE(), NULL, NULL, NULL, 0, NULL, NULL, 
    N'Thiết kế giao diện, trải nghiệm người dùng', 0, 1);

-- 2.12 Graphic Design
DECLARE @GRAPHIC_ID UNIQUEIDENTIFIER = NEWID();
INSERT INTO JobCategories (Id, Name, Slug, ParentId, IsActive, ExtraProperties, ConcurrencyStamp, 
    CreationTime, CreatorId, LastModificationTime, LastModifierId, IsDeleted, DeleterId, DeletionTime, 
    Description, JobCount, SortOrder)
VALUES (@GRAPHIC_ID, N'Graphic Design', 'graphic-design', @DESIGN_ID, 1, NULL, NEWID(), 
    GETDATE(), NULL, NULL, NULL, 0, NULL, NULL, 
    N'Thiết kế đồ họa, branding, visual', 0, 2);


-- =============================================
-- CẤP 3: CHUYÊN MÔN CỤ THỂ (7 categories)
-- =============================================

-- CHUYÊN MÔN PHÁT TRIỂN PHẦN MỀM
-- 3.1 Frontend Developer
INSERT INTO JobCategories (Id, Name, Slug, ParentId, IsActive, ExtraProperties, ConcurrencyStamp, 
    CreationTime, CreatorId, LastModificationTime, LastModifierId, IsDeleted, DeleterId, DeletionTime, 
    Description, JobCount, SortOrder)
VALUES (NEWID(), N'Frontend Developer', 'frontend-developer', @DEV_ID, 1, NULL, NEWID(), 
    GETDATE(), NULL, NULL, NULL, 0, NULL, NULL, 
    N'React, Angular, Vue.js developer', 0, 1);

-- 3.2 Backend Developer
INSERT INTO JobCategories (Id, Name, Slug, ParentId, IsActive, ExtraProperties, ConcurrencyStamp, 
    CreationTime, CreatorId, LastModificationTime, LastModifierId, IsDeleted, DeleterId, DeletionTime, 
    Description, JobCount, SortOrder)
VALUES (NEWID(), N'Backend Developer', 'backend-developer', @DEV_ID, 1, NULL, NEWID(), 
    GETDATE(), NULL, NULL, NULL, 0, NULL, NULL, 
    N'.NET, Java, Node.js, Python developer', 0, 2);

-- 3.3 Mobile Developer
INSERT INTO JobCategories (Id, Name, Slug, ParentId, IsActive, ExtraProperties, ConcurrencyStamp, 
    CreationTime, CreatorId, LastModificationTime, LastModifierId, IsDeleted, DeleterId, DeletionTime, 
    Description, JobCount, SortOrder)
VALUES (NEWID(), N'Mobile Developer', 'mobile-developer', @DEV_ID, 1, NULL, NEWID(), 
    GETDATE(), NULL, NULL, NULL, 0, NULL, NULL, 
    N'iOS, Android, React Native, Flutter', 0, 3);

-- CHUYÊN MÔN DATA
-- 3.4 Data Analyst
INSERT INTO JobCategories (Id, Name, Slug, ParentId, IsActive, ExtraProperties, ConcurrencyStamp, 
    CreationTime, CreatorId, LastModificationTime, LastModifierId, IsDeleted, DeleterId, DeletionTime, 
    Description, JobCount, SortOrder)
VALUES (NEWID(), N'Data Analyst', 'data-analyst', @DATA_ID, 1, NULL, NEWID(), 
    GETDATE(), NULL, NULL, NULL, 0, NULL, NULL, 
    N'Phân tích dữ liệu, báo cáo, BI', 0, 1);

-- 3.5 Machine Learning Engineer
INSERT INTO JobCategories (Id, Name, Slug, ParentId, IsActive, ExtraProperties, ConcurrencyStamp, 
    CreationTime, CreatorId, LastModificationTime, LastModifierId, IsDeleted, DeleterId, DeletionTime, 
    Description, JobCount, SortOrder)
VALUES (NEWID(), N'Machine Learning Engineer', 'machine-learning-engineer', @DATA_ID, 1, NULL, NEWID(), 
    GETDATE(), NULL, NULL, NULL, 0, NULL, NULL, 
    N'AI, ML, Deep Learning engineer', 0, 2);

-- CHUYÊN MÔN MARKETING
-- 3.6 SEO Specialist
INSERT INTO JobCategories (Id, Name, Slug, ParentId, IsActive, ExtraProperties, ConcurrencyStamp, 
    CreationTime, CreatorId, LastModificationTime, LastModifierId, IsDeleted, DeleterId, DeletionTime, 
    Description, JobCount, SortOrder)
VALUES (NEWID(), N'SEO Specialist', 'seo-specialist', @DIGITAL_MKT_ID, 1, NULL, NEWID(), 
    GETDATE(), NULL, NULL, NULL, 0, NULL, NULL, 
    N'Chuyên viên SEO, tối ưu công cụ tìm kiếm', 0, 1);

-- 3.7 Social Media Marketing
INSERT INTO JobCategories (Id, Name, Slug, ParentId, IsActive, ExtraProperties, ConcurrencyStamp, 
    CreationTime, CreatorId, LastModificationTime, LastModifierId, IsDeleted, DeleterId, DeletionTime, 
    Description, JobCount, SortOrder)
VALUES (NEWID(), N'Social Media Marketing', 'social-media-marketing', @DIGITAL_MKT_ID, 1, NULL, NEWID(), 
    GETDATE(), NULL, NULL, NULL, 0, NULL, NULL, 
    N'Facebook, TikTok, Instagram marketing', 0, 2);


-- =============================================
-- KIỂM TRA KẾT QUẢ
-- =============================================

PRINT '============================================='
PRINT 'DANH SÁCH CATEGORIES VỪA THÊM'
PRINT '============================================='

SELECT 
    CASE 
        WHEN ParentId IS NULL THEN N'Cấp 1'
        WHEN Id IN (SELECT ParentId FROM JobCategories WHERE ParentId IS NOT NULL) THEN N'Cấp 2'
        ELSE N'Cấp 3'
    END AS [Level],
    Name AS [Tên Category],
    Slug,
    Description AS [Mô tả],
    SortOrder AS [Thứ tự],
    IsActive AS [Kích hoạt],
    JobCount AS [Số Job],
    CreationTime AS [Ngày tạo]
FROM JobCategories
WHERE IsDeleted = 0
ORDER BY 
    CASE WHEN ParentId IS NULL THEN 0 ELSE 1 END,
    ParentId,
    SortOrder;

PRINT ''
PRINT '============================================='
PRINT 'THỐNG KÊ'
PRINT '============================================='

-- Đếm tổng số categories
SELECT 
    N'Tổng số categories' AS [Chỉ số],
    COUNT(*) AS [Giá trị]
FROM JobCategories
WHERE IsDeleted = 0;

-- Đếm theo từng cấp
SELECT 
    CASE 
        WHEN ParentId IS NULL THEN N'Cấp 1 (Root)'
        WHEN Id IN (SELECT ParentId FROM JobCategories WHERE ParentId IS NOT NULL) THEN N'Cấp 2 (Sub)'
        ELSE N'Cấp 3 (Leaf)'
    END AS [Cấp độ],
    COUNT(*) AS [Số lượng]
FROM JobCategories
WHERE IsDeleted = 0
GROUP BY 
    CASE 
        WHEN ParentId IS NULL THEN N'Cấp 1 (Root)'
        WHEN Id IN (SELECT ParentId FROM JobCategories WHERE ParentId IS NOT NULL) THEN N'Cấp 2 (Sub)'
        ELSE N'Cấp 3 (Leaf)'
    END
ORDER BY [Cấp độ];

-- Kiểm tra categories theo parent
SELECT 
    COALESCE(p.Name, N'ROOT') AS [Category cha],
    COUNT(c.Id) AS [Số category con]
FROM JobCategories c
LEFT JOIN JobCategories p ON c.ParentId = p.Id
WHERE c.IsDeleted = 0
GROUP BY p.Name
ORDER BY [Số category con] DESC;

PRINT ''
PRINT '✓ Script hoàn thành! Tổng số categories đã thêm: 25'
PRINT '✓ Bao gồm: 6 cấp 1, 12 cấp 2, 7 cấp 3'

