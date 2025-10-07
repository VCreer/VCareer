# Company Legal Information API Documentation

## 📋 Tổng quan

API này cung cấp chức năng quản lý thông tin pháp lý công ty theo cấu trúc tối ưu, gộp tất cả thông tin và documents vào một bảng duy nhất.

## 🔐 Authentication

Tất cả API endpoints đều yêu cầu authentication. Bao gồm JWT token trong Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 📊 Database Schema

### CompanyLegalInfos Table:
| Trường                            | Kiểu dữ liệu                          | Ý nghĩa                                 |
| --------------------------------- | ------------------------------------- | --------------------------------------- |
| `id`                              | bigint (PK, auto increment)           | Khóa chính                              |
| `employer_id`                     | bigint (FK → users.id)                | Liên kết tới nhà tuyển dụng             |
| `company_name`                    | varchar(255)                          | Tên công ty                             |
| `tax_code`                        | varchar(50)                           | Mã số thuế                              |
| `business_license_number`         | varchar(100)                          | Số giấy phép kinh doanh                 |
| `issue_date`                      | date                                  | Ngày cấp                                |
| `issue_place`                     | varchar(255)                          | Nơi cấp                                 |
| `legal_representative`            | varchar(255)                          | Người đại diện pháp luật                |
| `business_address`                | varchar(255)                          | Địa chỉ trụ sở                          |
| `phone`                           | varchar(20)                           | Số điện thoại                           |
| `email`                           | varchar(100)                          | Email công ty                           |
| **`business_license_file`**       | varchar(500)                          | 🔹 Link file giấy phép kinh doanh       |
| **`tax_certificate_file`**        | varchar(500)                          | 🔹 Link file giấy chứng nhận mã số thuế |
| **`representative_id_card_file`** | varchar(500)                          | 🔹 Link file CCCD người đại diện        |
| **`other_support_file`**          | varchar(500)                          | 🔹 Link file phụ khác (ủy quyền, v.v.)  |
| `status`                          | varchar(50)                           | Trạng thái duyệt (pending, approved, rejected) |
| `reviewed_by`                     | bigint (nullable)                     | Admin duyệt                             |
| `reviewed_at`                     | datetime (nullable)                   | Thời gian duyệt                         |
| `created_at`                      | datetime                              | Ngày tạo                                |
| `updated_at`                      | datetime                              | Ngày cập nhật                           |

## 📋 API Endpoints

### 1. Submit Company Legal Information
**POST** `/api/profile/company-legal-info`

Nộp thông tin pháp lý công ty mới.

**Authorization:** Requires `VCareer.Profile.SubmitLegalInformation` permission

**Request Body:**
```json
{
  "companyName": "Công ty TNHH ABC",
  "taxCode": "0123456789",
  "businessLicenseNumber": "41A1234567",
  "issueDate": "2020-01-01T00:00:00Z",
  "issuePlace": "Sở Kế hoạch và Đầu tư TP.HCM",
  "legalRepresentative": "Nguyễn Văn A",
  "businessAddress": "123 Đường ABC, Quận 1, TP.HCM",
  "phone": "0901234567",
  "email": "contact@abc.com",
  "businessLicenseFile": "https://storage.googleapis.com/bucket/licenses/abc-license.pdf",
  "taxCertificateFile": "https://storage.googleapis.com/bucket/certificates/abc-tax.pdf",
  "representativeIdCardFile": "https://storage.googleapis.com/bucket/idcards/representative-cccd.pdf",
  "otherSupportFile": "https://storage.googleapis.com/bucket/others/authorization.pdf"
}
```

**Response:** 200 OK với thông tin company legal info đã tạo

### 2. Update Company Legal Information
**PUT** `/api/profile/company-legal-info/{id}`

Cập nhật thông tin pháp lý công ty.

**Authorization:** Requires `VCareer.Profile.UpdateLegalInformation` permission

**Request Body:** Tương tự như Submit (tất cả fields)

**Response:** 200 OK với thông tin đã cập nhật

**Note:** Chỉ có thể cập nhật khi status = "pending"

### 3. Get Company Legal Information
**GET** `/api/profile/company-legal-info/{id}`

Lấy thông tin pháp lý công ty theo ID.

**Authorization:** Requires `VCareer.Profile.Default` permission

**Response:** 200 OK với thông tin company legal info

### 4. Get Current User Company Legal Information
**GET** `/api/profile/company-legal-info/current-user`

Lấy thông tin pháp lý công ty của người dùng hiện tại.

**Authorization:** Requires `VCareer.Profile.Default` permission

**Response:** 200 OK với thông tin company legal info

### 5. Get Current User Company Legal Information List
**GET** `/api/profile/company-legal-info/current-user/list`

Lấy tất cả thông tin pháp lý công ty của người dùng hiện tại.

**Authorization:** Requires `VCareer.Profile.Default` permission

**Response:** 200 OK với danh sách company legal info

### 6. Update File URLs
**PUT** `/api/profile/company-legal-info/{id}/files`

Cập nhật URLs của các files.

**Authorization:** Requires `VCareer.Profile.UpdateLegalInformation` permission

**Query Parameters:**
- `businessLicenseFile` (optional): URL file giấy phép kinh doanh
- `taxCertificateFile` (optional): URL file giấy chứng nhận mã số thuế
- `representativeIdCardFile` (optional): URL file CCCD người đại diện
- `otherSupportFile` (optional): URL file phụ khác

**Response:** 200 OK với thông tin đã cập nhật

### 7. Delete Company Legal Information
**DELETE** `/api/profile/company-legal-info/{id}`

Xóa thông tin pháp lý công ty.

**Authorization:** Requires `VCareer.Profile.DeleteSupportingDocument` permission

**Response:** 204 No Content

**Note:** Chỉ có thể xóa khi status = "pending"

## 🔧 Business Logic

### Validation Rules:
- **Tax Code**: Phải unique trong hệ thống
- **Business License Number**: Phải unique trong hệ thống
- **Email**: Phải đúng format email
- **Phone**: Tối đa 20 ký tự
- **File URLs**: Tối đa 500 ký tự mỗi URL

### Status Workflow:
1. **pending** → Khi submit hoặc update
2. **approved** → Khi admin duyệt
3. **rejected** → Khi admin từ chối

### Business Rules:
- Mỗi user chỉ có thể có 1 company legal info
- Không thể update/delete khi status = "approved"
- Khi update, status tự động reset về "pending"
- Tax code và business license number phải unique

## 🛡️ Security Features

1. **Authorization**: Tất cả endpoints đều có authorization phù hợp
2. **User Isolation**: User chỉ có thể access data của mình
3. **Data Validation**: Validation đầy đủ ở cả client và server
4. **Unique Constraints**: Tax code và business license number unique
5. **Status Protection**: Không thể modify approved records

## 📊 Error Handling

Tất cả APIs trả về error details theo format chuẩn:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "string",
    "validationErrors": [
      {
        "message": "string",
        "members": ["string"]
      }
    ]
  }
}
```

## 🧪 Test Cases

### Happy Path Tests:
1. **Valid submission** - Submit với data hợp lệ
2. **Valid update** - Update với data hợp lệ
3. **Get by ID** - Lấy thông tin theo ID
4. **Get current user** - Lấy thông tin user hiện tại
5. **Update file URLs** - Cập nhật URLs files

### Validation Tests:
1. **Duplicate tax code** - Submit tax code đã tồn tại
2. **Duplicate business license** - Submit business license đã tồn tại
3. **Invalid email** - Email không đúng format
4. **Update approved record** - Update record đã approved
5. **Delete approved record** - Delete record đã approved

### Security Tests:
1. **Access other user's data** - Access data của user khác
2. **Unauthorized access** - Access không có token
3. **Invalid permissions** - Access với permissions không đủ

## 📝 Usage Examples

### Submit Company Legal Information:
```bash
curl -X POST "https://api.vcareer.com/api/profile/company-legal-info" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Công ty TNHH ABC",
    "taxCode": "0123456789",
    "businessLicenseNumber": "41A1234567",
    "issueDate": "2020-01-01T00:00:00Z",
    "issuePlace": "Sở Kế hoạch và Đầu tư TP.HCM",
    "legalRepresentative": "Nguyễn Văn A",
    "businessAddress": "123 Đường ABC, Quận 1, TP.HCM",
    "phone": "0901234567",
    "email": "contact@abc.com",
    "businessLicenseFile": "https://storage.googleapis.com/bucket/licenses/abc-license.pdf"
  }'
```

### Update File URLs:
```bash
curl -X PUT "https://api.vcareer.com/api/profile/company-legal-info/1/files?businessLicenseFile=https://storage.googleapis.com/bucket/licenses/new-license.pdf&taxCertificateFile=https://storage.googleapis.com/bucket/certificates/new-tax.pdf" \
  -H "Authorization: Bearer <token>"
```

## 🚀 Lợi ích của cấu trúc mới

1. **Tối ưu Database**: Chỉ 1 bảng thay vì nhiều bảng
2. **Đơn giản hóa**: Ít relationships và JOIN queries
3. **Performance tốt hơn**: Truy vấn nhanh hơn
4. **Dễ maintain**: Ít entities và dependencies
5. **Cloud Storage**: Files lưu trên cloud, chỉ lưu URLs
6. **Flexible**: Dễ dàng thêm/sửa fields mới

## 🔄 Migration từ cấu trúc cũ

### Trước (3 bảng):
- `LegalInformations` - Thông tin pháp lý
- `SupportingDocuments` - Documents hỗ trợ  
- `Companies` - Thông tin công ty

### Sau (1 bảng):
- `CompanyLegalInfos` - Tất cả thông tin pháp lý và documents

### Migration Steps:
1. Tạo bảng `CompanyLegalInfos` mới
2. Migrate data từ các bảng cũ
3. Update application code
4. Drop các bảng cũ (sau khi test)

API này đã được tối ưu hóa theo đúng cấu trúc tham khảo của bạn! 🎯
