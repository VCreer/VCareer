# Sequence Diagrams - Hướng dẫn chọn diagram

## 📊 Có 4 versions - từ đơn giản đến chi tiết:

---

## ⭐ **Level 1: Ultra Simple** (Recommended cho presentation)
**File:** `LeaderRecruiterDashboard_Sequence_OneFlow.puml`

**Đặc điểm:**
- ✅ Chỉ **1 flow** duy nhất (main flow)
- ✅ Chỉ **5 participants** (Leader, UI, API, Service, DB)
- ✅ Khoảng **15 lines** code
- ✅ Focus vào big picture

**Khi nào dùng:**
- 🎯 Presentation cho stakeholders
- 🎯 Overview nhanh cho team mới
- 🎯 Document high-level architecture

**Preview:**
```
Leader → UI → API → Service → DB
      ← ← ← ← ←
(Straight flow, no branches)
```

---

## ⭐⭐ **Level 2: Very Simple** (Recommended cho documentation)
**File:** `LeaderRecruiterDashboard_Sequence_VerySimple.puml`

**Đặc điểm:**
- ✅ **Main flow** + optional actions
- ✅ **4 participants** (Leader, UI, API, DB)
- ✅ Có **alt block** cho error handling
- ✅ Group actions ở cuối

**Khi nào dùng:**
- 🎯 User documentation
- 🎯 Training materials
- 🎯 Quick reference

**Preview:**
```
Main Flow (8 steps)
    + Alt: Error handling
    + Group: 3 optional actions
```

---

## ⭐⭐⭐ **Level 3: Simplified** (Recommended cho developers)
**File:** `LeaderRecruiterDashboard_Sequence_Simplified.puml`

**Đặc điểm:**
- ✅ **4 main flows:**
  1. View Company Dashboard
  2. View Staff Detail
  3. Compare Staff
  4. Export Report
- ✅ **5 participants**
- ✅ Có **alt/loop blocks**
- ✅ Có **notes** giải thích

**Khi nào dùng:**
- 🎯 Developer documentation
- 🎯 Code review
- 🎯 Implementation guide

**Preview:**
```
Flow 1: Dashboard (with alt)
Flow 2: Staff Detail
Flow 3: Compare (with loop)
Flow 4: Export
+ Notes at bottom
```

---

## ⭐⭐⭐⭐ **Level 4: Detailed** (For technical deep-dive)
**File:** `LeaderRecruiterDashboard_Sequence.puml` (original)

**Đặc điểm:**
- ✅ **Complete flow** với mọi chi tiết
- ✅ **10+ participants** (including repos)
- ✅ Multiple **alt/loop/note blocks**
- ✅ Authorization, error handling, parallel flows

**Khi nào dùng:**
- 🎯 Technical specification
- 🎯 Debugging reference
- 🎯 Complete system documentation

---

## 📋 So sánh nhanh:

| Feature | OneFlow | VerySimple | Simplified | Detailed |
|---------|---------|------------|------------|----------|
| **Lines of code** | ~20 | ~60 | ~150 | ~400 |
| **Participants** | 5 | 4 | 5 | 10+ |
| **Flows** | 1 | 1 + options | 4 | 6+ |
| **Alt blocks** | 0 | 1 | 1 | 5+ |
| **Loop blocks** | 0 | 0 | 1 | 3+ |
| **Notes** | 1 | 1 | 1 | 10+ |
| **Complexity** | ⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Detail level** | High-level | Overview | Standard | Complete |

---

## 💡 Khuyến nghị sử dụng:

### 🎯 Cho Management/Stakeholders:
→ Dùng **OneFlow** (Level 1)

### 🎯 Cho End Users/Training:
→ Dùng **VerySimple** (Level 2)

### 🎯 Cho Developers:
→ Dùng **Simplified** (Level 3)

### 🎯 Cho Technical Leads/Architects:
→ Dùng **Detailed** (Level 4)

---

## 🚀 Cách sử dụng:

### 1. Chọn file phù hợp với mục đích
```bash
# Quick overview
LeaderRecruiterDashboard_Sequence_OneFlow.puml

# User guide
LeaderRecruiterDashboard_Sequence_VerySimple.puml

# Developer doc
LeaderRecruiterDashboard_Sequence_Simplified.puml

# Complete spec
LeaderRecruiterDashboard_Sequence.puml
```

### 2. Mở trong VS Code với PlantUML extension
```
Alt + D để preview
```

### 3. Hoặc dùng online
```
https://www.plantuml.com/plantuml/uml/
```

---

## 📝 Nội dung của từng diagram:

### OneFlow (Ultra Simple):
```
✓ Main flow only
✓ No error handling detail
✓ Focus on happy path
```

### VerySimple:
```
✓ Main flow (8 steps)
✓ Basic error handling
✓ Optional actions grouped
✓ Minimal detail
```

### Simplified:
```
✓ View Dashboard (main)
✓ View Staff Detail
✓ Compare Staff (with loop)
✓ Export Report
✓ Error handling
```

### Detailed (Original):
```
✓ Complete initialization
✓ Authorization checks
✓ All database queries
✓ All calculations
✓ Error scenarios
✓ Parallel loading
✓ All user interactions
```

---

## 🎨 Visual Comparison:

```
OneFlow:        Leader → UI → API → DB → API → UI → Leader
                (Straight line)

VerySimple:     Leader → UI → API → DB
                         ↓     ↓     ↓
                      [Main Flow]
                         ↓
                   [3 Optional Actions]

Simplified:     [Flow 1: Dashboard]
                [Flow 2: Staff Detail]
                [Flow 3: Compare]
                [Flow 4: Export]

Detailed:       [Initialization]
                [Authorization]
                [Fetch Data]
                [Calculate]
                [Return]
                [User Actions]
                [Error Handling]
                [Parallel Flows]
```

---

## ✅ Recommendation:

**Bắt đầu với OneFlow hoặc VerySimple!**

- Dễ hiểu nhất
- Đủ thông tin cho overview
- Không quá phức tạp
- Phù hợp cho hầu hết use cases

Nếu cần thêm detail, dần dần chuyển sang Simplified hoặc Detailed.

---

**Created:** 2025-01-29
**Author:** VCareer Development Team





