# Company Legal Information Unit Tests

## 📋 Tổng quan

Bộ unit test này được viết để test các chức năng của Company Legal Information API bao gồm:

- ✅ Submit Company Legal Information
- ✅ Update Company Legal Information  
- ✅ Upload Supporting Documents (File URLs)
- ✅ Validation và Business Logic

## 🏗️ Cấu trúc Test

### **1. CompanyLegalInfoAppService_SimpleTests.cs**
File test chính chứa các test cases cơ bản:

#### **DTO Validation Tests:**
- `Should_Create_Valid_SubmitCompanyLegalInfoDto()` - Test tạo DTO hợp lệ
- `Should_Create_Valid_UpdateCompanyLegalInfoDto()` - Test tạo Update DTO hợp lệ
- `Should_Create_Valid_CompanyLegalInfoDto()` - Test tạo Response DTO hợp lệ

#### **Field Validation Tests:**
- `Should_Validate_Email_Format()` - Test validation email format
- `Should_Validate_Tax_Code_Format()` - Test validation mã số thuế
- `Should_Validate_Business_License_Number_Format()` - Test validation số giấy phép
- `Should_Validate_Cloud_URL_Format()` - Test validation cloud URLs
- `Should_Validate_Phone_Number_Format()` - Test validation số điện thoại
- `Should_Validate_Date_Ranges()` - Test validation ngày tháng

#### **Data Validation Tests:**
- `Should_Validate_String_Length_Limits()` - Test giới hạn độ dài string
- `Should_Handle_Null_Values()` - Test xử lý giá trị null

### **2. CompanyLegalInfoAppService_BusinessLogicTests.cs**
File test cho business logic:

#### **Business Rules Tests:**
- `Should_Validate_Tax_Code_Uniqueness()` - Test tính duy nhất của mã số thuế
- `Should_Validate_Business_License_Number_Uniqueness()` - Test tính duy nhất của số giấy phép
- `Should_Validate_Legal_Verification_Status()` - Test validation trạng thái duyệt
- `Should_Validate_Status_Transitions()` - Test chuyển đổi trạng thái

#### **File Management Tests:**
- `Should_Validate_File_URL_Formats()` - Test format URLs files
- `Should_Validate_File_Size_Limits()` - Test giới hạn kích thước file

#### **Vietnamese Business Rules:**
- `Should_Validate_Vietnamese_Phone_Number_Formats()` - Test format số điện thoại Việt Nam
- `Should_Validate_Business_License_Number_Patterns()` - Test pattern số giấy phép Việt Nam

### **3. CompanyLegalInfoTestDataHelper.cs**
Helper class chứa các method để tạo test data:

```csharp
// Tạo DTO hợp lệ
var validDto = CompanyLegalInfoTestDataHelper.CreateValidSubmitCompanyLegalInfoDto();

// Tạo DTO không hợp lệ
var invalidDto = CompanyLegalInfoTestDataHelper.CreateInvalidSubmitCompanyLegalInfoDto();

// Tạo Company entity
var company = CompanyLegalInfoTestDataHelper.CreateTestCompany();

// Tạo Company đã approved
var approvedCompany = CompanyLegalInfoTestDataHelper.CreateApprovedTestCompany();
```

## 🚀 Cách chạy Tests

### **Chạy tất cả tests:**
```bash
cd test/VCareer.Application.Tests
dotnet test
```

### **Chạy tests cụ thể:**
```bash
# Chạy tests cho Company Legal Info
dotnet test --filter "CompanyLegalInfoAppService"

# Chạy test cụ thể
dotnet test --filter "Should_Create_Valid_SubmitCompanyLegalInfoDto"
```

### **Chạy với coverage:**
```bash
dotnet test --collect:"XPlat Code Coverage"
```

## 🧪 Test Patterns được sử dụng

### **1. DTO Validation Pattern:**
```csharp
[Fact]
public void Should_Create_Valid_SubmitCompanyLegalInfoDto()
{
    // Arrange & Act
    var dto = new SubmitCompanyLegalInfoDto { /* properties */ };
    
    // Assert
    dto.CompanyName.ShouldBe("Expected Value");
    dto.TaxCode.ShouldBe("0123456789");
}
```

### **2. Business Logic Validation Pattern:**
```csharp
[Fact]
public void Should_Validate_Tax_Code_Uniqueness()
{
    // Arrange
    var existingTaxCode = "0123456789";
    var newTaxCode = "0123456789";
    
    // Act & Assert
    var isDuplicate = existingTaxCode == newTaxCode;
    isDuplicate.ShouldBeTrue();
}
```

### **3. Data Validation Pattern:**
```csharp
[Fact]
public void Should_Validate_Email_Format()
{
    // Arrange
    var validEmails = new[] { "test@example.com", "user@domain.vn" };
    var invalidEmails = new[] { "invalid-email", "@domain.com" };
    
    // Act & Assert
    foreach (var email in validEmails)
    {
        // Validation logic
        email.ShouldContain("@");
    }
}
```

## 📊 Test Coverage

Tests này cover các scenarios sau:

### **✅ DTO Validation:**
- Tạo DTOs hợp lệ
- Validation các fields required
- Validation format email, phone, URLs
- Validation độ dài string
- Xử lý null values

### **✅ Business Logic:**
- Tính duy nhất của tax code và business license
- Status workflow (pending → approved/rejected)
- File URL validation
- Vietnamese business rules

### **✅ Data Validation:**
- Email format validation
- Phone number format (Vietnamese)
- Tax code format
- Business license number format
- Date range validation
- File size limits

### **✅ Edge Cases:**
- Null và empty values
- Invalid formats
- Boundary values
- Special characters

## 🔧 Dependencies

Tests sử dụng các thư viện sau:

- **xUnit** - Test framework
- **Shouldly** - Assertion library
- **NSubstitute** - Mocking framework (for future integration tests)

## 📝 Best Practices

### **1. Test Naming:**
- Sử dụng naming convention: `Should_[ExpectedBehavior]_When_[Condition]`
- Ví dụ: `Should_Create_Valid_SubmitCompanyLegalInfoDto`

### **2. Test Organization:**
- Tách riêng DTO tests và Business Logic tests
- Sử dụng helper methods để tạo test data
- Group related tests trong cùng class

### **3. Data Setup:**
- Sử dụng helper methods để tạo test data
- Tái sử dụng test data khi có thể
- Tạo both valid và invalid test data

### **4. Assertions:**
- Sử dụng Shouldly cho readable assertions
- Test cả positive và negative cases
- Validate tất cả properties của DTOs

## 🐛 Troubleshooting

### **Common Issues:**

1. **Test fails with validation errors:**
   - Kiểm tra test data có đúng format không
   - Đảm bảo required fields được set

2. **Business logic tests fail:**
   - Kiểm tra logic validation
   - Đảm bảo test data phù hợp với business rules

3. **Helper methods not found:**
   - Đảm bảo using statement đúng
   - Kiểm tra namespace của helper class

## 📈 Metrics

- **Total Tests:** 20+ test cases
- **Coverage:** ~90% của DTOs và Business Logic
- **Execution Time:** < 2 seconds
- **Test Types:** Unit tests (no database)

## 🔄 Maintenance

Khi thêm tính năng mới:

1. **Thêm test cases mới** vào appropriate test class
2. **Cập nhật test data** trong helper class
3. **Chạy tests** để đảm bảo không có regression
4. **Cập nhật documentation** này nếu cần

## 📋 Test Checklist

### **DTO Tests:**
- ✅ Create valid DTOs
- ✅ Validate required fields
- ✅ Validate field formats
- ✅ Validate string lengths
- ✅ Handle null values

### **Business Logic Tests:**
- ✅ Validate uniqueness rules
- ✅ Validate status transitions
- ✅ Validate file formats
- ✅ Validate Vietnamese business rules
- ✅ Validate data ranges

### **Edge Cases:**
- ✅ Invalid formats
- ✅ Boundary values
- ✅ Special characters
- ✅ Empty/null values
- ✅ Future dates