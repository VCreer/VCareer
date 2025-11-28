# Use Case Specification: Approve Company Profile

## Primary Actors

Employee/Admin

## Description

As an Employee/Admin, I want to be able to approve a company profile so that the company's legal information is verified and the company can use the platform's services. The approval changes the company's verification status from "pending" or "rejected" to "approved", sets the verification status to true, and clears any previous rejection notes. Companies with "approved" status can post jobs and access full platform features.

## Preconditions

1. User has logged into the system
2. User has the role of Employee/Admin (system_employee role)
3. Company exists in the system
4. Company has "pending" or "rejected" verification status
5. User is viewing the company detail in the Company Verification page
6. User has permission to approve companies

## Postconditions

1. Company verification status is changed to "approved"
2. Company VerificationStatus is set to true
3. Company LegalReviewedAt is updated to current timestamp
4. Company RejectionNotes is cleared (set to null)
5. Company is moved from pending/rejected list to verified list
6. Success message is displayed to the user
7. Company list is refreshed to reflect the status change

## Normal Sequence/Flow

1. User (Employee/Admin) navigates to the Company Verification page

2. User views the list of pending companies (or rejected companies)

3. User selects a company from the list to view details

4. System displays the company detail panel with company information and legal documents

5. User reviews the company information and legal documents

6. User clicks "Duyệt" (Approve) button or "Duyệt lại" (Approve again) button for rejected companies

7. System calls API `approveCompany(id)` from frontend

8. System receives request and verifies:
   - User is authenticated
   - User has Employee/Admin role (system_employee)
   - Company exists in the database

9. System checks company verification status:
   - Company LegalVerificationStatus must be "pending" or "rejected"
   - If status is neither "pending" nor "rejected", system throws error

10. System updates company:
    - Sets `LegalVerificationStatus = "approved"`
    - Sets `VerificationStatus = true`
    - Sets `LegalReviewedAt = DateTime.UtcNow`
    - Sets `RejectionNotes = null` (clears any previous rejection notes)
    - Sets `LegalReviewedBy = null` (temporarily, due to database schema)

11. System saves updated company to database

12. System returns success response (NoContent)

13. System receives response and displays success message: "Đã duyệt công ty thành công" (Company approved successfully)

14. System closes the company detail panel

15. System refreshes the company list to reflect the status change

## Alternative Sequences/Flows

### Step 6_User cancels the approval

User can cancel approving the company in the following case:

1. User cancels: User does not click the "Duyệt" button
   - System keeps the company detail panel open
   - Use case ends (no changes made)

### Step 8_System can't validate the user

User can't approve the company & get relevant error message in the following cases:

1. User not authenticated: User is not logged into the system
   - System returns 401 Unauthorized
   - System redirects user to login page
   - User cannot proceed with approving the company
   - User must log in first

2. User doesn't have required role: User does not have Employee/Admin role (system_employee)
   - System returns 403 Forbidden
   - System displays access denied message
   - User cannot proceed with approving the company

### Step 9_System can't validate the company status

User can't approve the company & get relevant error message in the following cases:

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

### Step 11_System can't save the company

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








