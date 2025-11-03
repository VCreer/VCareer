# CV Upload API - Đơn giản hóa theo TopCV

## ✅ Đã hoàn thành

### 1. Tạo Constants cho CV Upload
- **File**: `src/VCareer.Domain.Shared/Constants/FileConstant/CvUploadConstants.cs`
- **Chức năng**: 
  - Giới hạn file size: 5MB
  - Chỉ chấp nhận: PDF, DOC, DOCX
  - Validate MIME types
  - Generate unique file names

### 2. API Endpoints mới

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/cv/simple-upload` | POST | Upload CV đơn giản (chỉ cần file) |
| `/api/cv/by-type/Online` | GET | Lấy danh sách CV tạo online |
| `/api/cv/by-type/Upload` | GET | Lấy danh sách CV upload file |

### 3. Tính năng Upload CV đơn giản

#### ✅ **Không cần input fields**
- Chỉ cần kéo file vào và upload
- Không cần nhập CVName, Description, etc.

#### ✅ **File validation tự động**
- **Size**: Tối đa 5MB
- **Format**: Chỉ PDF, DOC, DOCX
- **MIME Type**: Validate chính xác

#### ✅ **Tách riêng 2 list**
- **CV Online**: `GET /api/cv/by-type/Online`
- **CV Upload**: `GET /api/cv/by-type/Upload`

#### ✅ **Tự động generate metadata**
- CVName = tên file gốc (không có extension)
- Description = "CV được upload từ file: [filename]"
- FileUrl = URL đến blob storage
- FileSize = kích thước file
- FileType = MIME type

## 🚀 Cách sử dụng

### 1. Upload CV đơn giản
```bash
POST /api/cv/simple-upload
Content-Type: multipart/form-data

# Body: FormData với field "file"
```

**Response:**
```json
{
  "id": "guid",
  "candidateId": "guid",
  "cvName": "My_CV_File",
  "cvType": "Upload",
  "status": "Published",
  "originalFileName": "My CV File.pdf",
  "fileUrl": "/api/files/cv/CV_Upload_20241201_143022_1234.pdf",
  "fileSize": 2048576,
  "fileType": "application/pdf",
  "description": "CV được upload từ file: My CV File.pdf",
  "isDefault": false,
  "isPublic": false
}
```

### 2. Lấy danh sách CV theo loại

#### CV Online:
```bash
GET /api/cv/by-type/Online
```

#### CV Upload:
```bash
GET /api/cv/by-type/Upload
```

**Response:**
```json
[
  {
    "id": "guid",
    "cvName": "CV Frontend Developer",
    "cvType": "Online",
    "status": "Published",
    "fullName": "Nguyễn Văn A",
    "email": "test@email.com",
    // ... other fields
  },
  {
    "id": "guid2", 
    "cvName": "My_CV_File",
    "cvType": "Upload",
    "originalFileName": "My CV File.pdf",
    "fileUrl": "/api/files/cv/...",
    // ... other fields
  }
]
```

## 🔧 File Validation Rules

### ✅ **Allowed File Types:**
- `.pdf` (application/pdf)
- `.doc` (application/msword)  
- `.docx` (application/vnd.openxmlformats-officedocument.wordprocessingml.document)

### ✅ **File Size:**
- **Maximum**: 5MB (5,242,880 bytes)
- **Minimum**: > 0 bytes

### ✅ **Error Messages:**
- `"Vui lòng chọn file CV để upload."` - No file selected
- `"File quá lớn. Kích thước tối đa cho phép là 5MB."` - File too large
- `"Định dạng file không được hỗ trợ. Chỉ chấp nhận các file: .pdf, .doc, .docx"` - Wrong extension
- `"Loại file không được hỗ trợ. Chỉ chấp nhận: application/pdf, application/msword, ..."` - Wrong MIME type

## 📁 File Storage

### Blob Container:
- **Container**: `cv-files` (defined in `CvFileContainer.cs`)
- **File naming**: `CV_Upload_YYYYMMDD_HHMMSS_RANDOM.ext`
- **Example**: `CV_Upload_20241201_143022_1234.pdf`

### File URL:
- **Pattern**: `/api/files/cv/{fileName}`
- **Example**: `/api/files/cv/CV_Upload_20241201_143022_1234.pdf`

## 🎯 Frontend Integration

### Upload Component:
```typescript
// Simple drag & drop upload
onFileSelected(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  
  this.http.post('/api/cv/simple-upload', formData)
    .subscribe(response => {
      console.log('CV uploaded:', response);
    });
}
```

### Separate Lists:
```typescript
// Get Online CVs
getOnlineCVs() {
  return this.http.get('/api/cv/by-type/Online');
}

// Get Upload CVs  
getUploadCVs() {
  return this.http.get('/api/cv/by-type/Upload');
}
```

## 🔄 Workflow

1. **User drags file** → Frontend validates basic (size, type)
2. **Frontend calls** → `POST /api/cv/simple-upload`
3. **Backend validates** → File size, extension, MIME type
4. **Backend uploads** → File to blob storage
5. **Backend creates** → CV record in database
6. **Backend returns** → CV information
7. **Frontend updates** → Upload CV list

## 📝 Notes

- **Authentication**: Disabled for development (commented `[Authorize]`)
- **Default CV**: First CV of user becomes default automatically
- **File Storage**: Uses ABP Blob Storage (configurable)
- **Error Handling**: Comprehensive validation with user-friendly messages
- **File Naming**: Automatic unique naming to prevent conflicts

---

**Ready to use!** 🎉

