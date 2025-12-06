# CV Block Editor - Hướng dẫn Setup

## Tổng quan

Đã implement **block-based CV editor** với Angular CDK Drag & Drop, cho phép user:
- ✅ Add/xóa block tùy ý (Kinh nghiệm, Học vấn, Kỹ năng, Dự án, Chứng chỉ, Ngoại ngữ, Custom text)
- ✅ Kéo thả để reorder blocks
- ✅ Duplicate blocks
- ✅ Collapse/expand blocks
- ✅ Tất cả dữ liệu được sync với backend `CvDataDto` hiện tại (không cần sửa backend)

## Cài đặt Dependencies

**QUAN TRỌNG:** Cần cài đặt `@angular/cdk` trước khi chạy:

```bash
cd angular
npm install @angular/cdk
```

## Cấu trúc Components

### Main Component
- `cv-block-editor` - Component chính quản lý danh sách blocks với drag & drop

### Sub-components (theo từng loại block)
- `cv-block-personal-info` - Thông tin cá nhân (pinned, không thể xóa)
- `cv-block-work-experience` - Kinh nghiệm làm việc
- `cv-block-education` - Học vấn
- `cv-block-skills` - Kỹ năng
- `cv-block-projects` - Dự án
- `cv-block-certificates` - Chứng chỉ
- `cv-block-languages` - Ngoại ngữ
- `cv-block-custom-text` - Văn bản tùy chỉnh

## Cách sử dụng

### 1. Trong `write-cv` component

Component đã được tích hợp sẵn. Có flag `useBlockEditor` để toggle giữa:
- **Block editor mới** (`useBlockEditor = true`) - UI drag & drop với blocks
- **Template form cũ** (`useBlockEditor = false`) - Render từ template HTML như hiện tại

### 2. Flow dữ liệu

```
Backend DataJson (CvDataDto)
    ↓
buildBlocksFromCvData() → blocks: CvBlock[]
    ↓
cv-block-editor (UI)
    ↓
onBlocksChange() → buildCvDataFromBlocks() → cvData
    ↓
convertToBackendFormat() → DataJson (CvDataDto)
    ↓
Backend API
```

### 3. Schema Block

Mỗi block có cấu trúc:
```typescript
{
  id: string;              // UUID
  type: CvBlockType;       // 'personal-info' | 'work-experience' | ...
  title?: string;          // Tên hiển thị
  data: any;               // Dữ liệu form của block
  meta?: {
    pinned?: boolean;      // Block không thể xóa/di chuyển
    collapsed?: boolean;   // Block đang thu gọn
  };
}
```

## Features đã implement

### ✅ Drag & Drop
- Kéo thả để reorder blocks (trừ personal-info pinned)
- Visual feedback khi drag

### ✅ Add Block
- Nút "Thêm Section" với dropdown menu
- Chọn loại block muốn thêm

### ✅ Remove Block
- Nút xóa trên mỗi block
- Personal-info không thể xóa (pinned)

### ✅ Duplicate Block
- Nút duplicate để nhân đôi block

### ✅ Collapse/Expand
- Click vào header để thu gọn/mở rộng block

### ✅ Form Validation
- Reactive Forms với Validators
- Required fields được đánh dấu *

## Lưu ý

1. **Backend không cần sửa**: DataJson vẫn là `CvDataDto` như cũ, chỉ có cách FE quản lý dữ liệu thay đổi.

2. **Tương thích ngược**: Code cũ (template form) vẫn hoạt động, chỉ cần set `useBlockEditor = false`.

3. **Migration dữ liệu**: Khi load CV cũ, `buildBlocksFromCvData()` sẽ tự động convert sang blocks format.

4. **Custom text block**: Hiện tại map vào `careerObjective` trong `CvDataDto`. Có thể mở rộng sau để support nhiều custom text blocks.

## Optional Features (Đã implement ✅)

### ✅ 1. Rich Text Editor (Quill) cho Custom Text Block

**Cài đặt (Optional):**
```bash
npm install quill ngx-quill
```

**Sử dụng:**
- Component `cv-block-custom-text` đã hỗ trợ Quill editor
- Nếu Quill chưa được cài đặt, sẽ tự động fallback về textarea
- Quill sẽ tự động load khi component được khởi tạo

**Lưu ý:** 
- Cần import Quill styles trong `angular.json` hoặc `styles.scss`:
```scss
@import '~quill/dist/quill.snow.css';
```

### ✅ 2. Preview CV từ Blocks

**Cách sử dụng:**
- Click nút "Xem trước" trên header
- Nếu đang dùng block editor (`useBlockEditor = true`), sẽ preview từ blocks
- Preview sẽ render HTML từ blocks và hiển thị trong dialog

**Method:**
```typescript
previewCvFromBlocks() // Generate HTML từ blocks và hiển thị preview
```

### ✅ 3. Export PDF từ Blocks

**Cách sử dụng:**
- Click nút "Xuất PDF" trên header
- Nếu đang dùng block editor, sẽ export PDF từ blocks
- PDF sẽ được tự động download với tên CV

**Method:**
```typescript
exportPdfFromBlocks() // Generate PDF từ blocks và download
```

**Dependencies:** 
- `html2canvas` (đã có)
- `jspdf` (đã có)

### ✅ 4. Template Selection với Block Editor

**Cách hoạt động:**
- Khi chọn template mới, `mapBlocksFromTemplate()` sẽ được gọi
- Method này sẽ parse template HTML để tìm các sections
- Blocks sẽ được sắp xếp lại theo thứ tự trong template
- Personal-info block luôn được giữ ở đầu

**Method:**
```typescript
mapBlocksFromTemplate(template: CvTemplateDto) // Map và sắp xếp blocks theo template
```

