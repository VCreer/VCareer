# Legal Information & Supporting Documents API Documentation

## 📋 Tổng quan

API này cung cấp các chức năng để người dùng có thể:
- **Submit Legal Information**: Nộp thông tin pháp lý (CMND, CCCD, Passport, etc.)
- **Upload Supporting Documents**: Upload giấy tờ chứng minh (bằng cấp, chứng chỉ, kinh nghiệm làm việc, etc.)

## 🔐 Authentication

Tất cả API endpoints đều yêu cầu authentication. Bao gồm JWT token trong Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 📄 Legal Information APIs

### 1. Submit Legal Information
**POST** `/api/profile/legal-information`

Nộp thông tin pháp lý mới cho người dùng hiện tại.

**Authorization:** Requires `VCareer.Profile.SubmitLegalInformation` permission

**Request Body:**
```json
{
  "documentType": "CMND", // CMND, CCCD, Passport, DriverLicense, etc.
  "documentNumber": "123456789",
  "issueDate": "2020-01-01T00:00:00Z",
  "expiryDate": "2030-01-01T00:00:00Z",
  "issuingAuthority": "Công an TP.HCM",
  "placeOfIssue": "TP. Hồ Chí Minh",
  "additionalNotes": "Ghi chú bổ sung",
  "isVerified": false
}
```

**Response:** 200 OK với thông tin legal information đã tạo

**Validation Rules:**
- `documentType`: Required, max 50 characters
- `documentNumber`: Required, max 20 characters
- `issueDate`: Required, must be valid date
- `expiryDate`: Required, must be after issue date and not expired
- `issuingAuthority`: Required, max 200 characters
- `placeOfIssue`: Required, max 500 characters
- `additionalNotes`: Optional, max 1000 characters

### 2. Update Legal Information
**PUT** `/api/profile/legal-information/{id}`

Cập nhật thông tin pháp lý đã tồn tại.

**Authorization:** Requires `VCareer.Profile.UpdateLegalInformation` permission

**Request Body:** Tương tự như Submit Legal Information (không có `isVerified`)

**Response:** 200 OK với thông tin đã cập nhật

**Note:** Chỉ có thể cập nhật khi chưa được verify

### 3. Get Legal Information
**GET** `/api/profile/legal-information/{id}`

Lấy thông tin pháp lý theo ID.

**Authorization:** Requires `VCareer.Profile.Default` permission

**Response:** 200 OK với thông tin legal information

### 4. Get All Legal Information
**GET** `/api/profile/legal-information`

Lấy tất cả thông tin pháp lý của người dùng hiện tại.

**Authorization:** Requires `VCareer.Profile.Default` permission

**Response:** 200 OK với danh sách legal information

### 5. Delete Legal Information
**DELETE** `/api/profile/legal-information/{id}`

Xóa thông tin pháp lý.

**Authorization:** Requires `VCareer.Profile.DeleteSupportingDocument` permission

**Response:** 204 No Content

**Note:** Chỉ có thể xóa khi chưa được verify

## 📁 Supporting Documents APIs

### 1. Upload Supporting Document
**POST** `/api/profile/supporting-documents/upload`

Upload giấy tờ chứng minh mới.

**Authorization:** Requires `VCareer.Profile.UploadSupportingDocument` permission

**Request Body:**
```json
{
  "documentName": "Bằng đại học",
  "documentCategory": "Education", // Education, Work Experience, Certificate, etc.
  "description": "Bằng cử nhân Công nghệ thông tin",
  "fileContent": "base64-encoded-file-content",
  "fileExtension": ".pdf",
  "fileSize": 1048576, // File size in bytes
  "mimeType": "application/pdf",
  "isPublic": false
}
```

**Response:** 200 OK với thông tin document đã upload

**Validation Rules:**
- `documentName`: Required, max 100 characters
- `documentCategory`: Required, max 50 characters
- `description`: Optional, max 500 characters
- `fileContent`: Required, base64 encoded
- `fileExtension`: Required, allowed: .pdf, .jpg, .jpeg, .png, .doc, .docx
- `fileSize`: Required, max 10MB
- `mimeType`: Required, allowed: application/pdf, image/jpeg, image/png, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document

### 2. Update Supporting Document
**PUT** `/api/profile/supporting-documents/{id}`

Cập nhật thông tin document (không bao gồm file).

**Authorization:** Requires `VCareer.Profile.UpdateSupportingDocument` permission

**Request Body:**
```json
{
  "documentName": "Bằng đại học (Updated)",
  "documentCategory": "Education",
  "description": "Bằng cử nhân Công nghệ thông tin - Đã cập nhật",
  "isPublic": true
}
```

**Response:** 200 OK với thông tin đã cập nhật

### 3. Get Supporting Document
**GET** `/api/profile/supporting-documents/{id}`

Lấy thông tin document theo ID.

**Authorization:** Requires `VCareer.Profile.Default` permission

**Response:** 200 OK với thông tin document

### 4. Get All Supporting Documents
**GET** `/api/profile/supporting-documents`

Lấy tất cả documents của người dùng hiện tại.

**Authorization:** Requires `VCareer.Profile.Default` permission

**Response:** 200 OK với danh sách documents

### 5. Download Supporting Document
**GET** `/api/profile/supporting-documents/{id}/download`

Download file document.

**Authorization:** Requires `VCareer.Profile.DownloadSupportingDocument` permission

**Response:** File download với proper MIME type và filename

### 6. Delete Supporting Document
**DELETE** `/api/profile/supporting-documents/{id}`

Xóa document và file.

**Authorization:** Requires `VCareer.Profile.DeleteSupportingDocument` permission

**Response:** 204 No Content

## 🔧 Business Logic

### Legal Information:
- Mỗi user chỉ có thể có 1 document của mỗi loại (CMND, CCCD, Passport, etc.)
- Document phải có expiry date sau issue date
- Document không được expired
- Sau khi verify, không thể update hoặc delete
- Verification status: Pending → Approved/Rejected

### Supporting Documents:
- File size tối đa 10MB
- Chỉ cho phép các file types: PDF, JPG, JPEG, PNG, DOC, DOCX
- File được lưu với tên unique để tránh conflict
- Có thể set document là public hoặc private
- Khi delete document, file vật lý cũng bị xóa

## 🛡️ Security Features

1. **Authorization**: Tất cả endpoints đều có authorization phù hợp
2. **File Validation**: Kiểm tra file type, size, và content
3. **User Isolation**: User chỉ có thể access documents của chính mình
4. **Data Validation**: Validation đầy đủ ở cả client và server
5. **Audit Logging**: Tất cả operations đều được audit log

## 📊 Error Handling

Tất cả APIs trả về error details theo format chuẩn:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "string",
    "validationErrors": [
      {
        "message": "string",
        "members": ["string"]
      }
    ]
  }
}
```

## 🧪 Test Cases

### Legal Information Test Cases:
1. **Valid submission** - Submit với data hợp lệ
2. **Duplicate document type** - Submit cùng loại document 2 lần
3. **Expired document** - Submit document đã hết hạn
4. **Invalid dates** - Expiry date trước issue date
5. **Update verified document** - Update document đã verify
6. **Delete verified document** - Delete document đã verify

### Supporting Documents Test Cases:
1. **Valid upload** - Upload file hợp lệ
2. **File too large** - Upload file > 10MB
3. **Invalid file type** - Upload file không được phép
4. **Invalid MIME type** - MIME type không khớp với extension
5. **Download non-existent file** - Download file không tồn tại
6. **Access other user's document** - Access document của user khác

## 📝 Usage Examples

### Submit Legal Information:
```bash
curl -X POST "https://api.vcareer.com/api/profile/legal-information" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "documentType": "CMND",
    "documentNumber": "123456789",
    "issueDate": "2020-01-01T00:00:00Z",
    "expiryDate": "2030-01-01T00:00:00Z",
    "issuingAuthority": "Công an TP.HCM",
    "placeOfIssue": "TP. Hồ Chí Minh",
    "additionalNotes": "CMND cấp mới"
  }'
```

### Upload Supporting Document:
```bash
curl -X POST "https://api.vcareer.com/api/profile/supporting-documents/upload" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "documentName": "Bằng đại học",
    "documentCategory": "Education",
    "description": "Bằng cử nhân CNTT",
    "fileContent": "JVBERi0xLjQKJcfsj6IKNSAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDMgMCBSCi9NZWRpYUJveCBbMCAwIDU5NSA4NDJdCi9SZXNvdXJjZXMgPDwKL0ZvbnQgPDwKL0YxIDIgMCBSCj4+Cj4+Ci9Db250ZW50cyA0IDAgUgo+PgplbmRvYmoK...",
    "fileExtension": ".pdf",
    "fileSize": 1048576,
    "mimeType": "application/pdf",
    "isPublic": false
  }'
```

## 🔄 Database Schema

### LegalInformations Table:
- Id (Guid, PK)
- UserId (Guid, FK)
- DocumentType (string, 50)
- DocumentNumber (string, 20)
- IssueDate (DateTime)
- ExpiryDate (DateTime)
- IssuingAuthority (string, 200)
- PlaceOfIssue (string, 500)
- AdditionalNotes (string, 1000)
- IsVerified (bool)
- VerificationStatus (string, 50)
- VerificationNotes (string, 1000)
- VerifiedAt (DateTime?)
- VerifiedBy (Guid?)
- CreationTime, LastModificationTime, etc.

### SupportingDocuments Table:
- Id (Guid, PK)
- UserId (Guid, FK)
- DocumentName (string, 100)
- DocumentCategory (string, 50)
- Description (string, 500)
- FilePath (string, 1000)
- FileExtension (string, 10)
- FileSize (long)
- MimeType (string, 100)
- IsPublic (bool)
- UploadStatus (string, 50)
- UploadedAt (DateTime)
- CreationTime, LastModificationTime, etc.
