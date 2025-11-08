# 🔧 Hướng Dẫn Sửa Lỗi Reset Password Link

## ❌ Vấn đề
Link trong email vẫn hiển thị `your-frontend-url` thay vì URL thực tế từ configuration.

## ✅ Nguyên nhân
1. **Application chưa được rebuild/restart** sau khi thay đổi code
2. **Email cũ** được gửi trước khi code được update (link trong email cũ vẫn là link cũ)

## 🛠️ Cách khắc phục

### Bước 1: Rebuild Project
```bash
# Trong thư mục src/VCareer.HttpApi.Host
dotnet build
```

Hoặc trong Visual Studio:
- Right-click vào project `VCareer.HttpApi.Host`
- Chọn **Rebuild**

### Bước 2: Restart Application
- **Dừng** application hiện tại (nếu đang chạy)
- **Chạy lại** application

### Bước 3: Kiểm tra Configuration
Đảm bảo file `src/VCareer.HttpApi.Host/appsettings.json` có cấu hình đúng:

```json
{
  "App": {
    "AngularUrl": "http://localhost:4200"
  }
}
```

### Bước 4: Test lại
1. **Gửi email mới** bằng cách gọi lại API `ForgotPasswordAsync`
2. **Kiểm tra email mới** - link phải là: `http://localhost:4200/reset-password?email=xxx&token=xxx`
3. **Click vào link** - phải mở được trang reset password

## 🔍 Kiểm tra Log
Sau khi restart, kiểm tra log khi gọi API `ForgotPasswordAsync`:
- Log sẽ hiển thị: `ForgotPassword: AngularUrl from config = http://localhost:4200`
- Log sẽ hiển thị: `ForgotPassword: Reset link = http://localhost:4200/reset-password?email=xxx&token=xxx`

Nếu log không hiển thị hoặc hiển thị sai, có thể:
- Configuration chưa được load đúng
- Cần kiểm tra lại file `appsettings.json`

## 📝 Lưu ý
- **Email cũ** sẽ không hoạt động - cần gửi email mới
- Đảm bảo **Angular app đang chạy** trên `http://localhost:4200`
- Nếu đổi port Angular, cần update `App:AngularUrl` trong `appsettings.json`

## 🚀 Production
Khi deploy lên production:
1. Update `appsettings.Production.json` hoặc environment variables
2. Set `App:AngularUrl` = URL production của Angular app
3. Ví dụ: `"AngularUrl": "https://vcareer.com"`

