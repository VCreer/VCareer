# Leader Recruiter Performance Dashboard - UML Diagrams

## 📊 Tổng quan

Bộ tài liệu này bao gồm các PlantUML diagrams mô tả kiến trúc và luồng hoạt động của chức năng **Leader Recruiter Performance Dashboard**.

## 📁 Các file diagrams

### 1. **LeaderRecruiterDashboard_Class.puml** - Class Diagram

**Mô tả:** Sơ đồ lớp chi tiết hiển thị:
- Tất cả các classes trong hệ thống
- Relationships giữa các classes
- Properties và methods của từng class
- Phân tầng architecture (Controller → Service → Repository)

**Bao gồm:**
- ✅ **Controller Layer:** RecruitmentDashboardController
- ✅ **Service Layer:** IRecruitmentDashboardAppService, RecruitmentDashboardAppService
- ✅ **DTO Layer:** 6 DTOs (CompanyDashboardDto, StaffPerformanceDto, TopPerformerDto, etc.)
- ✅ **Domain Layer:** RecruiterProfile, ActivityLog, Company, IdentityUser
- ✅ **Repository Layer:** Generic repositories
- ✅ **Angular Layer:** Components và Services

**Điểm nổi bật:**
- Color-coded theo layer (Controller: Blue, Service: Green, DTO: Yellow, Entity: Pink)
- Hiển thị đầy đủ properties và methods
- Relationships rõ ràng với arrows và multiplicity

### 2. **LeaderRecruiterDashboard_Sequence.puml** - Main Sequence Diagram

**Mô tả:** Sơ đồ tuần tự chi tiết cho flow chính: **Get Company Dashboard**

**Flow bao gồm:**
1. 🔐 **Initialization:** User navigates, component loads
2. 🔐 **Authorization Check:** Verify Leader Recruiter permission
3. 👥 **Fetch Staff:** Get all HR staff in company
4. 📊 **Fetch Activities:** Get activity logs with filters
5. 🧮 **Calculate Performance:** Calculate metrics for each staff
6. 📈 **Sort & Aggregate:** Sort and calculate company statistics
7. 🏆 **Top Performers:** Identify top performing staff
8. 📤 **Return Response:** Send data back to frontend

**Đặc điểm:**
- Hiển thị đầy đủ các bước từ frontend đến database
- Có alt/else cho error handling
- Notes giải thích logic phức tạp
- Parallel flow để load activity trend

### 3. **LeaderRecruiterDashboard_Sequence_Simple.puml** - Additional Flows

**Mô tả:** Sơ đồ tuần tự đơn giản hóa cho các flows phụ:

**6 Flows:**

1. **Flow 1: Get Staff Performance Detail**
   - Click vào một staff cụ thể
   - Xem chi tiết hiệu suất của staff đó
   - Error handling cho permission và company validation

2. **Flow 2: Get Activity Trend**
   - Xem xu hướng hoạt động theo thời gian
   - Group activities theo ngày/tuần/tháng
   - Render chart

3. **Flow 3: Get Top Performers**
   - Lấy danh sách top 5 performers
   - Các categories khác nhau
   - Auto-load với dashboard

4. **Flow 4: Compare Staff Performance**
   - Select nhiều staff
   - So sánh metrics cạnh nhau
   - Handle invalid staff IDs

5. **Flow 5: Apply Filters**
   - Thay đổi date range, sort order
   - Reload toàn bộ dashboard với filters mới

6. **Flow 6: Export to CSV**
   - Export dữ liệu hiện tại
   - Client-side processing (no API call)
   - Download file

## 🎯 Cách xem diagrams

### Option 1: Visual Studio Code với PlantUML Extension

1. **Install extensions:**
   ```
   - PlantUML (jebbs.plantuml)
   - Graphviz (optional, for better rendering)
   ```

2. **View diagram:**
   - Mở file `.puml`
   - Press `Alt + D` hoặc click icon "Preview Diagram"
   - Diagram sẽ render trong preview panel

3. **Export diagram:**
   - Right-click trong file
   - Chọn "Export Current Diagram"
   - Chọn format: PNG, SVG, PDF, etc.

### Option 2: PlantUML Online Editor

1. Truy cập: https://www.plantuml.com/plantuml/uml/
2. Copy toàn bộ nội dung file `.puml`
3. Paste vào editor
4. Diagram sẽ tự động render
5. Download as PNG/SVG

### Option 3: PlantUML Command Line

1. **Install PlantUML:**
   ```bash
   # Using npm
   npm install -g node-plantuml
   
   # Or download JAR from plantuml.com
   ```

2. **Generate image:**
   ```bash
   plantuml LeaderRecruiterDashboard_Class.puml
   # Output: LeaderRecruiterDashboard_Class.png
   
   plantuml LeaderRecruiterDashboard_Sequence.puml
   plantuml LeaderRecruiterDashboard_Sequence_Simple.puml
   ```

3. **Generate SVG:**
   ```bash
   plantuml -tsvg LeaderRecruiterDashboard_Class.puml
   ```

### Option 4: IntelliJ IDEA / WebStorm

1. **Install plugin:** PlantUML integration
2. **Right-click file** → "Show PlantUML diagram"
3. Diagram hiển thị trong tool window

## 📖 Cách đọc diagrams

### Class Diagram

**Ký hiệu:**

- `+` : Public
- `-` : Private
- `#` : Protected
- `~` : Package/Internal

**Relationships:**

- `-->` : Association (uses)
- `--|>` : Inheritance (implements/extends)
- `*--` : Composition (contains)
- `o--` : Aggregation
- `..>` : Dependency

**Colors:**

- 🔵 **Blue (Controller):** HTTP endpoints
- 🟢 **Green (Service):** Business logic
- 🟡 **Yellow (DTO):** Data transfer objects
- 🩷 **Pink (Entity):** Domain models
- ⚪ **Gray (Repository):** Data access

### Sequence Diagram

**Elements:**

- `Actor` : Người dùng
- `Participant` : System components
- `Database` : Database
- `-->` : Synchronous call
- `<--` : Return
- `activate/deactivate` : Lifecycle

**Blocks:**

- `alt/else` : Conditional logic
- `loop` : Iteration
- `note` : Explanatory notes
- `==Section==` : Group related steps

## 🔍 Key Insights từ Diagrams

### 1. Architecture Patterns

**Layered Architecture:**
```
Frontend (Angular) 
    ↓
Controller (HTTP API)
    ↓
Service (Business Logic)
    ↓
Repository (Data Access)
    ↓
Database
```

**Separation of Concerns:**
- Controllers chỉ handle HTTP requests
- Services chứa business logic
- Repositories chỉ access data
- DTOs transfer data giữa layers

### 2. Security Implementation

**Multi-level checks:**
1. ✅ Authentication required (middleware)
2. ✅ Authorization check trong service (IsLead)
3. ✅ Company isolation (same company only)
4. ✅ Data filtering tự động

### 3. Performance Optimization

**Efficient data loading:**
- ✅ Batch query tất cả staff cùng lúc
- ✅ Single query cho activities với date filter
- ✅ In-memory calculation (không query nhiều lần)
- ✅ Repository pattern với Include cho eager loading

**Caching opportunities:**
- Company staff list có thể cache
- Top performers có thể cache (refresh định kỳ)
- Trend data có thể pre-calculate

### 4. Error Handling

**Graceful degradation:**
- Invalid staff IDs: skip instead of fail
- Missing data: return empty arrays
- Permission errors: clear error messages
- Frontend: loading states và error display

## 📝 Use Cases Covered

### Primary Use Cases

1. ✅ **UC1:** Leader views company performance overview
2. ✅ **UC2:** Leader views individual staff performance
3. ✅ **UC3:** Leader compares multiple staff
4. ✅ **UC4:** Leader views activity trends over time
5. ✅ **UC5:** Leader exports performance report
6. ✅ **UC6:** Leader filters data by date range

### Secondary Use Cases

7. ✅ **UC7:** System identifies top performers automatically
8. ✅ **UC8:** System calculates performance metrics (approval rate, etc.)
9. ✅ **UC9:** System aggregates company-wide statistics
10. ✅ **UC10:** System sorts staff by various criteria

## 🔄 Data Flow Summary

### Request Flow
```
User Input → Angular Component → HTTP Service → API Controller → 
App Service → Repository → Database
```

### Response Flow
```
Database → Repository → App Service (Calculate) → DTO → 
API Controller → HTTP Response → Angular Service → Component → UI
```

## 🛠️ Technical Decisions

### Why PlantUML?

✅ **Text-based:** Easy to version control
✅ **Readable:** Plain text, human-readable syntax
✅ **Powerful:** Support nhiều loại diagrams
✅ **Maintainable:** Easy to update
✅ **Portable:** Render anywhere (VS Code, online, CLI)

### Design Patterns Used

1. **Repository Pattern:** Data access abstraction
2. **Service Layer Pattern:** Business logic separation
3. **DTO Pattern:** Data transfer between layers
4. **Dependency Injection:** Loose coupling
5. **Observer Pattern:** Angular reactive programming (RxJS)

## 📚 Related Documentation

- `Leader_Recruiter_Performance_Dashboard_Guide.md` - Implementation guide
- `HRStaffActivityLog_Class.puml` - Related activity log diagram
- `HRStaffActivityLog_Sequence.puml` - Related activity log sequence

## 🚀 Next Steps

1. **Review diagrams** để hiểu architecture
2. **Follow sequence flows** để hiểu business logic
3. **Refer to diagrams** khi implement hoặc debug
4. **Update diagrams** khi có thay đổi code
5. **Share diagrams** với team để alignment

## 💡 Tips

- **Zoom in/out** trong PlantUML viewer để xem chi tiết
- **Follow arrows** để trace flow
- **Read notes** để hiểu business logic
- **Check colors** để identify layer
- **Compare diagrams** với actual code để verify

---

**Created:** 2025-01-29
**Version:** 1.0
**Author:** VCareer Development Team





