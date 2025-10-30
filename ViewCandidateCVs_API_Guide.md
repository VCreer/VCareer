# View Candidate CVs API - Hướng dẫn sử dụng

## Tổng quan
API này cho phép **Leader Recruiter** và **HR Staff** xem danh sách CVs công khai của các candidates.

## Endpoints

### 1. Lấy danh sách CVs công khai (với filter và pagination)

**Endpoint:** `GET /api/app/candidate-cvview/public-cvs`

**Method:** `GET`

**Authentication:** Required (JWT Bearer Token)

**Quyền truy cập:** Chỉ Recruiter (Leader Recruiter hoặc HR Staff)

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| searchTerm | string | No | null | Tìm kiếm theo tên, email, hoặc skills |
| cvType | string | No | null | Lọc theo loại CV: "Online" hoặc "Upload" |
| status | string | No | null | Lọc theo status: "Published", "Draft", "Archived" |
| pageIndex | int | No | 0 | Số trang (bắt đầu từ 0) |
| pageSize | int | No | 20 | Số items mỗi trang |
| sortBy | string | No | "CreationTime" | Sắp xếp theo: "CreationTime", "LastModificationTime", "FullName" |
| sortAscending | bool | No | false | true = tăng dần, false = giảm dần |

#### Example Request (cURL)

```bash
# Lấy tất cả CVs (trang đầu tiên)
curl -X 'GET' \
  'https://localhost:44385/api/app/candidate-cvview/public-cvs?pageIndex=0&pageSize=20' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'

# Tìm kiếm CVs với keyword "developer"
curl -X 'GET' \
  'https://localhost:44385/api/app/candidate-cvview/public-cvs?searchTerm=developer&pageIndex=0&pageSize=10' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'

# Lọc chỉ CVs đã upload
curl -X 'GET' \
  'https://localhost:44385/api/app/candidate-cvview/public-cvs?cvType=Upload&pageIndex=0&pageSize=20' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'

# Sắp xếp theo tên A-Z
curl -X 'GET' \
  'https://localhost:44385/api/app/candidate-cvview/public-cvs?sortBy=FullName&sortAscending=true' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

#### Example Response

```json
{
  "cvs": [
    {
      "cvId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "cvName": "My Professional CV",
      "cvType": "Online",
      "status": "Published",
      "fullName": "Nguyen Van A",
      "email": "nguyenvana@example.com",
      "phoneNumber": "0901234567",
      "address": "Ho Chi Minh City",
      "careerObjective": "Looking for a software developer position...",
      "workExperience": "[{\"company\":\"ABC Corp\",\"position\":\"Developer\",\"duration\":\"2 years\"}]",
      "education": "[{\"school\":\"FPT University\",\"degree\":\"Bachelor\",\"year\":\"2020\"}]",
      "skills": "[\"Java\",\"C#\",\"React\"]",
      "fileUrl": null,
      "originalFileName": null,
      "creationTime": "2025-10-15T10:30:00Z",
      "lastModificationTime": "2025-10-20T14:45:00Z",
      "candidateId": "4fa85f64-5717-4562-b3fc-2c963f66afa7"
    }
  ],
  "totalCount": 50,
  "pageIndex": 0,
  "pageSize": 20,
  "totalPages": 3
}
```

---

### 2. Lấy chi tiết một CV cụ thể

**Endpoint:** `GET /api/app/candidate-cvview/{cvId}`

**Method:** `GET`

**Authentication:** Required (JWT Bearer Token)

**Quyền truy cập:** Chỉ Recruiter (Leader Recruiter hoặc HR Staff)

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| cvId | Guid | Yes | ID của CV cần xem |

#### Example Request (cURL)

```bash
curl -X 'GET' \
  'https://localhost:44385/api/app/candidate-cvview/3fa85f64-5717-4562-b3fc-2c963f66afa6' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

#### Example Response

```json
{
  "cvId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "cvName": "My Professional CV",
  "cvType": "Online",
  "status": "Published",
  "fullName": "Nguyen Van A",
  "email": "nguyenvana@example.com",
  "phoneNumber": "0901234567",
  "address": "Ho Chi Minh City",
  "careerObjective": "Looking for a software developer position...",
  "workExperience": "[{\"company\":\"ABC Corp\",\"position\":\"Developer\",\"duration\":\"2 years\"}]",
  "education": "[{\"school\":\"FPT University\",\"degree\":\"Bachelor\",\"year\":\"2020\"}]",
  "skills": "[\"Java\",\"C#\",\"React\"]",
  "fileUrl": null,
  "originalFileName": null,
  "creationTime": "2025-10-15T10:30:00Z",
  "lastModificationTime": "2025-10-20T14:45:00Z",
  "candidateId": "4fa85f64-5717-4562-b3fc-2c963f66afa7"
}
```

---

## Error Responses

### 401 Unauthorized
Khi không có JWT token hoặc token không hợp lệ:
```json
{
  "error": {
    "message": "Unauthorized"
  }
}
```

### 403 Forbidden
Khi user không phải là Recruiter:
```json
{
  "error": {
    "message": "Bạn không có quyền truy cập chức năng này. Chỉ Recruiter mới được xem CVs.",
    "code": "Volo.Abp.UserFriendlyException"
  }
}
```

### 404 Not Found
Khi không tìm thấy CV:
```json
{
  "error": {
    "message": "Không tìm thấy CV.",
    "code": "Volo.Abp.UserFriendlyException"
  }
}
```

---

## Business Rules

1. **Quyền truy cập:**
   - Chỉ Leader Recruiter và HR Staff mới có quyền xem CVs
   - Recruiter phải ở trạng thái active (Status = true)

2. **CVs hiển thị:**
   - Chỉ hiển thị CVs có `IsPublic = true`
   - Chỉ hiển thị CVs có `Status = "Published"`

3. **Pagination:**
   - Default page size: 20 items
   - Page index bắt đầu từ 0

4. **Sorting:**
   - Mặc định sắp xếp theo ngày tạo (CreationTime) giảm dần (mới nhất trước)
   - Có thể sort theo: CreationTime, LastModificationTime, FullName

5. **Search:**
   - Tìm kiếm trong: FullName, Email, Skills, CareerObjective
   - Không phân biệt chữ hoa/thường

---

## Testing Steps

### Bước 1: Login để lấy JWT Token
```bash
# Login với tài khoản Recruiter
curl -X 'POST' \
  'https://localhost:44385/api/app/auth/login-recruiter' \
  -H 'Content-Type: application/json' \
  -d '{
    "userName": "recruiter_username",
    "password": "recruiter_password"
  }'
```

### Bước 2: Copy JWT Token từ response

### Bước 3: Gọi API xem CVs
```bash
curl -X 'GET' \
  'https://localhost:44385/api/app/candidate-cvview/public-cvs' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## Notes

- API này sử dụng ABP Framework's conventional routing
- Endpoint được tự động generate từ `ICandidateCVViewService`
- API route: `/api/app/candidate-cvview` (từ service name `CandidateCVView`)
- Antiforgery validation đã được disable cho API endpoints

---

## Future Enhancements

1. **Filter theo Company:**
   - Khi có JobApplication entity, có thể filter CVs theo công ty của recruiter
   - Chỉ hiển thị CVs của candidates đã ứng tuyển vào jobs của công ty

2. **Additional Filters:**
   - Filter theo kinh nghiệm (năm)
   - Filter theo vị trí địa lý
   - Filter theo ngành nghề

3. **Export CVs:**
   - Export danh sách CVs ra Excel/PDF
   - Download CV files (cho Upload type)

4. **CV Analytics:**
   - Thống kê số lượng CV theo loại, status
   - Top skills được mention nhiều nhất

