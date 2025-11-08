# 🔐 Hướng Dẫn Cấu Hình Gmail cho VCareer Project

## 📋 Tổng Quan

Dự án VCareer sử dụng Gmail SMTP để gửi email (ví dụ: email quên mật khẩu). Cấu hình Gmail được đặt ở các vị trí sau:

---

## 📁 1. File Cấu Hình SMTP (appsettings.json)

**Đường dẫn:** `src/VCareer.HttpApi.Host/appsettings.json`

```json
"Settings": {
    "Abp.Mailing.Smtp.Host": "smtp.gmail.com",
    "Abp.Mailing.Smtp.Port": "587",
    "Abp.Mailing.Smtp.UserName": "khuongndhe172473@fpt.edu.vn",
    "Abp.Mailing.Smtp.Password": "xxcizryjoogxrtxl",  // ⚠️ Đây là App Password
    "Abp.Mailing.Smtp.Domain": "",
    "Abp.Mailing.Smtp.EnableSsl": "true",
    "Abp.Mailing.Smtp.UseDefaultCredentials": "false",
    "Abp.Mailing.DefaultFromAddress": "khuongndhe172473@fpt.edu.vn",
    "Abp.Mailing.DefaultFromDisplayName": "VCareer"
}
```

### Giải thích các tham số:
- **Host**: `smtp.gmail.com` - Server SMTP của Gmail
- **Port**: `587` - Port cho STARTTLS (khuyến nghị) hoặc `465` cho SSL
- **UserName**: Email Gmail của bạn
- **Password**: ⚠️ **App Password** (KHÔNG phải mật khẩu Gmail thông thường)
- **EnableSsl**: `true` - Bật mã hóa SSL/TLS
- **DefaultFromAddress**: Email người gửi
- **DefaultFromDisplayName**: Tên hiển thị khi gửi email

---

## 💻 2. Code Cấu Hình MailKit (VCareerDomainModule.cs)

**Đường dẫn:** `src/VCareer.Domain/VCareerDomainModule.cs`

```csharp
using MailKit.Security;

// Cấu hình MailKit để xử lý SSL/TLS đúng cách
Configure<AbpMailKitOptions>(options =>
{
    var smtpPort = _configuration.GetValue<int>("Settings:Abp.Mailing.Smtp.Port", 587);
    var enableSsl = _configuration.GetValue<bool>("Settings:Abp.Mailing.Smtp.EnableSsl", true);
    
    // Port 465 sử dụng SSL/TLS từ đầu (implicit SSL)
    // Port 587 sử dụng STARTTLS (plain-text rồi nâng cấp lên TLS)
    if (smtpPort == 465)
    {
        options.SecureSocketOption = SecureSocketOptions.SslOnConnect;
    }
    else if (smtpPort == 587 && enableSsl)
    {
        options.SecureSocketOption = SecureSocketOptions.StartTls;
    }
    else
    {
        options.SecureSocketOption = SecureSocketOptions.None;
    }
});
```

### Giải thích:
- Code này tự động chọn phương thức bảo mật phù hợp dựa trên port:
  - **Port 465**: SSL/TLS từ đầu (implicit SSL)
  - **Port 587**: STARTTLS (nâng cấp từ plain-text lên TLS)

---

## 📧 3. Code Sử Dụng Email (AuthAppService.cs)

**Đường dẫn:** `src/VCareer.Application/Services/Auth/AuthAppService.cs`

```csharp
public async Task ForgotPasswordAsync(ForgotPasswordDto input)
{
    var user = await _identityManager.FindByEmailAsync(input.Email);
    if (user == null) throw new UserFriendlyException("Email not found");

    var token = await _identityManager.GeneratePasswordResetTokenAsync(user);

    var resetLink = $"https://your-frontend-url/reset-password?email={Uri.EscapeDataString(input.Email)}&token={Uri.EscapeDataString(token)}";

    var body = await _templateRenderer.RenderAsync(
         "Abp.StandardEmailTemplates.Message",
    new { message = $"Nhấn vào liên kết để đặt lại mật khẩu: <a href='{resetLink}'>Reset Password</a>" }
        );

    await _emailSender.SendAsync(user.Email, "Forgot Password!", body);
}
```

---

## 🔑 4. Cách Tạo App Password cho Gmail

**⚠️ QUAN TRỌNG:** Bạn **KHÔNG THỂ** sử dụng mật khẩu Gmail thông thường. Phải tạo **App Password**.

### Bước 1: Bật Xác thực 2 bước (2-Step Verification)
1. Truy cập: https://myaccount.google.com/security
2. Vào phần **"2-Step Verification"**
3. Bật tính năng này (nếu chưa bật)

### Bước 2: Tạo App Password
1. Truy cập: https://myaccount.google.com/apppasswords
   - Hoặc vào: **Google Account** → **Security** → **2-Step Verification** → **App passwords**
2. Chọn **App**: Chọn "Mail"
3. Chọn **Device**: Chọn "Windows Computer" (hoặc "Other" và nhập "VCareer")
4. Click **Generate**
5. **Sao chép mật khẩu 16 ký tự** (ví dụ: `xxcizryjoogxrtxl`)
6. Dán vào file `appsettings.json` tại `Abp.Mailing.Smtp.Password`

### Lưu ý:
- App Password có **16 ký tự**, không có khoảng trắng
- Mỗi App Password chỉ hiển thị **1 lần**, hãy lưu lại ngay
- Nếu quên, phải tạo lại App Password mới
- App Password **khác** với mật khẩu Gmail thông thường

---

## 🔧 5. Kiểm Tra Cấu Hình

### Kiểm tra trong code:
1. **appsettings.json**: Đảm bảo đúng email và App Password
2. **VCareerDomainModule.cs**: Đảm bảo MailKit đã được cấu hình
3. **AuthAppService.cs**: Đảm bảo `IEmailSender` đã được inject

### Test gửi email:
1. Chạy API `ForgotPasswordAsync`
2. Kiểm tra log để xem có lỗi không
3. Kiểm tra email inbox (có thể trong thư mục Spam)

---

## ❌ 6. Xử Lý Lỗi Thường Gặp

### Lỗi: `SslHandshakeException`
- **Nguyên nhân**: Cấu hình SSL/TLS không đúng
- **Giải pháp**: Đã được fix trong `VCareerDomainModule.cs` (sử dụng STARTTLS cho port 587)

### Lỗi: `Authentication failed`
- **Nguyên nhân**: App Password sai hoặc chưa bật 2-Step Verification
- **Giải pháp**: 
  1. Kiểm tra App Password trong `appsettings.json`
  2. Tạo lại App Password mới
  3. Đảm bảo đã bật 2-Step Verification

### Lỗi: `Username and Password not accepted`
- **Nguyên nhân**: Dùng mật khẩu Gmail thông thường thay vì App Password
- **Giải pháp**: Tạo và sử dụng App Password

---

## 📝 7. Thay Đổi Email Gmail

Nếu muốn thay đổi email Gmail khác:

1. **Tạo App Password mới** cho email mới
2. **Cập nhật appsettings.json**:
   ```json
   "Abp.Mailing.Smtp.UserName": "email-moi@gmail.com",
   "Abp.Mailing.Smtp.Password": "app-password-moi",
   "Abp.Mailing.DefaultFromAddress": "email-moi@gmail.com"
   ```
3. **Restart ứng dụng**

---

## 🔒 8. Bảo Mật

⚠️ **LƯU Ý QUAN TRỌNG:**
- **KHÔNG commit** App Password lên Git
- Sử dụng **User Secrets** hoặc **Environment Variables** cho Production
- Trong Production, nên sử dụng **Azure Key Vault** hoặc **AWS Secrets Manager**

### Cách ẩn App Password trong Development:
Sử dụng **User Secrets**:
```bash
dotnet user-secrets set "Settings:Abp.Mailing.Smtp.Password" "your-app-password"
```

---

## 📚 Tài Liệu Tham Khảo

- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [ABP Framework Email Documentation](https://docs.abp.io/en/abp/latest/Email-Sending)
- [MailKit Documentation](https://github.com/jstedfast/MailKit)

---

## ✅ Checklist

- [ ] Đã bật 2-Step Verification trong Gmail
- [ ] Đã tạo App Password
- [ ] Đã cập nhật App Password trong `appsettings.json`
- [ ] Đã cấu hình MailKit trong `VCareerDomainModule.cs`
- [ ] Đã test gửi email thành công
- [ ] Đã ẩn App Password khỏi Git (sử dụng User Secrets)

---

**Tạo bởi:** AI Assistant  
**Ngày cập nhật:** 2024  
**Version:** 1.0

