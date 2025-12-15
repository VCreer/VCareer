# SYSTEM TEST CASES - FINANCE EMPLOYEE (VCAREER)

**Test Level:** System Test (End-to-End)  
**Role:** FINANCE_EMPLOYEE  
**Total Test Cases:** 10

---

## TC-SYS-FINANCE-001: Login → Manage Subscription Services
**Description:** Finance employee login và quản lý subscription services  
**Pre-conditions:** Đã có tài khoản finance employee  
**Priority:** High

**Test Steps:**
1. Navigate to `/employee/login`
2. Login với email/password của finance employee
3. Verify login thành công, redirect to employee homepage
4. Navigate to "Quản lý gói dịch vụ" (`/employee/manage-service-packages`)
5. Verify danh sách subscription services hiển thị
6. Click "Tạo gói dịch vụ mới"
7. Fill form:
   - Title: "Gói Premium"
   - Description, Target (Candidate/Recruiter)
   - Original Price: 500000
   - Duration, Status
8. Click "Tạo"
9. Verify service được tạo thành công
10. Test edit service:
    - Click "Sửa" trên service vừa tạo
    - Update price, description
    - Save
11. Verify changes được lưu

**Expected Results:**
- Login thành công
- Service list hiển thị đầy đủ
- Create service thành công
- Edit service thành công
- Data được lưu đúng

---

## TC-SYS-FINANCE-002: Create Sale Price for Subscription Service
**Description:** Tạo giá bán (sale price) cho subscription service  
**Pre-conditions:** Đã login, có ít nhất 1 subscription service trong hệ thống  
**Priority:** High

**Test Steps:**
1. Navigate to "Quản lý giá bán" hoặc từ service detail
2. Click "Tạo giá bán mới"
3. Fill form:
   - Select Subscription Service từ dropdown
   - Sale Percent: 20 (giảm 20%)
   - Effective From: Ngày mai
   - Effective To: 30 ngày sau
4. Click "Tạo"
5. Verify:
   - Toast success: "Tạo giá bán thành công"
   - Sale price xuất hiện trong list
   - Status mặc định: Active
6. Verify calculated price:
   - Original Price: 500000
   - Sale Percent: 20%
   - Final Price: 400000 (500000 * 0.8)

**Expected Results:**
- Sale price được tạo thành công
- Validation pass (sale percent 0-100, dates valid)
- Price được calculate đúng
- Status mặc định là Active
- Data được lưu vào database

---

## TC-SYS-FINANCE-003: Create Sale Price - Conflict Time Validation
**Description:** Không cho phép tạo sale price trùng thời gian  
**Pre-conditions:** Đã login, có 1 sale price active cho service A (01/03 - 31/03)  
**Priority:** High

**Test Steps:**
1. Navigate to create sale price form
2. Select Service A
3. Test case 1: Overlap hoàn toàn
   - Effective From: 15/03
   - Effective To: 20/03
   - Click "Tạo"
   - Verify error: "Conflict time with other price"
4. Test case 2: Overlap một phần
   - Effective From: 25/03
   - Effective To: 15/04
   - Click "Tạo"
   - Verify error: "Conflict time with other price"
5. Test case 3: Không overlap (hợp lệ)
   - Effective From: 01/04
   - Effective To: 30/04
   - Click "Tạo"
   - Verify thành công

**Expected Results:**
- Validation detect conflict time đúng
- Error message rõ ràng
- Không tạo duplicate sale price
- Chỉ cho phép tạo khi không conflict

---

## TC-SYS-FINANCE-004: Update Sale Price
**Description:** Cập nhật sale price (chỉ cho phép update price chưa effect)  
**Pre-conditions:** Đã login, có 1 sale price chưa effect (Effective From > today)  
**Priority:** High

**Test Steps:**
1. Navigate to sale price list
2. Find sale price chưa effect (Price X)
3. Click "Sửa" trên Price X
4. Update:
   - Sale Percent: 20 → 30
   - Effective From: Update date
   - Effective To: Update date
5. Click "Cập nhật"
6. Verify update thành công
7. Test update price đang effect:
   - Find sale price đang effect (Price Y)
   - Click "Sửa"
   - Verify error: "You can't edit active price in effect period"
   - Hoặc button "Sửa" disabled

**Expected Results:**
- Update price chưa effect thành công
- Không cho phép update price đang effect
- Validation đúng
- Data được lưu đúng

---

## TC-SYS-FINANCE-005: Activate/Deactivate Sale Price
**Description:** Bật/tắt sale price  
**Pre-conditions:** Đã login, có sale prices với các status khác nhau  
**Priority:** High

**Test Steps:**
1. Navigate to sale price list
2. Test activate:
   - Find sale price inactive (Price A)
   - Click "Kích hoạt" hoặc toggle
   - Verify:
     - Price A status chuyển thành Active
     - Toast success: "Đã kích hoạt giá bán"
3. Test deactivate:
   - Find sale price active (Price B)
   - Click "Vô hiệu hóa" hoặc toggle
   - Verify:
     - Price B status chuyển thành Inactive
     - Toast success: "Đã vô hiệu hóa giá bán"
4. Test activate price expired:
   - Find sale price expired (Effective To < today)
   - Click "Kích hoạt"
   - Verify error: "You can't activate an expired price"
5. Test activate price conflict:
   - Find sale price inactive có conflict time với price active
   - Click "Kích hoạt"
   - Verify error: "Conflict time with other price"

**Expected Results:**
- Activate/Deactivate hoạt động đúng
- Không cho phép activate price expired
- Không cho phép activate price conflict
- Status update đúng
- Data consistent

---

## TC-SYS-FINANCE-006: Delete Sale Price
**Description:** Xóa sale price (chỉ cho phép xóa price chưa effect)  
**Pre-conditions:** Đã login, có sale prices với các status khác nhau  
**Priority:** Medium

**Test Steps:**
1. Navigate to sale price list
2. Test delete price chưa effect:
   - Find sale price chưa effect (Price C)
   - Click "Xóa"
   - Confirm trong modal
   - Verify:
     - Price C bị xóa khỏi list
     - Toast success: "Đã xóa giá bán"
3. Test delete price đang effect:
   - Find sale price đang effect (Price D)
   - Click "Xóa"
   - Verify error: "You can't delete active price in effect period"
   - Hoặc button "Xóa" disabled
4. Test delete price expired:
   - Find sale price expired
   - Click "Xóa"
   - Verify error: "You can't delete expired subcription price"

**Expected Results:**
- Delete price chưa effect thành công
- Không cho phép delete price đang effect
- Không cho phép delete price expired
- Validation đúng

---

## TC-SYS-FINANCE-007: Manage Child Services
**Description:** Quản lý child services (tạo, sửa, xóa)  
**Pre-conditions:** Đã login  
**Priority:** High

**Test Steps:**
1. Navigate to "Quản lý dịch vụ con" (`/employee/manage-sub-service-packages`)
2. Verify danh sách child services hiển thị
3. Click "Tạo dịch vụ con mới"
4. Fill form:
   - Name: "Tăng priority job"
   - Description, Action, Target
   - Priority Level, Duration
   - Is Active: true
5. Click "Tạo"
6. Verify child service được tạo thành công
7. Test edit:
   - Click "Sửa" trên child service
   - Update name, description
   - Save
8. Verify changes được lưu
9. Test delete:
   - Click "Xóa" trên child service
   - Confirm
   - Verify child service bị xóa

**Expected Results:**
- Child service list hiển thị đầy đủ
- Create child service thành công
- Edit child service thành công
- Delete child service thành công
- Data được lưu đúng

---

## TC-SYS-FINANCE-008: Add Child Services to Subscription Service
**Description:** Thêm child services vào subscription service  
**Pre-conditions:** Đã login, có subscription service và child services  
**Priority:** Medium

**Test Steps:**
1. Navigate to "Quản lý gói dịch vụ"
2. Click "Sửa" trên một subscription service (Service X)
3. Navigate to tab "Dịch vụ con" hoặc section "Child Services"
4. Click "Thêm dịch vụ con"
5. Select 2 child services từ dropdown/checkbox list
6. Click "Thêm"
7. Verify 2 child services xuất hiện trong list
8. Test remove:
   - Click "Xóa" trên một child service
   - Verify child service bị xóa khỏi list
9. Save subscription service
10. Verify changes được lưu

**Expected Results:**
- Add child services thành công
- Remove child service thành công
- List hiển thị đúng child services
- Data được lưu đúng

---

## TC-SYS-FINANCE-009: View Sale Price List with Filters
**Description:** Xem danh sách sale prices với filters và pagination  
**Pre-conditions:** Đã login, có nhiều sale prices trong hệ thống  
**Priority:** Medium

**Test Steps:**
1. Navigate to sale price management page
2. Verify danh sách hiển thị với columns:
   - Service name, Sale percent, Effective dates, Status
3. Filter theo service:
   - Select một service từ dropdown
   - Verify chỉ hiển thị prices của service đó
4. Filter theo status:
   - Select "Active"
   - Verify chỉ hiển thị prices active
5. Search với keyword:
   - Nhập keyword vào search box
   - Verify kết quả được filter
6. Test pagination:
   - Click "Trang 2"
   - Verify prices trang 2 được load
7. Sort theo column:
   - Click header "Effective From"
   - Verify prices được sort

**Expected Results:**
- Sale price list hiển thị đầy đủ
- Filters hoạt động đúng
- Search hoạt động
- Pagination hoạt động
- Sort hoạt động

---

## TC-SYS-FINANCE-010: Verify Sale Price Impact on User Purchase
**Description:** Verify sale price ảnh hưởng đến giá khi user mua  
**Pre-conditions:** Đã login, có sale price active cho một service  
**Priority:** Low

**Test Steps:**
1. Tạo sale price active:
   - Service: "Gói Premium"
   - Original Price: 500000
   - Sale Percent: 20%
   - Effective From: Hôm nay
   - Effective To: 30 ngày sau
2. Login as recruiter (hoặc candidate)
3. Navigate to "Mua dịch vụ"
4. Verify "Gói Premium" hiển thị:
   - Original Price: 500000 (gạch ngang)
   - Sale Price: 400000 (highlight)
   - Badge "Giảm 20%"
5. Add to cart và verify total amount = 400000
6. Complete purchase flow
7. Verify order total = 400000 (không phải 500000)

**Expected Results:**
- Sale price được apply đúng khi user mua
- UI hiển thị giá sale rõ ràng
- Order total = sale price (không phải original price)
- Data consistent giữa finance management và user purchase

---

## SUMMARY

**Total Test Cases:** 10  
**Priority Distribution:**
- High: 6 test cases (Login, Create Sale Price, Conflict Validation, Update, Activate/Deactivate, Manage Child Services)
- Medium: 3 test cases (Delete, Add Child Services, View with Filters)
- Low: 1 test case (Verify Impact on Purchase)

**Key Test Areas:**
- Subscription Service Management (Create, Update, Delete)
- Sale Price Management (Create, Update, Delete, Activate/Deactivate)
- Conflict Time Validation
- Child Service Management
- Add/Remove Child Services to Subscription Service
- Filters, Search, Pagination
- Impact on User Purchase

**Test Execution Notes:**
- Cần data test: Subscription services, Child services, Sale prices với các status
- Verify business rules: Conflict time, Active/Inactive rules, Expired price rules
- Test cả positive và negative scenarios
- Verify data consistency giữa finance management và user-facing features









