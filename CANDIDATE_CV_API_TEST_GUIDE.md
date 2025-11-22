# Hướng dẫn Test API Candidate CV - Theo Workflow

## 📋 Tổng quan Workflow

```
1. Xem danh sách Templates → Chọn Template
2. Xem Template Details → Hiểu structure
3. Tạo CV từ Template → Nhập data
4. Xem CV đã render → Preview
5. Cập nhật CV → Sửa data
6. Publish/Set Default → Hoàn tất
```

---

## 🔐 Authentication

**Tất cả API đều yêu cầu JWT Bearer Token**

Trong Swagger:
1. Click "Authorize" button
2. Nhập token: `Bearer <your-token>`
3. Click "Authorize"

Hoặc trong Postman:
- Header: `Authorization: Bearer <your-token>`

---

## 📝 BƯỚC 1: Xem danh sách Templates (để chọn)

### API: `GET /api/cv/templates/active`

**Mục đích**: Lấy danh sách templates đang active để candidate chọn

**Request**:
```
GET https://localhost:44385/api/cv/templates/active
```

**Query Parameters** (optional):
- `category`: Filter theo category
- `isFree`: Filter theo free/premium
- `skipCount`: Pagination skip
- `maxResultCount`: Số lượng results (default: 10)

**Response**:
```json
{
  "totalCount": 5,
  "items": [
    {
      "id": "template-guid-1",
      "name": "Template Modern",
      "description": "Template hiện đại",
      "previewImageUrl": "https://example.com/preview.jpg",
      "category": "Modern",
      "isActive": true,
      "isFree": true,
      "sortOrder": 1
    },
    {
      "id": "template-guid-2",
      "name": "Template Classic",
      "description": "Template cổ điển",
      "previewImageUrl": "https://example.com/preview2.jpg",
      "category": "Classic",
      "isActive": true,
      "isFree": true,
      "sortOrder": 2
    }
  ]
}
```

**Test trong Swagger**:
1. Tìm endpoint `GET /api/cv/templates/active`
2. Click "Try it out"
3. Click "Execute"
4. Copy `id` của template bạn muốn dùng (ví dụ: `template-guid-1`)

---

## 📝 BƯỚC 2: Xem Template Details (để hiểu structure)

### API: `GET /api/cv/templates/{id}`

**Mục đích**: Lấy thông tin chi tiết của template, bao gồm `LayoutDefinition` và `Styles` để frontend biết cần những fields nào

**Request**:
```
GET https://localhost:44385/api/cv/templates/template-guid-1
```

**Response**:
```json
{
  "id": "template-guid-1",
  "name": "Template Modern",
  "description": "Template hiện đại",
  "previewImageUrl": "https://example.com/preview.jpg",
  "layoutDefinition": "<div class=\"cv-container\"><h1>{{personalInfo.fullName}}</h1><p>{{personalInfo.email}}</p>{{#foreach workExperiences}}<div>{{workExperience.companyName}}</div>{{/foreach}}</div>",
  "styles": "body { font-family: Arial; } .cv-container { padding: 20px; }",
  "category": "Modern",
  "isActive": true,
  "isFree": true,
  "sortOrder": 1
}
```

**Lưu ý**:
- `layoutDefinition`: HTML template với placeholders
- `styles`: CSS cho template
- Frontend sẽ parse `layoutDefinition` để biết cần fields nào (ví dụ: `{{personalInfo.fullName}}` → cần field "Họ tên")

**Test trong Swagger**:
1. Tìm endpoint `GET /api/cv/templates/{id}`
2. Click "Try it out"
3. Nhập `id` của template (ví dụ: `template-guid-1`)
4. Click "Execute"
5. Copy `layoutDefinition` để hiểu structure

---

## 📝 BƯỚC 3: Tạo CV từ Template (Nhập data)

### API: `POST /api/cv/candidates`

**Mục đích**: Tạo CV mới với template đã chọn và data candidate nhập

**Request**:
```
POST https://localhost:44385/api/cv/candidates
```

**Request Body**:
```json
{
  "templateId": "template-guid-1",
  "cvName": "CV của Nguyễn Văn A",
  "dataJson": "{\"personalInfo\":{\"fullName\":\"Nguyễn Văn A\",\"email\":\"nguyenvana@email.com\",\"phoneNumber\":\"0123456789\",\"dateOfBirth\":\"1998-12-06T00:00:00\",\"address\":\"Quận Hoàng Mai, Hà Nội\",\"profileImageUrl\":\"https://example.com/avatar.jpg\",\"linkedIn\":\"linkedin.com/in/nguyenvana\",\"website\":\"https://nguyenvana.com\"},\"careerObjective\":\"Mục tiêu nghề nghiệp của tôi là trở thành một developer giỏi...\",\"workExperiences\":[{\"companyName\":\"Công ty ABC\",\"position\":\"Business Development Executive\",\"startDate\":\"2022-03-01T00:00:00\",\"endDate\":\"2025-02-28T00:00:00\",\"isCurrentJob\":false,\"description\":\"Mô tả công việc...\",\"achievements\":[\"Thành tích 1\",\"Thành tích 2\"]}],\"educations\":[{\"institutionName\":\"Trường Đại học Ngoại Thương\",\"degree\":\"Cử nhân\",\"major\":\"Quản trị Kinh doanh\",\"startDate\":\"2016-09-01T00:00:00\",\"endDate\":\"2020-06-30T00:00:00\",\"isCurrent\":false,\"gpa\":\"3.7/4.0\",\"description\":\"Môn học liên quan: Quản trị bán hàng, Chiến lược kinh doanh...\"}],\"skills\":[{\"skillName\":\"JavaScript\",\"level\":\"Advanced\",\"category\":\"Technical\"},{\"skillName\":\"Communication\",\"level\":\"Expert\",\"category\":\"Soft\"}],\"projects\":[],\"certificates\":[],\"languages\":[{\"languageName\":\"Tiếng Anh\",\"proficiencyLevel\":\"Advanced\"}]}",
  "isPublished": false,
  "isDefault": false,
  "isPublic": false,
  "notes": "CV đầu tiên của tôi"
}
```

**Giải thích**:
- `templateId`: ID của template đã chọn ở bước 1
- `cvName`: Tên CV (do candidate tự đặt)
- `dataJson`: **JSON string** (chú ý: phải escape đúng!) chứa tất cả data theo structure `CvDataDto`
- `isPublished`: `false` = draft, `true` = published
- `isDefault`: `true` = set làm CV mặc định
- `isPublic`: `true` = cho recruiter xem

**Cấu trúc `dataJson` (CvDataDto)**:
```json
{
  "personalInfo": {
    "fullName": "Nguyễn Văn A",
    "email": "nguyenvana@email.com",
    "phoneNumber": "0123456789",
    "dateOfBirth": "1998-12-06T00:00:00",
    "address": "Quận Hoàng Mai, Hà Nội",
    "profileImageUrl": "https://example.com/avatar.jpg",
    "linkedIn": "linkedin.com/in/nguyenvana",
    "gitHub": "github.com/nguyenvana",
    "website": "https://nguyenvana.com"
  },
  "careerObjective": "Mục tiêu nghề nghiệp...",
  "workExperiences": [
    {
      "companyName": "Công ty ABC",
      "position": "Business Development Executive",
      "startDate": "2022-03-01T00:00:00",
      "endDate": "2025-02-28T00:00:00",
      "isCurrentJob": false,
      "description": "Mô tả công việc...",
      "achievements": ["Thành tích 1", "Thành tích 2"]
    }
  ],
  "educations": [
    {
      "institutionName": "Trường Đại học Ngoại Thương",
      "degree": "Cử nhân",
      "major": "Quản trị Kinh doanh",
      "startDate": "2016-09-01T00:00:00",
      "endDate": "2020-06-30T00:00:00",
      "isCurrent": false,
      "gpa": "3.7/4.0",
      "description": "Môn học liên quan..."
    }
  ],
  "skills": [
    {
      "skillName": "JavaScript",
      "level": "Advanced",
      "category": "Technical"
    }
  ],
  "projects": [],
  "certificates": [],
  "languages": [
    {
      "languageName": "Tiếng Anh",
      "proficiencyLevel": "Advanced"
    }
  ],
  "additionalInfo": "Thông tin bổ sung..."
}
```

**⚠️ LƯU Ý QUAN TRỌNG**:
- `dataJson` phải là **JSON string** (escape đúng!)
- Trong Swagger, bạn có thể paste JSON object trực tiếp, Swagger sẽ tự động convert
- Nếu test bằng Postman, phải escape đúng: `"` → `\"`

**Response**:
```json
{
  "id": "cv-guid-123",
  "candidateId": "user-guid-456",
  "templateId": "template-guid-1",
  "cvName": "CV của Nguyễn Văn A",
  "dataJson": "{...}",
  "isPublished": false,
  "isDefault": false,
  "isPublic": false,
  "publishedAt": null,
  "viewCount": 0,
  "notes": "CV đầu tiên của tôi",
  "template": null
}
```

**Lưu lại `id`** (ví dụ: `cv-guid-123`) để dùng cho các bước sau!

**Test trong Swagger**:
1. Tìm endpoint `POST /api/cv/candidates`
2. Click "Try it out"
3. Paste JSON body ở trên (sửa `templateId` cho đúng)
4. Click "Execute"
5. Copy `id` từ response

---

## 📝 BƯỚC 4: Xem CV đã render (Preview)

### API: `GET /api/cv/candidates/{id}/render`

**Mục đích**: Render CV thành HTML hoàn chỉnh (combine template + data)

**Request**:
```
GET https://localhost:44385/api/cv/candidates/cv-guid-123/render
```

**Response**:
```json
{
  "cvId": "cv-guid-123",
  "htmlContent": "<!DOCTYPE html><html><head><style>body { font-family: Arial; } .cv-container { padding: 20px; }</style></head><body><div class=\"cv-container\"><h1>Nguyễn Văn A</h1><p>nguyenvana@email.com</p><div><div>Công ty ABC</div></div></div></body></html>"
}
```

**Giải thích**:
- `htmlContent`: HTML đã render hoàn chỉnh (có thể hiển thị trực tiếp)
- Tất cả placeholders đã được replace bằng data thực tế
- CSS đã được inject vào `<style>` tag

**Cách sử dụng**:
1. Copy `htmlContent`
2. Lưu vào file `.html` và mở bằng browser
3. Hoặc hiển thị trong iframe/div trong frontend

**Test trong Swagger**:
1. Tìm endpoint `GET /api/cv/candidates/{id}/render`
2. Click "Try it out"
3. Nhập `id` của CV (ví dụ: `cv-guid-123`)
4. Click "Execute"
5. Copy `htmlContent` và test hiển thị

---

## 📝 BƯỚC 5: Cập nhật CV (Sửa data)

### API: `PUT /api/cv/candidates/{id}`

**Mục đích**: Cập nhật thông tin CV (có thể update từng phần)

**Request**:
```
PUT https://localhost:44385/api/cv/candidates/cv-guid-123
```

**Request Body** (có thể chỉ gửi fields cần update):
```json
{
  "cvName": "CV đã cập nhật",
  "dataJson": "{\"personalInfo\":{\"fullName\":\"Nguyễn Văn B (đã đổi tên)\",\"email\":\"nguyenvanb@email.com\"},\"careerObjective\":\"Mục tiêu mới...\"}",
  "isPublished": true,
  "isDefault": true,
  "notes": "Đã cập nhật thông tin"
}
```

**Lưu ý**:
- Chỉ cần gửi fields muốn update
- `dataJson` có thể chỉ gửi phần data muốn thay đổi (partial update)
- Nếu muốn update toàn bộ data, gửi lại full `dataJson`

**Response**:
```json
{
  "id": "cv-guid-123",
  "candidateId": "user-guid-456",
  "templateId": "template-guid-1",
  "cvName": "CV đã cập nhật",
  "dataJson": "{...}",
  "isPublished": true,
  "isDefault": true,
  "isPublic": false,
  "publishedAt": "2024-01-15T10:30:00Z",
  "viewCount": 0,
  "notes": "Đã cập nhật thông tin"
}
```

**Test trong Swagger**:
1. Tìm endpoint `PUT /api/cv/candidates/{id}`
2. Click "Try it out"
3. Nhập `id` của CV
4. Paste JSON body (chỉ fields cần update)
5. Click "Execute"

---

## 📝 BƯỚC 6: Lấy danh sách CV của candidate

### API: `GET /api/cv/candidates`

**Mục đích**: Lấy danh sách tất cả CV của candidate hiện tại

**Request**:
```
GET https://localhost:44385/api/cv/candidates
```

**Query Parameters** (optional):
- `templateId`: Filter theo template
- `isPublished`: Filter theo published/draft
- `isDefault`: Filter theo default
- `isPublic`: Filter theo public
- `searchKeyword`: Search theo tên CV
- `skipCount`: Pagination skip
- `maxResultCount`: Số lượng results

**Response**:
```json
{
  "totalCount": 3,
  "items": [
    {
      "id": "cv-guid-123",
      "cvName": "CV của Nguyễn Văn A",
      "templateId": "template-guid-1",
      "isPublished": true,
      "isDefault": true,
      "isPublic": false,
      "viewCount": 5
    },
    {
      "id": "cv-guid-124",
      "cvName": "CV thứ 2",
      "templateId": "template-guid-2",
      "isPublished": false,
      "isDefault": false,
      "isPublic": false,
      "viewCount": 0
    }
  ]
}
```

**Test trong Swagger**:
1. Tìm endpoint `GET /api/cv/candidates`
2. Click "Try it out"
3. Điền query parameters (optional)
4. Click "Execute"

---

## 📝 BƯỚC 7: Lấy CV theo ID

### API: `GET /api/cv/candidates/{id}`

**Mục đích**: Lấy thông tin chi tiết của 1 CV (bao gồm template info)

**Request**:
```
GET https://localhost:44385/api/cv/candidates/cv-guid-123
```

**Response**:
```json
{
  "id": "cv-guid-123",
  "candidateId": "user-guid-456",
  "templateId": "template-guid-1",
  "cvName": "CV của Nguyễn Văn A",
  "dataJson": "{...}",
  "isPublished": true,
  "isDefault": true,
  "isPublic": false,
  "publishedAt": "2024-01-15T10:30:00Z",
  "viewCount": 5,
  "notes": "CV đầu tiên",
  "template": {
    "id": "template-guid-1",
    "name": "Template Modern",
    "description": "Template hiện đại",
    "previewImageUrl": "https://example.com/preview.jpg",
    "category": "Modern"
  }
}
```

**Test trong Swagger**:
1. Tìm endpoint `GET /api/cv/candidates/{id}`
2. Click "Try it out"
3. Nhập `id` của CV
4. Click "Execute"

---

## 📝 BƯỚC 8: Set CV làm mặc định

### API: `POST /api/cv/candidates/{id}/set-default`

**Mục đích**: Set CV làm mặc định (chỉ 1 CV mặc định per candidate)

**Request**:
```
POST https://localhost:44385/api/cv/candidates/cv-guid-123/set-default
```

**Response**: `204 No Content`

**Lưu ý**: Nếu có CV khác đang là default, sẽ tự động bỏ default

**Test trong Swagger**:
1. Tìm endpoint `POST /api/cv/candidates/{id}/set-default`
2. Click "Try it out"
3. Nhập `id` của CV
4. Click "Execute"

---

## 📝 BƯỚC 9: Publish/Unpublish CV

### API: `POST /api/cv/candidates/{id}/publish`

**Mục đích**: Publish hoặc unpublish CV

**Request**:
```
POST https://localhost:44385/api/cv/candidates/cv-guid-123/publish
```

**Request Body**:
```json
true   // Publish
```
hoặc
```json
false  // Unpublish
```

**Response**: `204 No Content`

**Lưu ý**: Khi publish, `PublishedAt` sẽ được set thành thời điểm hiện tại

**Test trong Swagger**:
1. Tìm endpoint `POST /api/cv/candidates/{id}/publish`
2. Click "Try it out"
3. Nhập `id` của CV
4. Nhập body: `true` hoặc `false`
5. Click "Execute"

---

## 📝 BƯỚC 10: Lấy CV mặc định

### API: `GET /api/cv/candidates/default`

**Mục đích**: Lấy CV mặc định của candidate hiện tại

**Request**:
```
GET https://localhost:44385/api/cv/candidates/default
```

**Response**:
```json
{
  "id": "cv-guid-123",
  "cvName": "CV của Nguyễn Văn A",
  "templateId": "template-guid-1",
  "isDefault": true,
  ...
}
```

**Test trong Swagger**:
1. Tìm endpoint `GET /api/cv/candidates/default`
2. Click "Try it out"
3. Click "Execute"

---

## 📝 BƯỚC 11: Xóa CV

### API: `DELETE /api/cv/candidates/{id}`

**Mục đích**: Xóa CV (chỉ có thể xóa CV của chính mình)

**Request**:
```
DELETE https://localhost:44385/api/cv/candidates/cv-guid-123
```

**Response**: `204 No Content`

**Test trong Swagger**:
1. Tìm endpoint `DELETE /api/cv/candidates/{id}`
2. Click "Try it out"
3. Nhập `id` của CV
4. Click "Execute"

---

## 📝 BƯỚC 12: Tăng view count (cho recruiter)

### API: `POST /api/cv/candidates/{id}/increment-view`

**Mục đích**: Tăng view count khi recruiter xem CV (public)

**Request**:
```
POST https://localhost:44385/api/cv/candidates/cv-guid-123/increment-view
```

**Response**: `204 No Content`

**Test trong Swagger**:
1. Tìm endpoint `POST /api/cv/candidates/{id}/increment-view`
2. Click "Try it out"
3. Nhập `id` của CV
4. Click "Execute"

---

## 🎯 TÓM TẮT WORKFLOW TEST

### Workflow cơ bản:
```
1. GET /api/cv/templates/active
   → Chọn template (copy id)

2. GET /api/cv/templates/{id}
   → Xem template details (để hiểu structure)

3. POST /api/cv/candidates
   → Tạo CV (với templateId + dataJson)
   → Copy CV id

4. GET /api/cv/candidates/{id}/render
   → Xem CV đã render (HTML)

5. PUT /api/cv/candidates/{id}
   → Cập nhật CV (nếu cần)

6. POST /api/cv/candidates/{id}/set-default
   → Set làm CV mặc định

7. POST /api/cv/candidates/{id}/publish
   → Publish CV
```

### Workflow quản lý:
```
- GET /api/cv/candidates
  → Xem danh sách CV

- GET /api/cv/candidates/{id}
  → Xem CV chi tiết

- GET /api/cv/candidates/default
  → Lấy CV mặc định

- DELETE /api/cv/candidates/{id}
  → Xóa CV
```

---

## ⚠️ LƯU Ý QUAN TRỌNG

### 1. `dataJson` phải là JSON string
```json
// ❌ SAI
"dataJson": {
  "personalInfo": {...}
}

// ✅ ĐÚNG
"dataJson": "{\"personalInfo\":{...}}"
```

### 2. Date format: ISO 8601
```json
"dateOfBirth": "1998-12-06T00:00:00"
"startDate": "2022-03-01T00:00:00"
```

### 3. Escape đúng trong JSON
- Dấu ngoặc kép: `"` → `\"`
- Backslash: `\` → `\\`

### 4. Authentication
- Tất cả API đều cần JWT Bearer Token
- User phải là Candidate (có CandidateProfile)

---

## 🔧 Tools để test

### Swagger UI:
- `https://localhost:44385/swagger/index.html`
- Dễ test, có UI trực quan

### Postman:
- Import collection
- Dễ test với nhiều scenarios

### curl:
```bash
curl -X GET "https://localhost:44385/api/cv/candidates" \
  -H "Authorization: Bearer <token>"
```

---

## ✅ Checklist Test

- [ ] 1. Xem danh sách templates
- [ ] 2. Chọn và xem template details
- [ ] 3. Tạo CV từ template
- [ ] 4. Render CV và xem HTML
- [ ] 5. Cập nhật CV
- [ ] 6. Xem danh sách CV
- [ ] 7. Set CV làm mặc định
- [ ] 8. Publish CV
- [ ] 9. Lấy CV mặc định
- [ ] 10. Xóa CV

---

Chúc bạn test thành công! 🎉



