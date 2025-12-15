# UI TEST CASES - JOB MANAGEMENT (RECRUITER)

Format per case: **Description** | **Procedure** | **Expected Result**  
Pre-conditions: User must be logged in as recruiter with verified company.

---

## 1) POST JOB (Tạo Job Mới)

- **TC-POST-JOB-SUCCESS**  
  Description: Tạo job mới thành công với đầy đủ thông tin.  
  Procedure:  
  - Login as recruiter  
  - Navigate to job posting page (`/recruiter/job-posting`)  
  - Fill all required fields: job title, description, requirements, category, location, salary, etc.  
  - Select tags (optional)  
  - Click "Đăng bài" button  
  Expected Result:  
  - Toast success: "Đăng bài thành công"  
  - Job appears in job list  
  - Job status is active (visible to candidates)  
  - API `POST /api/app/job-post` called with bearer token

- **TC-POST-JOB-VALIDATION-REQUIRED**  
  Description: Validation khi thiếu thông tin bắt buộc.  
  Procedure:  
  - Open job posting form  
  - Leave required fields empty (job title, category, location)  
  - Click "Đăng bài"  
  Expected Result:  
  - Error messages shown for empty required fields  
  - Form không submit  
  - API không được gọi

- **TC-POST-JOB-VALIDATION-DEADLINE**  
  Description: Validation deadline không được trong quá khứ.  
  Procedure:  
  - Fill form  
  - Set application deadline là ngày trong quá khứ  
  - Click "Đăng bài"  
  Expected Result:  
  - Error message: "Deadline không được trong quá khứ"  
  - Form không submit

- **TC-POST-JOB-SALARY-DEAL**  
  Description: Tạo job với mức lương "Thỏa thuận".  
  Procedure:  
  - Fill form  
  - Check "Thỏa thuận" cho salary  
  - Leave salary min/max empty  
  - Submit  
  Expected Result:  
  - Job created with `salaryDeal = true`  
  - Salary min/max = null  
  - Job displays "Thỏa thuận" in salary field

- **TC-POST-JOB-WITH-TAGS**  
  Description: Tạo job với tags.  
  Procedure:  
  - Fill form  
  - Select parent category  
  - Select child category  
  - Select multiple tags from available tags  
  - Submit  
  Expected Result:  
  - Tags được lưu với job  
  - API `POST /api/app/job-tag/update-tag-of-job` called after job creation  
  - Tags hiển thị trên job detail

- **TC-POST-JOB-PREVIEW**  
  Description: Xem preview job trước khi đăng.  
  Procedure:  
  - Fill form  
  - Click "Xem trước" button  
  Expected Result:  
  - Preview modal hiển thị  
  - Job preview shows all entered information  
  - Modal có thể đóng

- **TC-POST-JOB-NO-COMPANY-INFO**  
  Description: Tạo job khi chưa có thông tin công ty.  
  Procedure:  
  - Login as recruiter without company legal info  
  - Navigate to job posting  
  Expected Result:  
  - Warning/error message shown  
  - Form disabled hoặc redirect to company info page  
  - Cannot create job without company info

- **TC-POST-JOB-NETWORK-ERROR**  
  Description: Xử lý lỗi network khi tạo job.  
  Procedure:  
  - Fill form  
  - Disconnect network  
  - Click "Đăng bài"  
  Expected Result:  
  - Error toast: "Đăng bài thất bại"  
  - Form data retained  
  - Can retry after network restored

---

## 2) CLOSE JOB (Đóng Job - Để Private)

- **TC-CLOSE-JOB-SUCCESS**  
  Description: Đóng job thành công (chuyển sang private).  
  Procedure:  
  - Login as recruiter  
  - Navigate to job management page (campaign-job-management)  
  - Find active job  
  - Click actions menu (3 dots)  
  - Click "Đóng bài" / "Close job"  
  Expected Result:  
  - Confirmation modal appears (nếu có)  
  - Job status changes to closed/inactive  
  - Job không còn hiển thị cho candidates  
  - Toast success: "Đã đóng bài thành công"  
  - API `POST /api/app/job-post/{id}/close-job-post` called

- **TC-CLOSE-JOB-CONFIRMATION**  
  Description: Xác nhận trước khi đóng job.  
  Procedure:  
  - Click "Đóng bài"  
  - Confirm trong modal  
  Expected Result:  
  - Modal hiển thị thông tin job  
  - Có nút "Xác nhận" và "Hủy"  
  - Click "Hủy" → Modal đóng, job không thay đổi  
  - Click "Xác nhận" → Job được đóng

- **TC-CLOSE-JOB-ALREADY-CLOSED**  
  Description: Đóng job đã đóng rồi.  
  Procedure:  
  - Find closed job  
  - Click actions menu  
  Expected Result:  
  - Option "Đóng bài" không hiển thị hoặc disabled  
  - Hoặc hiển thị "Mở lại" option

- **TC-CLOSE-JOB-REOPEN**  
  Description: Mở lại job đã đóng (nếu có chức năng).  
  Procedure:  
  - Find closed job  
  - Click "Mở lại" / "Reopen"  
  Expected Result:  
  - Job status changes to active  
  - Job hiển thị lại cho candidates  
  - Toast success shown

- **TC-CLOSE-JOB-UNAUTHORIZED**  
  Description: Đóng job không thuộc về recruiter.  
  Procedure:  
  - Login as recruiter A  
  - Try to close job của recruiter B (nếu có cách access)  
  Expected Result:  
  - 403 Forbidden error  
  - Error toast shown  
  - Job không thay đổi

- **TC-CLOSE-JOB-NETWORK-ERROR**  
  Description: Xử lý lỗi network khi đóng job.  
  Procedure:  
  - Click "Đóng bài"  
  - Disconnect network  
  - Confirm  
  Expected Result:  
  - Error toast: "Đóng bài thất bại"  
  - Job status không thay đổi  
  - Can retry

---

## 3) UPDATE JOB (Cập Nhật Job)

- **TC-UPDATE-JOB-SUCCESS**  
  Description: Cập nhật job thành công.  
  Procedure:  
  - Login as recruiter  
  - Navigate to job posting page với jobId trong URL (`/recruiter/job-posting?jobId=xxx`)  
  - Form tự động load job data  
  - Modify một số fields (title, description, salary, etc.)  
  - Click "Cập nhật" button  
  Expected Result:  
  - Toast success: "Cập nhật thành công"  
  - Job data updated in database  
  - Changes reflected in job list/detail  
  - API `PUT /api/app/job-post` called with updated data

- **TC-UPDATE-JOB-LOAD-DATA**  
  Description: Load job data khi vào edit mode.  
  Procedure:  
  - Navigate to `/recruiter/job-posting?jobId=xxx`  
  - Wait for form to load  
  Expected Result:  
  - Form fields populated with job data  
  - Category, tags, location, salary loaded correctly  
  - Loading indicator shown during load  
  - Toast: "Đã tải thông tin công việc" (nếu có)

- **TC-UPDATE-JOB-VALIDATION**  
  Description: Validation khi update với data không hợp lệ.  
  Procedure:  
  - Load job data  
  - Clear required fields  
  - Click "Cập nhật"  
  Expected Result:  
  - Validation errors shown  
  - Form không submit  
  - API không được gọi

- **TC-UPDATE-JOB-TAGS**  
  Description: Cập nhật tags của job.  
  Procedure:  
  - Load job với existing tags  
  - Remove một số tags  
  - Add tags mới  
  - Submit  
  Expected Result:  
  - Tags được update  
  - API `POST /api/app/job-tag/update-tag-of-job` called  
  - New tags hiển thị trên job detail

- **TC-UPDATE-JOB-CATEGORY-CHANGE**  
  Description: Thay đổi category của job.  
  Procedure:  
  - Load job  
  - Change parent/child category  
  - Submit  
  Expected Result:  
  - Category updated  
  - Tags list reloaded based on new category  
  - Old tags cleared (nếu không thuộc category mới)

- **TC-UPDATE-JOB-SALARY-CHANGE**  
  Description: Thay đổi từ salary range sang "Thỏa thuận" hoặc ngược lại.  
  Procedure:  
  - Load job với salary range  
  - Check "Thỏa thuận"  
  - Submit  
  Expected Result:  
  - Salary updated to "Thỏa thuận"  
  - Salary min/max cleared  
  - Job displays "Thỏa thuận"

- **TC-UPDATE-JOB-NOT-FOUND**  
  Description: Update job không tồn tại.  
  Procedure:  
  - Navigate to `/recruiter/job-posting?jobId=invalid-id`  
  Expected Result:  
  - Error toast: "Không tìm thấy công việc"  
  - Form shows empty hoặc redirect  
  - 404 error from API

- **TC-UPDATE-JOB-UNAUTHORIZED**  
  Description: Update job không thuộc về recruiter.  
  Procedure:  
  - Login as recruiter A  
  - Try to update job của recruiter B  
  Expected Result:  
  - 403 Forbidden error  
  - Error toast shown  
  - Cannot update job

- **TC-UPDATE-JOB-NETWORK-ERROR**  
  Description: Xử lý lỗi network khi update.  
  Procedure:  
  - Make changes  
  - Disconnect network  
  - Click "Cập nhật"  
  Expected Result:  
  - Error toast: "Cập nhật thất bại"  
  - Form data retained  
  - Can retry

---

## 4) DELETE JOB (Xóa Job)

- **TC-DELETE-JOB-SUCCESS**  
  Description: Xóa job thành công.  
  Procedure:  
  - Login as recruiter  
  - Navigate to job management page  
  - Find job to delete  
  - Click actions menu (3 dots)  
  - Click "Xóa" / "Delete"  
  - Confirm trong delete modal  
  Expected Result:  
  - Delete confirmation modal appears  
  - Modal shows job title/info  
  - Click "Xác nhận" → Job deleted  
  - Job removed from list  
  - Toast success: "Đã xóa công việc thành công"  
  - API `DELETE /api/app/job-post/{id}` called

- **TC-DELETE-JOB-CONFIRMATION-CANCEL**  
  Description: Hủy xóa job.  
  Procedure:  
  - Click "Xóa"  
  - Click "Hủy" trong confirmation modal  
  Expected Result:  
  - Modal closes  
  - Job không bị xóa  
  - Job vẫn hiển thị trong list

- **TC-DELETE-JOB-CONFIRMATION-CLOSE**  
  Description: Đóng confirmation modal bằng X button.  
  Procedure:  
  - Click "Xóa"  
  - Click X button để đóng modal  
  Expected Result:  
  - Modal closes  
  - Job không bị xóa

- **TC-DELETE-JOB-DOUBLE-CLICK**  
  Description: Ngăn double click khi đang xóa.  
  Procedure:  
  - Click "Xóa" → Confirm  
  - Click "Xác nhận" nhiều lần nhanh  
  Expected Result:  
  - Chỉ 1 request được gửi  
  - Button disabled trong khi xóa  
  - Loading indicator shown

- **TC-DELETE-JOB-WITH-APPLICATIONS**  
  Description: Xóa job đã có applications.  
  Procedure:  
  - Find job có applications  
  - Click "Xóa"  
  - Confirm  
  Expected Result:  
  - Job deleted (hoặc soft delete)  
  - Applications có thể được giữ lại hoặc xóa theo business logic  
  - Toast success/error based on result

- **TC-DELETE-JOB-UNAUTHORIZED**  
  Description: Xóa job không thuộc về recruiter.  
  Procedure:  
  - Login as recruiter A  
  - Try to delete job của recruiter B  
  Expected Result:  
  - 403 Forbidden error  
  - Error toast: "Không có quyền xóa công việc này"  
  - Job không bị xóa

- **TC-DELETE-JOB-NOT-FOUND**  
  Description: Xóa job không tồn tại.  
  Procedure:  
  - Try to delete job với ID không tồn tại  
  Expected Result:  
  - 404 Not Found error  
  - Error toast shown  
  - No crash

- **TC-DELETE-JOB-NETWORK-ERROR**  
  Description: Xử lý lỗi network khi xóa.  
  Procedure:  
  - Click "Xóa" → Confirm  
  - Disconnect network  
  Expected Result:  
  - Error toast: "Xóa công việc thất bại"  
  - Job không bị xóa  
  - Modal closes  
  - Can retry

---

## 5) AUTHENTICATION & AUTHORIZATION

- **TC-AUTH-NOT-LOGIN**  
  Description: Truy cập job management khi chưa login.  
  Procedure:  
  - Logout  
  - Navigate to job posting/management page  
  Expected Result:  
  - Redirect to login page  
  - Cannot access job management

- **TC-AUTH-NOT-RECRUITER**  
  Description: Candidate/Employee truy cập job management.  
  Procedure:  
  - Login as candidate/employee  
  - Navigate to job posting page  
  Expected Result:  
  - 403 Forbidden hoặc redirect  
  - Cannot access job management

- **TC-AUTH-TOKEN-EXPIRED**  
  Description: Token hết hạn khi đang thao tác.  
  Procedure:  
  - Login và làm việc  
  - Let token expire  
  - Try to post/update/delete job  
  Expected Result:  
  - 401 Unauthorized error  
  - Prompt to login again  
  - Form data retained (nếu có thể)

---

## 6) UI/UX & LOADING STATES

- **TC-UI-LOADING-SUBMIT**  
  Description: Hiển thị loading khi submit.  
  Procedure:  
  - Fill form  
  - Click "Đăng bài" / "Cập nhật"  
  Expected Result:  
  - Button shows loading state  
  - Button disabled during submit  
  - Loading spinner/indicator visible

- **TC-UI-LOADING-DATA**  
  Description: Hiển thị loading khi load job data.  
  Procedure:  
  - Navigate to edit mode  
  - Wait for data load  
  Expected Result:  
  - Loading indicator shown  
  - Form disabled during load  
  - Data appears after load complete

- **TC-UI-TOAST-NOTIFICATION**  
  Description: Toast notifications hiển thị đúng.  
  Procedure:  
  - Perform any action (post/update/delete/close)  
  Expected Result:  
  - Toast appears với correct message và type  
  - Toast auto-hides sau vài giây  
  - Can manually close toast

- **TC-UI-FORM-RESET**  
  Description: Form reset sau khi submit thành công (create mode).  
  Procedure:  
  - Create job successfully  
  - Check form state  
  Expected Result:  
  - Form cleared/reset  
  - All fields back to default  
  - Ready for next job creation

- **TC-UI-RESPONSIVE**  
  Description: Form responsive trên mobile/tablet.  
  Procedure:  
  - Open job posting form trên mobile/tablet  
  - Fill form, scroll, submit  
  Expected Result:  
  - Layout fits screen  
  - Fields usable on touch devices  
  - Buttons tappable  
  - Modal displays correctly

---

## Quick Notes
- Chỉ recruiter đã verify company mới có thể post job.  
- Job phải có category, location, title, description (required fields).  
- Close job = set `isActive = false` (job không hiển thị cho candidates).  
- Delete job = xóa vĩnh viễn (hoặc soft delete tùy implementation).  
- Update job cần load data từ API trước khi edit.  
- Tất cả actions cần bearer token trong request headers.









