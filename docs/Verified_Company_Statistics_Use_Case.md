# Use Case Specification: Verified Company Statistics

## Primary Actors

Employee/Admin

## Description

As an Employee/Admin, I want to be able to view statistics about verified companies so that I can monitor the verification process, track the number of verified companies, understand verification trends, and make data-driven decisions about the company verification workflow. The statistics provide insights into the overall health of the company verification process, including total verified companies, verification rates, and trends over time.

## Preconditions

1. User has logged into the system
2. User has the role of Employee/Admin (system_employee role)
3. User has access to the Company Verification page or Statistics/Dashboard page
4. System database is accessible and operational
5. There are companies in the system (verified, pending, or rejected)

## Postconditions

1. Statistics about verified companies are displayed to the Employee/Admin
2. Employee/Admin can see key metrics including:
   - Total number of verified companies
   - Number of verified companies in a specific time period
   - Verification rate (percentage of verified vs total submitted)
   - Comparison with pending and rejected companies
3. Employee/Admin can use the statistics to understand verification trends
4. Statistics are updated based on current company data

## Normal Sequence/Flow

1. User (Employee/Admin) navigates to the Company Verification page or Statistics/Dashboard page

2. System displays the Company Verification page with tabs: "Chờ xác thực" (Pending), "Đã xác minh" (Verified), and "Đã từ chối" (Rejected)

3. System automatically loads statistics about verified companies:
   - System queries database for companies with `VerificationStatus = true` AND `LegalVerificationStatus = "approved"`
   - System counts total verified companies
   - System may calculate additional metrics (verification rate, trends, etc.)

4. System displays statistics in a statistics panel or dashboard section:
   - Total Verified Companies: [count]
   - Verified This Month: [count]
   - Verification Rate: [percentage]%
   - Comparison metrics (if available):
     - Total Pending: [count]
     - Total Rejected: [count]
     - Total Submitted: [count]

5. User views the statistics

6. User can interact with statistics (if interactive features are available):
   - Click on statistics to filter verified companies list
   - View detailed breakdown by time period
   - Export statistics (if feature available)

7. System updates statistics when company list is refreshed or when user navigates between tabs

## Alternative Sequences/Flows

### Step 3_No verified companies found

System can't find any verified companies in the following case:

1. No verified companies exist: There are no companies with `VerificationStatus = true` AND `LegalVerificationStatus = "approved"` in the system
   - System returns count of 0 for verified companies
   - System displays statistics showing:
     - Total Verified Companies: 0
     - Verified This Month: 0
     - Verification Rate: 0%
   - Statistics panel still displays with zero values
   - Use case continues (user can see that no companies are verified yet)

### Step 3_System can't calculate statistics

System can't calculate statistics & display error message in the following cases:

1. Database error: Database is unavailable or query fails
   - System catches database error
   - System displays error message: "Không thể tải thống kê" (Unable to load statistics)
   - System may display placeholder or hide statistics section
   - User can retry by refreshing the page

2. API endpoint unavailable: Statistics API endpoint is down or unreachable
   - System catches network/API error
   - System displays error message: "Không thể tải thống kê" (Unable to load statistics)
   - System may display placeholder or hide statistics section
   - User can retry by refreshing the page

### Step 4_Statistics displayed with limited data

System displays statistics with available data in the following case:

1. Limited data available: Some statistics cannot be calculated due to missing data
   - System displays available statistics
   - System shows "N/A" or "-" for unavailable metrics
   - System may display a message indicating limited data availability
   - Use case continues with partial statistics

### Step 6_User filters by statistics

User can filter company list based on statistics in the following case:

1. User clicks on statistic: User clicks on a statistic value (e.g., "Verified This Month")
   - System filters the verified companies list based on the selected statistic
   - System updates the company list to show only companies matching the statistic criteria
   - System highlights the active filter
   - User can see filtered results

### Step 2_User navigates to statistics from different page

User can access statistics from different locations in the following case:

1. User accesses from dashboard: User navigates to a main dashboard page that shows company verification statistics
   - System displays statistics in the dashboard view
   - Statistics may be more comprehensive in dashboard view
   - User can click to navigate to detailed Company Verification page
   - Use case continues with statistics displayed

### Step 3_Statistics calculated with date range filter

System calculates statistics for specific time period in the following case:

1. Date range filter applied: User selects a specific date range for statistics
   - System queries verified companies within the selected date range
   - System calculates statistics based on filtered data
   - System displays statistics for the selected period
   - System may show comparison with previous period
   - Use case continues with filtered statistics








