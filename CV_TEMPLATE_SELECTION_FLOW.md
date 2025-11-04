# Giải thích: Khi Candidate Chọn Template

## ❓ Câu hỏi 1: "Khi candidate chọn CV template thì có render ra để điền thông tin không?"

**Trả lời**: 
- ✅ **CÓ** - Nhưng **KHÔNG phải render CV hoàn chỉnh**
- ✅ **Frontend sẽ parse template để tạo form nhập liệu**
- ✅ **Có thể preview CV** khi đang điền (nếu cần)

---

## 📋 WORKFLOW CHI TIẾT

### Bước 1: Candidate xem danh sách Templates

```
GET /api/cv/templates/active
```

**Response**: Danh sách templates với preview images
```json
[
  {
    "id": "template-1",
    "name": "Template Modern",
    "previewImageUrl": "https://...",
    "description": "..."
  },
  {
    "id": "template-2", 
    "name": "Template Classic",
    "previewImageUrl": "https://...",
    "description": "..."
  }
]
```

**Frontend**: Hiển thị grid/gallery với preview images
- Candidate click vào template để chọn

---

### Bước 2: Candidate chọn Template → Frontend load template details

```
GET /api/cv/templates/{templateId}
```

**Response**:
```json
{
  "id": "template-1",
  "name": "Template Modern",
  "layoutDefinition": "<div>...{{personalInfo.fullName}}...{{#foreach workExperiences}}...</div>",
  "styles": "body { font-family: Arial; } ...",
  "supportedFields": "personalInfo,workExperiences,educations,skills"
}
```

**Frontend Parse Template**:
```javascript
// Frontend đọc layoutDefinition
const template = await getTemplate(templateId);

// Parse để tạo form fields
const formFields = [];

// Personal Info
if (template.layoutDefinition.includes('{{personalInfo.fullName}}')) {
  formFields.push({ 
    type: 'text', 
    name: 'personalInfo.fullName', 
    label: 'Họ tên',
    required: true 
  });
}

if (template.layoutDefinition.includes('{{personalInfo.email}}')) {
  formFields.push({ 
    type: 'email', 
    name: 'personalInfo.email', 
    label: 'Email' 
  });
}

// Work Experiences (có loop)
if (template.layoutDefinition.includes('{{#foreach workExperiences}}') || 
    template.layoutDefinition.includes('{{workExperiences}}')) {
  formFields.push({
    type: 'array',
    name: 'workExperiences',
    label: 'Kinh nghiệm làm việc',
    itemFields: [
      { type: 'text', name: 'companyName', label: 'Tên công ty' },
      { type: 'text', name: 'position', label: 'Vị trí' },
      { type: 'date', name: 'startDate', label: 'Ngày bắt đầu' },
      { type: 'date', name: 'endDate', label: 'Ngày kết thúc' },
      { type: 'textarea', name: 'description', label: 'Mô tả' }
    ]
  });
}

// Tương tự cho các sections khác...
```

**Frontend hiển thị form**:
- Dựa trên `formFields` đã parse
- Candidate điền thông tin vào form
- Form có thể có preview real-time (nếu frontend implement)

---

### Bước 3: Candidate điền xong → Tạo CV

```
POST /api/cv/candidates
{
  "templateId": "template-1",
  "cvName": "CV của tôi",
  "dataJson": "{...}" // Data từ form
}
```

**Lưu ý**: 
- CV được tạo với `templateId` và `dataJson`
- Chưa render HTML

---

### Bước 4: Preview CV (khi candidate muốn xem)

```
GET /api/cv/candidates/{cvId}/render
```

**Response**: HTML đã render hoàn chỉnh
```json
{
  "cvId": "cv-123",
  "htmlContent": "<!DOCTYPE html>...<div class='cv-container'>...</div>..."
}
```

**Frontend**: Hiển thị HTML trong iframe hoặc div

---

## ❓ Câu hỏi 2: "Code có hỗ trợ nhiều template khác nhau không?"

**Trả lời**: ✅ **CÓ - HỖ TRỢ VÔ HẠN TEMPLATES!**

### Tại sao code hỗ trợ nhiều template?

#### 1. **Mỗi CV có TemplateId riêng**
```csharp
public class CandidateCv {
    public Guid TemplateId { get; set; }  // ← Link đến template
    public string DataJson { get; set; }   // ← Data của candidate
}
```

#### 2. **RenderCvAsync tự động lấy template theo TemplateId**
```csharp
public async Task<RenderCvDto> RenderCvAsync(Guid cvId)
{
    var cv = await _candidateCvRepository.GetAsync(cvId);
    var template = await _templateRepository.GetAsync(cv.TemplateId);  // ← Lấy template
    
    var htmlContent = template.LayoutDefinition;  // ← Dùng HTML của template đó
    // ... replace placeholders với data
}
```

#### 3. **Logic render tự động detect placeholders**
- Code không hardcode template nào
- Tự động detect placeholders trong `LayoutDefinition`
- Hỗ trợ 2 cách:
  - Placeholder đơn giản: `{{workExperiences}}` → Backend generate HTML
  - Loop-based: `{{#foreach workExperiences}}...{{/foreach}}` → Template tự định nghĩa structure

#### 4. **Ví dụ với nhiều templates khác nhau**

**Template 1 - Modern Style**:
```html
<div class="cv-modern">
  <h1>{{personalInfo.fullName}}</h1>
  {{#foreach workExperiences}}
    <div class="card">{{workExperience.companyName}}</div>
  {{/foreach}}
</div>
```

**Template 2 - Classic Style**:
```html
<div class="cv-classic">
  <header>
    <h2>{{personalInfo.fullName}}</h2>
  </header>
  <section>
    {{workExperiences}}  <!-- Backend generate -->
  </section>
</div>
```

**Template 3 - Minimal Style**:
```html
<div class="cv-minimal">
  <p>{{personalInfo.fullName}}</p>
  <ul>
    {{#foreach skills}}
      <li>{{skill.skillName}}</li>
    {{/foreach}}
  </ul>
</div>
```

**→ Code xử lý TẤT CẢ templates này mà không cần sửa code!**

---

## 🎯 TÓM TẮT

### Câu hỏi 1: "Render ra để điền thông tin?"
- ✅ **Frontend parse template** → Tạo form nhập liệu
- ✅ **Có thể preview** khi đang điền (gọi API render với data tạm)
- ❌ **KHÔNG render CV hoàn chỉnh** ngay khi chọn template

### Câu hỏi 2: "Hỗ trợ nhiều template?"
- ✅ **CÓ - Hỗ trợ vô hạn templates**
- ✅ Mỗi template có HTML/CSS riêng
- ✅ Code tự động detect và xử lý placeholders
- ✅ Không cần sửa code khi thêm template mới

---

## 💡 GỢI Ý CHO FRONTEND

### 1. Khi candidate chọn template:
```typescript
async function onSelectTemplate(templateId: string) {
  // Load template details
  const template = await api.getTemplate(templateId);
  
  // Parse template để tạo form
  const formConfig = parseTemplateToForm(template.layoutDefinition);
  
  // Hiển thị form cho candidate điền
  showForm(formConfig);
  
  // Optional: Preview real-time khi đang điền
  setupRealtimePreview(templateId);
}
```

### 2. Preview real-time (optional):
```typescript
async function previewCV(templateId: string, formData: any) {
  // Tạo CV tạm (chưa lưu)
  const tempCv = {
    templateId: templateId,
    dataJson: JSON.stringify(formData)
  };
  
  // Gọi API render (có thể cần API riêng cho preview)
  const html = await api.previewRender(tempCv);
  
  // Hiển thị preview
  showPreview(html);
}
```

### 3. Parse template để tạo form:
```typescript
function parseTemplateToForm(layoutDefinition: string) {
  const fields = [];
  
  // Detect personal info fields
  if (layoutDefinition.includes('{{personalInfo.fullName}}')) {
    fields.push({ name: 'personalInfo.fullName', type: 'text', label: 'Họ tên' });
  }
  
  // Detect work experiences
  if (layoutDefinition.includes('{{#foreach workExperiences}}')) {
    fields.push({
      name: 'workExperiences',
      type: 'array',
      label: 'Kinh nghiệm',
      itemFields: [
        { name: 'companyName', type: 'text', label: 'Công ty' },
        { name: 'position', type: 'text', label: 'Vị trí' },
        // ...
      ]
    });
  }
  
  return fields;
}
```

---

## ✅ KẾT LUẬN

1. **Khi chọn template**: Frontend parse để tạo form, KHÔNG render CV
2. **Code hỗ trợ nhiều template**: Mỗi template có HTML/CSS riêng, code tự động xử lý
3. **Preview**: Có thể preview khi đang điền (gọi API render với data tạm)
4. **Render cuối cùng**: Khi candidate muốn xem CV hoàn chỉnh → gọi `RenderCvAsync`



