# Hướng dẫn tạo CV Template

## Cách hoạt động

Khi bạn tạo một **CvTemplate**, bạn sẽ cung cấp:
- **LayoutDefinition**: HTML chứa layout và placeholders
- **Styles**: CSS để style cho HTML

Khi render CV (gọi API `RenderCvAsync`), hệ thống sẽ:
1. Lấy `LayoutDefinition` từ template
2. Parse `DataJson` từ `CandidateCv`
3. Thay thế các placeholders bằng data thực tế
4. Inject CSS vào HTML
5. Trả về HTML hoàn chỉnh

## Cách 1: Sử dụng Placeholder đơn giản (Backend tự generate HTML)

### Template HTML (LayoutDefinition):
```html
<div class="cv-container">
  <div class="header">
    <h1>{{personalInfo.fullName}}</h1>
    <p>{{personalInfo.email}}</p>
    <p>{{personalInfo.phoneNumber}}</p>
  </div>
  
  <div class="objective">
    <h2>MỤC TIÊU NGHỀ NGHIỆP</h2>
    <p>{{careerObjective}}</p>
  </div>
  
  <div class="work-experience">
    <h2>KINH NGHIỆM LÀM VIỆC</h2>
    {{workExperiences}}
  </div>
  
  <div class="education">
    <h2>HỌC VẤN</h2>
    {{educations}}
  </div>
</div>
```

**Lưu ý**: Với cách này, backend sẽ tự động generate HTML cho `{{workExperiences}}` và `{{educations}}` theo format mặc định.

## Cách 2: Template tự định nghĩa structure (Linh hoạt hơn)

### Template HTML (LayoutDefinition):
```html
<div class="cv-container">
  <div class="header">
    <img src="{{personalInfo.profileImageUrl}}" alt="Avatar" class="avatar">
    <h1>{{personalInfo.fullName}}</h1>
    <p>Ngày sinh: {{personalInfo.dateOfBirth}}</p>
    <p>Giới tính: {{personalInfo.gender}}</p>
    <p>Số điện thoại: {{personalInfo.phoneNumber}}</p>
    <p>Email: {{personalInfo.email}}</p>
    <p>Địa chỉ: {{personalInfo.address}}</p>
  </div>
  
  <div class="objective">
    <h2>MỤC TIÊU NGHỀ NGHIỆP</h2>
    <hr>
    <p>{{careerObjective}}</p>
  </div>
  
  <div class="education">
    <h2>HỌC VẤN</h2>
    <hr>
    {{#foreach educations}}
    <div class="education-item">
      <div class="date-range">{{education.dateRange}}</div>
      <div class="content">
        <h3>{{education.institutionName}}</h3>
        <p><strong>Chuyên ngành:</strong> {{education.major}}</p>
        <ul>
          <li>Xếp loại: {{education.gpa}}</li>
          <li>Môn học liên quan: {{education.description}}</li>
        </ul>
        <div class="achievements">
          <strong>Thành tích nổi bật:</strong>
          <ul>
            <!-- Thêm achievements nếu cần -->
          </ul>
        </div>
      </div>
    </div>
    {{/foreach}}
  </div>
  
  <div class="work-experience">
    <h2>KINH NGHIỆM LÀM VIỆC</h2>
    <hr>
    {{#foreach workExperiences}}
    <div class="work-experience-item">
      <div class="date-range">{{workExperience.dateRange}}</div>
      <div class="content">
        <h3>{{workExperience.companyName}}</h3>
        <p><strong>{{workExperience.position}}</strong></p>
        <p>{{workExperience.description}}</p>
        <div class="achievements">
          <strong>Thành tích nổi bật:</strong>
          {{workExperience.achievements}}
        </div>
      </div>
    </div>
    {{/foreach}}
  </div>
</div>
```

**Lưu ý**: 
- Sử dụng `{{#foreach collectionName}}...{{/foreach}}` để loop qua danh sách
- Sử dụng `{{item.fieldName}}` để truy cập field của từng item trong loop
- Backend sẽ tự động loop và replace các placeholders

## CSS (Styles):

```css
.cv-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
  background: white;
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin-right: 20px;
}

h1 {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
}

h2 {
  font-size: 18px;
  font-weight: bold;
  text-transform: uppercase;
  margin-top: 20px;
  margin-bottom: 10px;
}

hr {
  border: none;
  border-top: 1px solid black;
  margin-bottom: 15px;
}

.education-item, .work-experience-item {
  display: flex;
  margin-bottom: 20px;
}

.date-range {
  width: 150px;
  font-weight: bold;
}

.content {
  flex: 1;
}

.achievements ul {
  margin-top: 10px;
  padding-left: 20px;
}
```

## Các Placeholders có sẵn:

### Personal Info:
- `{{personalInfo.fullName}}`
- `{{personalInfo.email}}`
- `{{personalInfo.phoneNumber}}`
- `{{personalInfo.dateOfBirth}}` (format: dd/MM/yyyy)
- `{{personalInfo.address}}`
- `{{personalInfo.profileImageUrl}}`
- `{{personalInfo.linkedIn}}`
- `{{personalInfo.gitHub}}`
- `{{personalInfo.website}}`

### Sections:
- `{{careerObjective}}`
- `{{additionalInfo}}`

### Collections (2 cách):

**Cách 1 - Backend tự generate:**
- `{{workExperiences}}`
- `{{educations}}`
- `{{skills}}`
- `{{projects}}`
- `{{certificates}}`
- `{{languages}}`

**Cách 2 - Template tự định nghĩa:**
```html
{{#foreach workExperiences}}
  {{workExperience.companyName}}
  {{workExperience.position}}
  {{workExperience.dateRange}}
  {{workExperience.description}}
  {{workExperience.achievements}}
{{/foreach}}

{{#foreach educations}}
  {{education.institutionName}}
  {{education.degree}}
  {{education.major}}
  {{education.dateRange}}
  {{education.gpa}}
  {{education.description}}
{{/foreach}}

{{#foreach skills}}
  {{skill.skillName}}
  {{skill.level}}
  {{skill.category}}
{{/foreach}}

{{#foreach projects}}
  {{project.projectName}}
  {{project.description}}
  {{project.technologies}}
  {{project.projectUrl}}
{{/foreach}}

{{#foreach certificates}}
  {{certificate.certificateName}}
  {{certificate.issuingOrganization}}
  {{certificate.issueDate}}
{{/foreach}}

{{#foreach languages}}
  {{language.languageName}}
  {{language.proficiencyLevel}}
{{/foreach}}
```

## Ví dụ Template hoàn chỉnh (theo ảnh CV mẫu):

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>CV</title>
</head>
<body>
  <div class="cv-container">
    <!-- Header với ảnh và thông tin cá nhân -->
    <div class="header">
      <img src="{{personalInfo.profileImageUrl}}" alt="Avatar" class="avatar">
      <div class="personal-info">
        <h1>{{personalInfo.fullName}}</h1>
        <p class="title">Business Development Executive</p>
        <div class="contact-details">
          <p>Ngày sinh: {{personalInfo.dateOfBirth}}</p>
          <p>Giới tính: Nam</p>
          <p>Số điện thoại: {{personalInfo.phoneNumber}}</p>
          <p>Email: {{personalInfo.email}}</p>
          <p>Website: {{personalInfo.website}}</p>
          <p>Địa chỉ: {{personalInfo.address}}</p>
        </div>
      </div>
    </div>

    <!-- Mục tiêu nghề nghiệp -->
    <div class="section">
      <h2>MỤC TIÊU NGHỀ NGHIỆP</h2>
      <hr>
      <p>{{careerObjective}}</p>
    </div>

    <!-- Học vấn -->
    <div class="section">
      <h2>HỌC VẤN</h2>
      <hr>
      {{#foreach educations}}
      <div class="education-item">
        <div class="date">{{education.dateRange}}</div>
        <div class="content">
          <h3>{{education.institutionName}}</h3>
          <p><strong>Chuyên ngành:</strong> {{education.major}}</p>
          <ul>
            <li>Xếp loại: {{education.gpa}}</li>
            <li>Môn học liên quan: {{education.description}}</li>
          </ul>
          <div class="achievements">
            <strong>Thành tích nổi bật:</strong>
            <ul>
              <!-- Thêm achievements nếu có -->
            </ul>
          </div>
        </div>
      </div>
      {{/foreach}}
    </div>

    <!-- Kinh nghiệm làm việc -->
    <div class="section">
      <h2>KINH NGHIỆM LÀM VIỆC</h2>
      <hr>
      {{#foreach workExperiences}}
      <div class="work-item">
        <div class="date">{{workExperience.dateRange}}</div>
        <div class="content">
          <h3>{{workExperience.companyName}}</h3>
          <p><strong>{{workExperience.position}}</strong></p>
          <ul>
            <li>{{workExperience.description}}</li>
          </ul>
          <div class="achievements">
            <strong>Thành tích nổi bật:</strong>
            {{workExperience.achievements}}
          </div>
        </div>
      </div>
      {{/foreach}}
    </div>
  </div>
</body>
</html>
```

## Lưu ý quan trọng:

1. **CSS được inject tự động**: Bạn chỉ cần cung cấp CSS trong field `Styles`, hệ thống sẽ tự động inject vào `<head>` hoặc đầu HTML.

2. **HTML Escape**: Tất cả text data đều được escape để tránh XSS. Chỉ URLs (như `profileImageUrl`, `website`) không được escape.

3. **Date Format**: 
   - `{{personalInfo.dateOfBirth}}`: `dd/MM/yyyy`
   - `{{workExperience.dateRange}}`: `MM/yyyy - MM/yyyy` hoặc `MM/yyyy - Hiện tại`
   - `{{education.dateRange}}`: `yyyy - yyyy` hoặc `yyyy - Hiện tại`

4. **Empty Data**: Nếu không có data, placeholder sẽ được thay bằng chuỗi rỗng `""`.

5. **Loop Structure**: Nếu template không có `{{#foreach}}`, hệ thống sẽ tìm placeholder đơn giản như `{{workExperiences}}` và replace bằng HTML được generate tự động.



