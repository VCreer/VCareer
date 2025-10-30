# Leader Recruiter Performance Dashboard - Implementation Guide

## Tổng quan

Chức năng **Leader Recruiter Performance Dashboard** là một dashboard toàn diện giúp Leader Recruiter theo dõi và đánh giá hiệu suất làm việc của các HR Staff trong công ty. Dashboard cung cấp các thông số chi tiết về hoạt động tuyển dụng, hiệu quả công việc, và so sánh hiệu suất giữa các nhân viên.

## Tính năng chính

### 1. Dashboard Tổng quan (Overview)
- **Thống kê tổng quan công ty:**
  - Tổng số nhân viên HR
  - Tổng số công việc đã đăng tuyển
  - Số lượng ứng viên được phê duyệt
  - Số buổi phỏng vấn đã hoàn thành
  
- **Thống kê hoạt động theo thời gian:**
  - Hoạt động hôm nay
  - Hoạt động tuần này
  - Hoạt động tháng này
  - Trung bình hoạt động mỗi nhân viên

- **Top Performers:**
  - Nhân viên đăng nhiều công việc nhất
  - Nhân viên phê duyệt nhiều ứng viên nhất
  - Nhân viên hoàn thành nhiều phỏng vấn nhất
  - Tỷ lệ phê duyệt cao nhất
  - Nhân viên tích cực nhất tháng này

### 2. Danh sách Staff (Staff List)
Hiển thị bảng chi tiết hiệu suất của từng HR Staff bao gồm:
- Tên và email
- Trạng thái (Active/Inactive)
- Số công việc đã đăng
- Số công việc đang hoạt động
- Số ứng viên đã đánh giá
- Tỷ lệ phê duyệt ứng viên
- Số buổi phỏng vấn
- Tổng hoạt động trong tháng

### 3. Xu hướng hoạt động (Trends)
Biểu đồ hiển thị xu hướng hoạt động theo thời gian:
- Xu hướng theo ngày (7 ngày gần nhất)
- Xu hướng theo tuần
- Xu hướng theo tháng

### 4. So sánh hiệu suất (Compare Staff)
Cho phép chọn nhiều HR Staff để so sánh hiệu suất trực tiếp với nhau.

## Cấu trúc Backend

### 1. DTOs (Data Transfer Objects)

#### `StaffPerformanceDto.cs`
Chứa thông tin hiệu suất chi tiết của một HR Staff.

```csharp
- UserId: Guid
- FullName: string
- Email: string
- IsLead: bool
- Status: bool
- TotalJobsPosted: int
- ActiveJobs: int
- CandidatesApproved: int
- ApprovalRate: decimal
- InterviewsCompleted: int
- ThisMonthActivities: int
// ... và nhiều thuộc tính khác
```

#### `CompanyDashboardDto.cs`
Tổng hợp hiệu suất của toàn bộ công ty.

#### `TopPerformerDto.cs`
Thông tin về nhân viên có hiệu suất cao nhất.

#### `DashboardFilterDto.cs`
Bộ lọc để filter dữ liệu dashboard theo nhiều tiêu chí.

#### `ActivityTrendDto.cs`
Dữ liệu xu hướng hoạt động theo thời gian.

### 2. Service Interface

**File:** `src/VCareer.Application.Contracts/IServices/IRecruitmentDashboard/IRecruitmentDashboardAppService.cs`

```csharp
public interface IRecruitmentDashboardAppService
{
    Task<CompanyDashboardDto> GetCompanyDashboardAsync(DashboardFilterDto filter);
    Task<StaffPerformanceDto> GetStaffPerformanceAsync(Guid staffId, DashboardFilterDto filter);
    Task<ActivityTrendDto> GetActivityTrendAsync(DashboardFilterDto filter);
    Task<TopPerformerDto[]> GetTopPerformersAsync(int topCount, DashboardFilterDto filter);
    Task<StaffPerformanceDto[]> CompareStaffPerformanceAsync(Guid[] staffIds, DashboardFilterDto filter);
}
```

### 3. Service Implementation

**File:** `src/VCareer.Application/Services/RecruitmentDashboard/RecruitmentDashboardAppService.cs`

Implement các phương thức:
- Kiểm tra quyền Leader Recruiter
- Lấy dữ liệu từ ActivityLog
- Tính toán các metrics hiệu suất
- Sắp xếp và filter dữ liệu

### 4. API Controller

**File:** `src/VCareer.HttpApi/Controllers/RecruitmentDashboardController.cs`

Endpoints:
- `GET /api/app/recruitment-dashboard/company` - Lấy dashboard tổng quan
- `GET /api/app/recruitment-dashboard/staff/{staffId}` - Lấy hiệu suất của một staff
- `GET /api/app/recruitment-dashboard/trend` - Lấy xu hướng hoạt động
- `GET /api/app/recruitment-dashboard/top-performers` - Lấy top performers
- `POST /api/app/recruitment-dashboard/compare` - So sánh nhiều staff

### 5. Permissions

**File:** `src/VCareer.Domain.Shared/Permission/VCareerPermission.cs`

Thêm permissions:
```csharp
public static class Dashboard
{
    public const string Default = GroupName + ".Dashboard";
    public const string ViewCompanyDashboard = Default + ".ViewCompanyDashboard";
    public const string ViewStaffPerformance = Default + ".ViewStaffPerformance";
    public const string ViewActivityTrend = Default + ".ViewActivityTrend";
    public const string ViewTopPerformers = Default + ".ViewTopPerformers";
    public const string CompareStaffPerformance = Default + ".CompareStaffPerformance";
}
```

## Cấu trúc Frontend (Angular)

### 1. Component

**File:** `angular/src/app/features/dashboard/recruitment-performance/recruitment-performance-dashboard.component.ts`

Component chính với các chức năng:
- Load dashboard data
- Apply filters
- Export to CSV
- Toggle view modes
- Select staff for comparison

### 2. Template

**File:** `angular/src/app/features/dashboard/recruitment-performance/recruitment-performance-dashboard.component.html`

UI components:
- Filter section
- View mode tabs (Overview, Staff List, Trends, Comparison)
- Summary cards
- Performance table
- Charts
- Top performers section

### 3. Styles

**File:** `angular/src/app/features/dashboard/recruitment-performance/recruitment-performance-dashboard.component.scss`

Responsive design với:
- Grid layouts
- Card styles
- Table styles
- Chart styles
- Mobile responsive

### 4. Service

**File:** `angular/src/app/proxy/api/recruitment-dashboard.service.ts`

Service để gọi API với các phương thức tương ứng.

### 5. Models

**File:** `angular/src/app/proxy/models/dashboard.models.ts`

TypeScript interfaces cho các DTOs.

### 6. Routing

**File:** `angular/src/app/app.routes.ts`

Route: `/recruiter/performance-dashboard`

## Cách sử dụng

### 1. Backend Setup

1. Build backend project:
```bash
cd src/VCareer.HttpApi.Host
dotnet build
```

2. Run migrations (nếu có thêm bảng mới):
```bash
cd src/VCareer.DbMigrator
dotnet run
```

3. Start backend:
```bash
cd src/VCareer.HttpApi.Host
dotnet run
```

### 2. Frontend Setup

1. Install dependencies:
```bash
cd angular
npm install
```

2. Start Angular dev server:
```bash
npm start
```

3. Access dashboard:
```
http://localhost:4200/recruiter/performance-dashboard
```

### 3. Sử dụng Dashboard

1. **Đăng nhập với tài khoản Leader Recruiter**
   - Chỉ user có IsLead = true mới có quyền truy cập

2. **Áp dụng bộ lọc:**
   - Chọn khoảng thời gian (Start Date, End Date)
   - Chọn tiêu chí sắp xếp
   - Bật/tắt "Include Inactive Staff"
   - Click "Apply Filters"

3. **Xem Overview:**
   - Xem tổng quan các thống kê của công ty
   - Xem top performers
   - Xem hoạt động theo thời gian

4. **Xem danh sách Staff:**
   - Xem bảng chi tiết hiệu suất từng staff
   - Chọn staff để so sánh

5. **Xem xu hướng:**
   - Biểu đồ hoạt động 7 ngày gần nhất

6. **So sánh Staff:**
   - Chọn nhiều staff từ tab Staff List
   - Chuyển sang tab Comparison để xem so sánh

7. **Export dữ liệu:**
   - Click "Export CSV" để tải về file CSV

## Các Metrics được tính toán

### 1. Approval Rate (Tỷ lệ phê duyệt)
```
Approval Rate = (Candidates Approved / (Candidates Approved + Candidates Rejected)) * 100
```

### 2. Interview Completion Rate (Tỷ lệ hoàn thành phỏng vấn)
```
Interview Completion Rate = (Interviews Completed / (Interviews Completed + Interviews Cancelled)) * 100
```

### 3. Average Activities Per Day
```
Average Activities Per Day = Total Activities / Number of Days in Filter Range
```

### 4. Average Activities Per Staff
```
Average Activities Per Staff = Total Activities / Total Staff
```

## Security

- **Authorization:** Chỉ Leader Recruiter (IsLead = true) mới có quyền truy cập
- **Data Isolation:** Chỉ xem được data của staff cùng công ty
- **Authentication Required:** Phải đăng nhập để sử dụng

## Mở rộng tương lai

1. **Real-time updates:** Sử dụng SignalR để cập nhật real-time
2. **Advanced charts:** Tích hợp thư viện chart chuyên nghiệp (Chart.js, D3.js)
3. **Email reports:** Gửi báo cáo định kỳ qua email
4. **Custom dashboards:** Cho phép tùy chỉnh dashboard
5. **Mobile app:** Phát triển mobile app cho dashboard

## Troubleshooting

### Lỗi "Bạn không có quyền truy cập"
- Kiểm tra user có IsLead = true không
- Kiểm tra user có thuộc RecruiterProfile không

### Dashboard không load được data
- Kiểm tra backend API có chạy không
- Kiểm tra console log để xem error message
- Kiểm tra network tab trong browser dev tools

### Dữ liệu không đúng
- Kiểm tra ActivityLog có được log đúng không
- Kiểm tra filter parameters
- Kiểm tra timezone của server và client

## Files đã tạo

### Backend
1. `src/VCareer.Application.Contracts/Dto/DashboardDto/StaffPerformanceDto.cs`
2. `src/VCareer.Application.Contracts/Dto/DashboardDto/CompanyDashboardDto.cs`
3. `src/VCareer.Application.Contracts/Dto/DashboardDto/TopPerformerDto.cs`
4. `src/VCareer.Application.Contracts/Dto/DashboardDto/DashboardFilterDto.cs`
5. `src/VCareer.Application.Contracts/Dto/DashboardDto/ActivityTrendDto.cs`
6. `src/VCareer.Application.Contracts/IServices/IRecruitmentDashboard/IRecruitmentDashboardAppService.cs`
7. `src/VCareer.Application/Services/RecruitmentDashboard/RecruitmentDashboardAppService.cs`
8. `src/VCareer.HttpApi/Controllers/RecruitmentDashboardController.cs`
9. Updated: `src/VCareer.Domain.Shared/Permission/VCareerPermission.cs`
10. Updated: `src/VCareer.Domain.Shared/Permission/VCareerPermissionDefinitionProvider.cs`
11. Updated: `src/VCareer.Domain.Shared/Localization/VCareer/en.json`

### Frontend
1. `angular/src/app/features/dashboard/recruitment-performance/recruitment-performance-dashboard.component.ts`
2. `angular/src/app/features/dashboard/recruitment-performance/recruitment-performance-dashboard.component.html`
3. `angular/src/app/features/dashboard/recruitment-performance/recruitment-performance-dashboard.component.scss`
4. `angular/src/app/proxy/api/recruitment-dashboard.service.ts`
5. `angular/src/app/proxy/models/dashboard.models.ts`
6. Updated: `angular/src/app/app.routes.ts`

## Kết luận

Dashboard này cung cấp một giải pháp toàn diện để Leader Recruiter có thể theo dõi, đánh giá và so sánh hiệu suất của các HR Staff trong công ty. Với giao diện thân thiện và nhiều tính năng hữu ích, dashboard giúp tối ưu hóa quy trình quản lý và nâng cao hiệu quả tuyển dụng.





