# Use Case Specification: Add Rejection Notes for Recruiter

## Primary Actors

Employee/Admin

## Description

As an Employee/Admin, I want to be able to add rejection notes when rejecting a company profile so that the recruiter understands why their company verification was rejected and what they need to do to fix the issues. The rejection notes are required when rejecting a company and will be communicated to the recruiter via email notification. These notes help recruiters understand the specific reasons for rejection and guide them on how to correct their company information for resubmission.

## Preconditions

1. User has logged into the system
2. User has the role of Employee/Admin (system_employee role)
3. Company exists in the system
4. Company has "pending" verification status
5. User is viewing the company detail in the Company Verification page
6. User has clicked the "Từ chối" (Reject) button
7. Rejection modal is displayed

## Postconditions

1. Rejection notes are entered and saved with the company rejection
2. Rejection notes are stored in the company's RejectionNotes field
3. Rejection notes will be sent to the recruiter via email notification (TODO: email implementation)
4. Rejection notes are visible in the company detail view for rejected companies
5. Company status is changed to "rejected" with the rejection notes attached

## Normal Sequence/Flow

1. User (Employee/Admin) navigates to the Company Verification page

2. User views the list of pending companies

3. User selects a company from the list to view details

4. System displays the company detail panel with company information and legal documents

5. User reviews the company information and legal documents

6. User clicks "Từ chối" (Reject) button

7. System displays rejection modal dialog with:
   - Title: "Từ chối công ty" (Reject Company)
   - Textarea field for rejection notes (required)
   - Placeholder: "Nhập lý do từ chối công ty này. Lý do này sẽ được gửi cho Recruiter..." (Enter the reason for rejecting this company. This reason will be sent to Recruiter...)
   - "Hủy" (Cancel) button
   - "Xác nhận từ chối" (Confirm Rejection) button (disabled if rejection notes is empty)

8. User enters rejection reason in the textarea field:
   - User types detailed explanation of why the company is being rejected
   - User may include specific issues found in legal documents
   - User may provide guidance on what needs to be corrected

9. System enables "Xác nhận từ chối" button when textarea has content

10. User clicks "Xác nhận từ chối" (Confirm Rejection) button

11. System validates rejection notes:
    - Rejection notes must not be empty or whitespace
    - If empty, system displays error: "Vui lòng nhập lý do từ chối" (Please enter rejection reason)
    - If valid, system proceeds

12. System calls API `rejectCompany(id, rejectDto)` from frontend with RejectCompanyDto containing rejectionNotes

13. System receives request and verifies:
    - User is authenticated
    - User has Employee/Admin role (system_employee)
    - Company exists in the database

14. System checks company verification status:
    - Company LegalVerificationStatus must be "pending"
    - If status is not "pending", system throws error

15. System validates rejection notes:
    - Rejection notes must not be null or whitespace
    - If invalid, system throws error

16. System updates company:
    - Sets `LegalVerificationStatus = "rejected"`
    - Sets `VerificationStatus = false`
    - Sets `LegalReviewedAt = DateTime.UtcNow`
    - Sets `RejectionNotes = input.RejectionNotes` (saves rejection notes)
    - Sets `LegalReviewedBy = null` (temporarily, due to database schema)

17. System saves updated company to database with rejection notes

18. System returns success response (NoContent)

19. System receives response and displays success message: "Đã từ chối công ty thành công" (Company rejected successfully)

20. System closes the rejection modal

21. System closes the company detail panel

22. System refreshes the company list to reflect the status change

23. System prepares rejection notes for email notification to recruiter (TODO: email implementation)

## Alternative Sequences/Flows

### Step 7_User cancels adding rejection notes

User can cancel adding rejection notes in the following case:

1. User cancels: User clicks "Hủy" (Cancel) button or clicks outside the modal
   - System closes the rejection modal
   - System keeps the company detail panel open
   - Rejection notes are not saved
   - Use case ends (no changes made)

### Step 8_User doesn't enter rejection notes

User can't submit rejection without notes in the following case:

1. Rejection notes is empty: User clicks "Xác nhận từ chối" button without entering rejection notes
   - System validates and finds rejection notes is empty or whitespace
   - System disables the "Xác nhận từ chối" button (button is already disabled if textarea is empty)
   - System displays error message: "Vui lòng nhập lý do từ chối" (Please enter rejection reason)
   - User cannot proceed with rejecting the company
   - User must enter rejection notes

### Step 11_System validates rejection notes on frontend

System validates rejection notes before API call in the following case:

1. Rejection notes is empty: System checks if rejection notes is empty or only whitespace
   - System displays error toast: "Vui lòng nhập lý do từ chối" (Please enter rejection reason)
   - System does not call API
   - User must enter rejection notes

### Step 13_System can't validate the user

User can't add rejection notes & get relevant error message in the following cases:

1. User not authenticated: User is not logged into the system
   - System returns 401 Unauthorized
   - System redirects user to login page
   - User cannot proceed with adding rejection notes
   - User must log in first

2. User doesn't have required role: User does not have Employee/Admin role (system_employee)
   - System returns 403 Forbidden
   - System displays access denied message
   - User cannot proceed with adding rejection notes

### Step 14_System can't validate the company status

User can't add rejection notes & get relevant error message in the following cases:

1. Company does not exist: Company is not found in the system
   - System displays error message: "Company not found"
   - System returns 404 Not Found or 400 Bad Request
   - User cannot proceed with adding rejection notes

2. Company not in pending status: Company LegalVerificationStatus is not "pending"
   - System displays error message: "Chỉ có thể từ chối các công ty đang ở trạng thái chờ xác thực." (Can only reject companies with pending status)
   - System returns 400 Bad Request
   - User cannot proceed with adding rejection notes
   - Company must be in pending status to be rejected

### Step 15_System can't validate rejection notes

System can't validate rejection notes & display error message in the following case:

1. Rejection notes is empty: Rejection notes is null, empty, or whitespace
   - System displays error message: "Vui lòng nhập lý do từ chối." (Please enter rejection reason)
   - System returns 400 Bad Request
   - User cannot proceed with rejecting the company
   - User must provide rejection notes

### Step 17_System can't save rejection notes

System can't save the rejection notes & display error message in the following cases:

1. Database error: Database is unavailable or update fails
   - System catches database error
   - System displays error toast notification: "Từ chối công ty thất bại" (Failed to reject company)
   - System keeps the rejection modal open with entered notes preserved
   - User can retry the rejection

2. API endpoint unavailable: API endpoint is down or unreachable
   - System catches network/API error
   - System displays error toast notification: "Từ chối công ty thất bại" (Failed to reject company)
   - System keeps the rejection modal open with entered notes preserved
   - User can retry the rejection








