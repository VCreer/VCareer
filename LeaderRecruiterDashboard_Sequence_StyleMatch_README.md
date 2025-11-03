# Leader Recruiter Dashboard - Sequence Diagrams (Style Matched)

## 📋 Tổng quan

Bộ sequence diagrams này được thiết kế theo **đúng style** của `DeactivateHRStaff_Sequence.puml`, với:
- ✅ Autonumbering với nested levels (1, 1.1, 1.1.1, etc.)
- ✅ Clean và đơn giản
- ✅ Alt/else cho validation
- ✅ Notes để giải thích
- ✅ Activate/return pattern
- ✅ Database interactions rõ ràng

---

## 📁 Các file diagrams

### 1️⃣ **LeaderRecruiterDashboard_Sequence_StyleMatch.puml**
**Function:** Get Company Dashboard (Main flow)

**Participants:**
- Leader Recruiter (Actor)
- RecruitmentDashboardController
- RecruitmentDashboardAppService
- RecruiterRepository
- ActivityLogRepository
- Database

**Flow chính:**
```
1. Leader → API: GET /company-dashboard
  1.1 Get current recruiter profile
    1.1.1 Database query
    1.1.2 Return profile
  1.2 Validate IsLead
  [alt: Not Leader → error]
  [else: Is Leader]
    1.3 Get all staff in company
    1.4 Get activity logs (filtered)
    1.5 Calculate staff performance
    1.6 Calculate company statistics
    1.7 Calculate top performers
    1.8 Sort staff
    1.9 Build DTO
    1.10 Return dashboard data
    1.11 Return 200 OK
```

**Input DTO:**
```
DashboardFilterDto:
- StartDate
- EndDate
- SortBy
- IncludeInactive
```

**Output DTO:**
```
CompanyDashboardDto:
- Company info
- Staff performances
- Top performers
- Aggregated statistics
```

---

### 2️⃣ **LeaderRecruiterDashboard_Sequence_GetStaffDetail.puml**
**Function:** Get Staff Performance Detail

**Participants:** (Same as above)

**Flow chính:**
```
1. Leader → API: GET /staff/{staffId}/performance
  1.1 Get current recruiter profile
  1.2 Validate IsLead
  [alt: Not Leader → error]
  [else: Is Leader]
    1.3 Find staff profile
    1.4 Validate same company
    [alt: Different company → error]
    [else: Same company]
      1.5 Get staff activities
      1.6 Calculate performance metrics
      1.7 Build DTO
      1.8 Return staff performance
      1.9 Return 200 OK
```

**Input:**
```
- StaffId (from URL)
- StartDate
- EndDate
```

**Output DTO:**
```
StaffPerformanceDto:
- User info
- Job statistics
- Candidate statistics
- Interview statistics
- Performance metrics
```

---

### 3️⃣ **LeaderRecruiterDashboard_Sequence_CompareStaff.puml**
**Function:** Compare Staff Performance

**Participants:** (Same as above)

**Flow chính:**
```
1. Leader → API: POST /compare
  1.1 Get current recruiter profile
  1.2 Validate IsLead
  [alt: Not Leader → error]
  [else: Is Leader]
    1.3 Initialize result list
    [loop: For each staffId]
      1.4 Find staff profile
      1.5 Validate same company
      [alt: Invalid → skip]
      [else: Valid]
        1.6 Get staff activities
        1.7 Calculate performance
        1.8 Add to result list
    1.9 Build response array
    1.10 Return staff performances
    1.11 Return 200 OK
```

**Input DTO:**
```
CompareStaffRequest:
- StaffIds: [Guid[]]
- Filter: DashboardFilterDto
```

**Output:**
```
StaffPerformanceDto[] (array)
```

---

### 4️⃣ **LeaderRecruiterDashboard_Sequence_GetTrend.puml**
**Function:** Get Activity Trend

**Participants:** (Same as above)

**Flow chính:**
```
1. Leader → API: GET /trend
  1.1 Get current recruiter profile
  1.2 Validate IsLead
  [alt: Not Leader → error]
  [else: Is Leader]
    1.3 Get company staff IDs
    1.4 Get all activities (filtered)
    1.5 Group by daily
    1.6 Group by weekly
    1.7 Group by monthly
    1.8 Build DTO
    1.9 Return trend data
    1.10 Return 200 OK
```

**Input DTO:**
```
DashboardFilterDto:
- StartDate
- EndDate
```

**Output DTO:**
```
ActivityTrendDto:
- DailyTrend: []
- WeeklyTrend: []
- MonthlyTrend: []
```

---

## 🎨 Style Characteristics

### Autonumbering Pattern:
```
1         → Main step
1.1       → Sub-step level 1
1.1.1     → Sub-step level 2
1.1.2     → Sub-step level 2
1.2       → Next sub-step level 1
```

### Alt/Else Blocks:
```plantuml
alt Condition Failed
    autonumber X.Y.1
    return error message
    autonumber X.Y.2
    return error response
else Condition Success
    autonumber X.Z
    [Continue normal flow]
end
```

### Loop Pattern:
```plantuml
loop For each item
    autonumber X.Y
    [Process item]
    
    alt Invalid
        [Skip]
    else Valid
        [Process]
    end
end
```

### Notes Usage:
```plantuml
note over Participant
Content explanation
end note

note right of Participant
Inline explanation
end note
```

---

## 🔍 So sánh với DeactivateHRStaff

| Feature | DeactivateHRStaff | Dashboard (Main) | Dashboard (Detail) | Dashboard (Compare) | Dashboard (Trend) |
|---------|-------------------|------------------|--------------------|--------------------|-------------------|
| **Participants** | 5 | 5 | 5 | 5 | 5 |
| **Main Steps** | 1-1.10 | 1-1.11 | 1-1.9 | 1-1.11 | 1-1.10 |
| **Alt Blocks** | 1 | 1 | 2 | 2 | 1 |
| **Loop Blocks** | 0 | 0 | 0 | 1 | 0 |
| **Notes** | 1 | 2 | 1 | 0 | 3 |
| **DB Queries** | 3 | 2 | 2 | 2 (in loop) | 2 |
| **Validation** | Business Rules | IsLead | IsLead + Company | IsLead + Company | IsLead |
| **Complexity** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 📊 Common Patterns

### 1. Authorization Check Pattern (All flows)
```
1.1 Get current user profile
  1.1.1 Database query
  1.1.2 Return profile
1.2 Validate IsLead()
alt Not Leader
  return error
else Is Leader
  [Continue]
end
```

### 2. Database Query Pattern
```
X.Y Service → Repository: Action
  X.Y.1 Repository → DB: ExecuteQuery()
  return result
  X.Y.2 Repository → Service: Return data
```

### 3. Response Building Pattern
```
X.Y Service → Service: Calculate/Process
X.Y+1 Service → Service: Build DTO
X.Y+2 return Return data
X.Y+3 return Return 200 OK
```

---

## 🚀 Cách sử dụng

### VS Code với PlantUML Extension:
```bash
1. Mở file .puml
2. Press Alt+D
3. Xem diagram preview
```

### Export to PNG/SVG:
```bash
# Right-click trong VS Code
→ Export Current Diagram
→ Chọn format (PNG, SVG, PDF)
```

### PlantUML Online:
```
1. Copy nội dung file
2. Paste vào: https://www.plantuml.com/plantuml/uml/
3. View và download
```

---

## 💡 Key Features

### ✅ Consistent Style
- Giống 100% với DeactivateHRStaff style
- Autonumbering pattern đồng nhất
- Alt/else structure giống nhau
- Notes placement tương tự

### ✅ Clear Flow
- Mỗi diagram focus vào 1 use case
- Steps được đánh số rõ ràng
- Database interactions explicit
- Error handling visible

### ✅ Easy to Maintain
- Text-based, dễ version control
- Có thể copy/paste structure
- Dễ update khi logic thay đổi

### ✅ Professional
- Clean presentation
- Suitable cho documentation
- Good for stakeholder review

---

## 📝 Use Cases Covered

| Use Case | File | Description |
|----------|------|-------------|
| **UC1: View Dashboard** | StyleMatch | Leader xem tổng quan công ty |
| **UC2: View Staff Detail** | GetStaffDetail | Leader xem chi tiết 1 staff |
| **UC3: Compare Staff** | CompareStaff | Leader so sánh nhiều staff |
| **UC4: View Trend** | GetTrend | Leader xem xu hướng hoạt động |

---

## 🔄 Relationship với Class Diagram

```
Class Diagram                    Sequence Diagrams
     ↓                                  ↓
LeaderRecruiterDashboard_Class.puml
     ├── Controllers         →  All sequence diagrams
     ├── Services            →  All sequence diagrams
     ├── Repositories        →  All sequence diagrams
     ├── DTOs                →  Notes in diagrams
     └── Domain Models       →  Database interactions
```

---

## 📚 Related Files

### Same Style:
- ✅ `DeactivateHRStaff_Class.puml` (Class diagram mẫu)
- ✅ `DeactivateHRStaff_Sequence.puml` (Sequence diagram mẫu)

### Dashboard Files:
- ✅ `LeaderRecruiterDashboard_Class.puml` (Class diagram)
- ✅ `LeaderRecruiterDashboard_Sequence_StyleMatch.puml` ⭐
- ✅ `LeaderRecruiterDashboard_Sequence_GetStaffDetail.puml` ⭐
- ✅ `LeaderRecruiterDashboard_Sequence_CompareStaff.puml` ⭐
- ✅ `LeaderRecruiterDashboard_Sequence_GetTrend.puml` ⭐

### Documentation:
- 📄 `Leader_Recruiter_Performance_Dashboard_Guide.md`
- 📄 `LeaderRecruiterDashboard_Diagrams_README.md`

---

## 🎯 Best Practices Applied

1. **Consistent Numbering:** Luôn dùng autonumber
2. **Clear Activation:** Luôn activate/return paired
3. **Explicit Queries:** Database queries rõ ràng
4. **Error First:** Alt block luôn check error trước
5. **Notes Sparingly:** Chỉ note khi cần giải thích
6. **Clean Returns:** Return values explicit
7. **Validation Early:** Authorization check ngay đầu

---

## 🔧 Maintenance Tips

### Khi update logic:
1. ✅ Giữ nguyên autonumbering structure
2. ✅ Update steps trong alt/else nếu thay đổi
3. ✅ Update notes nếu calculation thay đổi
4. ✅ Đảm bảo activate/return paired

### Khi thêm flow mới:
1. ✅ Copy structure từ file có sẵn
2. ✅ Thay đổi title và steps
3. ✅ Giữ nguyên style pattern
4. ✅ Update README này

---

**Created:** 2025-01-29  
**Style Based On:** DeactivateHRStaff_Sequence.puml  
**Author:** VCareer Development Team





