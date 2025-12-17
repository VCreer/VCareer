# SYSTEM TEST CASES - JOB SEARCH & BROWSE (CANDIDATE)

**Test Level:** System Test (End-to-End)  
**Role:** CANDIDATE  
**Total Test Cases:** 6

---

## TC-SYS-JOB-SEARCH-001: Basic Job Search
**Description:** Tìm kiếm job cơ bản với keyword  
**Pre-conditions:** Đã login, hệ thống có ít nhất 10 jobs với keyword "Java"  
**Priority:** High

**Test Steps:**
1. Navigate to homepage (`/`)
2. Nhập keyword "Java Developer" vào search box
3. Click "Tìm kiếm" hoặc Enter
4. Verify danh sách jobs hiển thị (ít nhất 1 job)
5. Verify mỗi job card hiển thị: title, company, location, salary, posted date
6. Verify jobs có chứa keyword "Java" trong title hoặc description
7. Click vào một job để xem detail

**Expected Results:**
- Search trả về kết quả phù hợp với keyword
- Job cards hiển thị đầy đủ thông tin
- Có thể navigate to job detail
- Loading indicator hiển thị khi đang search

---

## TC-SYS-JOB-SEARCH-002: Search with Multiple Filters
**Description:** Tìm kiếm job với nhiều filters kết hợp  
**Pre-conditions:** Đã login, hệ thống có jobs đa dạng về category, location, salary  
**Priority:** High

**Test Steps:**
1. Navigate to homepage
2. Nhập keyword "Developer"
3. Filter category: "Công nghệ thông tin"
4. Filter location: "Hà Nội"
5. Filter salary: "15-25 triệu"
6. Filter experience: "3-5 years"
7. Click "Tìm kiếm"
8. Verify kết quả được filter đúng
9. Verify chỉ hiển thị jobs thỏa mãn TẤT CẢ điều kiện
10. Clear filters → Verify kết quả trở về ban đầu

**Expected Results:**
- Tất cả filters hoạt động đúng
- Filters combine đúng (AND logic)
- Kết quả chính xác theo filters
- Clear filters hoạt động

---

## TC-SYS-JOB-SEARCH-003: View Job Detail
**Description:** Xem chi tiết job đầy đủ  
**Pre-conditions:** Đã login, có ít nhất 1 job trong hệ thống  
**Priority:** High

**Test Steps:**
1. Từ job listing, click vào một job card
2. Verify navigate to job detail page (`/candidate/job-detail/{jobId}`)
3. Verify job detail hiển thị đầy đủ:
   - Job title, company name, company logo
   - Location (province, district)
   - Salary range hoặc "Thỏa thuận"
   - Job description (full text)
   - Requirements, Benefits
   - Application deadline
   - Button "Ứng tuyển", "Lưu", "Chia sẻ"
4. Scroll xuống xem "Related Jobs" section
5. Click vào một related job → Verify navigate to job detail mới

**Expected Results:**
- Job detail page hiển thị đầy đủ thông tin
- Related jobs hiển thị và có thể navigate
- Các buttons hoạt động (Apply, Save, Share)
- Responsive trên mobile

---

## TC-SYS-JOB-SEARCH-004: Save and Unsave Job
**Description:** Lưu job vào danh sách yêu thích và bỏ lưu  
**Pre-conditions:** Đã login, đang xem job detail  
**Priority:** High

**Test Steps:**
1. Xem job detail của Job A
2. Click "Lưu" hoặc icon bookmark
3. Verify:
   - Toast success: "Đã lưu công việc"
   - Icon bookmark fill/change color
   - Button đổi thành "Đã lưu"
4. Navigate to "Saved Jobs" page (`/candidate/save-jobs`)
5. Verify Job A xuất hiện trong danh sách
6. Quay lại job detail của Job A
7. Click "Đã lưu" hoặc icon bookmark đã fill
8. Verify:
   - Toast: "Đã bỏ lưu công việc"
   - Icon bookmark unfill
   - Button đổi thành "Lưu"
9. Navigate lại "Saved Jobs" → Verify Job A không còn trong list

**Expected Results:**
- Save job thành công, job xuất hiện trong saved list
- Unsave job thành công, job bị xóa khỏi saved list
- UI update đúng (icon, button text)
- Data sync giữa job detail và saved jobs list

---

## TC-SYS-JOB-SEARCH-005: View Saved Jobs List
**Description:** Xem danh sách jobs đã lưu  
**Pre-conditions:** Đã login, đã lưu ít nhất 3 jobs  
**Priority:** Medium

**Test Steps:**
1. Navigate to "Saved Jobs" page (`/candidate/save-jobs`)
2. Verify page hiển thị:
   - Title "Công việc đã lưu"
   - Danh sách jobs đã lưu
3. Verify mỗi job item hiển thị:
   - Job title, company name, location
   - Salary, posted date
   - Button "Xem chi tiết", "Bỏ lưu"
4. Click "Xem chi tiết" trên một job
5. Verify navigate to job detail page
6. Apply job từ detail page
7. Quay lại "Saved Jobs" → Verify job bị xóa (hoặc có badge "Đã apply")
8. Test pagination (nếu có > 10 jobs):
   - Click "Trang 2"
   - Verify jobs trang 2 được load

**Expected Results:**
- Saved jobs list hiển thị đầy đủ
- Mỗi job item có đầy đủ thông tin
- Có thể navigate to job detail từ saved list
- Apply job từ saved list hoạt động
- Pagination hoạt động (nếu có)

---

## TC-SYS-JOB-SEARCH-006: Empty Search Results & Saved Jobs
**Description:** Xử lý trường hợp không có kết quả  
**Pre-conditions:** Đã login  
**Priority:** Low

**Test Steps:**
1. Search với keyword không có kết quả (ví dụ: "xyzabc123")
2. Verify empty state hiển thị:
   - Message: "Không tìm thấy công việc phù hợp"
   - Có nút "Xóa bộ lọc" hoặc "Tìm kiếm lại"
3. Navigate to "Saved Jobs" khi chưa lưu job nào
4. Verify empty state hiển thị:
   - Message: "Bạn chưa lưu công việc nào"
   - Có nút "Tìm việc ngay" → Navigate to job listing

**Expected Results:**
- Empty state hiển thị đúng message
- Có action buttons để user tiếp tục
- UX tốt, không confuse user

---

## SUMMARY

**Total Test Cases:** 6  
**Priority Distribution:**
- High: 4 test cases (Basic Search, Filters, Job Detail, Save/Unsave)
- Medium: 1 test case (Saved Jobs List)
- Low: 1 test case (Empty States)

**Key Test Areas:**
- Search functionality với keyword và filters
- Job detail display và navigation
- Save/Unsave job workflow
- Saved jobs list management
- Empty states handling

**Test Execution Notes:**
- Cần data test đầy đủ: jobs với đa dạng category, location, salary
- Test trên cả desktop và mobile để verify responsive
- Verify data consistency giữa job listing, job detail và saved jobs










