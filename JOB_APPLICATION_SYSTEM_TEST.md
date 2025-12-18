# SYSTEM TEST CASES - JOB APPLICATION (CANDIDATE)

**Test Level:** System Test (End-to-End)  
**Role:** CANDIDATE  
**Total Test Cases:** 6

---

## TC-SYS-JOB-APPLY-001: Apply Job with Online CV
**Description:** Ứng tuyển job với CV online có sẵn  
**Pre-conditions:** Đã login, có ít nhất 1 CV online, có 1 job active trong hệ thống  
**Priority:** High

**Test Steps:**
1. Navigate to job detail page của Job A
2. Verify job detail hiển thị đầy đủ
3. Click "Ứng tuyển"
4. Verify apply modal mở với options: "CV Online", "CV Uploaded", "Tải CV lên"
5. Chọn "CV Online"
6. Verify dropdown CV list hiển thị (ít nhất 1 CV)
7. Chọn một CV từ dropdown
8. (Optional) Nhập cover letter: "Tôi rất quan tâm đến vị trí này"
9. Click "Gửi đơn ứng tuyển"
10. Verify:
    - Loading indicator hiển thị
    - Toast success: "Ứng tuyển thành công"
    - Modal đóng
    - Button "Ứng tuyển" đổi thành "Đã ứng tuyển" hoặc "Ứng tuyển lại"
11. Navigate to "Applied Jobs" page
12. Verify Job A xuất hiện trong list với status "Pending"

**Expected Results:**
- Apply modal mở đúng
- CV dropdown hiển thị đầy đủ CVs
- Apply thành công, application được tạo
- Job xuất hiện trong applied jobs với status đúng
- UI update đúng (button text, badge)

---

## TC-SYS-JOB-APPLY-002: Apply Job with Uploaded CV
**Description:** Ứng tuyển job với CV uploaded có sẵn  
**Pre-conditions:** Đã login, có ít nhất 1 CV uploaded, có 1 job active  
**Priority:** High

**Test Steps:**
1. Navigate to job detail page của Job B
2. Click "Ứng tuyển"
3. Chọn "CV Uploaded"
4. Verify dropdown hiển thị CVs uploaded (tên file hoặc tên đã đổi)
5. Chọn một CV uploaded
6. Click "Gửi đơn ứng tuyển"
7. Verify apply thành công
8. Navigate to "Applied Jobs"
9. Verify Job B xuất hiện
10. Click "Xem CV đã gửi" → Verify CV uploaded có thể xem/download

**Expected Results:**
- Apply với CV uploaded thành công
- CV uploaded có thể xem lại từ applied jobs
- Application được tạo đúng với CV uploaded

---

## TC-SYS-JOB-APPLY-003: Apply Job - Upload New CV and Apply
**Description:** Upload CV mới và apply ngay trong quá trình apply  
**Pre-conditions:** Đã login, có file CV hợp lệ (< 5MB, PDF/DOC/DOCX)  
**Priority:** High

**Test Steps:**
1. Navigate to job detail page của Job C
2. Click "Ứng tuyển"
3. Chọn "Tải CV lên"
4. Chọn file CV hợp lệ (ví dụ: `new-cv.pdf`)
5. (Optional) Nhập tên CV
6. Click "Upload và ứng tuyển" hoặc "Upload"
7. Verify:
    - File được upload trước
    - Sau đó apply được thực hiện tự động
    - Toast success: "Tải CV lên và ứng tuyển thành công"
8. Verify CV được lưu vào CV library
9. Verify application được tạo
10. Navigate to CV Management → Verify CV mới xuất hiện trong list

**Expected Results:**
- Upload CV và apply trong một flow thành công
- CV được lưu vào library
- Application được tạo với CV mới
- Data consistent giữa CV library và applications

---

## TC-SYS-JOB-APPLY-004: View Applied Jobs List
**Description:** Xem danh sách jobs đã ứng tuyển  
**Pre-conditions:** Đã login, đã apply ít nhất 3 jobs với các status khác nhau  
**Priority:** High

**Test Steps:**
1. Navigate to "Applied Jobs" page (`/candidate/applied-jobs`)
2. Verify page hiển thị:
   - Title "Công việc đã ứng tuyển"
   - Danh sách applications
3. Verify mỗi application hiển thị:
   - Job title, company name
   - Applied date
   - Status (Pending/Approved/Rejected)
   - Button "Xem chi tiết", "Xem CV đã gửi"
4. Click "Xem chi tiết" → Verify navigate to job detail
5. Click "Xem CV đã gửi" → Verify CV detail/preview hiển thị
6. Verify pagination (nếu có > 10 applications):
   - Click "Trang 2" → Verify applications trang 2 được load

**Expected Results:**
- Applied jobs list hiển thị đầy đủ
- Mỗi application có đầy đủ thông tin
- Có thể navigate to job detail và CV detail
- Pagination hoạt động (nếu có)

---

## TC-SYS-JOB-APPLY-005: Filter Applied Jobs by Status
**Description:** Lọc applications theo trạng thái  
**Pre-conditions:** Đã login, có applications với các status: Pending, Approved, Rejected  
**Priority:** Medium

**Test Steps:**
1. Navigate to "Applied Jobs" page
2. Verify filter options hiển thị: "Tất cả", "Chờ phản hồi", "Đã duyệt", "Đã từ chối"
3. Click filter "Chờ phản hồi" (Pending)
4. Verify chỉ hiển thị applications có status "Pending"
5. Click filter "Đã duyệt" (Approved)
6. Verify chỉ hiển thị applications có status "Approved"
7. Click filter "Đã từ chối" (Rejected)
8. Verify chỉ hiển thị applications có status "Rejected"
9. Click "Tất cả" → Verify hiển thị tất cả applications
10. Verify filter được highlight khi active

**Expected Results:**
- Filter hoạt động đúng cho từng status
- Kết quả được filter chính xác
- Filter UI update đúng (highlight active filter)
- "Tất cả" hiển thị đầy đủ applications

---

## TC-SYS-JOB-APPLY-006: Re-apply Job After Rejection
**Description:** Ứng tuyển lại job sau khi bị từ chối  
**Pre-conditions:** Đã login, có 1 application bị reject (Job D), có CV khác để apply lại  
**Priority:** Medium

**Test Steps:**
1. Navigate to "Applied Jobs" page
2. Filter "Đã từ chối" → Verify Job D hiển thị với status "Rejected"
3. Click "Xem chi tiết" trên Job D
4. Verify job detail hiển thị:
   - Badge "Đã từ chối" hoặc "Rejected"
   - Button "Ứng tuyển lại" hoặc "Apply Again"
5. Click "Ứng tuyển lại"
6. Chọn CV khác (hoặc cùng CV)
7. (Optional) Nhập cover letter mới
8. Click "Gửi đơn ứng tuyển"
9. Verify:
    - Toast success: "Ứng tuyển lại thành công"
    - Application mới được tạo (hoặc application cũ được update)
10. Navigate to "Applied Jobs" → Verify Job D có status "Pending" (application mới)

**Expected Results:**
- Có thể apply lại job đã bị reject
- Application mới được tạo (hoặc update application cũ)
- Status update thành "Pending"
- CV mới được link với application mới

---

## TC-SYS-JOB-APPLY-007: Apply Expired Job (Negative Test)
**Description:** Không thể apply job đã hết hạn  
**Pre-conditions:** Đã login, có 1 job đã expired (deadline < today)  
**Priority:** Low

**Test Steps:**
1. Navigate to job detail page của expired job
2. Verify job detail hiển thị:
   - Badge "Đã hết hạn" hoặc "Expired"
   - Deadline < today
3. Verify button "Ứng tuyển":
   - Disabled với tooltip "Công việc này đã hết hạn"
   - Hoặc không hiển thị
4. (Nếu button vẫn hiển thị) Click "Ứng tuyển"
5. Verify:
   - Error toast: "Công việc này đã hết hạn ứng tuyển"
   - Hoặc modal không mở

**Expected Results:**
- Expired job không thể apply
- UI hiển thị rõ ràng job đã expired
- Error message rõ ràng nếu user cố apply

---

## TC-SYS-JOB-APPLY-008: Apply Job - No CV Available
**Description:** Không thể apply khi chưa có CV nào  
**Pre-conditions:** Đã login, chưa có CV online và uploaded  
**Priority:** Low

**Test Steps:**
1. Navigate to job detail page
2. Click "Ứng tuyển"
3. Verify apply modal mở
4. Verify:
   - Option "CV Online" disabled hoặc không có CV trong dropdown
   - Option "CV Uploaded" disabled hoặc không có CV
   - Warning message: "Bạn chưa có CV. Vui lòng tạo CV hoặc tải CV lên trước"
5. Có link "Tạo CV ngay" hoặc "Tải CV lên"
6. Click link → Verify navigate to CV Management page

**Expected Results:**
- Apply modal hiển thị warning khi chưa có CV
- Options disabled hoặc không có CV
- Có hướng dẫn user tạo/upload CV
- Link navigate đúng đến CV Management

---

## SUMMARY

**Total Test Cases:** 8  
**Priority Distribution:**
- High: 4 test cases (Apply with Online CV, Apply with Uploaded CV, Upload & Apply, View Applied Jobs)
- Medium: 2 test cases (Filter by Status, Re-apply)
- Low: 2 test cases (Expired Job, No CV Available)

**Key Test Areas:**
- Apply job với các loại CV khác nhau (Online, Uploaded, New Upload)
- View và manage applied jobs list
- Filter applications theo status
- Re-apply job after rejection
- Error handling (expired job, no CV)

**Test Execution Notes:**
- Cần data test: jobs với các status khác nhau, expired jobs
- Cần CVs: Online CVs, Uploaded CVs
- Verify data consistency giữa job detail, applied jobs và recruiter view
- Test cả positive và negative scenarios












