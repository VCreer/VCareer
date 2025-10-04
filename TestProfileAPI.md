# Hướng dẫn Test API Profile Management

## 🚀 Cách chạy ứng dụng:

1. **Chạy Database Migration:**
```bash
cd src/VCareer.DbMigrator
dotnet run
```

2. **Chạy API Host:**
```bash
cd src/VCareer.HttpApi.Host
dotnet run
```

3. **Truy cập Swagger UI:**
- Mở trình duyệt và truy cập: `https://localhost:44385/swagger`
- Hoặc: `http://localhost:44385/swagger`

## 🔐 Authentication:

Trước khi test API Profile Management, bạn cần đăng nhập để lấy JWT token:

1. **Đăng ký tài khoản mới:**
   - POST `/api/account/register`
   - Body:
   ```json
   {
     "userName": "testuser",
     "emailAddress": "test@example.com",
     "password": "Test123!",
     "appName": "VCareer"
   }
   ```

2. **Đăng nhập:**
   - POST `/api/account/login`
   - Body:
   ```json
   {
     "userNameOrEmailAddress": "testuser",
     "password": "Test123!",
     "rememberMe": true
   }
   ```

3. **Copy JWT token từ response và sử dụng trong Authorization header:**
   ```
   Authorization: Bearer <your-jwt-token>
   ```

## 📋 Test API Profile Management:

### 1. **Get Current User Profile**
- **Method:** GET
- **URL:** `/api/profile`
- **Headers:** 
  ```
  Authorization: Bearer <your-jwt-token>
  ```
- **Expected Response:** 200 OK với thông tin profile

### 2. **Update Personal Information**
- **Method:** PUT
- **URL:** `/api/profile/personal-info`
- **Headers:** 
  ```
  Authorization: Bearer <your-jwt-token>
  Content-Type: application/json
  ```
- **Body:**
  ```json
  {
    "name": "John",
    "surname": "Doe",
    "email": "john.doe@example.com",
    "phoneNumber": "+1234567890",
    "bio": "Experienced software developer with 5 years of experience",
    "dateOfBirth": "1990-01-01T00:00:00Z",
    "gender": true,
    "location": "Ho Chi Minh City, Vietnam",
    "address": "123 Main Street, District 1, HCMC",
    "nationality": "Vietnamese",
    "maritalStatus": "Single"
  }
  ```
- **Expected Response:** 204 No Content

### 3. **Change Password**
- **Method:** PUT
- **URL:** `/api/profile/change-password`
- **Headers:** 
  ```
  Authorization: Bearer <your-jwt-token>
  Content-Type: application/json
  ```
- **Body:**
  ```json
  {
    "currentPassword": "Test123!",
    "newPassword": "NewPassword123!",
    "confirmPassword": "NewPassword123!"
  }
  ```
- **Expected Response:** 204 No Content

## 🧪 Test Cases:

### **Test Case 1: Valid Update Personal Info**
```bash
curl -X PUT "https://localhost:44385/api/profile/personal-info" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John",
    "surname": "Doe",
    "email": "john.doe@example.com",
    "phoneNumber": "+1234567890",
    "bio": "Software Developer"
  }'
```

### **Test Case 2: Invalid Email Format**
```bash
curl -X PUT "https://localhost:44385/api/profile/personal-info" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John",
    "surname": "Doe",
    "email": "invalid-email",
    "phoneNumber": "+1234567890"
  }'
```
**Expected:** 400 Bad Request với validation error

### **Test Case 3: Change Password with Wrong Current Password**
```bash
curl -X PUT "https://localhost:44385/api/profile/change-password" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "WrongPassword",
    "newPassword": "NewPassword123!",
    "confirmPassword": "NewPassword123!"
  }'
```
**Expected:** 400 Bad Request với error message

### **Test Case 4: Unauthorized Access**
```bash
curl -X GET "https://localhost:44385/api/profile"
```
**Expected:** 401 Unauthorized

## 🔍 Kiểm tra Database:

Sau khi test, bạn có thể kiểm tra database để xem dữ liệu đã được lưu:

1. **Thông tin cơ bản:** Bảng `AbpUsers`
2. **Thông tin bổ sung:** Cột `ExtraProperties` trong bảng `AbpUsers`

## 📝 Notes:

- Tất cả API đều yêu cầu authentication
- Validation được thực hiện ở cả client và server
- Error messages được localize
- Tất cả operations đều được audit log
- API tuân thủ RESTful conventions

## 🐛 Troubleshooting:

1. **401 Unauthorized:** Kiểm tra JWT token có hợp lệ không
2. **403 Forbidden:** Kiểm tra permissions đã được cấu hình đúng chưa
3. **400 Bad Request:** Kiểm tra validation rules trong DTO
4. **500 Internal Server Error:** Kiểm tra logs trong console hoặc database connection
