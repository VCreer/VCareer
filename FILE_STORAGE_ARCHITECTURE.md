# Kiến trúc lưu trữ file - FileDescriptor vs UploadedCv

## Tổng quan

Hệ thống sử dụng kiến trúc **2 lớp (2-layer architecture)** để quản lý file:
1. **FileDescriptor** - Lớp generic để quản lý file metadata
2. **UploadedCv** - Lớp domain-specific để quản lý business logic của CV

---

## 1. FileDescriptor - Lớp Generic (File Storage Layer)

### Mục đích:
`FileDescriptor` là một entity **generic** dùng để lưu metadata của **BẤT KỲ file nào** trong hệ thống.

### Các thuộc tính:
```csharp
public class FileDescriptor : Entity<Guid>
{
    public string CreatorId { get; set; }          // ID người tạo file
    public string StorageName { get; set; }        // Tên file trong storage (unique)
    public string OriginalName { get; set; }       // Tên file gốc (từ client)
    public string Extension { get; set; }          // Đuôi file (.pdf, .docx, ...)
    public long Size { get; set; }                 // Kích thước file (bytes)
    public string MimeType { get; set; }           // MIME type (application/pdf, ...)
    public string ContainerName { get; set; }      // Tên container trong blob storage
    public string StoragePath { get; set; }        // Đường dẫn lưu file
    public int Status { get; set; }                // Trạng thái file
    public DateTime UploadTime { get; set; }       // Thời gian upload
}
```

### Chức năng:
- ✅ Lưu metadata của file (tên, size, mime type, path, ...)
- ✅ Quản lý file trong blob storage
- ✅ **Tái sử dụng** cho nhiều loại file khác nhau:
  - CV files (PDF, DOCX)
  - Company logos (PNG, JPG)
  - Documents (various formats)
  - Certificates, etc.

### Service: `FileServices`
- `UploadAsync()` - Upload file và tạo FileDescriptor
- `SoftDeleteAsync()` - Xóa file (soft delete)
- `DownloadAsync()` - Download file từ blob storage

---

## 2. UploadedCv - Lớp Domain-Specific (Business Logic Layer)

### Mục đích:
`UploadedCv` là một entity **domain-specific** để quản lý **business logic** của CV, link `FileDescriptor` với `CandidateProfile`.

### Các thuộc tính:
```csharp
public class UploadedCv : FullAuditedAggregateRoot<Guid>
{
    public Guid CandidateId { get; set; }          // ID candidate (UserId)
    public Guid FileDescriptorId { get; set; }     // FK đến FileDescriptor
    public string CvName { get; set; }             // Tên CV (do candidate đặt)
    public bool IsDefault { get; set; }            // CV mặc định?
    public bool IsPublic { get; set; }             // CV public?
    public string? Notes { get; set; }             // Ghi chú về CV
    
    // Navigation properties
    public CandidateProfile? CandidateProfile { get; set; }
    public FileDescriptor? FileDescriptor { get; set; }
}
```

### Chức năng:
- ✅ **Link FileDescriptor với CandidateProfile** - Xác định CV thuộc về candidate nào
- ✅ **Business logic riêng của CV**:
  - `CvName` - Tên CV do candidate tự đặt (có thể khác với `OriginalName` trong FileDescriptor)
  - `IsDefault` - Chỉ 1 CV mặc định per candidate
  - `IsPublic` - CV có public không (cho recruiter xem)
  - `Notes` - Ghi chú về CV
- ✅ **Audit fields** - `CreationTime`, `LastModificationTime`, `CreatorId`, etc. (từ `FullAuditedAggregateRoot`)

### Service: `UploadedCvAppService`
- `UploadCvAsync()` - Upload CV (tạo FileDescriptor + UploadedCv)
- `GetListAsync()` - Lấy danh sách CV của candidate
- `SetDefaultAsync()` - Set CV mặc định
- `DeleteAsync()` - Xóa CV (xóa cả FileDescriptor)

---

## 3. Luồng Upload CV

### Bước 1: Upload File
```
User uploads file (PDF, DOCX, ...)
    ↓
FileServices.UploadAsync()
    ↓
1. Validate file (size, extension, mime type, magic number)
2. Generate StorageName (unique)
3. Save file to Blob Storage
4. Create FileDescriptor record in DB
    ↓
Returns FileDescriptor.Id
```

### Bước 2: Tạo UploadedCv
```
UploadedCvAppService.UploadCvAsync()
    ↓
1. Get FileDescriptorId from step 1
2. Create UploadedCv record:
   - CandidateId = current user's UserId
   - FileDescriptorId = FileDescriptor.Id (from step 1)
   - CvName = user-provided name
   - IsDefault, IsPublic, Notes = user inputs
    ↓
Returns UploadedCvDto (includes FileDescriptor info)
```

---

## 4. Tại sao cần cả 2 lớp?

### ❌ Nếu chỉ dùng FileDescriptor:

**Vấn đề 1: Không có business logic**
```csharp
// FileDescriptor chỉ có:
- OriginalName = "CV_John_Doe.pdf"
- StorageName = "abc123xyz.pdf"
- ContainerName = "Resumes"

// Nhưng không có:
- CvName = "CV Senior Developer" (tên do candidate đặt)
- IsDefault = true
- IsPublic = false
- Notes = "Updated CV with new experience"
```

**Vấn đề 2: Không link được với Candidate**
```csharp
// FileDescriptor chỉ có CreatorId (string)
// Không có foreign key rõ ràng đến CandidateProfile
// Khó query: "Lấy tất cả CV của candidate X"
```

**Vấn đề 3: Không có audit fields**
```csharp
// FileDescriptor chỉ có UploadTime
// Không có: CreationTime, LastModificationTime, CreatorId, etc.
```

**Vấn đề 4: Không thể tái sử dụng file**
```csharp
// Nếu 1 file được dùng cho nhiều mục đích:
// - CV của candidate A
// - Document của candidate A
// - Attachment của application
// → Không thể link 1 FileDescriptor với nhiều entity khác nhau
```

---

### ✅ Với kiến trúc 2 lớp:

**Ưu điểm 1: Separation of Concerns**
```
FileDescriptor (Storage Layer)
    ↓
    - Quản lý file metadata
    - Quản lý blob storage
    - Generic, reusable

UploadedCv (Business Logic Layer)
    ↓
    - Quản lý business logic của CV
    - Link với CandidateProfile
    - Domain-specific
```

**Ưu điểm 2: Tái sử dụng FileDescriptor**
```
1 FileDescriptor có thể được reference bởi:
    - UploadedCv (CV của candidate)
    - CompanyDocument (Document của company)
    - ApplicationAttachment (Attachment của application)
    - ... (nhiều entity khác)
```

**Ưu điểm 3: Flexibility**
```csharp
// Candidate có thể đổi tên CV mà không ảnh hưởng đến file gốc
UploadedCv.CvName = "CV Senior Developer"  // Tên mới
FileDescriptor.OriginalName = "CV_John_Doe.pdf"  // Tên file gốc vẫn giữ nguyên
```

**Ưu điểm 4: Query dễ dàng**
```csharp
// Lấy tất cả CV của candidate X
var cvs = await _uploadedCvRepository.GetListAsync(
    x => x.CandidateId == candidateId
);

// Lấy file descriptor từ CV
var fileDescriptor = await _fileDescriptorRepository.GetAsync(
    uploadedCv.FileDescriptorId
);
```

**Ưu điểm 5: Business rules**
```csharp
// Chỉ 1 CV mặc định per candidate
if (isDefault) {
    var existingDefault = await _uploadedCvRepository.FirstOrDefaultAsync(
        x => x.CandidateId == userId && x.IsDefault
    );
    if (existingDefault != null) {
        existingDefault.IsDefault = false;
    }
}
```

---

## 5. So sánh với các pattern khác

### Pattern hiện tại: **Repository Pattern với Aggregation**
```
FileDescriptor (Aggregate Root)
    ↓
UploadedCv (Aggregate Root, references FileDescriptor)
    ↓
CandidateProfile (Aggregate Root, referenced by UploadedCv)
```

### Alternative 1: **Single Table Inheritance**
```csharp
// Tất cả trong 1 table
public class FileMetadata {
    public Guid Id { get; set; }
    public string FileType { get; set; } // "CV", "Document", "Logo"
    public Guid? CandidateId { get; set; }
    public Guid? CompanyId { get; set; }
    public string? CvName { get; set; }
    public bool? IsDefault { get; set; }
    // ... nhiều nullable fields
}
```
❌ **Vấn đề**: Table sẽ có nhiều nullable columns, khó maintain

### Alternative 2: **Table Per Type (TPT)**
```csharp
// FileDescriptor (base table)
// UploadedCvFile (inherits FileDescriptor)
```
❌ **Vấn đề**: Phức tạp hơn, không linh hoạt bằng composition

### Alternative 3: **Embedded File Info**
```csharp
// Chỉ dùng UploadedCv, không dùng FileDescriptor
public class UploadedCv {
    public string StorageName { get; set; }
    public string OriginalName { get; set; }
    public long Size { get; set; }
    // ... duplicate all file metadata
}
```
❌ **Vấn đề**: 
- Duplicate code
- Không tái sử dụng được
- Nếu cần thêm loại file mới (CompanyLogo, Document), phải duplicate lại

---

## 6. Kết luận

### Kiến trúc hiện tại là đúng vì:

1. **Separation of Concerns**
   - FileDescriptor: Quản lý file storage (generic)
   - UploadedCv: Quản lý business logic (domain-specific)

2. **Reusability**
   - FileDescriptor có thể dùng cho nhiều loại file
   - Không cần duplicate code

3. **Flexibility**
   - 1 FileDescriptor có thể được reference bởi nhiều entity
   - Dễ mở rộng (thêm CompanyDocument, ApplicationAttachment, ...)

4. **Maintainability**
   - Code rõ ràng, dễ hiểu
   - Dễ test và debug

5. **Scalability**
   - Dễ thêm business logic mới cho CV
   - Không ảnh hưởng đến file storage layer

---

## 7. Ví dụ thực tế

### Scenario: Candidate upload CV và đổi tên
```
1. User uploads "CV_John_Doe.pdf"
   → FileDescriptor created:
      - OriginalName = "CV_John_Doe.pdf"
      - StorageName = "abc123xyz.pdf"

2. User sets CvName = "CV Senior Developer"
   → UploadedCv created:
      - CvName = "CV Senior Developer"
      - FileDescriptorId = FileDescriptor.Id

3. User changes CvName to "My Updated CV"
   → Only UploadedCv.CvName updated
   → FileDescriptor.OriginalName unchanged (still "CV_John_Doe.pdf")
```

### Scenario: Same file used for multiple purposes
```
1. User uploads "resume.pdf"
   → FileDescriptor created (Id = guid1)

2. User creates UploadedCv
   → UploadedCv.FileDescriptorId = guid1

3. User uses same file for ApplicationAttachment
   → ApplicationAttachment.FileDescriptorId = guid1
   
→ Same file, 2 different purposes, no duplication!
```

---

## 8. Best Practices

### ✅ DO:
- Sử dụng FileDescriptor cho file storage
- Sử dụng domain-specific entities (UploadedCv, CompanyLogo, ...) cho business logic
- Link domain entities với FileDescriptor qua Foreign Key
- Load FileDescriptor khi cần (lazy loading)

### ❌ DON'T:
- Duplicate file metadata trong domain entities
- Hard-code file storage logic trong domain entities
- Mix file storage logic với business logic
- Create FileDescriptor without domain entity (trừ khi thực sự cần)

---

## 9. Tóm tắt

| Aspect | FileDescriptor | UploadedCv |
|--------|----------------|------------|
| **Purpose** | File storage metadata | CV business logic |
| **Scope** | Generic (all file types) | Domain-specific (CV only) |
| **Reusability** | High (reusable) | Low (CV-specific) |
| **Business Logic** | None | Rich (IsDefault, IsPublic, Notes) |
| **Relationships** | Referenced by many | References FileDescriptor, CandidateProfile |
| **Audit** | Basic (UploadTime) | Full (CreationTime, LastModificationTime, etc.) |

**Kết luận**: Kiến trúc 2 lớp là đúng và cần thiết để:
- Tách biệt concerns
- Tái sử dụng code
- Dễ mở rộng và maintain
- Hỗ trợ business logic phức tạp


