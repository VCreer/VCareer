# Rejected Company Detail Screen - Field Description & Action Types

## This screen allows the Employee to:

1. **View rejected company details** - View detailed information of a company that has been rejected
2. **View rejection information** - See the rejection date and rejection reason for the company
3. **Approve again** - Re-approve a previously rejected company after they have updated their information

## On this screen, the user can also:

1. **View company basic information** - See company contact details, address, website, size, founded year, and description
2. **View legal documents** - Access company registration certificate and other legal documents
3. **View registrant information** - See the name and email of the recruiter who registered the company
4. **Close detail view** - Close the company detail panel and return to the list view
5. **View PDF documents** - Open PDF files in a new tab

---

## Field Description

| Field Name | Description |
|------------|-------------|
| **Mã công ty** | Displays company code identifier in company card (e.g., "Mã: #4"). Action type: View |
| **Tên công ty** | Displays company name in company card (e.g., "Tập đoàn try hard"). Action type: View |
| **Email** | Displays company contact email address in company card. Action type: View |
| **Điện thoại** | Displays company contact phone number in company card. Action type: View |
| **Mã số thuế** | Displays tax identification number (MST) in company card. Action type: View |
| **Người đăng ký** | Displays lead recruiter name in company card. Action type: View |
| **Ngày tạo** | Displays the date when company was created in company card. Format: DD/MM/YYYY. Action type: View |
| **Trạng thái** | Displays rejection status badge "Đã từ chối" (Rejected) in company card. Action type: View |
| **Mã công ty (chi tiết)** | Displays company code in detail panel header (e.g., "Mã công ty: #4"). Action type: View |
| **Tên công ty (chi tiết)** | Displays company name in detail panel header. Action type: View |
| **Nút đóng** | Button to close company detail panel and return to list view. Action type: Navigate |
| **Email (chi tiết)** | Displays company contact email address in basic information section. Action type: View |
| **Điện thoại (chi tiết)** | Displays company contact phone number in basic information section. Action type: View |
| **Địa chỉ** | Displays company headquarters address. Action type: View |
| **Website** | Displays company website URL as clickable link. Action type: View, Navigate |
| **Quy mô** | Displays company size (number of employees). Action type: View |
| **Năm thành lập** | Displays the year when company was founded. Action type: View |
| **Mô tả** | Displays company description/bio. Action type: View |
| **Giấy đăng ký doanh nghiệp** | Displays company registration certificate document label. Action type: View |
| **PDF File** | Displays PDF file indicator with PDF icon. Action type: View |
| **Nút Xem PDF** | Button to view PDF document in new tab. Action type: Open |
| **Tên người đăng ký** | Displays lead recruiter name who registered the company. Action type: View |
| **Email người đăng ký** | Displays lead recruiter email who registered the company. Action type: View |
| **Ngày từ chối** | Displays the date when company was rejected. Format: DD/MM/YYYY. Action type: View |
| **Lý do từ chối** | Displays rejection reason text in a highlighted input field with red border. Shows the reason why company was rejected. Action type: View |
| **Nút Duyệt lại** | Button to approve a previously rejected company again. Changes status from "rejected" to "approved". Action type: Approve Again |

---

## Action Type Definitions

| Action Type | Description |
|-------------|-------------|
| `VIEW` | Display information or field. Read-only display of data. |
| `NAVIGATE` | Navigate to different view, tab, page, or external link. |
| `OPEN` | Open document in new tab or modal viewer (for images or PDFs). |
| `APPROVE_AGAIN` | Approve a previously rejected company again. Changes status from "rejected" to "approved", sets VerificationStatus = true, and clears rejection notes. API: `POST /api/profile/company-legal-info/{id}/approve` |

---

## Notes

- This screen is displayed when viewing companies in the "Đã từ chối" (Rejected) tab
- Rejection reason is displayed in a read-only field with red border to highlight it
- Only companies with "rejected" status can be approved again
- When approving again, the company status changes to "approved" and rejection notes are cleared
- After approving again, the company is moved from rejected list to verified list
- All actions require Employee/Admin role (system_employee)


