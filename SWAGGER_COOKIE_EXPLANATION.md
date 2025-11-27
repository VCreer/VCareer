# Giải thích: Tại sao Swagger vẫn lấy được user sau khi restart .NET?

## 🎯 Câu trả lời ngắn gọn:

**Swagger cũng chạy trong Browser!** Cookie được lưu trong Browser, không phải Server. Khi restart .NET, cookie VẪN CÒN trong browser.

## 🔍 Chi tiết:

### 1. Swagger là một trang web trong Browser

```
┌─────────────────────────────────────────────────────────┐
│  Browser (Chrome/Edge/Firefox)                          │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Tab 1: Angular App                                │  │
│  │ http://localhost:4200                            │  │
│  │ → Cookie: access_token (domain: localhost:44385)  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Tab 2: Swagger UI                                 │  │
│  │ https://localhost:44385/swagger                   │  │
│  │ → Cookie: access_token (domain: localhost:44385)   │  │
│  │ → CÙNG DOMAIN → CÙNG COOKIE!                      │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  Cookie Storage (Browser):                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Domain: localhost:44385                          │  │
│  │ access_token: eyJhbGc...                         │  │
│  │ HttpOnly: true                                    │  │
│  │ Secure: true                                      │  │
│  │ → VẪN CÒN SAU KHI RESTART SERVER!                 │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 2. Luồng hoạt động:

```
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 1: Login từ Angular App                                │
│                                                              │
│  Angular App (localhost:4200)                                │
│    → POST /api/auth/login                                    │
│    → Backend set cookie: access_token                         │
│    → Cookie lưu trong Browser (domain: localhost:44385)      │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 2: Mở Swagger UI                                       │
│                                                              │
│  Browser mở: https://localhost:44385/swagger                │
│    → CÙNG DOMAIN với cookie (localhost:44385)               │
│    → Browser tự động có cookie                               │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 3: Restart .NET Server                                 │
│                                                              │
│  Tắt .NET → Bật lại .NET                                    │
│    → Server restart                                         │
│    → Cookie VẪN CÒN trong Browser!                           │
│    → Server không lưu cookie (stateless)                     │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 4: Gửi API từ Swagger                                  │
│                                                              │
│  Swagger UI (trong Browser)                                  │
│    → Click "Try it out"                                     │
│    → Click "Execute"                                        │
│    → Browser gửi request:                                   │
│       POST /api/job/create                                   │
│       Cookie: access_token=eyJhbGc... (TỰ ĐỘNG)             │
│                                                              │
│  Backend nhận request:                                       │
│    → Lấy cookie từ request                                  │
│    → Validate token                                         │
│    → ✅ Valid → User authenticated                           │
│    → Trả về 200 OK                                          │
└─────────────────────────────────────────────────────────────┘
```

## 🔑 Điểm quan trọng:

### 1. Cookie được lưu theo Domain, không phải theo Tab

```javascript
// Cookie được lưu trong Browser Storage theo domain
// Domain: localhost:44385

// Tất cả các tab/trang web cùng domain đều có cookie:
// ✅ https://localhost:44385/swagger
// ✅ https://localhost:44385/api/...
// ✅ http://localhost:4200 (nếu cookie được set với SameSite=None)
```

### 2. Browser tự động gửi Cookie với mọi request

```javascript
// Khi Swagger gửi request:
// Browser tự động thêm Cookie header

Request Headers:
  POST /api/job/create HTTP/1.1
  Host: localhost:44385
  Cookie: access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  // ↑ Browser tự động thêm cookie này!
```

### 3. Restart Server KHÔNG ảnh hưởng Cookie

```
┌─────────────────────────────────────────────────────────┐
│ Server (.NET)                                            │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ - Không lưu cookie                                    │ │
│ │ - Stateless authentication                            │ │
│ │ - Validate token từ request                          │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ Restart → Cookie VẪN CÒN trong Browser                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Browser Storage                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Domain: localhost:44385                              │ │
│ │ access_token: eyJhbGc...                            │ │
│ │ → VẪN CÒN SAU KHI RESTART SERVER!                   │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 🔍 Cách kiểm tra:

### 1. Xem Cookie trong Browser:

```
1. Mở Swagger: https://localhost:44385/swagger
2. F12 → DevTools
3. Application → Cookies → https://localhost:44385
4. → Sẽ thấy: access_token
```

### 2. Xem Cookie trong Network Tab:

```
1. Swagger → Try it out → Execute
2. DevTools → Network tab
3. Click vào request
4. Request Headers → Cookie: access_token=...
```

### 3. Test: Xóa Cookie và thử lại:

```
1. DevTools → Application → Cookies
2. Xóa access_token
3. Swagger → Try it out → Execute
4. → Sẽ bị 401 Unauthorized
```

## 💡 Tại sao Swagger có thể dùng Cookie?

### Swagger UI cũng là một trang web:

```html
<!-- Swagger UI là HTML/JavaScript chạy trong browser -->
<!-- URL: https://localhost:44385/swagger -->

<!-- Khi Swagger gửi request, nó sử dụng browser's fetch/XMLHttpRequest -->
<!-- Browser tự động thêm cookie với mọi request đến cùng domain -->
```

### Code trong Swagger UI (tự động):

```javascript
// Swagger UI tự động gửi cookie
// (Browser tự động thêm Cookie header)

fetch('https://localhost:44385/api/job/create', {
  method: 'POST',
  credentials: 'include', // ← Tự động gửi cookie
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
```

## 🎯 Kết luận:

1. ✅ **Swagger chạy trong Browser** → Có cookie của domain
2. ✅ **Cookie được lưu trong Browser** → Không bị mất khi restart server
3. ✅ **Browser tự động gửi cookie** → Với mọi request đến cùng domain
4. ✅ **Backend validate cookie** → Từ request header
5. ✅ **Restart server không ảnh hưởng** → Cookie vẫn còn trong browser

## 🔧 Lưu ý:

- Cookie chỉ bị mất khi:
  - User xóa cookie thủ công
  - Cookie hết hạn (expires)
  - User clear browser data
  - User logout (backend xóa cookie)

- Restart server KHÔNG xóa cookie trong browser!









