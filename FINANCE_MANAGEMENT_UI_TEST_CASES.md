# UI TEST CASES - FINANCE MANAGEMENT (SALE PRICE FOR SUBSCRIPTION SERVICE)

Format per case: **Description** | **Procedure** | **Expected Result**  
Pre-conditions: Logged in as finance/admin (role allowed to manage subscription prices).

---

## 1) Create Sale Price for Subscription Service

- **TC-CREATE-SUCCESS**  
  Description: Tạo giá bán mới cho gói subscription.  
  Procedure:  
  - Login as finance/admin  
  - Open Finance Management → Subscription Prices → Create  
  - Select Subscription Service  
  - Enter price, currency, effective date (start), optional end date  
  - Save  
  Expected Result:  
  - Toast success; new price appears in list with correct values  
  - Status defaults to active (or per business rule)  
  - API create price called with bearer token

- **TC-CREATE-REQUIRED-FIELDS**  
  Description: Validation khi thiếu trường bắt buộc.  
  Procedure:  
  - Open create form  
  - Leave price or service unset  
  - Click Save  
  Expected Result:  
  - Inline errors for required fields  
  - No API call

- **TC-CREATE-DATE-RANGE-INVALID**  
  Description: End date trước start date.  
  Procedure:  
  - Set start date = today, end date = yesterday  
  - Save  
  Expected Result:  
  - Validation error shown; form not submitted

- **TC-CREATE-DUPLICATE-OVERLAP**  
  Description: Không cho phép tạo giá trùng thời gian cho cùng dịch vụ.  
  Procedure:  
  - Chọn service A  
  - Nhập date range trùng với một giá đã tồn tại  
  - Save  
  Expected Result:  
  - Error message: overlapping sale price not allowed  
  - No duplicate record created

- **TC-CREATE-NETWORK-ERROR**  
  Description: Xử lý lỗi mạng khi tạo giá.  
  Procedure:  
  - Fill valid form  
  - Disconnect network  
  - Save  
  Expected Result:  
  - Error toast shown  
  - Form data retained; can retry

---

## 2) Update Sale Price for Subscription Service

- **TC-UPDATE-SUCCESS**  
  Description: Cập nhật giá bán tồn tại.  
  Procedure:  
  - Open list, pick a price row, click Edit  
  - Change price or date range  
  - Save  
  Expected Result:  
  - Toast success; list reflects new values  
  - API update called with correct payload

- **TC-UPDATE-VALIDATION-REQUIRED**  
  Description: Bỏ trống trường bắt buộc khi cập nhật.  
  Procedure:  
  - Edit price  
  - Clear price value  
  - Save  
  Expected Result:  
  - Validation error; no API call

- **TC-UPDATE-DATE-RANGE-OVERLAP**  
  Description: Không cho phép overlap với giá khác của cùng service.  
  Procedure:  
  - Edit price date range to overlap với một price khác cùng service  
  - Save  
  Expected Result:  
  - Error about overlapping period  
  - Update rejected

- **TC-UPDATE-NETWORK-ERROR**  
  Description: Lỗi mạng khi update.  
  Procedure:  
  - Edit price  
  - Disconnect network  
  - Save  
  Expected Result:  
  - Error toast; data not lost; can retry

---

## 3) Activate Sale Price

- **TC-ACTIVATE-SUCCESS**  
  Description: Kích hoạt một sale price đang inactive.  
  Procedure:  
  - In list, find inactive price → click Activate  
  - Confirm (if modal)  
  Expected Result:  
  - Status changes to Active  
  - Toast success  
  - API activate endpoint called

- **TC-ACTIVATE-CONFLICT-OVERLAP**  
  Description: Không cho active nếu trùng thời gian với price đang active cùng service.  
  Procedure:  
  - Pick inactive price có date range trùng với active price  
  - Click Activate  
  Expected Result:  
  - Error message: overlap not allowed  
  - Status remains inactive

- **TC-ACTIVATE-EXPIRED**  
  Description: Không thể active khi end date đã qua.  
  Procedure:  
  - Inactive price with past end date  
  - Click Activate  
  Expected Result:  
  - Error or blocked action  
  - Status unchanged

---

## 4) Deactivate Sale Price

- **TC-DEACTIVATE-SUCCESS**  
  Description: Vô hiệu hóa giá đang active.  
  Procedure:  
  - Find active price → click Deactivate  
  - Confirm (if modal)  
  Expected Result:  
  - Status → Inactive  
  - Toast success  
  - API deactivate endpoint called

- **TC-DEACTIVATE-NO-CONFIRM**  
  Description: Huỷ thao tác deactivate.  
  Procedure:  
  - Click Deactivate  
  - Click Cancel in modal  
  Expected Result:  
  - Status unchanged  
  - No API call

- **TC-DEACTIVATE-IN-USE**  
  Description: Deactivate khi đang là giá duy nhất active cho service (xem business rule).  
  Procedure:  
  - Active price is the only active record for service  
  - Deactivate  
  Expected Result:  
  - If allowed: status inactive, downstream uses fallback/default logic  
  - If not allowed: error shown, status unchanged

---

## 5) Listing, Filters, and UI

- **TC-LIST-DISPLAY**  
  Description: Bảng hiển thị đúng cột: Service, Price, Currency, Start/End date, Status, Actions.  
  Procedure:  
  - Open Finance Management → Price list  
  Expected Result:  
  - All columns present; actions visible per row (Edit/Activate/Deactivate)

- **TC-FILTER-SERVICE**  
  Description: Lọc theo Subscription Service.  
  Procedure:  
  - Select a service in filter  
  Expected Result:  
  - List shows only prices for that service

- **TC-FILTER-STATUS**  
  Description: Lọc theo trạng thái (Active/Inactive).  
  Procedure:  
  - Choose status filter  
  Expected Result:  
  - List matches selected status

- **TC-PAGINATION**  
  Description: Phân trang danh sách giá.  
  Procedure:  
  - Navigate pages  
  Expected Result:  
  - Data updates per page; page indicators correct

- **TC-SEARCH-KEYWORD**  
  Description: Tìm kiếm theo tên service hoặc code.  
  Procedure:  
  - Enter keyword in search box  
  Expected Result:  
  - Matching rows shown; empty state if none

---

## 6) Authentication & Authorization

- **TC-AUTH-NOT-LOGIN**  
  Description: Truy cập module khi chưa đăng nhập.  
  Procedure:  
  - Logout  
  - Open Finance Management  
  Expected Result:  
  - Redirect to login

- **TC-AUTH-WRONG-ROLE**  
  Description: Role không đủ quyền (candidate/recruiter) truy cập finance.  
  Procedure:  
  - Login as unauthorized role  
  - Open Finance Management  
  Expected Result:  
  - 403 or redirect; no data shown

- **TC-TOKEN-EXPIRED**  
  Description: Token hết hạn khi thao tác.  
  Procedure:  
  - Let token expire  
  - Try create/update/activate/deactivate  
  Expected Result:  
  - 401; prompt to re-login; no state corruption

---

## 7) UI/UX & Loading States

- **TC-LOADING-INDICATOR**  
  Description: Hiển thị loading khi fetch list.  
  Procedure:  
  - Open price list  
  Expected Result:  
  - Spinner/placeholder shown during load; hidden after

- **TC-BUTTON-DISABLE-DURING-SUBMIT**  
  Description: Nút Save/Activate/Deactivate disabled trong khi gửi request.  
  Procedure:  
  - Perform action  
  - Try double-click  
  Expected Result:  
  - Single request; button disabled/loading state

- **TC-TOAST-NOTIFICATIONS**  
  Description: Toast hiển thị thông báo thành công/thất bại.  
  Procedure:  
  - Trigger success and error paths  
  Expected Result:  
  - Toast shows correct message/type; auto-hide; closable

- **TC-FORM-RESET-CANCEL**  
  Description: Hủy form tạo/cập nhật.  
  Procedure:  
  - Open create/edit form  
  - Click Cancel/Close  
  Expected Result:  
  - Modal/form closes; no changes applied

---

## Quick Notes
- Chỉ role finance/admin được phép tạo/cập nhật/kích hoạt/vô hiệu hóa sale price.  
- Không cho phép overlap thời gian cho cùng một subscription service (tránh giá chồng).  
- Activation/deactivation phải kiểm tra business rule: nếu chỉ có một giá active, deactivate có thể cần cảnh báo.  
- Tất cả API cần bearer token; xử lý 401/403 rõ ràng.  














