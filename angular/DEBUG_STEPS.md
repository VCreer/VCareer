# 🔍 DEBUG GUIDE - VCareer Angular

## ✅ KIỂM TRA BACKEND API

### Bước 1: Chạy Backend .NET
```bash
# Mở terminal mới, vào folder backend
cd src/VCareer.HttpApi.Host
dotnet run
```

Backend phải chạy ở: `https://localhost:44385`

### Bước 2: Test API trực tiếp
Mở browser và test các URL sau:

1. **Category API:**
   ```
   https://localhost:44385/api/job-categories/tree
   ```
   - Phải trả về JSON array của categories
   - Có cấu trúc: `categoryId`, `categoryName`, `children`, etc.

2. **Location API:**
   ```
   https://localhost:44385/api/locations/provinces
   ```
   - Phải trả về JSON array của provinces
   - Có cấu trúc: `id`, `name`, `code`, `districts`

### Bước 3: Kiểm tra CORS
Nếu API không trả về dữ liệu, check trong browser console (F12):
- Nếu có lỗi CORS → Fix trong backend `Program.cs`
- Nếu có lỗi HTTPS certificate → Chấp nhận certificate trong browser

### Bước 4: Kiểm tra Angular
Mở browser console (F12) và xem:
```
✅ CandidateHomepage - Loaded categories: X
✅ CandidateHomepage - Loaded provinces: Y
✅ FilterBar received categories: X
✅ FilterBar received provinces: Y
```

Nếu thấy số 0 → Backend chưa trả về dữ liệu!

### Bước 5: Test mock data (nếu backend chưa ready)
Trong `candidate-homepage.ts`, thêm mock data:
```typescript
loadInitialData() {
  // ✅ TEMPORARY: Mock data for testing
  this.categories = [
    {
      categoryId: '1',
      categoryName: 'IT',
      slug: 'it',
      description: 'Công nghệ thông tin',
      jobCount: 100,
      children: [],
      fullPath: 'IT',
      isLeaf: false
    }
  ];
  this.provinces = [
    {
      id: 1,
      name: 'Hà Nội',
      code: 'HN',
      districts: [
        { id: 1, name: 'Ba Đình', code: 'BD', provinceId: 1 }
      ]
    }
  ];
  console.log('✅ Using mock data');
  return;
  
  // Original API call below...
}
```

## 🎯 EXPECTED BEHAVIOR

### Khi mở Category Dropdown:
1. Click "Danh mục Nghề"
2. Phải hiện danh sách Level 1 categories (bên trái)
3. Hover vào Level 1 → Hiện Level 2 và Level 3 (bên phải)

### Khi mở Location Dropdown:
1. Click "Địa điểm"
2. Phải hiện danh sách provinces (bên trái)
3. Hover vào province → Hiện districts (bên phải)

### Khi Search:
- Gõ keyword → Hiện kết quả hoặc "Không tìm thấy"
- Xóa keyword → Quay về tree ban đầu

## 🚀 QUICK FIX

Nếu vẫn không hiện, thử:
```bash
# Clear browser cache
Ctrl + Shift + Delete

# Restart Angular
cd angular
Ctrl+C (stop)
npm start
```





