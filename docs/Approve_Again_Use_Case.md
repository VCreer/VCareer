# Use Case Specification: Approve Again

## Primary Actors

Employee/Admin

## Description

As an Employee/Admin, I want to be able to approve a previously rejected company profile again so that companies that have corrected their issues and resubmitted their legal information can be verified and use the platform's services. The "Approve Again" action allows employees to approve companies that were previously rejected, changing their status from "rejected" to "approved" and clearing any previous rejection notes. This enables companies to recover from rejection and gain access to platform features after addressing the issues that led to their initial rejection.

## Preconditions

1. User has logged into the system
2. User has the role of Employee/Admin (system_employee role)
3. Company exists in the system
4. Company has "rejected" verification status
5. User is viewing the rejected companies list in the Company Verification page
6. User is viewing the company detail for a rejected company
7. User has permission to approve companies

## Postconditions

1. Company verification status is changed from "rejected" to "approved"
2. Company VerificationStatus is set to true
3. Company LegalReviewedAt is updated to current timestamp
4. Company RejectionNotes is cleared (set to null)
5. Company is moved from rejected list to verified list
6. Success message is displayed to the user
7. Company list is refreshed to reflect the status change

## Normal Sequence/Flow

1. User (Employee/Admin) navigates to the Company Verification page

2. User clicks on the "Đã từ chối" (Rejected) tab

3. System displays the list of rejected companies

4. User selects a rejected company from the list to view details

5. System displays the company detail panel with:
   - Company information and legal documents
   - Rejection information section showing:
     - Rejection date (LegalReviewedAt)
     - Previous rejection notes (RejectionNotes)

6. User reviews the company information, legal documents, and previous rejection notes

7. User verifies that the company has addressed the issues mentioned in the rejection notes

8. User clicks "Duyệt lại" (Approve Again) button

9. System calls API `approveCompany(id)` from frontend

10. System receives request and verifies:
    - User is authenticated
    - User has Employee/Admin role (system_employee)
    - Company exists in the database

11. System checks company verification status:
    - Company LegalVerificationStatus must be "pending" or "rejected"
    - If status is neither "pending" nor "rejected", system throws error

12. System updates company:
    - Sets `LegalVerificationStatus = "approved"`
    - Sets `VerificationStatus = true`
    - Sets `LegalReviewedAt = DateTime.UtcNow`
    - Sets `RejectionNotes = null` (clears previous rejection notes)
    - Sets `LegalReviewedBy = null` (temporarily, due to database schema)

13. System saves updated company to database

14. System returns success response (NoContent)

15. System receives response and displays success message: "Đã duyệt công ty thành công" (Company approved successfully)

16. System closes the company detail panel

17. System refreshes the company list to reflect the status change

18. Company is now visible in the "Đã xác minh" (Verified) tab

## Alternative Sequences/Flows

### Step 8_User cancels the approval

User can cancel approving the company again in the following case:

1. User cancels: User does not click the "Duyệt lại" button
   - System keeps the company detail panel open
   - Use case ends (no changes made)

### Step 10_System can't validate the user

User can't approve the company again & get relevant error message in the following cases:

1. User not authenticated: User is not logged into the system
   - System returns 401 Unauthorized
   - System redirects user to login page
   - User cannot proceed with approving the company
   - User must log in first

2. User doesn't have required role: User does not have Employee/Admin role (system_employee)
   - System returns 403 Forbidden
   - System displays access denied message
   - User cannot proceed with approving the company

### Step 11_System can't validate the company status

User can't approve the company again & get relevant error message in the following cases:

1. Company does not exist: Company is not found in the system
   - System displays error message: "Company not found"
   - System returns 404 Not Found or 400 Bad Request
   - User cannot proceed with approving the company

2. Company already approved: Company LegalVerificationStatus is already "approved"
   - System displays error message: "Chỉ có thể duyệt các công ty đang ở trạng thái chờ xác thực hoặc đã bị từ chối." (Can only approve companies with pending or rejected status)
   - System returns 400 Bad Request
   - User cannot proceed with approving the company
   - Company is already in approved state

3. Company has invalid status: Company LegalVerificationStatus is neither "pending" nor "rejected"
   - System displays error message: "Chỉ có thể duyệt các công ty đang ở trạng thái chờ xác thực hoặc đã bị từ chối." (Can only approve companies with pending or rejected status)
   - System returns 400 Bad Request
   - User cannot proceed with approving the company

4. Company status changed: Company status was changed to "pending" by recruiter updating their information
   - System allows approval (status is "pending")
   - Approval proceeds normally
   - This is valid scenario when recruiter updates company info after rejection

### Step 13_System can't save the company

System can't save the updated company & display error message in the following cases:

1. Database error: Database is unavailable or update fails
   - System catches database error
   - System displays error toast notification: "Duyệt công ty thất bại" (Failed to approve company)
   - System keeps the company detail panel open
   - User can retry the approval

2. API endpoint unavailable: API endpoint is down or unreachable
   - System catches network/API error
   - System displays error toast notification: "Duyệt công ty thất bại" (Failed to approve company)
   - System keeps the company detail panel open
   - User can retry the approval








