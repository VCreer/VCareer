# SYSTEM TEST CASES - LEADER RECRUITER (VCAREER)

**Test Level:** System Test (End-to-End)  
**Role:** LEAD_RECRUITER  
**Total Test Cases:** 30+ test cases

---

## PHẦN 1: AUTHENTICATION & SESSION MANAGEMENT

### TC-AUTH-001: Login Success
**Description:** Leader Recruiter đăng nhập thành công  
**Pre-conditions:** 
- Tài khoản Leader Recruiter hợp lệ
- Company đã verify (nếu hệ thống yêu cầu)
- Chưa đăng nhập hoặc đã logout

**Priority:** High

**Steps:**
1. Mở trình duyệt, truy cập `/recruiter/login`
2. Nhập email Leader Recruiter hợp lệ
3. Nhập password đúng
4. Click nút "Đăng nhập"
5. Quan sát redirect và UI

**Expected Results:**
- Redirect về dashboard recruiter (`/recruiter` hoặc trang chủ recruiter)
- Header hiển thị tên user/avatar
- Menu hiển thị đầy đủ các mục: Jobs, Campaign, HR Staff, Reports, Services, Candidates
- Token/session được tạo và lưu (kiểm tra cookie/localStorage)
- Không có lỗi 401/403 trong console
- API calls khởi tạo (profile, dashboard stats) trả về 200

---

### TC-AUTH-002: Login Fail - Invalid Credentials
**Description:** Đăng nhập với thông tin sai  
**Pre-conditions:** Tài khoản Leader Recruiter tồn tại

**Priority:** High

**Steps:**
1. Mở `/recruiter/login`
2. Nhập email đúng, password sai
3. Click "Đăng nhập"
4. Quan sát thông báo lỗi

**Expected Results:**
- Hiển thị thông báo lỗi: "Sai tài khoản hoặc mật khẩu" (toast notification màu đỏ)
- Không tạo session/token
- Không redirect dashboard
- Vẫn ở trang login
- Form không bị reset (giữ email)

---

### TC-AUTH-003: Login Fail - Email Not Found
**Description:** Đăng nhập với email không tồn tại  
**Pre-conditions:** Email không tồn tại trong hệ thống

**Priority:** High

**Steps:**
1. Mở `/recruiter/login`
2. Nhập email không tồn tại
3. Nhập password bất kỳ
4. Click "Đăng nhập"

**Expected Results:**
- Hiển thị thông báo lỗi: "Sai tài khoản hoặc mật khẩu" (không tiết lộ email có tồn tại hay không)
- Không tạo session
- Vẫn ở trang login

---

### TC-AUTH-004: Logout & Session Clear
**Description:** Đăng xuất và xóa session  
**Pre-conditions:** Đang đăng nhập với tài khoản Leader Recruiter

**Priority:** Medium

**Steps:**
1. Từ dashboard recruiter, click vào avatar/profile menu
2. Click "Đăng xuất" / "Logout"
3. Quan sát redirect
4. Thử truy cập route bảo vệ (VD: `/recruiter/job-posting`)
5. Kiểm tra token/cookie/session

**Expected Results:**
- Redirect về `/recruiter/login`
- Token/cookie/session bị xóa
- Không thể truy cập route bảo vệ (redirect về login hoặc 401)
- Session clear hoàn toàn

---

### TC-AUTH-005: Session Expiry / Token Expired
**Description:** Xử lý khi token hết hạn  
**Pre-conditions:** Đang login Leader Recruiter

**Priority:** Medium

**Steps:**
1. Login Leader Recruiter thành công
2. Chờ đến khi token hết hạn (hoặc revoke token thủ công)
3. Thực hiện hành động bảo vệ: mở `/recruiter/campaign-job-management`
4. Quan sát response

**Expected Results:**
- Bị yêu cầu login lại (redirect về `/recruiter/login`)
- Hoặc hiển thị 401/403 và UI tự động chuyển về login
- Không hiển thị dữ liệu bảo vệ
- Thông báo rõ ràng về việc hết phiên

---

### TC-AUTH-006: Forgot Password - Valid Email
**Description:** Quên mật khẩu với email hợp lệ  
**Pre-conditions:** Tài khoản Leader Recruiter tồn tại, có email test/mock

**Priority:** High

**Steps:**
1. Mở `/recruiter/forgot-password`
2. Nhập email Leader Recruiter hợp lệ
3. Click "Gửi" / "Submit"
4. Kiểm tra email (Mailhog/Mailtrap)
5. Click link reset trong email
6. Nhập mật khẩu mới + confirm
7. Submit
8. Đăng nhập lại với mật khẩu mới

**Expected Results:**
- Thông báo: "Liên kết đặt lại mật khẩu đã được gửi đến email của bạn"
- Email reset được gửi đến đúng địa chỉ
- Link reset hợp lệ, không hết hạn
- Đặt mật khẩu mới thành công
- Login được với mật khẩu mới
- Mật khẩu cũ không còn dùng được

---

### TC-AUTH-007: Forgot Password - Invalid Email
**Description:** Quên mật khẩu với email không tồn tại  
**Pre-conditions:** Email không tồn tại trong hệ thống

**Priority:** Medium

**Steps:**
1. Mở `/recruiter/forgot-password`
2. Nhập email không tồn tại
3. Click "Gửi"

**Expected Results:**
- Thông báo chung: "Nếu email tồn tại, chúng tôi đã gửi hướng dẫn" (không tiết lộ email có tồn tại)
- Không gửi email thực
- Không lộ thông tin user

---

### TC-AUTH-008: Reset Password - Invalid Token
**Description:** Reset mật khẩu với token không hợp lệ/hết hạn  
**Pre-conditions:** Có link reset password (token đã hết hạn hoặc sai)

**Priority:** Medium

**Steps:**
1. Truy cập link reset password với token không hợp lệ
2. Nhập mật khẩu mới + confirm
3. Submit

**Expected Results:**
- Hiển thị thông báo: "Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu link mới"
- Không đặt được mật khẩu mới
- Redirect về trang forgot password hoặc login

---

### TC-AUTH-009: Access Control - Unauthorized Access
**Description:** Truy cập route Leader khi chưa login hoặc sai role  
**Pre-conditions:** 
- Chưa login, hoặc
- Login bằng HR Staff (không phải Leader)

**Priority:** High

**Steps:**
1. (Chưa login) Mở `/recruiter/hr-staff-management`
2. (Sai role) Login HR Staff → mở `/recruiter/hr-staff-management`
3. Quan sát response

**Expected Results:**
- Chưa login: redirect về `/recruiter/login` hoặc 401
- HR Staff: bị chặn/403, thông báo "Bạn không có quyền truy cập"
- Không hiển thị trang/dữ liệu nhạy cảm
- Menu không hiển thị các mục chỉ dành cho Leader

---

## PHẦN 2: JOB MANAGEMENT

### TC-JOB-001: Create New Job (Draft)
**Description:** Tạo job mới ở trạng thái Draft  
**Pre-conditions:** 
c
- Có dữ liệu: Category, Location, Salary range

**Priority:** High

**Steps:**
1. Vào `/recruiter/job-posting`
2. Điền form:
   - Title: "Senior Java Developer"
   - Category/Subcategory: Chọn ngành nghề
   - Location: Chọn địa điểm
   - Salary range: Nhập min-max
   - Description: Mô tả công việc
   - Requirements: Yêu cầu ứng viên
   - Benefits: Quyền lợi
3. Chọn Status = Draft (hoặc không publish ngay)
4. Click "Lưu" / "Save"
5. Mở trang quản lý job (`/recruiter/campaign-job-management`)
6. Tìm job vừa tạo

**Expected Results:**
- Job tạo thành công, hiển thị thông báo success
- Job xuất hiện trong danh sách với status = Draft
- Thông tin job đúng: Title, Category, Location, Salary, Description
- Job chưa hiển thị cho candidate (chưa public)
- Có thể edit/delete job Draft

---

### TC-JOB-002: Create New Job - Validation Errors
**Description:** Tạo job với dữ liệu thiếu/sai  
**Pre-conditions:** Đã login Leader Recruiter

**Priority:** High

**Steps:**
1. Vào `/recruiter/job-posting`
2. Bỏ trống các trường bắt buộc (Title, Category, Location)
3. Click "Lưu"
4. Quan sát validation errors

**Expected Results:**
- Hiển thị validation errors dưới các trường bắt buộc
- Không tạo job
- Form không submit
- Thông báo rõ ràng: "Vui lòng điền đầy đủ thông tin bắt buộc"

---

### TC-JOB-003: Post Job (Draft → Pending → Active)
**Description:** Đăng job từ Draft, chuyển Pending chờ Employee duyệt, sau duyệt thành Active  
**Pre-conditions:** 
- Có job ở trạng thái Draft
- Có tài khoản Employee để duyệt

**Priority:** High

**Steps:**
1. Mở quản lý job → chọn job Draft
2. Click "Đăng bài" / "Publish" / "Submit"
3. Xác nhận modal (nếu có)
4. Verify status chuyển thành Pending
5. (Switch role) Login Employee → vào danh sách job Pending
6. Approve job
7. Verify status chuyển thành Active
8. (Switch role) Candidate view → search job theo title
9. Verify job hiển thị trong kết quả

**Expected Results:**
- Submit chuyển job từ Draft → Pending
- Job không hiển thị cho candidate khi còn Pending
- Employee approve chuyển job từ Pending → Active
- Job Active hiển thị cho candidate search/browse
- Thông tin job khớp giữa recruiter view và candidate view

---

### TC-JOB-004: Update Job (Active)
**Description:** Chỉnh sửa job đang Active  
**Pre-conditions:** Có job đang Active (đã được duyệt)

**Priority:** High

**Steps:**
1. Mở quản lý job → chọn job Active (Job A)
2. Click "Sửa" / "Edit"
3. Cập nhật:
   - Title: "Java Developer" → "Senior Java Developer"
   - Salary: "20-30 triệu" → "25-35 triệu"
   - Description: Thêm nội dung mới
4. Click "Lưu" / "Update"
5. Verify tại recruiter view (list + detail)
6. (Switch role) Candidate view → search theo title mới
7. Mở job detail → đối chiếu thông tin

**Expected Results:**
- Update thành công, thông báo success
- Recruiter view hiển thị thông tin mới
- Candidate view hiển thị title/salary/description đã cập nhật
- Không tạo bản ghi trùng (job ID giữ nguyên)
- Dữ liệu nhất quán giữa recruiter và candidate view

---

### TC-JOB-005: Update Job - Validation
**Description:** Cập nhật job với dữ liệu không hợp lệ  
**Pre-conditions:** Có job Active

**Priority:** Medium

**Steps:**
1. Mở job Active → Edit
2. Xóa Title (để trống)
3. Nhập Salary min > max
4. Click "Lưu"

**Expected Results:**
- Validation errors hiển thị
- Không cập nhật job
- Job vẫn giữ thông tin cũ

---

### TC-JOB-006: Close Job
**Description:** Đóng job để ẩn khỏi candidate  
**Pre-conditions:** 
- Có job Active
- Có thể có applications

**Priority:** High

**Steps:**
1. Mở quản lý job → chọn job Active (Job B)
2. Click "Đóng job" / "Close"
3. Xác nhận modal (nếu có)
4. Verify status = Closed
5. (Switch role) Candidate view → search theo title Job B
6. Verify Job B không xuất hiện
7. Kiểm tra applications của Job B

**Expected Results:**
- Status chuyển thành Closed
- Job không hiển thị trong candidate search/browse
- Applications vẫn tồn tại, có thể xem/duyệt
- Recruiter vẫn thấy job trong quản lý với status Closed

---

### TC-JOB-007: Reopen Job
**Description:** Mở lại job đã đóng  
**Pre-conditions:** Có job ở trạng thái Closed

**Priority:** High

**Steps:**
1. Mở quản lý job → chọn job Closed (Job B)
2. Click "Mở lại" / "Reopen"
3. Xác nhận (nếu có)
4. Verify status = Active
5. (Switch role) Candidate view → search theo title Job B
6. Verify Job B xuất hiện lại

**Expected Results:**
- Status chuyển từ Closed → Active
- Job hiển thị lại trong candidate search/browse
- Thông tin job không thay đổi
- Applications vẫn giữ nguyên

---

### TC-JOB-008: Delete Job (No Applications)
**Description:** Xóa job không có ứng tuyển  
**Pre-conditions:** Có job không có applications

**Priority:** Medium

**Steps:**
1. Mở quản lý job → chọn job không có applications
2. Click "Xóa" / "Delete"
3. Xác nhận modal
4. Verify job biến mất khỏi list
5. Search job theo ID/title

**Expected Results:**
- Job bị xóa khỏi database
- Không còn trong danh sách quản lý
- Không tìm thấy trong search
- Status = Deleted (nếu soft delete)

---

### TC-JOB-009: Delete Job (With Applications)
**Description:** Xóa job có ứng tuyển  
**Pre-conditions:** Có job có ≥1 applications

**Priority:** Medium

**Steps:**
1. Mở quản lý job → chọn job có applications
2. Click "Xóa" / "Delete"
3. Quan sát response

**Expected Results:**
- Bị chặn hoặc cảnh báo: "Không thể xóa job có ứng tuyển"
- Job không bị xóa
- Applications vẫn tồn tại
- Hoặc (nếu cho phép): Job bị xóa nhưng applications được xử lý theo business rule

---

## PHẦN 3: RECRUITMENT CAMPAIGN

### TC-CAMPAIGN-001: Create Recruitment Campaign
**Description:** Tạo chiến dịch tuyển dụng mới  
**Pre-conditions:** Đã login Leader Recruiter

**Priority:** High

**Steps:**
1. Vào `/recruiter/recruitment-campaign`
2. Click "Tạo chiến dịch mới" / "Create Campaign"
3. Nhập:
   - Tên campaign: "Tuyển dụng Q1 2025"
   - Mô tả: Mô tả chiến dịch
   - Start date: Chọn ngày bắt đầu
   - End date: Chọn ngày kết thúc (sau start date)
4. Click "Lưu" / "Save"
5. Verify campaign xuất hiện trong list

**Expected Results:**
- Campaign tạo thành công
- Hiển thị trong danh sách campaigns
- Trạng thái đúng (Active/Draft)
- Thời gian hợp lệ (end date > start date)
- Có thể mở chi tiết campaign

---

### TC-CAMPAIGN-002: Add Jobs to Campaign
**Description:** Gắn job vào campaign  
**Pre-conditions:** 
- Có campaign vừa tạo
- Có ≥2 jobs (có thể Draft hoặc Active)

**Priority:** High

**Steps:**
1. Mở chi tiết campaign vừa tạo
2. Click "Thêm công việc" / "Add Jobs"
3. Chọn 2 jobs từ danh sách
4. Click "Thêm" / "Add"
5. Verify jobs xuất hiện trong campaign
6. Mở `/recruiter/campaign-job-management` → filter theo campaign
7. Verify 2 jobs hiển thị và thuộc campaign

**Expected Results:**
- Jobs được gắn đúng campaign
- Hiển thị trong campaign detail
- Filter campaign hoạt động đúng
- Dữ liệu nhất quán giữa campaign và job management

---

### TC-CAMPAIGN-003: Create Job in Campaign (Draft)
**Description:** Tạo job mới trực tiếp trong campaign ở trạng thái Draft  
**Pre-conditions:** Có campaign đang mở

**Priority:** High

**Steps:**
1. Mở chi tiết campaign
2. Click "Tạo công việc mới" / "Create Job"
3. Điền form job (Title, Category, Location, Salary, Description, Requirements, Benefits)
4. Campaign được chọn mặc định (từ context)
5. Chọn Status = Draft
6. Click "Lưu"
7. Verify job xuất hiện trong campaign với status Draft

**Expected Results:**
- Job được tạo với status Draft
- Job tự động gắn với campaign
- Chưa hiển thị cho candidate
- Có thể edit/delete job Draft trong campaign

---

### TC-CAMPAIGN-004: View Campaign Jobs
**Description:** Xem danh sách jobs trong campaign  
**Pre-conditions:** Campaign có ≥2 jobs

**Priority:** Medium

**Steps:**
1. Mở chi tiết campaign
2. Xem danh sách jobs
3. Verify thông tin: Title, Status, Created date
4. Click vào job để xem detail
5. Filter jobs theo status (Draft, Pending, Active, Closed)

**Expected Results:**
- Hiển thị đầy đủ jobs thuộc campaign
- Thông tin job đúng
- Filter hoạt động
- Có thể navigate đến job detail

---

### TC-CAMPAIGN-005: Update Campaign
**Description:** Chỉnh sửa thông tin campaign  
**Pre-conditions:** Có campaign đã tạo

**Priority:** Medium

**Steps:**
1. Mở chi tiết campaign
2. Click "Sửa" / "Edit"
3. Cập nhật: Tên, Mô tả, End date
4. Click "Lưu"
5. Verify thông tin đã cập nhật

**Expected Results:**
- Campaign cập nhật thành công
- Thông tin mới hiển thị đúng
- Jobs trong campaign không bị ảnh hưởng

---

### TC-CAMPAIGN-006: Delete Campaign
**Description:** Xóa campaign  
**Pre-conditions:** 
- Có campaign
- Campaign có thể có hoặc không có jobs

**Priority:** Low

**Steps:**
1. Mở chi tiết campaign
2. Click "Xóa" / "Delete"
3. Xác nhận modal
4. Verify campaign biến mất

**Expected Results:**
- Campaign bị xóa (hoặc soft delete)
- Jobs trong campaign được xử lý theo business rule (có thể bị xóa hoặc giữ lại)
- Không còn trong danh sách campaigns

---

## PHẦN 4: CANDIDATE SEARCH & INVITE

### TC-CANDIDATE-001: Candidate Search - Keyword
**Description:** Tìm kiếm ứng viên bằng keyword  
**Pre-conditions:** 
- Đã login Leader Recruiter
- Lucene index đã reindex
- Có candidates với CV public

**Priority:** High

**Steps:**
1. Vào `/recruiter/find-candidate`
2. Nhập keyword: "Java"
3. Click "Tìm kiếm" / "Search"
4. Quan sát kết quả
5. Verify phân trang hoạt động

**Expected Results:**
- Trả về danh sách candidates phù hợp keyword
- Kết quả có chứa "Java" trong JobTitle, Skills, hoặc CV content
- Phân trang hiển thị đúng (nếu có nhiều kết quả)
- Hiệu năng chấp nhận được (< 3s)

---

### TC-CANDIDATE-002: Candidate Search - With Filters
**Description:** Tìm kiếm ứng viên với bộ lọc  
**Pre-conditions:** 
- Có candidates với thông tin đa dạng
- Lucene index đã reindex

**Priority:** High

**Steps:**
1. Vào `/recruiter/find-candidate`
2. Nhập keyword: "Developer"
3. Áp dụng filters:
   - Location = "Hà Nội"
   - Experience = "3-5 years"
   - Skills = "Java, Spring" (nếu có)
4. Click "Tìm kiếm"
5. Verify kết quả thu hẹp

**Expected Results:**
- Kết quả phù hợp cả keyword và filters
- Candidates có Location = Hà Nội
- Candidates có Experience trong khoảng 3-5 years
- Kết quả chính xác, không lỗi

---

### TC-CANDIDATE-003: View Candidate Profile
**Description:** Xem chi tiết hồ sơ ứng viên  
**Pre-conditions:** Đã có kết quả search candidate

**Priority:** High

**Steps:**
1. Từ kết quả search, click vào một candidate
2. Mở profile detail
3. Xem thông tin: Tên, Email, Số điện thoại, Kinh nghiệm, Kỹ năng
4. Xem các CV (online/upload)
5. Click "Xem CV" để mở preview

**Expected Results:**
- Profile hiển thị đầy đủ thông tin
- CV preview được (online CV hoặc uploaded CV)
- Thông tin chính xác
- UI/UX dễ đọc, không lỗi

---

### TC-CANDIDATE-004: Send Invite to Candidate
**Description:** Gửi lời mời ứng viên gắn với job  
**Pre-conditions:** 
- Đã xem candidate profile
- Có ≥1 job Active để gắn vào invite

**Priority:** High

**Steps:**
1. Từ candidate profile, click "Liên hệ" / "Gửi lời mời" / "Send Invite"
2. Chọn job Active từ dropdown
3. Nhập message (tùy chọn)
4. Click "Gửi" / "Send"
5. Verify thông báo success
6. (Switch role) Candidate view → kiểm tra notification

**Expected Results:**
- Invite gửi thành công, thông báo success
- Candidate nhận notification: "Nhà tuyển dụng vừa xem CV của bạn cho công việc [Job Title]"
- Log/activity được ghi (nếu có)
- Invite được lưu trong hệ thống

---

### TC-CANDIDATE-005: Candidate Search - Empty Results
**Description:** Tìm kiếm không có kết quả  
**Pre-conditions:** Lucene index đã reindex

**Priority:** Medium

**Steps:**
1. Vào `/recruiter/find-candidate`
2. Nhập keyword không có trong database: "XYZ123ABC"
3. Click "Tìm kiếm"

**Expected Results:**
- Hiển thị "Không tìm thấy ứng viên nào"
- Empty state rõ ràng
- Không lỗi, không crash

---

### TC-CANDIDATE-006: Candidate Search - Pagination
**Description:** Phân trang kết quả tìm kiếm  
**Pre-conditions:** Có >10 candidates phù hợp search

**Priority:** Medium

**Steps:**
1. Search với keyword trả về nhiều kết quả (>10)
2. Click "Trang 2" / "Next"
3. Verify kết quả trang 2
4. Click "Trang 1" / "Previous"
5. Verify quay lại trang 1

**Expected Results:**
- Phân trang hoạt động đúng
- Kết quả trang 2 khác trang 1
- Navigation (Next/Previous) hoạt động
- Không duplicate results

---

## PHẦN 5: APPLICATION MANAGEMENT

### TC-APPLICATION-001: View Applications List
**Description:** Xem danh sách ứng tuyển  
**Pre-conditions:** 
- Có job với ≥3 applications
- Applications ở các trạng thái: Pending, Approved, Rejected

**Priority:** High

**Steps:**
1. Vào quản lý job → chọn job có applications
2. Click "Xem ứng tuyển" / "View Applications"
3. Quan sát danh sách applications
4. Verify thông tin: Tên ứng viên, CV, Status, Applied date
5. Filter theo status (Pending, Approved, Rejected)

**Expected Results:**
- Hiển thị đầy đủ applications
- Thông tin đúng: Tên, CV link, Status, Date
- Filter hoạt động
- Phân trang (nếu có nhiều applications)

---

### TC-APPLICATION-002: View Application Detail & CV
**Description:** Xem chi tiết ứng tuyển và CV  
**Pre-conditions:** Có application Pending

**Priority:** High

**Steps:**
1. Từ danh sách applications, click vào một application
2. Mở application detail
3. Xem thông tin: Tên, Email, Số điện thoại, Applied date
4. Click "Xem CV" để mở CV preview
5. Verify CV hiển thị đúng

**Expected Results:**
- Application detail hiển thị đầy đủ thông tin
- CV preview được (online CV hoặc uploaded CV)
- Thông tin chính xác
- (Side effect) Candidate nhận notification: "Nhà tuyển dụng vừa xem CV của bạn"

---

### TC-APPLICATION-003: Approve Application
**Description:** Duyệt hồ sơ ứng tuyển  
**Pre-conditions:** Có application ở trạng thái Pending

**Priority:** High

**Steps:**
1. Mở application detail (Pending)
2. Click "Duyệt" / "Approve"
3. Xác nhận modal (nếu có)
4. Verify status chuyển thành Approved
5. Verify thông báo success
6. (Switch role) Candidate view → kiểm tra notification

**Expected Results:**
- Status chuyển từ Pending → Approved
- Thông báo success
- Application hiển thị với status Approved trong list
- Candidate nhận notification về việc được duyệt
- Log/activity được ghi

---

### TC-APPLICATION-004: Reject Application
**Description:** Từ chối hồ sơ ứng tuyển  
**Pre-conditions:** Có application ở trạng thái Pending

**Priority:** High

**Steps:**
1. Mở application detail (Pending)
2. Click "Từ chối" / "Reject"
3. Nhập lý do từ chối (nếu yêu cầu)
4. Xác nhận
5. Verify status chuyển thành Rejected
6. (Switch role) Candidate view → kiểm tra notification

**Expected Results:**
- Status chuyển từ Pending → Rejected
- Lý do từ chối được lưu
- Thông báo success
- Candidate nhận notification về việc bị từ chối (kèm lý do nếu có)
- Application hiển thị với status Rejected trong list

---

### TC-APPLICATION-005: Filter Applications by Status
**Description:** Lọc ứng tuyển theo trạng thái  
**Pre-conditions:** Job có applications ở nhiều trạng thái

**Priority:** Medium

**Steps:**
1. Mở danh sách applications
2. Filter "Pending" → Verify chỉ hiển thị Pending
3. Filter "Approved" → Verify chỉ hiển thị Approved
4. Filter "Rejected" → Verify chỉ hiển thị Rejected
5. Filter "Tất cả" → Verify hiển thị tất cả

**Expected Results:**
- Filter hoạt động chính xác
- Kết quả khớp với filter đã chọn
- Số lượng applications đúng

---

## PHẦN 6: HR STAFF MANAGEMENT

### TC-HR-001: View HR Staff List
**Description:** Xem danh sách HR Staff  
**Pre-conditions:** 
- Đã login Leader Recruiter
- Có ≥2 HR Staff trong công ty

**Priority:** High

**Steps:**
1. Vào `/recruiter/hr-staff-management`
2. Quan sát danh sách HR Staff
3. Verify thông tin: Tên, Email, Status, Role, Created date

**Expected Results:**
- Hiển thị đầy đủ HR Staff trong công ty
- Thông tin đúng
- Phân trang (nếu có nhiều staff)
- Chỉ hiển thị staff của công ty Leader

---

### TC-HR-002: Add HR Staff
**Description:** Thêm HR Staff mới  
**Pre-conditions:** Đã login Leader Recruiter

**Priority:** High

**Steps:**
1. Vào `/recruiter/hr-staff-management`
2. Click "Thêm nhân viên" / "Add Staff"
3. Nhập:
   - Email: email chưa tồn tại
   - Tên: Tên nhân viên
   - Role: HR Staff
4. Click "Gửi lời mời" / "Send Invite"
5. Verify email mời được gửi
6. Verify staff xuất hiện trong list với status Pending/Invited

**Expected Results:**
- Staff được tạo với status Pending/Invited
- Email mời được gửi đến đúng địa chỉ
- Staff xuất hiện trong danh sách
- Chỉ Leader mới có quyền thêm staff

---

### TC-HR-003: Edit HR Staff
**Description:** Chỉnh sửa thông tin HR Staff  
**Pre-conditions:** Có HR Staff trong danh sách

**Priority:** Medium

**Steps:**
1. Mở danh sách HR Staff
2. Chọn một staff → Click "Sửa" / "Edit"
3. Cập nhật: Tên, Quyền (nếu có)
4. Click "Lưu"
5. Verify thông tin đã cập nhật

**Expected Results:**
- Staff cập nhật thành công
- Thông tin mới hiển thị đúng
- Quyền được áp dụng đúng

---

### TC-HR-004: Activate HR Staff
**Description:** Kích hoạt HR Staff  
**Pre-conditions:** Có HR Staff ở trạng thái Inactive/Pending

**Priority:** Medium

**Steps:**
1. Mở danh sách HR Staff
2. Chọn staff Inactive → Click "Kích hoạt" / "Activate"
3. Xác nhận
4. Verify status chuyển thành Active

**Expected Results:**
- Status chuyển từ Inactive → Active
- Staff có thể login và sử dụng hệ thống
- Thông báo success

---

### TC-HR-005: Deactivate HR Staff
**Description:** Vô hiệu hóa HR Staff  
**Pre-conditions:** Có HR Staff Active

**Priority:** Medium

**Steps:**
1. Mở danh sách HR Staff
2. Chọn staff Active → Click "Vô hiệu hóa" / "Deactivate"
3. Xác nhận
4. Verify status chuyển thành Inactive
5. (Switch role) Staff bị deactivate → thử login

**Expected Results:**
- Status chuyển từ Active → Inactive
- Staff không thể login (bị chặn)
- Thông báo success

---

### TC-HR-006: Delete HR Staff
**Description:** Xóa HR Staff  
**Pre-conditions:** Có HR Staff (không phải Leader)

**Priority:** Low

**Steps:**
1. Mở danh sách HR Staff
2. Chọn staff → Click "Xóa" / "Delete"
3. Xác nhận modal
4. Verify staff biến mất khỏi list

**Expected Results:**
- Staff bị xóa khỏi hệ thống
- Không còn trong danh sách
- Không thể login với email đó

---

### TC-HR-007: Access Control - HR Staff Cannot Manage Staff
**Description:** HR Staff không thể quản lý staff khác  
**Pre-conditions:** 
- Có tài khoản HR Staff
- Có tài khoản Leader Recruiter

**Priority:** High

**Steps:**
1. (Switch role) Login HR Staff
2. Thử truy cập `/recruiter/hr-staff-management`
3. Quan sát response

**Expected Results:**
- Bị chặn/403
- Thông báo: "Bạn không có quyền truy cập"
- Không hiển thị trang/dữ liệu
- Menu không có mục "HR Staff Management"

---

## PHẦN 7: SERVICES & PAYMENT

### TC-SERVICE-001: View Services List
**Description:** Xem danh sách dịch vụ  
**Pre-conditions:** Đã login Leader Recruiter

**Priority:** Medium

**Steps:**
1. Vào `/recruiter/service` hoặc `/recruiter/buy-services`
2. Quan sát danh sách services
3. Verify thông tin: Tên service, Giá, Mô tả, Features

**Expected Results:**
- Hiển thị đầy đủ services
- Thông tin đúng: Tên, Giá (có sale nếu có), Mô tả
- UI/UX rõ ràng

---

### TC-SERVICE-002: Purchase Service - Add to Cart
**Description:** Thêm dịch vụ vào giỏ hàng  
**Pre-conditions:** Có services có sẵn

**Priority:** High

**Steps:**
1. Vào danh sách services
2. Chọn một service
3. Click "Thêm vào giỏ" / "Add to Cart"
4. Verify service xuất hiện trong cart
5. Thêm thêm 1 service khác
6. Verify cart có 2 services

**Expected Results:**
- Service được thêm vào cart
- Cart hiển thị số lượng items
- Tổng tiền được tính đúng
- Có thể xem cart detail

---

### TC-SERVICE-003: Purchase Service - Checkout & VNPay
**Description:** Thanh toán dịch vụ qua VNPay  
**Pre-conditions:** 
- Có services trong cart
- VNPay sandbox hoạt động

**Priority:** High

**Steps:**
1. Mở cart → Click "Thanh toán" / "Checkout"
2. Xem order summary: Services, Tổng tiền (có sale nếu có)
3. Chọn phương thức thanh toán: VNPay
4. Click "Thanh toán" / "Pay"
5. Verify redirect đến VNPay
6. (Giả lập) Thanh toán thành công → callback về site
7. Verify order status = Paid
8. Vào "Dịch vụ của tôi" → verify service được active

**Expected Results:**
- Order được tạo với status Pending
- Redirect đến VNPay thành công
- Thanh toán thành công → order status = Paid
- Service được active cho user
- Subscription được tạo (nếu là subscription service)
- Tổng tiền áp dụng sale price đúng (nếu có)

---

### TC-SERVICE-004: Purchase Service - VNPay Cancel
**Description:** Hủy thanh toán VNPay  
**Pre-conditions:** Có order đang pending

**Priority:** Medium

**Steps:**
1. Tạo order → redirect VNPay
2. (Giả lập) Click "Hủy" / "Cancel" trên VNPay
3. Callback về site với status cancel
4. Verify order status

**Expected Results:**
- Order status = Cancelled hoặc Failed
- Service không được active
- User có thể tạo order mới

---

### TC-SERVICE-005: View My Services
**Description:** Xem danh sách dịch vụ đã mua  
**Pre-conditions:** Đã mua ≥1 services

**Priority:** Medium

**Steps:**
1. Vào "Dịch vụ của tôi" / "My Services"
2. Quan sát danh sách services đã mua
3. Verify thông tin: Tên service, Ngày mua, Trạng thái (Active/Expired), Ngày hết hạn

**Expected Results:**
- Hiển thị đầy đủ services đã mua
- Thông tin đúng: Tên, Ngày mua, Status, Expiry date
- Services Active có thể sử dụng
- Services Expired không thể sử dụng

---

## PHẦN 8: REPORTS & ANALYTICS

### TC-REPORT-001: View Recruitment Dashboard
**Description:** Xem dashboard tuyển dụng  
**Pre-conditions:** 
- Đã login Leader Recruiter
- Có dữ liệu: jobs, applications

**Priority:** High

**Steps:**
1. Vào `/recruiter/recruitment-report` hoặc dashboard
2. Quan sát các metrics:
   - Tổng số job
   - Tổng số ứng tuyển
   - Tỉ lệ duyệt
   - Jobs theo trạng thái
3. Verify số liệu khớp với dữ liệu thực

**Expected Results:**
- Dashboard hiển thị đầy đủ metrics
- Số liệu chính xác, khớp với database
- Charts/graphs hiển thị đúng (nếu có)
- UI/UX rõ ràng

---

### TC-REPORT-002: Filter Reports by Date Range
**Description:** Lọc báo cáo theo khoảng thời gian  
**Pre-conditions:** Có dữ liệu trong nhiều tháng

**Priority:** Medium

**Steps:**
1. Mở recruitment report
2. Chọn date range: 30 ngày gần nhất
3. Click "Áp dụng" / "Apply"
4. Verify các metrics cập nhật theo date range
5. Chọn date range khác: 7 ngày
6. Verify metrics cập nhật lại

**Expected Results:**
- Filter date range hoạt động
- Metrics cập nhật đúng theo date range
- Số liệu khớp với dữ liệu trong khoảng thời gian đã chọn

---

### TC-REPORT-003: Export Report (nếu có)
**Description:** Xuất báo cáo ra file  
**Pre-conditions:** Có dữ liệu trong report

**Priority:** Low

**Steps:**
1. Mở recruitment report
2. Click "Xuất Excel" / "Export Excel" (nếu có)
3. Verify file được tải về
4. Mở file → đối chiếu dữ liệu

**Expected Results:**
- File được tải về thành công
- Dữ liệu trong file khớp với UI
- Format đúng (Excel/PDF)

---

## PHẦN 9: INTEGRATION & END-TO-END FLOWS

### TC-FLOW-001: Complete Job Posting Flow
**Description:** Luồng hoàn chỉnh từ tạo job đến candidate apply  
**Pre-conditions:** Đã login Leader Recruiter

**Priority:** High

**Steps:**
1. Tạo campaign mới
2. Tạo job Draft trong campaign
3. Submit job → Pending
4. (Switch role) Employee approve → Active
5. (Switch role) Candidate search → tìm thấy job
6. Candidate apply job
7. (Switch role) Leader view application → Approve
8. (Switch role) Candidate nhận notification

**Expected Results:**
- Tất cả các bước hoạt động đúng
- Dữ liệu nhất quán giữa các roles
- Notifications được gửi đúng
- End-to-end flow hoàn chỉnh

---

### TC-FLOW-002: Complete Candidate Invite Flow
**Description:** Luồng hoàn chỉnh từ search candidate đến invite  
**Pre-conditions:** Đã login Leader Recruiter

**Priority:** High

**Steps:**
1. Search candidate với keyword + filters
2. Xem candidate profile
3. Send invite gắn với job
4. (Switch role) Candidate nhận notification
5. Candidate click notification → xem job detail
6. Candidate apply job (nếu muốn)

**Expected Results:**
- Search trả kết quả đúng
- Invite gửi thành công
- Candidate nhận notification
- Notification link đến job detail đúng
- Flow hoàn chỉnh

---

### TC-FLOW-003: Complete Service Purchase Flow
**Description:** Luồng hoàn chỉnh từ xem service đến active  
**Pre-conditions:** Đã login Leader Recruiter

**Priority:** High

**Steps:**
1. Xem danh sách services
2. Add service to cart
3. Checkout → tạo order
4. Thanh toán VNPay → thành công
5. Callback về site → order Paid
6. Service được active
7. Sử dụng service (VD: boost job)

**Expected Results:**
- Order tạo đúng
- Thanh toán thành công
- Service được active
- Có thể sử dụng service ngay
- Flow hoàn chỉnh

---

## SUMMARY

**Total Test Cases:** 30+ test cases

**Priority Breakdown:**
- High: 20 test cases
- Medium: 8 test cases
- Low: 2 test cases

**Coverage:**
- ✅ Authentication & Session (9 test cases)
- ✅ Job Management (9 test cases)
- ✅ Recruitment Campaign (6 test cases)
- ✅ Candidate Search & Invite (6 test cases)
- ✅ Application Management (5 test cases)
- ✅ HR Staff Management (7 test cases)
- ✅ Services & Payment (5 test cases)
- ✅ Reports & Analytics (3 test cases)
- ✅ Integration & End-to-End Flows (3 test cases)

**Execution Notes:**
- Cần test data: jobs (Draft, Pending, Active, Closed), campaigns, candidates (public CV), applications (Pending, Approved, Rejected), services + sale prices, HR staff accounts
- Với payment: dùng VNPay sandbox; kiểm tra order/subscription state sau callback
- Với search: đảm bảo Lucene index đã re-index
- Kiểm tra cả UI feedback (toast/modal) và database/state consistency
- Test với nhiều roles: Leader, HR Staff, Employee, Candidate
