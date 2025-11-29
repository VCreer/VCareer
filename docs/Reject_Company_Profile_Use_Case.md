# Use Case Specification: Reject Company Profile

## Primary Actors

Employee/Admin

## Description

As an Employee/Admin, I want to be able to reject a company profile so that companies with invalid or incomplete legal information cannot use the platform's services. The rejection changes the company's verification status from "pending" to "rejected", sets the verification status to false, and requires a rejection reason that will be communicated to the recruiter. Companies with "rejected" status cannot post jobs until they update their information and resubmit for verification.

## Preconditions

1. User has logged into the system
2. User has the role of Employee/Admin (system_employee role)
3. Company exists in the system
4. Company has "pending" verification status
5. User is viewing the company detail in the Company Verification page
6. User has permission to reject companies

## Postconditions

1. Company verification status is changed to "rejected"
2. Company VerificationStatus is set to false
3. Company LegalReviewedAt is updated to current timestamp
4. Company RejectionNotes is saved with the rejection reason
5. Company is moved from pending list to rejected list
6. Success message is displayed to the user
7. Company list is refreshed to reflect the status change

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

8. User enters rejection reason in the textarea field

9. User clicks "Xác nhận từ chối" (Confirm Rejection) button

10. System validates rejection notes:
    - Rejection notes must not be empty or whitespace
    - If empty, system displays error: "Vui lòng nhập lý do từ chối" (Please enter rejection reason)
    - If valid, system proceeds

11. System calls API `rejectCompany(id, rejectDto)` from frontend with RejectCompanyDto containing rejectionNotes

12. System receives request and verifies:
    - User is authenticated
    - User has Employee/Admin role (system_employee)
    - Company exists in the database

13. System checks company verification status:
    - Company LegalVerificationStatus must be "pending"
    - If status is not "pending", system throws error

14. System validates rejection notes:
    - Rejection notes must not be null or whitespace
    - If invalid, system throws error

15. System updates company:
    - Sets `LegalVerificationStatus = "rejected"`
    - Sets `VerificationStatus = false`
    - Sets `LegalReviewedAt = DateTime.UtcNow`
    - Sets `RejectionNotes = input.RejectionNotes`
    - Sets `LegalReviewedBy = null` (temporarily, due to database schema)

16. System saves updated company to database

17. System returns success response (NoContent)

18. System receives response and displays success message: "Đã từ chối công ty thành công" (Company rejected successfully)

19. System closes the rejection modal

20. System closes the company detail panel

21. System refreshes the company list to reflect the status change

## Alternative Sequences/Flows

### Step 7_User cancels the rejection

User can cancel rejecting the company in the following case:

1. User cancels: User clicks "Hủy" (Cancel) button or clicks outside the modal
   - System closes the rejection modal
   - System keeps the company detail panel open
   - Use case ends (no changes made)

### Step 8_User doesn't enter rejection reason

User can't submit rejection without reason in the following case:

1. Rejection notes is empty: User clicks "Xác nhận từ chối" button without entering rejection reason
   - System validates and finds rejection notes is empty or whitespace
   - System disables the "Xác nhận từ chối" button (button is already disabled if textarea is empty)
   - System displays error message: "Vui lòng nhập lý do từ chối" (Please enter rejection reason)
   - User cannot proceed with rejecting the company
   - User must enter rejection reason

### Step 10_System validates rejection notes on frontend

System validates rejection notes before API call in the following case:

1. Rejection notes is empty: System checks if rejection notes is empty or only whitespace
   - System displays error toast: "Vui lòng nhập lý do từ chối" (Please enter rejection reason)
   - System does not call API
   - User must enter rejection reason

### Step 12_System can't validate the user

User can't reject the company & get relevant error message in the following cases:

1. User not authenticated: User is not logged into the system
   - System returns 401 Unauthorized
   - System redirects user to login page
   - User cannot proceed with rejecting the company
   - User must log in first

2. User doesn't have required role: User does not have Employee/Admin role (system_employee)
   - System returns 403 Forbidden
   - System displays access denied message
   - User cannot proceed with rejecting the company

### Step 13_System can't validate the company status

User can't reject the company & get relevant error message in the following cases:

1. Company does not exist: Company is not found in the system
   - System displays error message: "Company not found"
   - System returns 404 Not Found or 400 Bad Request
   - User cannot proceed with rejecting the company

2. Company not in pending status: Company LegalVerificationStatus is not "pending"
   - System displays error message: "Chỉ có thể từ chối các công ty đang ở trạng thái chờ xác thực." (Can only reject companies with pending status)
   - System returns 400 Bad Request
   - User cannot proceed with rejecting the company
   - Company must be in pending status to be rejected

3. Company already approved: Company LegalVerificationStatus is "approved"
   - System displays error message: "Chỉ có thể từ chối các công ty đang ở trạng thái chờ xác thực." (Can only reject companies with pending status)
   - System returns 400 Bad Request
   - User cannot proceed with rejecting the company
   - Approved companies cannot be rejected (they can only be re-verified if they update their information)

4. Company already rejected: Company LegalVerificationStatus is "rejected"
   - System displays error message: "Chỉ có thể từ chối các công ty đang ở trạng thái chờ xác thực." (Can only reject companies with pending status)
   - System returns 400 Bad Request
   - User cannot proceed with rejecting the company
   - Company is already rejected

### Step 14_System can't validate rejection notes

System can't validate rejection notes & display error message in the following case:

1. Rejection notes is empty: Rejection notes is null, empty, or whitespace
   - System displays error message: "Vui lòng nhập lý do từ chối." (Please enter rejection reason)
   - System returns 400 Bad Request
   - User cannot proceed with rejecting the company
   - User must provide rejection reason

### Step 16_System can't save the company

System can't save the updated company & display error message in the following cases:

1. Database error: Database is unavailable or update fails
   - System catches database error
   - System displays error toast notification: "Từ chối công ty thất bại" (Failed to reject company)
   - System keeps the rejection modal open
   - User can retry the rejection

2. API endpoint unavailable: API endpoint is down or unreachable
   - System catches network/API error
   - System displays error toast notification: "Từ chối công ty thất bại" (Failed to reject company)
   - System keeps the rejection modal open
   - User can retry the rejection








