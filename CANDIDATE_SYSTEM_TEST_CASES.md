# SYSTEM TEST CASES - CANDIDATE (VCAREER)

**Test Level:** System Test (End-to-End, Black Box Testing)  
**Focus:** User Journeys & Business Scenarios  
**Role:** CANDIDATE

## 📋 LƯU Ý QUAN TRỌNG

**System Test KHÔNG test:**
- ❌ Từng UI component/button/field riêng lẻ (đó là UI test)
- ❌ Từng API endpoint riêng lẻ (đó là API test)
- ❌ Integration giữa 2-3 modules (đó là Integration test)

**System Test TẬP TRUNG VÀO:**
- ✅ **User Journeys hoàn chỉnh** (từ đầu đến cuối)
- ✅ **Business Scenarios thực tế** (use cases của người dùng)
- ✅ **System behavior như một tổng thể** (black box testing)
- ✅ **End-to-end workflows** (user experience)

**Giả định:**
- UI components đã được test ở UI test
- API endpoints đã được test ở API test
- Integration giữa modules đã được test ở Integration test
- System test chỉ verify system hoạt động đúng từ góc độ người dùng cuối

**Lưu ý về các chức năng cơ bản (Login, Logout, Search, etc.):**
- System Test **VẪN CẦN** test các chức năng này
- Nhưng test trong **context của user journeys**, không test riêng lẻ
- Ví dụ: Không test "Login API trả về token" (đó là Integration test)
- Mà test "User login → Tìm job → Apply → Logout → Login lại → Vẫn thấy applied jobs" (đó là System test)

---

## 1. AUTHENTICATION & SESSION MANAGEMENT (Basic Functions in Context)

### TC-SYS-CAND-AUTH-001: Login → Use System → Logout → Login Again Journey
**Scenario:** User login, sử dụng hệ thống, logout và login lại để verify session persistence  
**Pre-conditions:** Đã có tài khoản candidate với email: candidate@test.com, password: Test123!@#  
**Test Steps:**
1. Navigate to `/candidate/login`
2. Verify login page hiển thị đúng (email field, password field, login button)
3. Nhập email: `candidate@test.com`
4. Nhập password: `Test123!@#`
5. Click "Đăng nhập"
6. Verify:
   - Loading indicator hiển thị trong khi đang login
   - Redirect to homepage (`/` hoặc `/home`)
   - User info hiển thị trên header (fullName, avatar nếu có)
   - Toast success: "Đăng nhập thành công" (nếu có)
7. Tìm kiếm job với keyword "Java Developer"
8. Verify search results hiển thị
9. Lưu 2 jobs vào "Saved Jobs":
   - Job A: Click icon bookmark trên job card → Verify icon fill/change color
   - Job B: Click icon bookmark trên job card → Verify icon fill/change color
10. Verify toast: "Đã lưu công việc" (nếu có)
11. Navigate to "Saved Jobs" page (`/candidate/save-jobs`)
12. Verify 2 jobs hiển thị trong list với đúng thông tin (title, company, location)
13. Apply 1 job:
    - Navigate to job detail của Job A
    - Click "Ứng tuyển"
    - Chọn CV online từ dropdown
    - Nhập cover letter: "Tôi rất quan tâm đến vị trí này"
    - Click "Gửi đơn ứng tuyển"
    - Verify toast success: "Ứng tuyển thành công"
    - Verify button "Ứng tuyển" đổi thành "Đã ứng tuyển" hoặc "Ứng tuyển lại"
14. Navigate to "Applied Jobs" page (`/candidate/applied-jobs`)
15. Verify Job A xuất hiện trong list với:
    - Status: "Pending" hoặc "Chờ phản hồi"
    - Applied date hiển thị đúng
    - Có thể click "Xem chi tiết"
16. Update profile:
    - Navigate to `/candidate/profile`
    - Verify profile data hiển thị đầy đủ
    - Sửa fullName từ "Nguyễn Văn A" → "Nguyễn Văn B"
    - Click "Lưu thay đổi"
    - Verify toast success: "Cập nhật profile thành công"
    - Verify fullName mới hiển thị trên header
17. Logout:
    - Click avatar/username trên header
    - Click "Đăng xuất"
    - Verify redirect to login page hoặc homepage
    - Verify user info không còn hiển thị trên header
18. Login lại với cùng tài khoản:
    - Navigate to `/candidate/login`
    - Nhập email: `candidate@test.com`
    - Nhập password: `Test123!@#`
    - Click "Đăng nhập"
19. Verify sau khi login lại:
    - Redirect to homepage
    - Navigate to "Saved Jobs" → Verify 2 jobs vẫn còn (Job A và Job B)
    - Navigate to "Applied Jobs" → Verify Job A vẫn còn với status "Pending"
    - Navigate to "Profile" → Verify fullName vẫn là "Nguyễn Văn B" (đã update)
    - Verify header hiển thị fullName mới: "Nguyễn Văn B"

**Expected Results:**
- Login thành công, redirect to homepage đúng
- Search job hoạt động và trả về kết quả
- Save job hoạt động, jobs được lưu vào database
- Apply job thành công, application được tạo
- Update profile thành công, data được lưu
- Logout thành công, session được clear
- Login lại thành công
- **Tất cả data được persist:** Saved jobs, Applied jobs, Profile updates đều còn sau logout/login
- Session được manage đúng, không mất data
- User có thể tiếp tục workflow sau khi login lại

**Post-conditions:** User đã login lại, tất cả data trước đó vẫn còn nguyên

---

### TC-SYS-CAND-AUTH-002: Forgot Password → Reset → Login Journey
**Scenario:** User quên mật khẩu, reset và login lại thành công  
**Pre-conditions:** Đã có tài khoản với email: candidate@test.com, password cũ: OldPass123!@#  
**Test Steps:**
1. Navigate to `/candidate/login`
2. Click link "Quên mật khẩu?" hoặc navigate to `/candidate/forget-password`
3. Verify forgot password page hiển thị:
   - Email input field
   - Button "Gửi OTP" hoặc "Gửi mã xác nhận"
4. Nhập email: `candidate@test.com`
5. Click "Gửi OTP"
6. Verify:
   - Loading indicator hiển thị
   - Toast success: "OTP đã được gửi đến email của bạn" (nếu có)
   - Redirect to verify OTP page (`/candidate/verify-otp`) hoặc OTP input hiển thị
7. Kiểm tra email (hoặc SMS) → Lấy OTP code (ví dụ: 123456)
8. Nhập OTP code vào form
9. Click "Xác nhận" hoặc "Verify"
10. Verify:
    - OTP được verify thành công
    - Redirect to reset password page (`/candidate/reset-password`)
    - Hoặc form reset password hiển thị
11. Nhập password mới: `NewPass123!@#`
12. Nhập confirm password: `NewPass123!@#`
13. Verify:
    - Password validation pass (>= 8 ký tự, có chữ hoa, số, ký tự đặc biệt nếu có rule)
    - Confirm password match
14. Click "Đặt lại mật khẩu" hoặc "Reset Password"
15. Verify:
    - Loading indicator hiển thị
    - Toast success: "Đặt lại mật khẩu thành công"
    - Redirect to login page
16. Thử login với password cũ:
    - Navigate to `/candidate/login`
    - Nhập email: `candidate@test.com`
    - Nhập password cũ: `OldPass123!@#`
    - Click "Đăng nhập"
    - Verify error: "Email hoặc mật khẩu không đúng"
17. Login với password mới:
    - Nhập email: `candidate@test.com`
    - Nhập password mới: `NewPass123!@#`
    - Click "Đăng nhập"
    - Verify login thành công
    - Redirect to homepage
18. Verify có thể sử dụng hệ thống bình thường:
    - Navigate to profile → Verify có thể xem profile
    - Search job → Verify có thể search
    - Xem job detail → Verify có thể xem
    - Apply job (nếu có CV) → Verify có thể apply
    - Tất cả chức năng hoạt động bình thường

**Expected Results:**
- Forgot password flow hoạt động đúng
- OTP được gửi đến email/SMS
- OTP verification thành công
- Reset password thành công
- Password cũ không còn hoạt động (verify bằng cách thử login)
- Password mới hoạt động đúng
- Login với password mới thành công
- User có thể sử dụng tất cả chức năng sau khi login
- Session được tạo đúng sau login

**Post-conditions:** User đã reset password và login thành công với password mới

---

### TC-SYS-CAND-AUTH-003: Session Expiration During Workflow
**Scenario:** Session hết hạn trong khi user đang thao tác  
**Pre-conditions:** Đã login, đang fill form apply job  
**Test Steps:**
1. Login và bắt đầu apply job (đã chọn CV, đang nhập cover letter)
2. Đợi session expire (hoặc manually expire)
3. Submit form apply
4. Verify redirect to login
5. Login lại
6. Kiểm tra form data có được preserve không (tùy design)

**Expected Results:**
- Session expiration được detect
- User được redirect to login
- Form data được preserve hoặc clear (tùy design)
- Sau khi login lại, có thể tiếp tục hoặc phải làm lại

---

## 2. PROFILE MANAGEMENT (Basic Functions in Context)

### TC-SYS-CAND-PROF-001: Update Profile → Impact on Job Suggestions
**Scenario:** Update profile và kiểm tra job suggestions thay đổi  
**Pre-conditions:** Đã login, profile location hiện tại: "Hà Nội", experience level: "1-3 years", có job suggestion settings đã bật  
**Test Steps:**
1. Navigate to homepage (`/` hoặc `/home`)
2. Scroll xuống phần "Gợi ý việc làm cho bạn" hoặc "Job Suggestions"
3. Verify job suggestions hiện tại hiển thị:
   - Có ít nhất 3-5 jobs được suggest
   - Jobs có location "Hà Nội" (hoặc nearby)
   - Jobs phù hợp với experience level "1-3 years"
   - Ghi nhận job IDs của suggestions hiện tại (ví dụ: Job 1, Job 2, Job 3)
4. Navigate to profile page (`/candidate/profile`)
5. Verify profile page hiển thị:
   - Form với các fields: fullName, email, phone, dateOfBirth, gender, address, location
   - Toggle "Cho phép tìm kiếm việc làm"
   - Toggle "Cho phép nhà tuyển dụng tìm kiếm"
6. Update location:
   - Click location dropdown
   - Chọn "TP.HCM" thay vì "Hà Nội"
   - Verify location field update thành "TP.HCM"
7. Update experience level (nếu có field này trong profile):
   - Click experience dropdown
   - Chọn "3-5 years" thay vì "1-3 years"
   - Verify experience field update thành "3-5 years"
8. Click "Lưu thay đổi" hoặc "Save"
9. Verify:
   - Loading indicator hiển thị
   - Toast success: "Cập nhật profile thành công"
   - Profile data được refresh và hiển thị location mới: "TP.HCM"
10. Navigate lại về homepage
11. Verify job suggestions đã update:
    - Scroll xuống phần "Gợi ý việc làm cho bạn"
    - Verify loading indicator hiển thị khi đang load suggestions mới
    - Verify suggestions mới hiển thị:
      - Jobs có location "TP.HCM" (hoặc nearby)
      - Jobs phù hợp với experience level "3-5 years"
      - Job IDs khác với suggestions cũ (Job 1, Job 2, Job 3 không còn hoặc ít hơn)
12. Verify suggestions phù hợp:
    - Click vào một job suggestion mới (Job X)
    - Verify job detail hiển thị location "TP.HCM" hoặc nearby
    - Verify job yêu cầu experience "3-5 years" hoặc tương đương
13. Apply job từ suggestions:
    - Từ job detail của Job X
    - Click "Ứng tuyển"
    - Chọn CV online
    - Nhập cover letter
    - Click "Gửi đơn ứng tuyển"
14. Verify application thành công:
    - Toast success: "Ứng tuyển thành công"
    - Job X xuất hiện trong "Applied Jobs"
    - Status: "Pending"

**Expected Results:**
- Profile page hiển thị đầy đủ form và toggles
- Update location thành công, data được lưu
- Update experience level thành công (nếu có field)
- Toast success hiển thị sau khi save
- Job suggestions được refresh sau khi update profile
- Suggestions mới phù hợp với location mới ("TP.HCM")
- Suggestions mới phù hợp với experience level mới ("3-5 years")
- Có thể apply job từ suggestions mới
- Application được tạo thành công
- Data consistent giữa profile settings và job suggestions

---

### TC-SYS-CAND-PROF-002: Profile Visibility Toggle → Recruiter Search Impact
**Scenario:** Toggle profile visibility và verify impact lên recruiter search  
**Pre-conditions:** Đã có profile đầy đủ, CV public  
**Test Steps:**
1. Set "Allow Recruiter Search" = true
2. Verify recruiter có thể search và thấy candidate
3. Set "Allow Recruiter Search" = false
4. Verify recruiter không còn thấy candidate trong search
5. Set lại = true
6. Verify recruiter thấy lại candidate

**Expected Results:**
- Toggle hoạt động đúng
- Recruiter search reflect settings
- Privacy được đảm bảo
- Real-time hoặc near-real-time update

---

## 3. JOB SEARCH (Basic Functions in Context)

### TC-SYS-CAND-SEARCH-001: Search Job → Filter → Apply → Track Journey
**Scenario:** Complete search workflow từ search đến apply và track  
**Pre-conditions:** Đã login với tài khoản có ít nhất 1 CV online, hệ thống có ít nhất 10 jobs với keyword "Java"  
**Test Steps:**
1. Navigate to homepage (`/` hoặc `/home`)
2. Verify homepage hiển thị:
   - Search box ở hero section
   - Category filter dropdown
   - Location filter dropdown
   - Job listings section
3. Search job với keyword "Java Developer":
   - Nhập "Java Developer" vào search box
   - Click "Tìm kiếm" hoặc Enter
   - Verify loading indicator hiển thị
4. Verify search results:
   - Danh sách jobs hiển thị (ít nhất 1 job)
   - Mỗi job card hiển thị: title, company name, location, salary, posted date
   - Jobs có chứa keyword "Java" trong title hoặc description
5. Filter theo category "Công nghệ thông tin":
   - Click category dropdown
   - Chọn "Công nghệ thông tin" hoặc expand category tree và chọn
   - Verify filter được apply (category được highlight hoặc hiển thị trong active filters)
   - Verify job list được filter lại
   - Verify chỉ còn jobs thuộc category "Công nghệ thông tin"
6. Filter theo location "Hà Nội":
   - Click location dropdown
   - Chọn "Hà Nội" từ province list
   - Verify location filter được apply
   - Verify job list được filter lại
   - Verify chỉ còn jobs ở "Hà Nội"
7. Filter theo salary range "15-25 triệu":
   - Click salary filter dropdown
   - Chọn range "15-25 triệu"
   - Verify salary filter được apply
   - Verify job list được filter lại
   - Verify chỉ còn jobs có salary trong range (hoặc "Thỏa thuận" nếu có logic)
8. Verify tất cả filters combine đúng:
   - Jobs phải thỏa mãn TẤT CẢ: keyword "Java", category "Công nghệ thông tin", location "Hà Nội", salary "15-25 triệu"
   - Count số lượng jobs hiển thị (ví dụ: 5 jobs)
9. Verify pagination (nếu có > 10 jobs):
   - Scroll xuống cuối danh sách
   - Verify pagination controls hiển thị (Previous, Next, page numbers)
   - Click "Trang 2" hoặc "Next"
   - Verify jobs trang 2 được load
   - Verify URL có query param `page=2` (nếu có)
10. Sort theo "Mới nhất":
    - Click sort dropdown
    - Chọn "Mới nhất" hoặc "Newest"
    - Verify sort được apply
    - Verify jobs được sắp xếp theo posted date (mới nhất trước)
    - Verify job đầu tiên có posted date mới nhất
11. Click vào một job phù hợp (Job X):
    - Click vào job card hoặc job title
    - Verify navigate to job detail page (`/candidate/job-detail/{jobId}`)
12. Verify job detail page hiển thị đầy đủ:
    - Job title, company name, company logo
    - Location (province, district nếu có)
    - Salary range hoặc "Thỏa thuận"
    - Job description (full text)
    - Requirements
    - Benefits
    - Application deadline
    - Button "Ứng tuyển" hoặc "Apply"
    - Button "Lưu" hoặc bookmark icon
    - Related jobs section (nếu có)
13. Apply job với CV:
    - Click "Ứng tuyển"
    - Verify modal apply mở
    - Verify có 2 options: "CV Online" và "CV Uploaded"
    - Chọn "CV Online"
    - Verify dropdown CV list hiển thị (ít nhất 1 CV)
    - Chọn một CV từ dropdown
    - Nhập cover letter: "Tôi rất quan tâm đến vị trí Java Developer này"
    - Click "Gửi đơn ứng tuyển"
    - Verify loading indicator hiển thị
14. Verify apply thành công:
    - Toast success: "Ứng tuyển thành công"
    - Modal đóng
    - Button "Ứng tuyển" đổi thành "Đã ứng tuyển" hoặc "Ứng tuyển lại"
    - Badge "Đã ứng tuyển" hiển thị trên job card (nếu có)
15. Navigate to "Applied Jobs" page (`/candidate/applied-jobs`)
16. Verify Job X xuất hiện trong applied jobs list:
    - Job title đúng
    - Company name đúng
    - Status: "Pending" hoặc "Chờ phản hồi"
    - Applied date hiển thị (ngày hôm nay)
    - Có button "Xem chi tiết"
    - Có button "Xem CV đã gửi"
17. Click "Xem CV đã gửi":
    - Verify CV detail page mở hoặc CV preview hiển thị
    - Verify CV đúng với CV đã chọn khi apply
    - Verify có thể xem đầy đủ thông tin CV
18. Search lại với cùng filters:
    - Quay lại homepage
    - Search "Java Developer"
    - Apply cùng filters: category "Công nghệ thông tin", location "Hà Nội", salary "15-25 triệu"
    - Verify Job X:
      - Không còn trong kết quả (nếu logic ẩn jobs đã apply)
      - Hoặc vẫn còn nhưng có badge "Đã ứng tuyển" (nếu logic hiển thị)
      - Hoặc button "Ứng tuyển" đổi thành "Ứng tuyển lại"

**Expected Results:**
- Search hoạt động và trả về kết quả phù hợp với keyword
- Category filter hoạt động đúng, chỉ hiển thị jobs trong category đã chọn
- Location filter hoạt động đúng, chỉ hiển thị jobs ở location đã chọn
- Salary filter hoạt động đúng, chỉ hiển thị jobs trong salary range
- Tất cả filters combine đúng (AND logic), jobs phải thỏa mãn tất cả điều kiện
- Pagination hoạt động nếu có nhiều kết quả
- Sort hoạt động đúng, jobs được sắp xếp theo tiêu chí đã chọn
- Job detail hiển thị đầy đủ thông tin
- Apply job thành công, application được tạo
- Applied jobs list hiển thị job đã apply với status đúng
- CV đã gửi có thể xem lại từ applied jobs
- Search results update sau khi apply (job đã apply có badge hoặc bị ẩn)

**Post-conditions:** Job X đã được apply, xuất hiện trong applied jobs với status "Pending"

---

### TC-SYS-CAND-SEARCH-002: Search → Save → Apply from Saved Journey
**Scenario:** Search, save jobs, apply từ saved list  
**Pre-conditions:** Đã login  
**Test Steps:**
1. Search job với keyword
2. Lưu 3 jobs vào "Saved Jobs"
3. Navigate to "Saved Jobs" page
4. Verify 3 jobs hiển thị đúng
5. Click "Xem chi tiết" trên một saved job
6. Apply job từ detail page
7. Verify job bị xóa khỏi "Saved Jobs" (hoặc vẫn còn với status "Đã apply")
8. Verify job xuất hiện trong "Applied Jobs"

**Expected Results:**
- Search và save hoạt động
- Saved jobs list hiển thị đúng
- Apply từ saved job thành công
- Data sync giữa saved và applied jobs

---

## 4. USER JOURNEY: CANDIDATE REGISTRATION & ONBOARDING

### TC-SYS-CAND-001: Complete Registration & First Job Application Journey
**Scenario:** Candidate mới đăng ký, hoàn thiện profile, tạo CV và apply job đầu tiên  
**Pre-conditions:** Chưa có tài khoản  
**Test Steps:**
1. Đăng ký tài khoản candidate mới với email/password hợp lệ
2. Login lần đầu
3. Hoàn thiện profile: fullName, phone, dateOfBirth, address
4. Upload avatar
5. Tạo CV online đầu tiên với đầy đủ thông tin
6. Tìm kiếm job phù hợp (keyword + category + location)
7. Xem job detail
8. Apply job với CV vừa tạo
9. Kiểm tra job xuất hiện trong "Applied Jobs" với status "Pending"
10. Kiểm tra recruiter có thể thấy application trong hệ thống

**Expected Results:**
- Tài khoản được tạo và verify thành công
- Profile được lưu đầy đủ
- CV được tạo và set làm default
- Job search trả về kết quả phù hợp
- Application được tạo thành công
- Data consistent giữa candidate view và recruiter view
- Email notification được gửi (nếu có)

**Post-conditions:** Candidate đã có tài khoản, profile, CV và 1 application pending

---

### TC-SYS-CAND-002: Registration → Profile → Multiple CVs → Multiple Applications
**Scenario:** Candidate tạo nhiều CVs và apply nhiều jobs  
**Pre-conditions:** Đã đăng ký và login  
**Test Steps:**
1. Tạo CV online thứ 2 với template khác
2. Upload CV file thứ 3
3. Đặt CV thứ 2 làm default
4. Tìm và apply 3 jobs khác nhau:
   - Job A: Apply với CV online thứ 1
   - Job B: Apply với CV uploaded
   - Job C: Apply với CV online thứ 2
5. Kiểm tra "Applied Jobs" hiển thị đúng 3 applications với CV tương ứng
6. Kiểm tra mỗi application có thể xem lại CV đã gửi

**Expected Results:**
- Tất cả CVs được lưu và quản lý đúng
- Default CV được update đúng
- 3 applications được tạo với đúng CV tương ứng
- Applied jobs list hiển thị đầy đủ và chính xác
- Mỗi application link đúng đến CV đã dùng

---

## 2. USER JOURNEY: JOB SEARCH & APPLICATION WORKFLOW

### TC-SYS-CAND-003: Complete Job Discovery & Application Flow
**Scenario:** Candidate tìm job, lưu job, apply và theo dõi status  
**Pre-conditions:** Đã login, có CV  
**Test Steps:**
1. Tìm kiếm job với keyword "Java Developer"
2. Filter theo category "Công nghệ thông tin" và location "Hà Nội"
3. Xem danh sách kết quả (pagination nếu có)
4. Lưu 2 jobs vào "Saved Jobs"
5. Xem chi tiết 1 job đã lưu
6. Apply job với CV online
7. Kiểm tra job tự động bị xóa khỏi "Saved Jobs" (hoặc vẫn còn tùy logic)
8. Kiểm tra job xuất hiện trong "Applied Jobs"
9. Filter applied jobs theo status "Pending"
10. Xem lại CV đã gửi từ applied jobs

**Expected Results:**
- Search và filter hoạt động đúng, trả về jobs phù hợp
- Saved jobs được lưu và hiển thị đúng
- Application được tạo thành công
- Data sync giữa saved jobs và applied jobs
- Applied jobs filter hoạt động đúng
- CV có thể xem lại từ application

---

### TC-SYS-CAND-004: Job Application → Status Update → Re-apply Flow
**Scenario:** Candidate apply, nhận rejection, apply lại với CV khác  
**Pre-conditions:** Đã apply job A với CV X  
**Test Steps:**
1. Recruiter reject application (simulate hoặc wait for real rejection)
2. Candidate xem applied jobs → thấy status "Rejected"
3. Candidate xem job detail → thấy "Đã từ chối"
4. Candidate tạo CV mới (CV Y) hoặc chọn CV khác
5. Candidate apply lại job A với CV Y
6. Kiểm tra application mới được tạo (hoặc application cũ được update)
7. Kiểm tra status chuyển về "Pending"

**Expected Results:**
- Status update được reflect đúng trong candidate view
- Re-apply được phép và tạo application mới
- CV mới được link đúng với application mới
- Recruiter thấy application mới trong hệ thống

---

## 3. CV MANAGEMENT (Upload CV, Xem/Sửa/Xóa CV, Set Default)

### TC-SYS-CAND-CV-001: Upload CV File - Success Journey
**Scenario:** Candidate upload CV file thành công và sử dụng để apply job  
**Pre-conditions:** Đã login as candidate, có sẵn file CV hợp lệ: `my-cv.pdf` (size < 5MB, format PDF)  
**Test Steps:**
1. Navigate to CV Management page (`/candidate/cv-management`)
2. Verify CV Management page hiển thị:
   - Section "CV Online" với danh sách CV online (nếu có)
   - Section "CV Đã Tải Lên" với danh sách CV uploaded (nếu có)
   - Button "Tải CV lên" hoặc "Upload CV"
3. Click "Tải CV lên" hoặc "Upload CV"
4. Verify upload modal mở:
   - File input field
   - Button "Chọn file" hoặc drag & drop area
   - Button "Upload" hoặc "Tải lên"
   - Button "Hủy" hoặc "Cancel"
5. Chọn file CV:
   - Click "Chọn file" hoặc drag file `my-cv.pdf` vào drop area
   - Verify file được chọn (tên file hiển thị)
   - Verify file info hiển thị: tên file, size (ví dụ: "my-cv.pdf - 2.5 MB")
6. (Optional) Nhập tên CV: "CV Backend Developer"
7. Click "Upload" hoặc "Tải lên"
8. Verify upload process:
   - Loading indicator hiển thị
   - Progress bar hiển thị (nếu có)
   - Toast: "Đang tải CV lên..." (nếu có)
9. Verify upload thành công:
   - Toast success: "Tải CV lên thành công"
   - Modal đóng
   - CV mới xuất hiện trong danh sách "CV Đã Tải Lên"
   - CV hiển thị: tên file, size, ngày upload, icon file type
10. Verify CV uploaded có các actions:
    - Button "Xem" hoặc icon eye
    - Button "Tải về" hoặc icon download
    - Button "Đổi tên" hoặc icon edit
    - Button "Xóa" hoặc icon trash
    - Button "Đặt mặc định" hoặc toggle (nếu chưa có default CV)
11. Sử dụng CV uploaded để apply job:
    - Navigate to job detail page
    - Click "Ứng tuyển"
    - Chọn "CV Uploaded"
    - Verify dropdown hiển thị CV vừa upload: "my-cv.pdf" hoặc "CV Backend Developer"
    - Chọn CV này
    - Submit apply
12. Verify apply thành công:
    - Toast success: "Ứng tuyển thành công"
    - Application được tạo
    - Navigate to "Applied Jobs"
    - Verify có thể click "Xem CV đã gửi" và xem được CV uploaded

**Expected Results:**
- Upload modal mở đúng
- File được chọn và validate đúng (size, format)
- Upload process hoạt động với loading indicator
- Upload thành công, CV được lưu vào database và cloud storage
- CV xuất hiện trong danh sách với đầy đủ thông tin
- CV có thể sử dụng để apply job
- CV có thể xem lại từ applied jobs
- File URL accessible và có thể download

**Priority:** High  
**Test Data:** File `my-cv.pdf` (size: 2.5MB, format: PDF)

---

### TC-SYS-CAND-CV-002: Upload CV - Validation Errors
**Scenario:** Upload CV với file không hợp lệ  
**Pre-conditions:** Đã login, có các file test: `large-file.pdf` (6MB), `image.jpg`, `document.txt`  
**Test Steps:**
1. Navigate to CV Management page
2. Click "Tải CV lên"
3. Test case 1: File quá lớn (> 5MB)
   - Chọn file `large-file.pdf` (6MB)
   - Verify error message: "File không được vượt quá 5MB"
   - Verify file không được chọn
   - Verify button "Upload" disabled hoặc không cho submit
4. Test case 2: File không đúng format
   - Chọn file `image.jpg`
   - Verify error message: "Chỉ chấp nhận file PDF, DOC, DOCX"
   - Verify file không được chọn
5. Test case 3: File không phải CV
   - Chọn file `document.txt`
   - Verify error message: "Chỉ chấp nhận file PDF, DOC, DOCX"
   - Verify file không được chọn
6. Test case 4: Không chọn file
   - Không chọn file, click "Upload"
   - Verify error message: "Vui lòng chọn file CV"
   - Verify modal không đóng

**Expected Results:**
- Tất cả validation errors được hiển thị đúng
- File không hợp lệ không được upload
- API không được gọi khi có validation error
- User được thông báo rõ ràng về lỗi

**Priority:** High  
**Test Data:** `large-file.pdf` (6MB), `image.jpg`, `document.txt`

---

### TC-SYS-CAND-CV-003: View Uploaded CV Detail
**Scenario:** Xem chi tiết CV uploaded với PDF viewer  
**Pre-conditions:** Đã có ít nhất 1 CV uploaded trong hệ thống  
**Test Steps:**
1. Navigate to CV Management page
2. Verify danh sách CV uploaded hiển thị
3. Click "Xem" hoặc icon eye trên một CV uploaded (CV X)
4. Verify navigate to CV view page (`/candidate/cv-management/uploaded/view/{id}`)
5. Verify CV view page hiển thị:
   - Header với tên CV
   - Button "Quay lại"
   - Button "Tải về"
   - Button "In"
   - PDF viewer với controls: zoom in/out, fit to width, previous/next page
6. Verify PDF viewer:
   - Loading indicator hiển thị khi đang load
   - PDF được render trong iframe hoặc PDF viewer
   - Có thể scroll/zoom để xem
   - Page info hiển thị: "1 / 3" (nếu PDF có nhiều trang)
7. Test zoom controls:
   - Click "Zoom In" → Verify zoom tăng (50% → 75% → 100%)
   - Click "Zoom Out" → Verify zoom giảm (100% → 75% → 50%)
   - Click "Fit to Width" → Verify PDF fit với chiều rộng màn hình
8. Test page navigation (nếu PDF có nhiều trang):
   - Click "Next Page" → Verify chuyển sang trang tiếp theo
   - Click "Previous Page" → Verify quay lại trang trước
   - Verify page info update đúng
9. Test download:
   - Click "Tải về"
   - Verify file download về máy
   - Verify tên file đúng (tên gốc hoặc tên đã đổi)
10. Test print:
    - Click "In"
    - Verify print dialog mở (hoặc PDF được mở trong print view)
11. Click "Quay lại"
12. Verify navigate về CV Management page

**Expected Results:**
- CV view page hiển thị đầy đủ
- PDF được load và render đúng
- Zoom controls hoạt động đúng
- Page navigation hoạt động (nếu có nhiều trang)
- Download hoạt động, file download về máy
- Print hoạt động (mở print dialog)
- Navigation back hoạt động đúng

**Priority:** High  
**Test Data:** CV uploaded với PDF có ít nhất 2-3 trang

---

### TC-SYS-CAND-CV-004: View Online CV Detail
**Scenario:** Xem chi tiết CV online với format template  
**Pre-conditions:** Đã có ít nhất 1 CV online trong hệ thống  
**Test Steps:**
1. Navigate to CV Management page
2. Verify danh sách CV online hiển thị
3. Click "Xem" hoặc click vào CV card trên một CV online (CV Y)
4. Verify navigate to CV view page (`/candidate/cv-management/view/{cvId}`)
5. Verify CV view page hiển thị:
   - Header với tên CV
   - Button "Quay lại"
   - Button "Sửa"
   - Button "Xóa"
   - Button "Đặt mặc định" (nếu chưa phải default)
   - Button "Xuất PDF"
   - CV content được render theo template
6. Verify CV content hiển thị đầy đủ:
   - FullName, Email, Phone, Address
   - Career Objective
   - Work Experience (nếu có)
   - Education (nếu có)
   - Skills (nếu có)
   - Projects (nếu có)
   - Certificates (nếu có)
   - Languages (nếu có)
   - Interests (nếu có)
7. Verify CV format:
   - Layout đúng theo template đã chọn
   - Font, colors, spacing đúng
   - Responsive trên mobile (nếu test trên mobile)
8. Test export to PDF:
   - Click "Xuất PDF"
   - Verify loading indicator hiển thị
   - Verify PDF được generate và download
   - Verify tên file: `{CVName}_{Date}.pdf`
   - Mở PDF → Verify content đúng với CV online
9. Click "Quay lại"
10. Verify navigate về CV Management page

**Expected Results:**
- CV view page hiển thị đầy đủ
- CV content được render đúng theo template
- Tất cả thông tin hiển thị đúng
- Export PDF hoạt động, PDF được generate và download đúng
- Navigation back hoạt động

**Priority:** High  
**Test Data:** CV online với đầy đủ thông tin (work experience, education, skills, etc.)

---

### TC-SYS-CAND-CV-005: Edit Online CV - Success Journey
**Scenario:** Sửa CV online và verify changes được lưu  
**Pre-conditions:** Đã có 1 CV online (CV Z) với thông tin cũ  
**Test Steps:**
1. Navigate to CV Management page
2. Click "Xem" trên CV Z
3. Verify CV detail page hiển thị
4. Click "Sửa" hoặc "Edit"
5. Verify navigate to edit page hoặc form edit mở
6. Verify form hiển thị với data hiện tại:
   - CVName: "CV Cũ"
   - FullName: "Nguyễn Văn A"
   - Work Experience: "Công ty X - Developer (2020-2022)"
   - Skills: "Java, Spring Boot"
7. Update các fields:
   - CVName: "CV Cũ" → "CV Mới Updated"
   - FullName: "Nguyễn Văn A" → "Nguyễn Văn B"
   - Work Experience: Thêm entry mới "Công ty Y - Senior Developer (2022-2024)"
   - Skills: "Java, Spring Boot" → "Java, Spring Boot, React, Node.js"
8. Click "Lưu thay đổi" hoặc "Save"
9. Verify save process:
   - Loading indicator hiển thị
   - Toast: "Đang lưu CV..." (nếu có)
10. Verify save thành công:
    - Toast success: "Cập nhật CV thành công"
    - Navigate về CV detail page (hoặc CV Management page)
    - CV được refresh với data mới
11. Verify changes được lưu:
    - Navigate lại về CV detail page
    - Verify CVName = "CV Mới Updated"
    - Verify FullName = "Nguyễn Văn B"
    - Verify Work Experience có entry mới
    - Verify Skills có thêm "React, Node.js"
12. Verify CV có thể dùng để apply job:
    - Navigate to job detail
    - Click "Ứng tuyển"
    - Chọn "CV Online"
    - Verify dropdown hiển thị "CV Mới Updated"
    - Apply job với CV này
    - Verify application thành công

**Expected Results:**
- Edit form hiển thị với data hiện tại
- Update fields thành công
- Save thành công, data được lưu vào database
- CV được refresh với data mới
- Changes persist sau khi reload
- CV updated có thể sử dụng để apply job
- Data consistent giữa CV detail và CV list

**Priority:** High  
**Test Data:** CV online với data cũ cần update

---

### TC-SYS-CAND-CV-006: Delete CV - Success Journey
**Scenario:** Xóa CV và verify không còn trong hệ thống  
**Pre-conditions:** Đã có ít nhất 2 CVs (1 default, 1 non-default), CV non-default chưa dùng để apply job  
**Test Steps:**
1. Navigate to CV Management page
2. Verify danh sách CVs hiển thị
3. Test case 1: Xóa CV non-default (CV A)
   - Click "Xóa" hoặc icon trash trên CV A
   - Verify confirmation modal mở:
     - Message: "Bạn có chắc muốn xóa CV này?"
     - CV name hiển thị
     - Button "Xác nhận" hoặc "Delete"
     - Button "Hủy" hoặc "Cancel"
   - Click "Xác nhận"
   - Verify delete process:
     - Loading indicator hiển thị
     - Toast: "Đang xóa CV..." (nếu có)
   - Verify delete thành công:
     - Toast success: "Xóa CV thành công"
     - Modal đóng
     - CV A không còn trong danh sách
     - Số lượng CVs giảm đi 1
4. Test case 2: Xóa CV default (CV B - đang là default)
   - Click "Xóa" trên CV B
   - Verify:
     - Error message: "Không thể xóa CV mặc định. Vui lòng đặt CV khác làm mặc định trước"
     - Hoặc button "Xóa" disabled với tooltip tương tự
     - CV B không bị xóa
5. Test case 3: Xóa CV đã dùng để apply job (CV C)
   - Click "Xóa" trên CV C (đã dùng để apply job)
   - Verify confirmation modal với warning:
     - Message: "CV này đã được dùng để ứng tuyển. Bạn có chắc muốn xóa?"
     - Hoặc message: "CV này đã được dùng để ứng tuyển. Xóa CV sẽ không ảnh hưởng đến các đơn ứng tuyển đã gửi"
   - Click "Xác nhận"
   - Verify delete thành công:
     - CV C bị xóa khỏi danh sách
     - Navigate to "Applied Jobs"
     - Verify application vẫn còn nhưng không thể xem CV detail (hoặc hiển thị "CV đã bị xóa")
6. Test case 4: Cancel delete
   - Click "Xóa" trên một CV
   - Click "Hủy" trong confirmation modal
   - Verify:
     - Modal đóng
     - CV không bị xóa
     - Vẫn còn trong danh sách

**Expected Results:**
- Delete CV non-default thành công
- Không thể xóa CV default (có error message hoặc button disabled)
- Có thể xóa CV đã dùng để apply (với warning)
- Cancel delete hoạt động đúng
- CV bị xóa không còn trong danh sách
- Applications vẫn tồn tại sau khi xóa CV (nhưng không thể xem CV detail)
- Data consistent giữa CV list và applications

**Priority:** High  
**Test Data:** 
- CV A: Non-default, chưa dùng để apply
- CV B: Default CV
- CV C: Đã dùng để apply job

---

### TC-SYS-CAND-CV-007: Set Default CV - Success Journey
**Scenario:** Đặt CV làm mặc định và verify impact  
**Pre-conditions:** Đã có ít nhất 2 CVs, CV A đang là default, CV B là non-default  
**Test Steps:**
1. Navigate to CV Management page
2. Verify CV A có badge "Mặc định" hoặc icon star fill
3. Verify CV B không có badge "Mặc định"
4. Test case 1: Set CV B làm default từ CV list
   - Click "Đặt mặc định" hoặc toggle trên CV B
   - Verify confirmation (nếu có) hoặc action ngay lập tức
   - Verify process:
     - Loading indicator hiển thị
     - Toast: "Đang đặt CV làm mặc định..." (nếu có)
   - Verify thành công:
     - Toast success: "Đã đặt CV làm mặc định"
     - CV B có badge "Mặc định" hoặc icon star fill
     - CV A mất badge "Mặc định" hoặc icon star unfill
     - CV B được highlight hoặc move lên đầu danh sách (nếu có logic)
5. Test case 2: Set CV B làm default từ CV detail page
   - Click "Xem" trên CV B
   - Verify CV detail page hiển thị
   - Click "Đặt mặc định"
   - Verify thành công tương tự như trên
6. Verify default CV được sử dụng khi apply job:
   - Navigate to job detail
   - Click "Ứng tuyển"
   - Chọn "CV Online"
   - Verify dropdown mặc định chọn CV B (default CV)
   - Hoặc verify CV B được highlight trong dropdown
7. Verify default CV hiển thị trong "CV Ưu tiên" section (nếu có):
   - Quay lại CV Management page
   - Verify section "CV Ưu tiên" hiển thị CV B
   - Verify CV A không còn trong section này
8. Test case 3: Set lại CV A làm default
   - Click "Đặt mặc định" trên CV A
   - Verify CV A lại có badge "Mặc định"
   - Verify CV B mất badge "Mặc định"

**Expected Results:**
- Set default CV thành công
- Badge "Mặc định" được update đúng
- Chỉ có 1 CV là default tại một thời điểm
- Default CV được highlight hoặc move lên đầu (nếu có logic)
- Default CV được sử dụng mặc định khi apply job
- Default CV hiển thị trong "CV Ưu tiên" section (nếu có)
- Data consistent giữa CV list, CV detail và apply job flow

**Priority:** High  
**Test Data:** 
- CV A: Đang là default
- CV B: Non-default

---

### TC-SYS-CAND-CV-008: Rename Uploaded CV
**Scenario:** Đổi tên CV uploaded  
**Pre-conditions:** Đã có ít nhất 1 CV uploaded  
**Test Steps:**
1. Navigate to CV Management page
2. Verify danh sách CV uploaded hiển thị
3. Click "Đổi tên" hoặc icon edit trên một CV uploaded (CV X)
4. Verify rename modal mở:
   - Input field với tên CV hiện tại
   - Button "Lưu" hoặc "Save"
   - Button "Hủy" hoặc "Cancel"
5. Update tên CV:
   - Tên cũ: "my-cv.pdf"
   - Nhập tên mới: "CV Backend Developer Updated"
   - Click "Lưu"
6. Verify rename thành công:
   - Toast success: "Đổi tên CV thành công"
   - Modal đóng
   - CV X hiển thị tên mới: "CV Backend Developer Updated"
7. Verify CV vẫn hoạt động bình thường:
   - Click "Xem" trên CV X
   - Verify CV view page hiển thị tên mới
   - Verify có thể download với tên mới (hoặc tên file gốc)
8. Verify CV có thể dùng để apply job:
   - Navigate to job detail
   - Click "Ứng tuyển"
   - Chọn "CV Uploaded"
   - Verify dropdown hiển thị tên mới: "CV Backend Developer Updated"

**Expected Results:**
- Rename modal mở đúng
- Tên CV được update thành công
- CV hiển thị tên mới trong danh sách
- CV vẫn hoạt động bình thường sau khi đổi tên
- CV có thể sử dụng để apply job với tên mới
- Data consistent giữa CV list và apply job flow

**Priority:** Medium  
**Test Data:** CV uploaded với tên cũ cần đổi

---

## 3. USER JOURNEY: CV MANAGEMENT & OPTIMIZATION

### TC-SYS-CAND-005: Create Multiple CVs → Optimize → Apply Strategy
**Scenario:** Candidate tạo nhiều CVs cho các mục đích khác nhau  
**Pre-conditions:** Đã login  
**Test Steps:**
1. Tạo CV online "CV Backend Developer" với focus vào backend skills
2. Tạo CV online "CV Fullstack Developer" với focus vào fullstack
3. Upload CV file "CV General.pdf"
4. Set "CV Backend Developer" làm default
5. Tìm job "Backend Developer" → Apply với "CV Backend Developer"
6. Tìm job "Fullstack Developer" → Apply với "CV Fullstack Developer"
7. Tìm job "Java Developer" → Apply với "CV General.pdf"
8. Kiểm tra mỗi application link đúng CV tương ứng
9. Update "CV Backend Developer" → thêm skill mới
10. Kiểm tra application đã apply vẫn giữ nguyên CV cũ (không auto-update)

**Expected Results:**
- Multiple CVs được quản lý độc lập
- Default CV được set đúng
- Mỗi application dùng đúng CV đã chọn
- Update CV không ảnh hưởng đến applications đã gửi
- CV history được preserve

---

### TC-SYS-CAND-006: CV Public/Private Toggle → Recruiter Search Impact
**Scenario:** Candidate toggle CV visibility và kiểm tra impact lên recruiter search  
**Pre-conditions:** Đã có CV online, recruiter có thể search  
**Test Steps:**
1. Set CV "Public" = true, Profile "Allow Recruiter Search" = true
2. Recruiter search candidate → CV xuất hiện trong kết quả
3. Candidate set CV "Public" = false
4. Recruiter search lại → CV không còn xuất hiện
5. Candidate set CV "Public" = true nhưng Profile "Allow Recruiter Search" = false
6. Recruiter search → CV không xuất hiện
7. Candidate set cả 2 = true → CV xuất hiện lại

**Expected Results:**
- Toggle settings được lưu đúng
- Recruiter search reflect đúng visibility settings
- Logic AND giữa CV public và profile allow search hoạt động đúng
- Real-time hoặc near-real-time update (không cần wait quá lâu)

---

## 4. USER JOURNEY: PROFILE MANAGEMENT & SETTINGS

### TC-SYS-CAND-007: Complete Profile Update → Job Suggestions Update
**Scenario:** Candidate update profile và kiểm tra job suggestions thay đổi  
**Pre-conditions:** Đã login, có job suggestion settings  
**Test Steps:**
1. Xem job suggestions hiện tại trên homepage
2. Update profile: location từ "Hà Nội" → "TP.HCM"
3. Update job suggestion settings: thêm category "Marketing"
4. Refresh homepage → xem job suggestions mới
5. Kiểm tra suggestions phù hợp với location và category mới
6. Update profile: experience level
7. Kiểm tra suggestions filter theo experience level

**Expected Results:**
- Profile update được lưu đúng
- Job suggestions update theo settings mới
- Suggestions phù hợp với location, category, experience
- Data consistent giữa profile và suggestions

---

### TC-SYS-CAND-008: Profile Visibility → Recruiter Access Control
**Scenario:** Candidate thay đổi visibility và kiểm tra recruiter không thể xem  
**Pre-conditions:** Đã có profile với data đầy đủ  
**Test Steps:**
1. Set "Allow Recruiter Search" = true
2. Recruiter search → candidate xuất hiện
3. Recruiter xem candidate profile → thấy đầy đủ thông tin
4. Candidate set "Allow Recruiter Search" = false
5. Recruiter search lại → candidate không xuất hiện
6. Recruiter truy cập trực tiếp candidate profile URL → 403 hoặc không thấy data

**Expected Results:**
- Visibility toggle hoạt động đúng
- Recruiter search reflect settings ngay lập tức
- Direct access bị block khi visibility = false
- Data privacy được đảm bảo

---

## 5. USER JOURNEY: COMPANY RESEARCH & APPLICATION

### TC-SYS-CAND-009: Company Research → Job Application Flow
**Scenario:** Candidate research company, xem jobs, apply  
**Pre-conditions:** Đã login  
**Test Steps:**
1. Browse company listing
2. Search company theo keyword
3. Xem company detail → thấy thông tin công ty, jobs đang tuyển
4. Xem danh sách jobs của company
5. Apply 1 job từ company page
6. Kiểm tra application được tạo
7. Quay lại company detail → số lượng jobs đang tuyển giảm đi 1 (nếu job bị close sau khi apply)

**Expected Results:**
- Company listing và search hoạt động đúng
- Company detail hiển thị đầy đủ thông tin
- Jobs của company được list đúng
- Application được tạo thành công
- Data consistent giữa company jobs và applications

---

## 6. USER JOURNEY: CAREER INVITATION & RESPONSE

### TC-SYS-CAND-010: Receive Invitation → Accept → Apply Flow
**Scenario:** Candidate nhận invitation từ recruiter, accept và apply  
**Pre-conditions:** Đã login, recruiter gửi invitation  
**Test Steps:**
1. Candidate xem "Career Opportunity Invitations"
2. Thấy invitation từ recruiter với job details
3. Xem chi tiết invitation → thấy job, company, recruiter info
4. Accept invitation
5. Navigate to job detail từ invitation
6. Apply job với CV phù hợp
7. Kiểm tra application được tạo và link với invitation
8. Recruiter thấy candidate đã accept và apply

**Expected Results:**
- Invitations được hiển thị đúng
- Accept invitation thành công
- Navigation từ invitation đến job hoạt động
- Application được link với invitation (nếu có logic)
- Recruiter được notify về accept và apply

---

## 7. INTEGRATION SCENARIOS: DATA CONSISTENCY

### TC-SYS-CAND-011: Cross-Module Data Consistency
**Scenario:** Kiểm tra data consistency giữa các modules  
**Pre-conditions:** Đã có profile, CVs, applications  
**Test Steps:**
1. Update profile fullName
2. Kiểm tra CV online có sync với profile không (tùy logic)
3. Kiểm tra applications vẫn giữ nguyên fullName cũ trong CV đã gửi
4. Delete một CV đã dùng để apply
5. Kiểm tra application vẫn tồn tại nhưng không thể xem CV detail
6. Update job suggestion settings
7. Kiểm tra homepage suggestions update
8. Apply job → kiểm tra job xuất hiện trong applied jobs
9. Kiểm tra recruiter thấy application trong hệ thống

**Expected Results:**
- Profile-CV sync hoạt động đúng (nếu có)
- Applications preserve CV data tại thời điểm apply
- Delete CV không làm mất application
- Settings update reflect đúng
- Data consistent giữa candidate và recruiter views

---

### TC-SYS-CAND-012: Concurrent Operations - Multiple Actions
**Scenario:** Thực hiện nhiều actions đồng thời  
**Pre-conditions:** Đã login  
**Test Steps:**
1. Tab 1: Apply job A
2. Tab 2: Apply job B (cùng lúc)
3. Tab 3: Update profile
4. Tab 4: Create new CV
5. Kiểm tra tất cả operations thành công
6. Refresh tất cả tabs → kiểm tra data consistent

**Expected Results:**
- Tất cả operations thành công
- Không có race condition
- Data consistent sau khi refresh
- No data loss

---

## 8. ERROR HANDLING & EDGE CASES

### TC-SYS-CAND-013: Network Failure Recovery
**Scenario:** Xử lý khi network fail trong quá trình thao tác  
**Pre-conditions:** Đang thực hiện action  
**Test Steps:**
1. Bắt đầu apply job
2. Disconnect network giữa chừng
3. Kiểm tra error message hiển thị
4. Reconnect network
5. Retry action
6. Kiểm tra action thành công và data được lưu đúng

**Expected Results:**
- Error được handle gracefully
- User được thông báo rõ ràng
- Có thể retry sau khi reconnect
- Data không bị duplicate hoặc corrupt

---

### TC-SYS-CAND-014: Expired Session Handling
**Scenario:** Xử lý khi session hết hạn trong quá trình thao tác  
**Pre-conditions:** Đã login, session sắp hết hạn  
**Test Steps:**
1. Đang fill form apply job
2. Session expire
3. Submit form
4. Kiểm tra redirect to login
5. Login lại
6. Kiểm tra form data được preserve (nếu có) hoặc mất (tùy logic)

**Expected Results:**
- Session expiration được detect
- User được redirect to login
- Form data được preserve hoặc clear tùy design
- Sau khi login lại, có thể tiếp tục hoặc phải làm lại

---

## 9. PERFORMANCE & LOAD SCENARIOS

### TC-SYS-CAND-015: Large Dataset Handling
**Scenario:** Kiểm tra performance với dataset lớn  
**Pre-conditions:** Hệ thống có nhiều jobs, companies, applications  
**Test Steps:**
1. Search job → kết quả > 100 jobs
2. Kiểm tra pagination hoạt động
3. Kiểm tra load time < 3s
4. Filter và search → kết quả vẫn load nhanh
5. Xem applied jobs với > 50 applications
6. Kiểm tra pagination và load time

**Expected Results:**
- Pagination hoạt động đúng
- Load time acceptable (< 3s cho actions thông thường)
- No timeout errors
- UI responsive trong khi loading

---

## 10. SECURITY & AUTHORIZATION

### TC-SYS-CAND-016: Unauthorized Access Prevention
**Scenario:** Kiểm tra candidate không thể access data của candidate khác  
**Pre-conditions:** Login as candidate A  
**Test Steps:**
1. Try access candidate B's profile URL directly
2. Try access candidate B's CV URL directly
3. Try access application của candidate B
4. Kiểm tra tất cả đều bị block hoặc redirect

**Expected Results:**
- 403 Forbidden hoặc redirect
- Không thể xem data của candidate khác
- Security được đảm bảo

---

## SUMMARY

**Total System Test Cases:** 16 test cases  
**Focus Areas:**
- **User Journeys:** Complete workflows từ đầu đến cuối
- **Business Scenarios:** Real-world use cases
- **Integration:** Data flow giữa các modules
- **Data Consistency:** Cross-module data integrity
- **Error Handling:** Edge cases và error recovery
- **Performance:** Load và scalability
- **Security:** Authorization và access control

**Khác biệt với UI Test:**
- **UI Test:** Test từng component, button, field, validation riêng lẻ
- **System Test:** Test complete workflows, end-to-end scenarios, integration giữa các modules

**Test Execution:**
- Mỗi test case có thể mất 5-15 phút để execute
- Cần test trên môi trường integration/staging
- Cần data test đầy đủ (jobs, companies, recruiters)
- Cần verify cả candidate view và recruiter view để đảm bảo data consistency
