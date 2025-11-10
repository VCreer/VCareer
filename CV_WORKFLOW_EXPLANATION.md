# Giải thích Workflow CV Management

## 📋 Tổng quan

Hệ thống CV Management hoạt động theo 2 bước chính:
1. **Template Management** (Admin tạo templates)
2. **Candidate CV Management** (Candidate tạo CV từ template)

---

## 🎨 PHẦN 1: TEMPLATE MANAGEMENT

### Bước 1: Admin tạo Template

**API**: `POST /api/cv/templates`

**Request Body**:
```json
{
  "name": "Template Modern",
  "description": "Template hiện đại, chuyên nghiệp",
  "previewImageUrl": "https://example.com/preview.jpg",
  "layoutDefinition": "<div class='cv-container'>...</div>",  // ← HTML của bạn
  "styles": "body { font-family: Arial; } .cv-container { ... }",  // ← CSS của bạn
  "category": "Modern",
  "sortOrder": 1,
  "isActive": true,
  "isFree": true
}
```

**Giải thích**:
- ✅ **LayoutDefinition**: Bạn đưa HTML vào đây (có thể chứa placeholders như `{{personalInfo.fullName}}`)
- ✅ **Styles**: Bạn đưa CSS vào đây
- ✅ Lưu vào database bảng `CvTemplates`

**Kết quả**: Template được lưu vào DB với ID mới.

---

### Bước 2: Get Template ra (cho candidate xem và chọn)

**API**: `GET /api/cv/templates/active` hoặc `GET /api/cv/templates/{id}`

**Response**:
```json
{
  "id": "guid-123",
  "name": "Template Modern",
  "description": "Template hiện đại, chuyên nghiệp",
  "previewImageUrl": "https://example.com/preview.jpg",
  "layoutDefinition": "<div class='cv-container'>...</div>",  // ← Raw HTML (chưa render)
  "styles": "body { font-family: Arial; } ...",  // ← Raw CSS
  "category": "Modern",
  "isActive": true,
  "isFree": true
}
```

**⚠️ LƯU Ý QUAN TRỌNG**:
- ❌ **KHÔNG tự render** - Chỉ trả về HTML/CSS raw (chưa có data)
- ✅ Template chỉ là "khuôn mẫu" chứa placeholders
- ✅ Frontend sẽ dùng `previewImageUrl` để hiển thị preview cho candidate chọn
- ✅ Khi candidate chọn template, frontend sẽ lấy `layoutDefinition` và `styles` để hiển thị form nhập liệu

---

## 👤 PHẦN 2: CANDIDATE CV MANAGEMENT

### Bước 3: Candidate chọn Template và tạo CV

**Workflow**:
1. Candidate xem danh sách templates (chỉ preview images)
2. Candidate chọn 1 template (ví dụ: Template ID = `guid-123`)
3. Frontend load template details để biết structure:
   - Đọc `layoutDefinition` để biết template có những fields nào
   - Đọc `styles` để style form nhập liệu
   - Hiển thị form cho candidate nhập data

**Frontend sẽ hiển thị form dựa trên template**:
- Nếu template có `{{personalInfo.fullName}}` → hiển thị input "Họ tên"
- Nếu template có `{{personalInfo.email}}` → hiển thị input "Email"
- Nếu template có `{{#foreach workExperiences}}` → hiển thị form nhập kinh nghiệm làm việc (có thể thêm nhiều)
- Tương tự cho các sections khác

---

### Bước 4: Candidate nhập data và tạo CV

**API**: `POST /api/cv/candidate-cvs`

**Request Body**:
```json
{
  "templateId": "guid-123",  // ← Template đã chọn
  "cvName": "CV của tôi",
  "dataJson": "{                              // ← Data candidate nhập vào
    \"personalInfo\": {
      \"fullName\": \"Nguyễn Văn A\",
      \"email\": \"nguyenvana@email.com\",
      \"phoneNumber\": \"0123456789\",
      \"dateOfBirth\": \"1998-12-06\",
      \"address\": \"Quận Hoàng Mai, Hà Nội\"
    },
    \"careerObjective\": \"Mục tiêu nghề nghiệp...\",
    \"workExperiences\": [
      {
        \"companyName\": \"Công ty ABC\",
        \"position\": \"Developer\",
        \"startDate\": \"2020-01-01\",
        \"endDate\": \"2022-12-31\",
        \"description\": \"Mô tả công việc...\"
      }
    ],
    \"educations\": [...],
    \"skills\": [...]
  }",
  "isPublished": false,
  "isDefault": false
}
```

**Giải thích**:
- ✅ `templateId`: Template candidate đã chọn
- ✅ `dataJson`: JSON chứa tất cả data candidate nhập (theo structure `CvDataDto`)
- ✅ Lưu vào database bảng `CandidateCvs`

**Kết quả**: CV được tạo với ID mới, nhưng chưa render.

---

### Bước 5: Render CV (khi candidate muốn xem/preview CV)

**API**: `GET /api/cv/candidate-cvs/{cvId}/render`

**Response**:
```json
{
  "cvId": "cv-guid-456",
  "htmlContent": "<!DOCTYPE html><html>...<div class='cv-container'>...</div>...</html>"
}
```

**Giải thích**:
- ✅ Backend lấy `LayoutDefinition` từ template
- ✅ Backend lấy `DataJson` từ CandidateCv
- ✅ Backend replace placeholders trong HTML bằng data thực tế
- ✅ Backend inject CSS vào HTML
- ✅ Trả về HTML hoàn chỉnh (đã render, có thể hiển thị trực tiếp)

**Frontend sẽ**:
- Hiển thị HTML này trong iframe hoặc div
- Hoặc export ra PDF
- Hoặc in ra

---

## 🔄 TÓM TẮT WORKFLOW

```
1. Admin tạo Template
   └─> Lưu HTML vào LayoutDefinition
   └─> Lưu CSS vào Styles
   └─> Lưu vào DB (CvTemplates)

2. Candidate xem danh sách Templates
   └─> GET /api/cv/templates/active
   └─> Hiển thị preview images
   └─> Candidate chọn template

3. Candidate tạo CV
   └─> GET /api/cv/templates/{id} (để lấy structure)
   └─> Frontend hiển thị form nhập liệu
   └─> Candidate nhập data
   └─> POST /api/cv/candidate-cvs (lưu data vào DataJson)

4. Candidate xem CV đã render
   └─> GET /api/cv/candidate-cvs/{cvId}/render
   └─> Backend combine Template (HTML/CSS) + Data (DataJson)
   └─> Trả về HTML đã render
   └─> Frontend hiển thị HTML
```

---

## ❓ TRẢ LỜI CÂU HỎI CỦA BẠN

### Câu hỏi: "Khi get dữ liệu từ bảng CvTemplate ra thì nó sẽ tự render cho tôi 1 cái template để tôi có thể nhập vào đúng không?"

**Trả lời**:
- ❌ **KHÔNG tự render** - Khi get template ra, chỉ trả về HTML/CSS raw (chưa có data)
- ✅ **Frontend sẽ tự xử lý**:
  - Frontend đọc `layoutDefinition` để biết template có những fields nào
  - Frontend parse placeholders (ví dụ: `{{personalInfo.fullName}}`) để tạo form
  - Frontend hiển thị form cho candidate nhập data
- ✅ **Render chỉ xảy ra ở bước cuối** - Khi gọi API `RenderCvAsync`, backend mới combine template + data để render HTML hoàn chỉnh

**Ví dụ**:
```javascript
// Frontend get template
const template = await getTemplate(templateId);

// Parse template để tạo form
const formFields = [];
if (template.layoutDefinition.includes('{{personalInfo.fullName}}')) {
  formFields.push({ type: 'text', name: 'fullName', label: 'Họ tên' });
}
if (template.layoutDefinition.includes('{{personalInfo.email}}')) {
  formFields.push({ type: 'email', name: 'email', label: 'Email' });
}

// Hiển thị form cho candidate nhập
// Sau khi nhập xong, gọi CreateCandidateCv với dataJson
```

---

## 📝 LƯU Ý QUAN TRỌNG

1. **Template chỉ là "khuôn mẫu"**:
   - Chứa HTML structure và placeholders
   - Chưa có data thực tế
   - Chưa render

2. **CV (CandidateCv) chứa data**:
   - `DataJson`: JSON chứa data candidate nhập
   - `TemplateId`: Link đến template đã chọn
   - Chưa render thành HTML

3. **Render CV**:
   - Chỉ xảy ra khi gọi API `RenderCvAsync`
   - Backend combine Template + Data
   - Trả về HTML hoàn chỉnh (có thể hiển thị/export)

4. **Frontend có 2 nhiệm vụ**:
   - **Khi tạo CV**: Parse template để tạo form nhập liệu
   - **Khi xem CV**: Gọi API render để lấy HTML và hiển thị



