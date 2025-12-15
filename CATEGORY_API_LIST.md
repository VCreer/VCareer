# DANH SÁCH API - CATEGORY MANAGEMENT

## 📋 Tổng Quan
Hệ thống quản lý Category theo cấu trúc cây (tree) với parent-child relationship. Category được sử dụng để phân loại job postings.

---

## 🌳 JOB CATEGORY APIs

### 1. **GET Category Tree**
**Endpoint:** `GET /api/app/job-category/category-tree`  
**Mô tả:** Lấy toàn bộ cây category với số lượng job trong mỗi category  
**Response:** `CategoryTreeDto[]`  
**Authentication:** Không cần (public)  
**Sử dụng:** Hiển thị category tree trong job search, job posting form

**Ví dụ Response:**
```json
[
  {
    "categoryId": "guid-1",
    "categoryName": "Công nghệ thông tin",
    "parentId": null,
    "jobCount": 150,
    "children": [
      {
        "categoryId": "guid-2",
        "categoryName": "Lập trình",
        "parentId": "guid-1",
        "jobCount": 80,
        "children": []
      }
    ]
  }
]
```

---

### 2. **POST Search Categories**
**Endpoint:** `POST /api/app/job-category/search-categories?keyword={keyword}`  
**Mô tả:** Tìm kiếm category theo keyword, trả về các leaf categories có path chứa từ khóa  
**Parameters:**
- `keyword` (query): Từ khóa tìm kiếm

**Response:** `CategoryTreeDto[]`  
**Authentication:** Không cần (public)  
**Sử dụng:** Tìm kiếm category khi tạo job

**Ví dụ Request:**
```
POST /api/app/job-category/search-categories?keyword=lập trình
```

---

### 3. **POST Create Category**
**Endpoint:** `POST /api/app/job-category/category`  
**Mô tả:** Tạo category mới  
**Request Body:** `CategoryUpdateCreateDto`
```json
{
  "categoryName": "Tên category",
  "parentId": "guid-parent-id" // null nếu là root category
}
```
**Response:** `void` (200 OK)  
**Authentication:** Cần (Employee/Admin)  
**Permission:** `VCareerPermission.SubcriptionPrice.Create` (có thể khác)

---

### 4. **PUT Update Category**
**Endpoint:** `PUT /api/app/job-category/{id}/category`  
**Mô tả:** Cập nhật thông tin category  
**Parameters:**
- `id` (path): Category ID (Guid)

**Request Body:** `CategoryUpdateCreateDto`
```json
{
  "categoryName": "Tên category mới",
  "parentId": "guid-parent-id" // có thể thay đổi parent
}
```
**Response:** `void` (200 OK)  
**Authentication:** Cần (Employee/Admin)  
**Permission:** `VCareerPermission.SubcriptionPrice.Update` (có thể khác)

---

### 5. **DELETE Delete Category**
**Endpoint:** `DELETE /api/app/job-category/{id}/category`  
**Mô tả:** Xóa category  
**Parameters:**
- `id` (path): Category ID (Guid)

**Response:** `void` (200 OK)  
**Authentication:** Cần (Employee/Admin)  
**Permission:** `VCareerPermission.SubcriptionPrice.Delete` (có thể khác)  
**Lưu ý:** Có thể không cho phép xóa nếu category có children hoặc có jobs

---

## 🏷️ TAG APIs (Liên quan đến Category)

### 6. **GET Tags by Category ID**
**Endpoint:** `GET /api/app/tag/tags-by-category-id/{categoryId}`  
**Mô tả:** Lấy danh sách tags thuộc về một category  
**Parameters:**
- `categoryId` (path): Category ID (Guid)

**Response:** `TagViewDto[]`  
**Authentication:** Không cần (public)  
**Sử dụng:** Load tags khi chọn category trong job posting form

**Ví dụ Response:**
```json
[
  {
    "id": 1,
    "tagName": "Java",
    "categoryId": "guid-category-id"
  },
  {
    "id": 2,
    "tagName": "Spring Boot",
    "categoryId": "guid-category-id"
  }
]
```

---

### 7. **POST Create Tags**
**Endpoint:** `POST /api/app/tag/tags`  
**Mô tả:** Tạo tag mới  
**Request Body:** `TagCreateDto`
```json
{
  "tagName": "Tên tag",
  "categoryId": "guid-category-id"
}
```
**Response:** `void` (200 OK)  
**Authentication:** Cần (Employee/Admin)

---

### 8. **PUT Update Tag**
**Endpoint:** `PUT /api/app/tag/tag`  
**Mô tả:** Cập nhật tag  
**Request Body:** `TagUpdateDto`
```json
{
  "id": 1,
  "tagName": "Tên tag mới",
  "categoryId": "guid-category-id"
}
```
**Response:** `void` (200 OK)  
**Authentication:** Cần (Employee/Admin)

---

### 9. **DELETE Delete Tags**
**Endpoint:** `DELETE /api/app/tag/tags?tagIds={tagIds}`  
**Mô tả:** Xóa nhiều tags cùng lúc  
**Parameters:**
- `tagIds` (query): Mảng ID tags (number[])

**Response:** `void` (200 OK)  
**Authentication:** Cần (Employee/Admin)

**Ví dụ Request:**
```
DELETE /api/app/tag/tags?tagIds=1&tagIds=2&tagIds=3
```

---

## 📊 Data Transfer Objects (DTOs)

### CategoryUpdateCreateDto
```typescript
{
  categoryName: string;
  parentId?: string | null; // Guid hoặc null
}
```

### CategoryTreeDto
```typescript
{
  categoryId: string; // Guid
  categoryName: string;
  parentId?: string | null;
  jobCount: number; // Số lượng jobs trong category này
  children: CategoryTreeDto[]; // Child categories
}
```

### TagViewDto
```typescript
{
  id: number;
  tagName: string;
  categoryId: string; // Guid
}
```

### TagCreateDto
```typescript
{
  tagName: string;
  categoryId: string; // Guid
}
```

### TagUpdateDto
```typescript
{
  id: number;
  tagName: string;
  categoryId: string; // Guid
}
```

---

## 🔐 Authentication & Authorization

- **Public APIs:** Get category tree, search categories, get tags by category
- **Protected APIs:** Create/Update/Delete category, Create/Update/Delete tags
- **Required Role:** Employee hoặc Admin (tùy permission config)

---

## 📝 Lưu Ý

1. **Category Tree Structure:**
   - Category có thể có parent (child category) hoặc không (root category)
   - Một category có thể có nhiều children
   - Job được gán vào leaf category (category không có children)

2. **Tags:**
   - Tags thuộc về một category cụ thể
   - Một category có thể có nhiều tags
   - Tags được sử dụng để tag jobs (JobTag)

3. **Job Count:**
   - `jobCount` trong CategoryTreeDto là số lượng jobs trực tiếp trong category đó
   - Không bao gồm jobs trong child categories

4. **Delete Restrictions:**
   - Có thể không cho phép xóa category nếu:
     - Category có children
     - Category có jobs
     - Category đang được sử dụng

---

## 🎯 Sử Dụng Trong Frontend

### Job Posting Form
- Load category tree: `GET /api/app/job-category/category-tree`
- Load tags khi chọn category: `GET /api/app/tag/tags-by-category-id/{categoryId}`

### Job Search
- Hiển thị category filter: `GET /api/app/job-category/category-tree`
- Search category: `POST /api/app/job-category/search-categories?keyword=...`

### Admin/Employee Management
- CRUD categories: POST, PUT, DELETE `/api/app/job-category/category`
- CRUD tags: POST, PUT, DELETE `/api/app/tag/tags`









