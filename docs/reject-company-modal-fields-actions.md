# Reject Company Modal - Field Description & Action Types

## This screen allows the Employee to:

1. **Reject a pending company** - Reject a company that is waiting for verification by providing a rejection reason
2. **Enter rejection reason** - Input detailed explanation for why the company is being rejected
3. **Send rejection notification** - The rejection reason will be sent to the Recruiter who registered the company

## On this screen, the user can also:

1. **Cancel rejection** - Close the modal without submitting the rejection
2. **View instructions** - See guidance that the rejection reason will be sent to the Recruiter
3. **Resize textarea** - Adjust the size of the rejection reason input field

---

## Field Description

| Field Name | Description |
|------------|-------------|
| **Tiêu đề** | Displays modal title "Từ chối công ty" (Reject company). Action type: View |
| **Hướng dẫn** | Displays instruction text "Nhập rõ lý do, hệ thống sẽ gửi cho Recruiter." (Enter the reason clearly, the system will send it to the Recruiter.). Action type: View |
| **Lý do từ chối** | Label for rejection reason input field with required indicator (*). Action type: View |
| **Ô nhập lý do** | Textarea input field to enter rejection reason. Placeholder: "Nhập lý do từ chối công ty này. Lý do này sẽ được gửi cho Recruiter..." (Enter the reason for rejecting this company. This reason will be sent to the Recruiter...). Action type: Input, Required |
| **Nút Hủy** | Button to cancel rejection and close modal without submitting. Action type: Modal |
| **Nút Xác nhận từ chối** | Button to confirm rejection after entering rejection reason. Submits reject action. Action type: Reject |
| **Nút đóng** | Close icon (X) in top-right corner to close modal without submitting. Action type: Modal |

---

## Action Type Definitions

| Action Type | Description |
|-------------|-------------|
| `VIEW` | Display information or field. Read-only display of data. |
| `INPUT` | User can enter or modify text/data in textarea field. |
| `REQUIRED` | Required field that must be filled before action can be completed. |
| `MODAL` | Open/close modal dialog. |
| `REJECT` | Reject a pending company. Changes status to "rejected", sets VerificationStatus = false, and saves rejection notes. API: `POST /api/profile/company-legal-info/{id}/reject` |

---

## Notes

- Rejection reason is required - the "Xác nhận từ chối" button is disabled until rejection notes are entered
- Rejection reason will be sent to the Recruiter who registered the company
- Modal can be closed by clicking "Hủy" button, close icon (X), or clicking outside the modal
- After successful rejection, the modal closes automatically and company list is refreshed
- Only companies with "pending" status can be rejected


