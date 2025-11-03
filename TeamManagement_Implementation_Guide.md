# Team Management - Activate & Deactivate HR Staff

## 📋 Tổng quan

Chức năng **Team Management** cho phép Leader Recruiter quản lý trạng thái của HR Staff trong công ty, bao gồm:
- ✅ **Activate Staff** - Kích hoạt lại staff đã bị vô hiệu hóa
- ✅ **Deactivate Staff** - Vô hiệu hóa staff (tạm ngưng hoạt động)

## 🎯 Use Cases

### UC1: Deactivate HR Staff
**Actor:** Leader Recruiter  
**Mục đích:** Vô hiệu hóa một HR Staff trong team  
**Điều kiện:** 
- User phải là Leader Recruiter
- Staff phải cùng công ty với Leader
- Staff không phải là Leader khác
- Staff không phải là chính Leader đang thực hiện
- Staff đang ở trạng thái Active

**Flow:**
1. Leader chọn staff cần deactivate
2. Nhập lý do deactivate
3. Hệ thống validate các điều kiện
4. Hệ thống cập nhật status = false
5. Trả về kết quả thành công

### UC2: Activate HR Staff
**Actor:** Leader Recruiter  
**Mục đích:** Kích hoạt lại một HR Staff đã bị deactivate  
**Điều kiện:**
- User phải là Leader Recruiter
- Staff phải cùng công ty với Leader
- Staff đang ở trạng thái Inactive

**Flow:**
1. Leader chọn staff cần activate
2. Nhập lý do activate
3. Hệ thống validate các điều kiện
4. Hệ thống cập nhật status = true
5. Trả về kết quả thành công

## 📁 Cấu trúc Files

### Backend

#### DTOs (3 files)
```
src/VCareer.Application.Contracts/Dto/TeamManagementDto/
├── ActivateStaffDto.cs          (Input cho activate)
├── DeactivateStaffDto.cs        (Input cho deactivate)
└── StaffStatusChangeDto.cs      (Output response)
```

#### Service Interface
```
src/VCareer.Application.Contracts/IServices/ITeamManagement/
└── ITeamManagementAppService.cs
```

#### Service Implementation
```
src/VCareer.Application/Services/TeamManagement/
└── TeamManagementAppService.cs
```

#### Controller
```
src/VCareer.HttpApi/Controllers/
└── TeamManagementController.cs
```

## 🔧 API Endpoints

### 1. Deactivate Staff
```http
POST /api/app/team-management/deactivate
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "staffId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "reason": "Performance issues",
  "sendNotification": true,
  "effectiveDate": "2025-01-30T00:00:00Z",
  "notes": "Additional notes"
}

Response: 200 OK
{
  "staffId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "fullName": "John Doe",
  "email": "john@example.com",
  "previousStatus": true,
  "newStatus": false,
  "action": "Deactivate",
  "reason": "Performance issues",
  "changeTimestamp": "2025-01-29T10:30:00Z",
  "performedBy": "Jane Smith",
  "message": "Staff John Doe đã được deactivate thành công."
}
```

### 2. Activate Staff
```http
POST /api/app/team-management/activate
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "staffId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "reason": "Return to work",
  "sendNotification": true,
  "effectiveDate": null,
  "notes": "Ready to work again"
}

Response: 200 OK
{
  "staffId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "fullName": "John Doe",
  "email": "john@example.com",
  "previousStatus": false,
  "newStatus": true,
  "action": "Activate",
  "reason": "Return to work",
  "changeTimestamp": "2025-01-29T10:30:00Z",
  "performedBy": "Jane Smith",
  "message": "Staff John Doe đã được activate thành công."
}
```

## 🔐 Business Rules

### Deactivate Staff

✅ **Allowed:**
- Leader deactivate regular staff trong cùng công ty

❌ **Not Allowed:**
- Non-Leader deactivate bất kỳ ai
- Leader deactivate staff ở công ty khác
- Leader deactivate Leader khác
- Leader deactivate chính mình
- Deactivate staff đã inactive rồi

### Activate Staff

✅ **Allowed:**
- Leader activate staff đã inactive trong cùng công ty

❌ **Not Allowed:**
- Non-Leader activate bất kỳ ai
- Leader activate staff ở công ty khác
- Activate staff đã active rồi

## 🎨 DTOs

### ActivateStaffDto (Input)
```csharp
public class ActivateStaffDto
{
    public Guid StaffId { get; set; }           // Required
    public string Reason { get; set; }          // Optional
    public bool SendNotification { get; set; }  // Default: true
    public DateTime? EffectiveDate { get; set; } // Optional (null = immediate)
    public string Notes { get; set; }           // Optional
}
```

### DeactivateStaffDto (Input)
```csharp
public class DeactivateStaffDto
{
    public Guid StaffId { get; set; }           // Required
    public string Reason { get; set; }          // Optional
    public bool SendNotification { get; set; }  // Default: true
    public DateTime? EffectiveDate { get; set; } // Optional (null = immediate)
    public string Notes { get; set; }           // Optional
}
```

### StaffStatusChangeDto (Output)
```csharp
public class StaffStatusChangeDto
{
    public Guid StaffId { get; set; }
    public string FullName { get; set; }
    public string Email { get; set; }
    public bool PreviousStatus { get; set; }
    public bool NewStatus { get; set; }
    public string Action { get; set; }         // "Activate" or "Deactivate"
    public string Reason { get; set; }
    public DateTime ChangeTimestamp { get; set; }
    public string PerformedBy { get; set; }
    public string Message { get; set; }
}
```

## 🔄 Flow Diagrams

### Class Diagram Files:
- `ActivateHRStaff_Class.puml` - Activate only
- `DeactivateHRStaff_Class.puml` - Deactivate only  
- `TeamManagement_Class.puml` - Both functions

### Sequence Diagram Files:
- `ActivateHRStaff_Sequence.puml` - Activate flow
- `DeactivateHRStaff_Sequence.puml` - Deactivate flow

## 🚨 Error Messages

### Common Errors:

| Error | Condition | HTTP Status |
|-------|-----------|-------------|
| "Staff ID không hợp lệ" | StaffId is empty | 400 |
| "Chỉ Leader Recruiter mới có quyền..." | User is not Leader | 403 |
| "Không tìm thấy staff" | Staff not found | 404 |
| "Bạn chỉ có thể ... staff trong cùng công ty" | Different company | 403 |
| "Không thể deactivate Leader khác" | Target is another Leader | 403 |
| "Không thể deactivate chính mình" | Self-deactivate attempt | 403 |
| "Staff này đã được deactivate trước đó" | Already inactive | 400 |
| "Staff này đã ở trạng thái active" | Already active | 400 |

## 💻 Service Implementation

### Key Methods:

```csharp
public class TeamManagementAppService : ITeamManagementAppService
{
    // Deactivate staff (set Status = false)
    public async Task<StaffStatusChangeDto> DeactivateStaffAsync(DeactivateStaffDto input)
    {
        // 1. Validate input
        // 2. Get current user and verify IsLead
        // 3. Get staff profile
        // 4. Verify same company
        // 5. Business rules validation
        // 6. Update status to false
        // 7. Build and return response
    }
    
    // Activate staff (set Status = true)
    public async Task<StaffStatusChangeDto> ActivateStaffAsync(ActivateStaffDto input)
    {
        // 1. Validate input
        // 2. Get current user and verify IsLead
        // 3. Get staff profile
        // 4. Verify same company
        // 5. Business rules validation
        // 6. Update status to true
        // 7. Build and return response
    }
    
    // Helper: Get current recruiter profile
    private async Task<RecruiterProfile> GetCurrentRecruiterProfileAsync()
    {
        // Get from repository with includes
    }
}
```

## 🔍 Validation Logic

### Deactivate Validation Chain:
```
1. Input validation (StaffId not empty)
   ↓
2. Authentication check (User is authenticated)
   ↓
3. Authorization check (User is Leader)
   ↓
4. Staff exists check
   ↓
5. Same company check
   ↓
6. Not self check
   ↓
7. Not other Leader check
   ↓
8. Current status check (must be active)
   ↓
9. Proceed with deactivate
```

### Activate Validation Chain:
```
1. Input validation (StaffId not empty)
   ↓
2. Authentication check (User is authenticated)
   ↓
3. Authorization check (User is Leader)
   ↓
4. Staff exists check
   ↓
5. Same company check
   ↓
6. Current status check (must be inactive)
   ↓
7. Proceed with activate
```

## 🧪 Testing

### Test Cases for Deactivate:

```csharp
[Fact]
public async Task DeactivateStaff_Success()
{
    // Arrange: Leader user, active staff, same company
    // Act: Call DeactivateStaffAsync
    // Assert: Status changed to false
}

[Fact]
public async Task DeactivateStaff_NonLeader_ThrowsException()
{
    // Arrange: Non-leader user
    // Act & Assert: Should throw UserFriendlyException
}

[Fact]
public async Task DeactivateStaff_DifferentCompany_ThrowsException()
{
    // Arrange: Staff from different company
    // Act & Assert: Should throw UserFriendlyException
}

[Fact]
public async Task DeactivateStaff_Self_ThrowsException()
{
    // Arrange: StaffId = CurrentUserId
    // Act & Assert: Should throw UserFriendlyException
}

[Fact]
public async Task DeactivateStaff_AlreadyInactive_ThrowsException()
{
    // Arrange: Staff already inactive
    // Act & Assert: Should throw UserFriendlyException
}
```

### Test Cases for Activate:

```csharp
[Fact]
public async Task ActivateStaff_Success()
{
    // Arrange: Leader user, inactive staff, same company
    // Act: Call ActivateStaffAsync
    // Assert: Status changed to true
}

[Fact]
public async Task ActivateStaff_NonLeader_ThrowsException()
{
    // Arrange: Non-leader user
    // Act & Assert: Should throw UserFriendlyException
}

[Fact]
public async Task ActivateStaff_AlreadyActive_ThrowsException()
{
    // Arrange: Staff already active
    // Act & Assert: Should throw UserFriendlyException
}
```

## 📊 Database Impact

### Tables Modified:
- `RecruiterProfile.Status` field

### SQL Example:
```sql
-- Deactivate
UPDATE RecruiterProfile 
SET Status = 0 
WHERE UserId = @staffId

-- Activate
UPDATE RecruiterProfile 
SET Status = 1 
WHERE UserId = @staffId
```

## 🔮 Future Enhancements

1. **Activity Logging**
   - Log all status changes to ActivityLog table
   - Track who, when, and why

2. **Email Notifications**
   - Send email to staff when activated/deactivated
   - CC to Leader

3. **Bulk Operations**
   - Activate/Deactivate multiple staff at once
   - CSV import/export

4. **Status History**
   - Keep history of all status changes
   - Show timeline in UI

5. **Scheduled Changes**
   - Use EffectiveDate for future changes
   - Background job to apply changes

6. **Soft Delete**
   - Add DeletedDate field
   - Distinguish between deactivated vs deleted

## 🚀 Deployment

### Steps:
1. **Build backend:**
   ```bash
   cd src/VCareer.HttpApi.Host
   dotnet build
   ```

2. **Run:**
   ```bash
   dotnet run
   ```

3. **Test endpoints:**
   ```bash
   # Swagger UI
   https://localhost:44300/swagger
   ```

## 📚 Related Documentation

- `DeactivateHRStaff_Class.puml` - Class diagram
- `DeactivateHRStaff_Sequence.puml` - Sequence diagram
- `ActivateHRStaff_Class.puml` - Class diagram
- `ActivateHRStaff_Sequence.puml` - Sequence diagram
- `TeamManagement_Class.puml` - Combined class diagram

---

**Created:** 2025-01-29  
**Version:** 1.0  
**Author:** VCareer Development Team





