# CV Template - Two Column

## Mô tả
Template CV 2 cột với layout hiện đại, màu beige (#f5f0e8) và xanh đậm (#2d5a3d). Template này phù hợp cho các ứng viên muốn CV chuyên nghiệp và dễ đọc.

## Cấu trúc Template

### Cột trái (35%):
- **Avatar**: Ảnh đại diện hình tròn
- **Thông tin liên hệ**: Phone, Email, Website, Address
- **Kỹ năng**: Danh sách kỹ năng với icon sao
- **Chứng chỉ**: Danh sách chứng chỉ với thời gian

### Cột phải (65%):
- **Header xanh đậm**: Tên, Vị trí ứng tuyển, Mục tiêu nghề nghiệp
- **Kinh nghiệm làm việc**: Danh sách công việc với nút ngày tháng
- **Học vấn**: Danh sách học vấn với nút ngày tháng

## Cách sử dụng Script SQL

1. **Mở SQL Server Management Studio (SSMS)** hoặc công cụ quản lý database của bạn

2. **Kết nối đến database** của ứng dụng VCareer

3. **Mở file** `insert-cv-template-two-column.sql`

4. **Chạy script** (F5 hoặc Execute)

5. **Kiểm tra kết quả**: Script sẽ hiển thị TemplateId đã tạo

## Placeholders được hỗ trợ

### Personal Info:
- `{{personalInfo.fullName}}`
- `{{personalInfo.email}}`
- `{{personalInfo.phoneNumber}}`
- `{{personalInfo.address}}`
- `{{personalInfo.website}}`
- `{{personalInfo.profileImageUrl}}`
- `{{personalInfo.linkedIn}}`
- `{{personalInfo.gitHub}}`

### Career Objective:
- `{{careerObjective}}`

### Work Experiences (Loop):
```
{{#foreach workExperiences}}
  {{workExperience.companyName}}
  {{workExperience.position}}
  {{workExperience.startDate}}
  {{workExperience.endDate}}
  {{workExperience.description}}
{{/foreach}}
```

### Educations (Loop):
```
{{#foreach educations}}
  {{education.institutionName}}
  {{education.major}}
  {{education.degree}}
  {{education.startDate}}
  {{education.endDate}}
  {{education.description}}
{{/foreach}}
```

### Skills (Loop):
```
{{#foreach skills}}
  {{skill.skillName}}
{{/foreach}}
```

### Certificates (Loop):
```
{{#foreach certificates}}
  {{certificate.certificateName}}
  {{certificate.issueDate}}
{{/foreach}}
```

## Test Template

Sau khi insert template vào database:

1. **Đăng nhập** vào ứng dụng với tài khoản candidate
2. **Tạo CV mới** tại `/candidate/write-cv`
3. **Chọn template** "Two Column - Beige & Green"
4. **Điền thông tin** qua block editor
5. **Lưu CV** và xem preview
6. **Render CV** để xem kết quả cuối cùng

## Lưu ý

- Template sử dụng CSS inline, không cần thêm styles riêng
- Template hỗ trợ Unicode (tiếng Việt) đầy đủ
- Template responsive và có thể in được (A4)
- Màu sắc có thể tùy chỉnh trong CSS nếu cần

## Troubleshooting

Nếu gặp lỗi khi chạy script:

1. **Kiểm tra encoding**: Đảm bảo file SQL được lưu với encoding UTF-8
2. **Kiểm tra database**: Đảm bảo bạn đang kết nối đúng database
3. **Kiểm tra quyền**: Đảm bảo user có quyền INSERT vào bảng CvTemplates
4. **Kiểm tra single quotes**: Nếu có lỗi syntax, kiểm tra các single quotes đã được escape đúng ('')

## Template ID

Sau khi chạy script, TemplateId sẽ được hiển thị. Bạn có thể lưu lại ID này để reference sau này.

