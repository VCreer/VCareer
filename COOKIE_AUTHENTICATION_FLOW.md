# Giải thích: Tại sao restart server nhưng vẫn authenticated?

## 🔄 Luồng hoạt động

### 1. Khi đăng nhập thành công:

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Frontend  │         │   Backend    │         │   Browser   │
│  Angular   │────────▶│   .NET API   │────────▶│   Cookie    │
└─────────────┘         └──────────────┘         └─────────────┘
     │                         │                         │
     │  POST /api/auth/login   │                         │
     │────────────────────────▶│                         │
     │                         │                         │
     │                         │  Set-Cookie:            │
     │                         │  access_token=xxx       │
     │                         │  HttpOnly=true          │
     │                         │────────────────────────▶│
     │                         │                         │
     │  Response: 200 OK       │                         │
     │◀────────────────────────│                         │
     │                         │                         │
     │  loadCurrentUser()      │                         │
     │────────────────────────▶│                         │
     │                         │  Cookie: access_token  │
     │                         │◀────────────────────────│
     │                         │                         │
     │  User Info              │                         │
     │◀────────────────────────│                         │
     │                         │                         │
     │  state.setUser(user)    │                         │
     │  (Lưu vào memory)       │                         │
     └─────────────────────────┴─────────────────────────┘
```

### 2. Khi restart server và call API:

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Frontend   │         │   Backend    │         │   Browser   │
│  Angular    │         │  (Restart)   │         │   Cookie    │
└─────────────┘         └──────────────┘         └─────────────┘
     │                         │                         │
     │  state.user = null      │                         │
     │  (Mất khi refresh)      │                         │
     │                         │                         │
     │  Call API:              │                         │
     │  POST /api/jobs         │                         │
     │────────────────────────▶│                         │
     │                         │                         │
     │                         │  Cookie: access_token   │
     │                         │◀────────────────────────│
     │                         │                         │
     │                         │  Validate cookie        │
     │                         │  Extract JWT token      │
     │                         │  Validate signature     │
     │                         │  ✅ Valid!              │
     │                         │                         │
     │  Response: 200 OK       │                         │
     │◀────────────────────────│                         │
     │                         │                         │
     │  Frontend thấy:         │                         │
     │  - API call thành công  │                         │
     │  - Không có lỗi 401     │                         │
     │  → Nghĩ rằng đã auth    │                         │
     └─────────────────────────┴─────────────────────────┘
```

## 🔑 Điểm quan trọng:

### 1. Cookie được lưu trong Browser, KHÔNG phải trong Server

```javascript
// Cookie được lưu trong Browser storage
// Khi restart server, cookie VẪN CÒN trong browser

// Kiểm tra trong DevTools:
// Application → Cookies → https://localhost:44385
// → access_token vẫn còn đó!
```

### 2. Frontend State (Memory) vs Cookie (Browser Storage)

```typescript
// AuthStateService - Lưu trong MEMORY
private userSubject = new BehaviorSubject<CurrentUserInfoDto | null>(null);

// Khi refresh page:
// - Memory bị xóa → user = null
// - Cookie VẪN CÒN trong browser
```

### 3. Backend validate cookie từ Request

```csharp
// VCareerHttpApiHostModule.cs
options.Events = new JwtBearerEvents
{
    OnMessageReceived = context =>
    {
        // Lấy token từ cookie
        context.Token = context.Request.Cookies["access_token"];
        return Task.CompletedTask;
    }
};
```

## 🎯 Tại sao `currentUser.isAuthenticated` vẫn là `true`?

### Scenario: Restart server → Call API

1. **Frontend state**: `user = null` (mất khi refresh)
2. **Browser cookie**: `access_token = xxx` (VẪN CÒN)
3. **Call API**: Gửi request với cookie
4. **Backend**: Validate cookie → ✅ Valid → Trả về 200 OK
5. **Frontend**: 
   - Thấy API thành công
   - Có thể gọi `loadCurrentUser()` 
   - Set lại `user` vào state
   - → `isAuthenticated = true`

## 🔍 Cách kiểm tra:

### 1. Xem cookie trong Browser:
```javascript
// DevTools → Application → Cookies
// → https://localhost:44385
// → access_token
```

### 2. Xem cookie trong Network tab:
```javascript
// DevTools → Network → Request Headers
// → Cookie: access_token=eyJhbGc...
```

### 3. Test: Xóa cookie và thử lại:
```javascript
// DevTools → Application → Cookies
// → Xóa access_token
// → Refresh page
// → Call API
// → Sẽ bị 401 Unauthorized
```

## 💡 Kết luận:

- ✅ Cookie được gửi tự động với mọi request (nhờ `withCredentials: true`)
- ✅ Cookie được lưu trong Browser, không phải Server
- ✅ Khi restart server, cookie VẪN CÒN trong browser
- ✅ Backend validate cookie từ request → Vẫn authenticated
- ✅ Frontend có thể load lại user info từ API → `isAuthenticated = true`




