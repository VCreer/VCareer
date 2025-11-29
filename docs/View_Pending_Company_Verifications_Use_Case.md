# Use Case Specification: View Pending Company Verifications

## Primary Actors

Employee/Admin

## Description

As an Employee/Admin, I want to be able to view a list of companies that are pending verification so that I can review their legal documents and company information before making approval or rejection decisions. The system displays companies with "pending" verification status in a paginated list with search and filter capabilities. Companies enter the pending status when recruiters submit their legal information (business license, tax certificate, representative ID card, etc.) for the first time or when they update their legal information after being previously approved or rejected.

## Preconditions

1. User has logged into the system
2. User has the role of Employee/Admin (system_employee role)
3. User has access to the company verification module/page
4. System database is accessible and operational
5. API endpoint for retrieving pending companies is available and functioning

## Postconditions

1. List of pending companies is displayed to the Employee/Admin
2. Employee/Admin can see company information including company name, code, contact information, creation date, and recruiter information
3. Employee/Admin can interact with the list (select company, search, filter, paginate)
4. Employee/Admin can view detailed company information and legal documents by selecting a company
5. Employee/Admin can perform actions on companies (approve or reject) from the detail view

## Normal Sequence/Flow

1. User (Employee/Admin) navigates to the Company Verification page

2. System displays the Company Verification page with three tabs: "Chờ xác thực" (Pending), "Đã xác minh" (Verified), and "Đã từ chối" (Rejected)

3. System automatically activates the "Chờ xác thực" (Pending) tab by default

4. System calls API `GetPendingCompaniesAsync` from frontend with default pagination parameters:
   - SkipCount: 0
   - MaxResultCount: 7 (items per page)
   - Sorting: 'CreationTime DESC'

5. System receives request and verifies:
   - User is authenticated
   - User has Employee/Admin role (system_employee)

6. System queries database for companies where `LegalVerificationStatus = "pending"`

7. System retrieves associated recruiter information (lead recruiter) for each company

8. System maps company data to `CompanyVerificationViewDto` including:
   - Company basic information (name, code, email, phone, tax code, address)
   - Company creation time
   - Recruiter name and email
   - Legal document file URLs (if available)

9. System applies default sorting by `CreationTime DESC` (newest first)

10. System returns paginated result with total count and items list

11. System receives response and displays the list of pending companies in a card-based layout

12. Each company card displays:
    - Company icon
    - Company code (#ID or companyCode)
    - Creation date with calendar icon
    - Company name (heading)
    - Contact information (email, phone, tax code) with icons
    - Recruiter name with user icon
    - Status badge with clock icon and "Chờ xác thực" text

13. System displays pagination controls if total pages > 1

14. System hides loading spinner

15. User can view all pending companies in the current page

## Alternative Sequences/Flows

### Step 4_No pending companies found

System can't find any pending companies in the following case:

1. No pending companies exist: There are no companies with `LegalVerificationStatus = "pending"` in the system
   - System returns empty result set (TotalCount = 0, Items = empty list)
   - System displays empty state message: "Không có công ty nào chờ xác thực." (No companies are pending verification.)
   - System shows empty list icon (building icon)
   - Search bar remains visible but pagination controls are hidden
   - Use case continues (user can still search or wait for new companies)

### Step 4_User searches for specific company

User can search for companies in the following case:

1. User enters search keyword: User types a keyword in the search input field (e.g., company name, tax code, email)
   - User clicks "Tìm kiếm" button or presses Enter key
   - System captures the search keyword
   - System calls `GetPendingCompaniesAsync` API with keyword in `CompanyVerificationFilterDto.Keyword` field
   - System filters companies where:
     - Company name contains the keyword (case-insensitive), OR
     - Company code contains the keyword (case-insensitive), OR
     - Contact email contains the keyword (case-insensitive), OR
     - Tax code contains the keyword (case-insensitive)
   - System displays filtered results
   - System updates pagination based on filtered total count
   - Use case continues with filtered list

### Step 4_User navigates pagination

User can navigate to different pages in the following case:

1. User clicks page number: User clicks on page number N or next/previous button in pagination controls
   - System calculates `SkipCount = (N - 1) * ItemsPerPage`
   - System calls `GetPendingCompaniesAsync` API with updated `SkipCount` and `MaxResultCount`
   - System retrieves the corresponding page of companies
   - System displays the new page of companies
   - System updates pagination controls to highlight the current page
   - Use case continues with new page data

### Step 5_System can't validate the user

User can't view pending companies & get relevant error message in the following cases:

1. User not authenticated: User is not logged into the system
   - System returns 401 Unauthorized
   - System redirects user to login page
   - User cannot proceed with viewing pending companies
   - User must log in first

2. User doesn't have required role: User does not have Employee/Admin role (system_employee)
   - System returns 403 Forbidden
   - System redirects user to appropriate page (home page or access denied page)
   - System may display access denied message
   - User cannot proceed with viewing pending companies

### Step 6_System can't retrieve companies

System can't retrieve companies & display error message in the following cases:

1. Database error: Database is unavailable or query fails
   - System catches database error
   - System displays error toast notification: "Không thể tải danh sách công ty chờ xác thực" (Unable to load pending companies list)
   - System hides loading spinner
   - System may display error state in the UI
   - User cannot view the company list
   - User can retry by refreshing the page

2. API endpoint unavailable: API endpoint is down or unreachable
   - System catches network/API error
   - System displays error toast notification: "Không thể tải danh sách công ty chờ xác thực" (Unable to load pending companies list)
   - System hides loading spinner
   - System may display error state in the UI
   - User cannot view the company list
   - User can retry by refreshing the page

### Step 15_User views company details

User can view detailed company information in the following case:

1. User selects company: User clicks on a company card in the list
   - System highlights the selected company card
   - System displays the company detail panel on the right side of the screen
   - System shows comprehensive company information:
     - Basic Information Section: Email, Phone, Address, Website, Company Size, Founded Year, Description
     - Legal Information Section: Business License File, Tax Certificate File, Representative ID Card File, Other Support File, Legal Document URL
     - Recruiter Information Section: Recruiter name and email
   - System displays action buttons: "Duyệt" (Approve) and "Từ chối" (Reject)
   - User can:
     - View document images by clicking on them (opens image modal)
     - View PDF files by clicking "Xem PDF" link
     - Download files by clicking download link
     - Click "Duyệt" to approve the company (see Approve Company use case)
     - Click "Từ chối" to reject the company (see Reject Company use case)
   - Use case continues with detail view displayed

### Step 15_User closes company detail view

User can close the detail view in the following case:

1. User closes detail panel: User clicks the close button (X) in the company detail header
   - System hides the company detail panel
   - System removes the highlight from the selected company card
   - System returns to the list-only view
   - Use case continues with list view
