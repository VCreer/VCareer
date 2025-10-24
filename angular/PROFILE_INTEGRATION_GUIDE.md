# Hướng dẫn kết nối Angular với Profile Management API

## ✅ Đã hoàn thành

### Files đã tạo/cập nhật:
1. **`angular/src/app/proxy/api/profile.service.ts`** - Service kết nối API
2. **`angular/src/app/features/dashboard/profile/candidate/candidate-profile.component.ts`** - Component sử dụng real API
3. **`angular/src/environments/environment.ts`** - Bật real API (`useMockApi: false`)
4. **`angular/src/app/proxy/api/index.ts`** - Export ProfileService

## 🔗 API Endpoints đã kết nối:

| Chức năng | Frontend Method | Backend Endpoint |
|-----------|----------------|------------------|
| Lấy profile | `getCurrentUserProfile()` | `GET /api/profile` |
| Cập nhật thông tin | `updatePersonalInfo()` | `PUT /api/profile/personal-info` |
| Đổi mật khẩu | `changePassword()` | `PUT /api/profile/change-password` |
| Xóa tài khoản | `deleteAccount()` | `DELETE /api/profile/account` |

## 🚀 Cách test:

### 1. Chạy Backend:
```bash
cd src/VCareer.HttpApi.Host
dotnet run
```
Backend: `https://localhost:44385`

### 2. Chạy Frontend:
```bash
cd angular
npm start
```
Frontend: `http://localhost:4200`

### 3. Test:
- Mở `http://localhost:4200`
- Navigate đến Profile page
- Thử load data và update profile

## 🔧 Data Mapping:

### Frontend → Backend:
```typescript
// Frontend profileData
{
  fullName: "Nguyễn Văn A",
  email: "test@email.com",
  phone: "0123456789",
  dateOfBirth: "1995-01-01",
  gender: "male",
  address: "123 ABC Street"
}

// → Backend UpdatePersonalInfoDto
{
  name: "Nguyễn",
  surname: "Văn A", 
  email: "test@email.com",
  phoneNumber: "0123456789",
  dateOfBirth: new Date("1995-01-01"),
  gender: true, // male = true, female = false
  location: "123 ABC Street"
}
```

### Backend → Frontend:
```typescript
// Backend ProfileDto
{
  name: "Nguyễn",
  surname: "Văn A",
  email: "test@email.com",
  phoneNumber: "0123456789",
  dateOfBirth: "1995-01-01T00:00:00Z",
  gender: true,
  location: "123 ABC Street"
}

// → Frontend profileData
{
  fullName: "Nguyễn Văn A",
  email: "test@email.com", 
  phone: "0123456789",
  dateOfBirth: "1995-01-01",
  gender: "male",
  address: "123 ABC Street"
}
```

## 🐛 Troubleshooting:

### Nếu gặp lỗi CORS:
Thêm vào `VCareerHttpApiHostModule.cs`:
```csharp
context.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", builder =>
    {
        builder.WithOrigins("http://localhost:4200")
               .AllowAnyHeader()
               .AllowAnyMethod();
    });
});

// Trong OnApplicationInitialization:
app.UseCors("AllowAngular");
```

### Nếu không load được data:
1. Kiểm tra Console browser (F12)
2. Kiểm tra Network tab để xem API calls
3. Đảm bảo backend đang chạy
4. Kiểm tra database có dữ liệu không

## 📝 Lưu ý:

- **Authentication đã tắt** nên không cần headers đặc biệt
- Chỉ cần `Content-Type: application/json`
- API sẽ tự động lấy user đầu tiên trong database để test
- Khi có authentication thật, chỉ cần thêm `Authorization: Bearer <token>` vào headers

---

**Ready to test!** 🎉

