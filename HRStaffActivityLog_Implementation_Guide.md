# HR Staff Activity Log - Implementation Guide

## 📋 Tổng quan

Chức năng này cho phép Team Leader xem nhật ký hoạt động của HR Staff trong team, bao gồm:
- Đăng/cập nhật Job
- Gửi Email
- Đánh giá ứng viên
- Lên lịch phỏng vấn

## 📁 Các file đã tạo

### 1. Domain Layer
```
src/VCareer.Domain/Models/ActivityLogs/
├── ActivityLog.cs          # Entity chính
└── ActivityType.cs         # Enum các loại hoạt động
```

### 2. Application Contracts Layer
```
src/VCareer.Application.Contracts/
├── Dto/ActivityLogDto/
│   ├── ActivityLogDto.cs
│   ├── ActivityLogListDto.cs
│   ├── ActivityLogFilterDto.cs
│   ├── ActivityStatisticsDto.cs
│   └── StaffInfoDto.cs
└── IServices/IActivityLogService/
    └── IActivityLogAppService.cs
```

### 3. Application Layer
```
src/VCareer.Application/Services/ActivityLog/
└── ActivityLogAppService.cs
```

### 4. HTTP API Layer
```
src/VCareer.HttpApi/Controllers/
└── ActivityLogController.cs
```

### 5. Infrastructure Layer
```
src/VCareer.EntityFrameworkCore/EntityFrameworkCore/
└── VCareerDbContext.cs      # Updated with ActivityLog DbSet
```

### 6. AutoMapper Configuration
```
src/VCareer.Application/
└── VCareerApplicationAutoMapperProfile.cs    # Updated with mapping
```

---

## 🚀 Các bước triển khai

### Bước 1: Tạo Database Migration

Mở terminal tại thư mục `src/VCareer.EntityFrameworkCore/` và chạy:

```powershell
# Tạo migration mới
dotnet ef migrations add AddActivityLogTable

# Hoặc nếu dùng ABP CLI
abp migrate-db
```

### Bước 2: Update Database

```powershell
# Apply migration vào database
dotnet ef database update

# Hoặc chạy DbMigrator project
cd src/VCareer.DbMigrator
dotnet run
```

### Bước 3: Build lại solution

```powershell
# Từ thư mục root
dotnet build
```

---

## 📖 Cách sử dụng API

### 1. Get Staff Activity Logs

**Endpoint:**
```
GET /api/activity-logs/staff/{staffId}
```

**Query Parameters:**
- `ActivityType` (optional): Filter theo loại hoạt động (JobPosted, EmailSent, CandidateEvaluated, etc.)
- `StartDate` (optional): Ngày bắt đầu
- `EndDate` (optional): Ngày kết thúc
- `SearchKeyword` (optional): Tìm kiếm trong Action hoặc Description
- `MaxResultCount` (default: 10): Số record trên mỗi trang
- `SkipCount` (default: 0): Bỏ qua bao nhiêu record
- `Sorting` (optional): Sắp xếp (vd: "CreationTime DESC")

**Request Example:**
```http
GET /api/activity-logs/staff/3fa85f64-5717-4562-b3fc-2c963f66afa6?ActivityType=1&MaxResultCount=20&SkipCount=0
Authorization: Bearer {your_token}
```

**Response Example:**
```json
{
  "staffInfo": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "email": "staff@example.com",
    "name": "John",
    "surname": "Doe",
    "fullName": "John Doe",
    "isLead": false,
    "status": true
  },
  "activities": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "activityType": 1,
      "activityTypeName": "JobPosted",
      "entityId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "entityType": "Job",
      "action": "Created new job",
      "description": "Posted Software Engineer position",
      "ipAddress": "192.168.1.100",
      "creationTime": "2025-10-28T10:30:00",
      "metadata": {
        "jobTitle": "Software Engineer",
        "location": "Ha Noi"
      }
    }
  ],
  "statistics": {
    "totalActivities": 150,
    "jobActivities": 45,
    "emailActivities": 60,
    "evaluationActivities": 30,
    "interviewActivities": 15,
    "todayActivities": 5,
    "thisWeekActivities": 25,
    "thisMonthActivities": 80
  },
  "totalCount": 150
}
```

---

## 🔨 Cách log activity trong code

### Ví dụ 1: Log khi đăng Job

```csharp
public class JobAppService : ApplicationService
{
    private readonly IActivityLogAppService _activityLogService;
    
    public async Task<JobDto> CreateJobAsync(CreateJobDto input)
    {
        // Create job
        var job = await _jobRepository.InsertAsync(newJob);
        
        // Log activity
        await _activityLogService.LogActivityAsync(
            userId: CurrentUser.GetId(),
            activityType: ActivityType.JobPosted,
            action: "Created new job",
            description: $"Posted {input.Title} position",
            entityId: job.Id,
            entityType: "Job",
            metadata: JsonSerializer.Serialize(new { 
                jobTitle = input.Title,
                location = input.Location 
            })
        );
        
        return ObjectMapper.Map<Job, JobDto>(job);
    }
}
```

### Ví dụ 2: Log khi gửi Email

```csharp
public async Task SendEmailToCandidate(Guid candidateId, string subject)
{
    // Send email logic...
    
    // Log activity
    await _activityLogService.LogActivityAsync(
        userId: CurrentUser.GetId(),
        activityType: ActivityType.EmailSent,
        action: "Sent email to candidate",
        description: $"Email subject: {subject}",
        entityId: candidateId,
        entityType: "Candidate",
        metadata: JsonSerializer.Serialize(new { 
            subject = subject,
            sentAt = DateTime.UtcNow 
        })
    );
}
```

### Ví dụ 3: Log khi đánh giá ứng viên

```csharp
public async Task EvaluateCandidate(Guid candidateId, int rating)
{
    // Evaluation logic...
    
    // Log activity
    await _activityLogService.LogActivityAsync(
        userId: CurrentUser.GetId(),
        activityType: ActivityType.CandidateEvaluated,
        action: "Evaluated candidate",
        description: $"Rating: {rating}/5",
        entityId: candidateId,
        entityType: "Candidate",
        metadata: JsonSerializer.Serialize(new { 
            rating = rating,
            evaluatedAt = DateTime.UtcNow 
        })
    );
}
```

---

## 🔐 Quyền truy cập

- Chỉ **Team Leader** (`IsLead = true`) mới có thể xem activity logs
- Chỉ xem được logs của staff trong **cùng company**
- Các validation được thực hiện tự động trong `ActivityLogAppService`

---

## 📊 Activity Types

```csharp
public enum ActivityType
{
    // Job related (1-9)
    JobPosted = 1,
    JobUpdated = 2,
    JobClosed = 3,
    JobDeleted = 4,
    
    // Email related (10-19)
    EmailSent = 10,
    EmailTemplateCreated = 11,
    
    // Candidate evaluation (20-29)
    CandidateEvaluated = 20,
    CandidateRejected = 21,
    CandidateApproved = 22,
    CandidateShortlisted = 23,
    
    // Interview (30-39)
    InterviewScheduled = 30,
    InterviewCompleted = 31,
    InterviewCancelled = 32,
    
    // Application (40-49)
    ApplicationReviewed = 40,
    ApplicationUpdated = 41
}
```

---

## 🎯 Features

✅ Filter theo loại hoạt động
✅ Filter theo khoảng thời gian
✅ Search trong Action và Description
✅ Paging và Sorting
✅ Statistics tổng hợp (hôm nay, tuần này, tháng này)
✅ Tracking IP Address và User Agent
✅ Metadata dạng JSON cho thông tin bổ sung
✅ Performance indexes trên database

---

## 🔍 Database Schema

```sql
CREATE TABLE ActivityLogs (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    UserId UNIQUEIDENTIFIER NOT NULL,
    ActivityType INT NOT NULL,
    EntityId UNIQUEIDENTIFIER NULL,
    EntityType NVARCHAR(128) NULL,
    Action NVARCHAR(256) NOT NULL,
    Description NVARCHAR(2000) NULL,
    IpAddress NVARCHAR(64) NULL,
    UserAgent NVARCHAR(512) NULL,
    Metadata NVARCHAR(4000) NULL,
    CreationTime DATETIME2 NOT NULL,
    CreatorId UNIQUEIDENTIFIER NULL,
    
    -- Indexes
    INDEX IX_ActivityLogs_UserId (UserId),
    INDEX IX_ActivityLogs_ActivityType (ActivityType),
    INDEX IX_ActivityLogs_CreationTime (CreationTime),
    INDEX IX_ActivityLogs_UserId_ActivityType (UserId, ActivityType),
    INDEX IX_ActivityLogs_UserId_CreationTime (UserId, CreationTime)
);
```

---

## 📝 Notes

1. **Performance**: Các indexes đã được tối ưu cho query phổ biến
2. **Metadata**: Lưu dưới dạng JSON string, có thể chứa thông tin bổ sung
3. **Audit**: Entity kế thừa từ `CreationAuditedAggregateRoot` nên có sẵn CreationTime và CreatorId
4. **Extensibility**: Dễ dàng thêm ActivityType mới vào enum

---

## 🧪 Testing

### Test API với cURL:

```bash
curl -X GET "https://localhost:44300/api/activity-logs/staff/{staffId}?MaxResultCount=10&SkipCount=0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test với Swagger:
1. Mở `https://localhost:44300/swagger`
2. Authorize với token
3. Test endpoint `/api/activity-logs/staff/{staffId}`

---

## ❓ Troubleshooting

### Lỗi: "Cannot access activity logs from different company"
- Đảm bảo Team Leader và Staff cùng CompanyId

### Lỗi: "Only team leaders can view staff activity logs"
- Kiểm tra `IsLead = true` cho user hiện tại

### Migration lỗi:
- Xóa migration: `dotnet ef migrations remove`
- Tạo lại: `dotnet ef migrations add AddActivityLogTable`

---

Chúc bạn triển khai thành công! 🚀






