# Company Verification Screen - Field Description & Action Types

## This screen allows the Employee to:

1. **View pending company verifications** - View list of companies waiting for verification approval
2. **View verified companies** - View list of companies that have been approved and verified
3. **View rejected companies** - View list of companies that have been rejected
4. **Approve company profile** - Approve a pending company, changing its status to "approved" and enabling full platform access
5. **Reject company profile** - Reject a pending company with rejection notes, changing its status to "rejected"
6. **Approve again** - Re-approve a previously rejected company after they have updated their information
7. **View verified company statistics** - View total count of verified companies and related statistics

## On this screen, the user can also:

1. **Search companies** - Search for companies by company name, tax code, email, or company code
2. **View company details** - Click on a company card to view detailed information including basic info, legal documents, and recruiter information
3. **View legal documents** - View business license, tax certificate, representative ID card, and other supporting documents as images or PDFs
4. **Navigate between tabs** - Switch between Pending, Verified, and Rejected tabs to view different company lists
5. **Navigate pages** - Use pagination to browse through multiple pages of companies
6. **Download documents** - Download legal documents and supporting files
7. **View images in modal** - Open document images in a full-screen modal viewer
8. **Close detail view** - Close the company detail panel to return to the list view

---

## Field Description

| Field Name | Description |
|------------|-------------|
| **Tab chọn** | Displays three tabs: "Chờ xác thực" (Pending), "Đã xác minh" (Verified), and "Đã từ chối" (Rejected). Action type: View, Navigate |
| **Thanh tìm kiếm** | Input field to search companies by company name, tax code, email, or company code. Action type: Input, Search |
| **Mã công ty** | Displays company code identifier (e.g., "Mã: #4"). Action type: View |
| **Tên công ty** | Displays company name (e.g., "Tập đoàn try hard"). Action type: View |
| **Email** | Displays company contact email address. Action type: View |
| **Điện thoại** | Displays company contact phone number. Action type: View |
| **Mã số thuế** | Displays tax identification number (MST). Action type: View |
| **Người đăng ký** | Displays lead recruiter name associated with the company. Action type: View |
| **Ngày tạo** | Displays the date when company was created. Format: DD/MM/YYYY. Action type: View |
| **Trạng thái** | Displays verification status badge: "Chờ xác thực", "Đã xác minh", or "Đã từ chối". Action type: View |
| **Danh sách công ty** | Vertical list of company cards that meet the filter and search conditions. Action type: Scroll |
| **Mã công ty (chi tiết)** | Displays company code in detail panel header (e.g., "Mã công ty: #4"). Action type: View |
| **Nút đóng** | Button to close company detail panel and return to list view. Action type: Navigate |
| **Email (chi tiết)** | Displays company contact email address in basic information section. Action type: View |
| **Điện thoại (chi tiết)** | Displays company contact phone number in basic information section. Action type: View |
| **Địa chỉ** | Displays company headquarters address. Action type: View |
| **Website** | Displays company website URL as clickable link. Action type: View, Navigate |
| **Quy mô** | Displays company size (number of employees). Action type: View |
| **Năm thành lập** | Displays the year when company was founded. Action type: View |
| **Mô tả** | Displays company description/bio. Action type: View |
| **Giấy đăng ký doanh nghiệp** | Displays company registration certificate document. Can be image or PDF. Action type: View, Download, Open |
| **Nút Xem PDF** | Button to view PDF document in new tab. Action type: Open |
| **Tên người đăng ký** | Displays lead recruiter name who registered the company. Action type: View |
| **Email người đăng ký** | Displays lead recruiter email who registered the company. Action type: View |
| **Nút Duyệt** | Button to approve a pending or rejected company. Action type: Approve |
| **Nút Từ chối** | Button to reject a pending company. Opens reject modal. Action type: Reject |
| **Thống kê** | Displays total count of verified companies in summary card (on Verified tab). Action type: View, Statistic |
| **Phân trang** | Displays pagination controls to navigate between pages. Action type: View, Navigate |
| **Modal từ chối** | Modal dialog to enter rejection reason. Action type: Modal, Input, Required |
| **Lý do từ chối** | Textarea input for rejection reason in reject modal. Action type: Input, Required |
| **Nút Xác nhận từ chối** | Button to confirm rejection after entering rejection notes. Action type: Reject |
| **Nút Hủy** | Button to cancel reject modal without submitting. Action type: Modal |

---

## Action Type Definitions

| Action Type | Description |
|-------------|-------------|
| `VIEW` | Display information or field. Read-only display of data. |
| `NAVIGATE` | Navigate to different view, tab, page, or external link. |
| `SELECT` | Select a company from the list to view details. |
| `MODAL` | Open/close modal dialog (reject modal, image viewer modal). |
| `STATISTIC` | Display statistical information (total verified companies count). |
| `INPUT` | User can enter or modify text/data in input field or textarea. |
| `SEARCH` | Search/filter company list based on keyword. |
| `REQUIRED` | Required field that must be filled before action can be completed. |
| `ACTION` | General action button that triggers a specific operation. |
| `APPROVE` | Approve a pending or rejected company. Changes status to "approved" and sets VerificationStatus = true. API: `POST /api/profile/company-legal-info/{id}/approve` |
| `REJECT` | Reject a pending company. Changes status to "rejected", sets VerificationStatus = false, and saves rejection notes. API: `POST /api/profile/company-legal-info/{id}/reject` |
| `APPROVE_AGAIN` | Approve a previously rejected company again. Same as APPROVE but specifically for rejected companies. API: `POST /api/profile/company-legal-info/{id}/approve` |
| `DOWNLOAD` | Download document file (PDF or other file types). |
| `OPEN` | Open document in new tab or modal viewer (for images or PDFs). |

---

## Notes

- All actions require Employee/Admin role (system_employee)
- Approve action can be performed on companies with status "pending" or "rejected"
- Reject action can only be performed on companies with status "pending"
- Rejection notes are required when rejecting a company
- Documents can be viewed as images (in modal) or downloaded as files
- Statistics are calculated automatically when viewing verified companies tab
- Default items per page: 7 companies
- Search is case-insensitive and searches across company name, tax code, email, and company code
