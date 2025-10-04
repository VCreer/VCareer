# ProfileTestDataHelper Usage Guide

## 🔧 Cách sử dụng ProfileTestDataHelper

### **1. Tạo User Test cơ bản:**
```csharp
// Tạo user không có phone number
var user = ProfileTestDataHelper.CreateTestUser();
```

### **2. Tạo User Test với Phone Number:**
```csharp
// Tạo user với phone number (khuyến nghị)
var user = await ProfileTestDataHelper.CreateTestUserWithPhoneAsync(
    userManager, 
    "+1234567890", 
    userId
);
```

### **3. Tạo DTOs cho Test:**
```csharp
// DTO hợp lệ
var validDto = ProfileTestDataHelper.CreateValidUpdatePersonalInfoDto();

// DTO không hợp lệ (để test validation)
var invalidDto = ProfileTestDataHelper.CreateInvalidUpdatePersonalInfoDto();

// Change password DTO
var changePasswordDto = ProfileTestDataHelper.CreateValidChangePasswordDto();
```

## ⚠️ **Lưu ý quan trọng:**

### **PhoneNumber Property:**
```csharp
// ❌ KHÔNG làm như này (sẽ gây lỗi CS0272):
var user = new IdentityUser(id, "testuser", "test@example.com");
user.PhoneNumber = "+1234567890"; // Lỗi!

// ✅ Làm như này:
var user = new IdentityUser(id, "testuser", "test@example.com");
await userManager.SetPhoneNumberAsync(user, "+1234567890");
```

### **Email Property:**
```csharp
// ❌ KHÔNG làm như này:
user.Email = "new@example.com"; // Lỗi!

// ✅ Làm như này:
await userManager.SetEmailAsync(user, "new@example.com");
```

## 📝 **Ví dụ Test Case hoàn chỉnh:**

```csharp
[Fact]
public async Task Should_Update_Personal_Info_Successfully()
{
    // Arrange
    var userId = Guid.NewGuid();
    
    // Sử dụng helper để tạo user với phone number
    var user = await ProfileTestDataHelper.CreateTestUserWithPhoneAsync(
        _userManager, 
        "+1234567890", 
        userId
    );

    // Mock current user
    _currentUser.Id.Returns(userId);
    _currentUser.IsAuthenticated.Returns(true);

    // Sử dụng helper để tạo DTO
    var updateDto = ProfileTestDataHelper.CreateValidUpdatePersonalInfoDto();

    // Act
    await _profileAppService.UpdatePersonalInfoAsync(updateDto);

    // Assert
    var updatedUser = await _userManager.GetByIdAsync(userId);
    updatedUser.Name.ShouldBe("John");
    updatedUser.PhoneNumber.ShouldBe("+1234567890");
}
```

## 🎯 **Best Practices:**

1. **Luôn sử dụng helper methods** thay vì tạo data thủ công
2. **Sử dụng `CreateTestUserWithPhoneAsync`** khi cần phone number
3. **Sử dụng `WithUnitOfWorkAsync`** cho database operations
4. **Mock `ICurrentUser`** cho authentication tests
5. **Sử dụng descriptive test names** theo pattern `Should_[Behavior]_When_[Condition]`

## 🔄 **Migration từ code cũ:**

### **Trước (có lỗi):**
```csharp
var user = new IdentityUser(userId, "testuser", "test@example.com");
user.Name = "John";
user.Surname = "Doe";
user.PhoneNumber = "+1234567890"; // ❌ Lỗi CS0272
```

### **Sau (đúng):**
```csharp
var user = new IdentityUser(userId, "testuser", "test@example.com");
user.Name = "John";
user.Surname = "Doe";
await userManager.SetPhoneNumberAsync(user, "+1234567890"); // ✅ OK
```

Hoặc sử dụng helper:
```csharp
var user = await ProfileTestDataHelper.CreateTestUserWithPhoneAsync(
    userManager, 
    "+1234567890", 
    userId
); // ✅ OK và clean hơn
```
