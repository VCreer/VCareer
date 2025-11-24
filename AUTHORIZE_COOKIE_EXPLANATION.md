# Giải thích: [Authorize] tự động xử lý Cookie như thế nào?

## 🎯 Câu trả lời ngắn gọn:

**CÓ!** `[Authorize]` tự động xử lý cookie để giải mã token. Code xử lý nằm ở:

**📍 File:** `src/VCareer.HttpApi.Host/VCareerHttpApiHostModule.cs`
**📍 Method:** `ConfigureAuthentication()` 
**📍 Dòng:** 187-195

## 🔍 Chi tiết cách hoạt động:

### 1. Code xử lý Cookie → Token:

```csharp
// VCareerHttpApiHostModule.cs - Dòng 187-195
options.Events = new JwtBearerEvents
{
    OnMessageReceived = context =>
    {
        // 🔑 ĐÂY LÀ CHỖ LẤY TOKEN TỪ COOKIE
        context.Token = context.Request.Cookies["access_token"];
        return Task.CompletedTask;
    }
};
```

### 2. Luồng hoạt động khi gọi API có [Authorize]:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Frontend gửi request:                                     │
│    POST /api/job/create                                       │
│    Cookie: access_token=eyJhbGc...                          │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. ASP.NET Core Middleware Pipeline:                        │
│                                                              │
│    Request → Authentication Middleware                      │
│                                                              │
│    → JwtBearer Authentication Handler                        │
│    → OnMessageReceived Event (Dòng 190-194)                 │
│    → Lấy token từ cookie:                                    │
│       context.Token = context.Request.Cookies["access_token"]│
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Validate Token tự động:                                   │
│                                                              │
│    TokenValidationParameters (Dòng 175-185):                 │
│    - ValidateIssuer = false                                 │
│    - ValidateAudience = false                               │
│    - ValidateLifetime = true ✅                             │
│    - ValidateIssuerSigningKey = true ✅                      │
│    - IssuerSigningKey = ... (từ config)                      │
│                                                              │
│    → Giải mã JWT token                                       │
│    → Validate signature                                      │
│    → Validate expiration time                                 │
│    → Extract claims (userId, roles, etc.)                     │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. [Authorize] Attribute:                                    │
│                                                              │
│    → Kiểm tra: User đã authenticated chưa?                  │
│    → Nếu token valid → User.IsAuthenticated = true          │
│    → [Authorize] PASS ✅                                     │
│    → Cho phép vào method CreateJobPost()                     │
│                                                              │
│    → Nếu token invalid/expired → 401 Unauthorized            │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Trong method CreateJobPost:                               │
│                                                              │
│    [Authorize]                                               │
│    public async Task CreateJobPost(...)                      │
│    {                                                          │
│        // _currentUser đã được set tự động                   │
│        if (_currentUser.IsAuthenticated == false)            │
│            throw ...                                          │
│                                                              │
│        var userId = _currentUser.GetId(); // ✅ Có userId     │
│        ...                                                    │
│    }                                                          │
└─────────────────────────────────────────────────────────────┘
```

## 📍 Vị trí code cụ thể:

### File 1: Cấu hình Authentication
```csharp
// src/VCareer.HttpApi.Host/VCareerHttpApiHostModule.cs
// Dòng 158-199

private void ConfigureAuthentication(...)
{
    context.Services
        .AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            // Validate token
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(...)
            };

            // 🔑 ĐÂY LÀ CHỖ LẤY TOKEN TỪ COOKIE
            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    context.Token = context.Request.Cookies["access_token"];
                    return Task.CompletedTask;
                }
            };
        });
}
```

### File 2: Method có [Authorize]
```csharp
// src/VCareer.Application/Services/Job/JobPostService.cs
// Dòng 206-211

[Authorize]  // ← Attribute này tự động sử dụng authentication middleware
public async Task CreateJobPost(JobPostCreateDto dto)
{
    // _currentUser đã được set tự động bởi ABP framework
    if (_currentUser.IsAuthenticated == false) 
        throw new AbpAuthorizationException("User is not authenticated");
    
    var recruiter = await _recruiterRepository.FindAsync(
        r => r.UserId == _currentUser.GetId() // ✅ Có userId
    );
    ...
}
```

## 🔑 Tóm tắt:

1. **`[Authorize]` tự động sử dụng Authentication Middleware**
   - Không cần code thủ công để lấy token
   - Middleware tự động chạy trước khi vào method

2. **Code lấy token từ cookie:**
   - **File:** `VCareerHttpApiHostModule.cs`
   - **Dòng:** 190-194
   - **Code:** `context.Token = context.Request.Cookies["access_token"];`

3. **Token được validate tự động:**
   - Validate signature
   - Validate expiration
   - Extract claims
   - Set `User.IsAuthenticated = true` nếu valid

4. **`_currentUser` được set tự động:**
   - ABP framework tự động inject `ICurrentUser`
   - Dựa trên claims từ JWT token đã validate

## ✅ Kết luận:

- ✅ `[Authorize]` tự động xử lý cookie
- ✅ Code lấy token từ cookie: **Dòng 192** trong `VCareerHttpApiHostModule.cs`
- ✅ Token được validate tự động bởi JWT middleware
- ✅ Không cần code thủ công trong controller/service







