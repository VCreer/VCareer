# UI TEST CASES - APPLY CV (CANDIDATE) — CONCISE

Format per case: **Description** | **Procedure** | **Expected Result**  
Pre-conditions stated inline; keep steps minimal but clear.

---

## 1) Apply with CV

- **TC-APPLY-ONLINE**  
  Description: Apply to a valid job using an existing Online CV.  
  Procedure:  
  - Login as candidate  
  - Open active job detail  
  - Click “Apply”, select Online CV  
  - (Optional) add cover letter  
  - Submit  
  Expected Result:  
  - Toast success shown; modal closes  
  - Button switches to “Apply again”; `hasApplied` true  
  - API `/apply-with-online-cv` sends `jobId`, `candidateCvId`, bearer token

- **TC-APPLY-UPLOADED**  
  Description: Apply using an uploaded CV from library.  
  Procedure:  
  - Login as candidate  
  - Open job detail, click Apply  
  - Select Uploaded CV  
  - Submit  
  Expected Result:  
  - Toast success; modal closes  
  - API `/apply-with-uploaded-cv` includes `uploadedCvId`, bearer token

- **TC-APPLY-UPLOAD-NEW**  
  Description: Upload a new CV file (<5MB pdf/doc/docx) then apply.  
  Procedure:  
  - Login as candidate  
  - Open job detail → Apply → choose “Upload”  
  - Pick/drag valid file (<5MB)  
  - Submit  
  Expected Result:  
  - Upload API succeeds; returned `uploadedCvId` reused for apply  
  - Apply succeeds; toast success; CV saved to library

- **TC-APPLY-NO-COVER-LETTER**  
  Description: Apply without cover letter.  
  Procedure:  
  - Login as candidate  
  - Apply with any CV  
  - Leave cover letter blank  
  - Submit  
  Expected Result:  
  - Apply succeeds without cover letter  
  - Toast success shown; no validation error

- **TC-APPLY-WITH-COVER-LETTER**  
  Description: Apply with cover letter.  
  Procedure:  
  - Login as candidate  
  - Apply, enter cover letter  
  - Submit  
  Expected Result:  
  - Request includes `coverLetter`  
  - Apply succeeds; toast success

- **TC-SWITCH-OPTIONS**  
  Description: Switch between Library and Upload options.  
  Procedure:  
  - In modal select Online CV  
  - Switch to Upload  
  - Switch back to Library  
  Expected Result:  
  - Switching clears prior selection/file  
  - Only one option active at a time

- **TC-DRAG-DROP**  
  Description: Drag-drop file into upload area.  
  Procedure:  
  - Choose Upload option  
  - Drag-drop valid CV file  
  Expected Result:  
  - File accepted; name displayed  
  - Remove/replace works

---

## 2) Validation & Errors

- **TC-VAL-NO-CV**  
  Description: Submit without selecting any CV/file.  
  Procedure:  
  - Open modal  
  - Do not pick CV/file  
  - Submit  
  Expected Result:  
  - Error “Please select a CV” shown  
  - API not called; modal stays open

- **TC-VAL-BAD-TYPE**  
  Description: Upload unsupported file type.  
  Procedure:  
  - Choose Upload  
  - Pick .png/.txt  
  - Observe validation  
  Expected Result:  
  - Format error shown; file rejected  
  - Cannot submit until valid file chosen

- **TC-VAL-OVERSIZE**  
  Description: Upload file >5MB.  
  Procedure:  
  - Choose Upload  
  - Pick oversized file (>5MB)  
  - Observe validation  
  Expected Result:  
  - Size error shown; file rejected  
  - Cannot submit until valid file chosen

- **TC-ERR-EXPIRED-JOB**  
  Description: Apply to an expired job.  
  Procedure:  
  - Open expired job detail  
  - Attempt Apply  
  Expected Result:  
  - Server returns job expired error  
  - No application created; message shown

- **TC-ERR-DUPLICATE**  
  Description: Apply again to a job already applied.  
  Procedure:  
  - Open a job already applied  
  - Click “Apply again”  
  Expected Result:  
  - Either allowed new application or duplicate warning  
  - User sees clear message on result

- **TC-ERR-NETWORK**  
  Description: Network loss during submit.  
  Procedure:  
  - Start apply flow  
  - Disconnect network  
  - Submit  
  Expected Result:  
  - Connection error shown; no redirect  
  - Form data retained to retry

- **TC-ERR-TOKEN-EXPIRED**  
  Description: Token expired while submitting.  
  Procedure:  
  - Let token expire or remove it  
  - Submit application  
  Expected Result:  
  - 401 Unauthorized returned  
  - Prompt to login again; no redirect loop

---

## 3) Post-apply Status

- **TC-STATUS-CHECK**  
  Description: Show applied state on job detail.  
  Procedure:  
  - After successful apply  
  - Reopen same job detail  
  Expected Result:  
  - Button shows “Apply again”; `hasApplied=true`  
  - `check-status` API invoked with bearer token

---

## 4) Authentication & Authorization

- **TC-AUTH-NOT-LOGIN**  
  Description: Unauthenticated user tries to apply.  
  Procedure:  
  - Ensure logged out  
  - Open job detail  
  - Click “Apply”  
  Expected Result:  
  - Prompt/redirect to login  
  - Apply APIs not called

- **TC-AUTH-WRONG-ROLE**  
  Description: Non-candidate (recruiter/employee) tries to apply.  
  Procedure:  
  - Login as recruiter/employee  
  - Open job detail  
  - Click Apply  
  Expected Result:  
  - Not allowed (403/message)  
  - No application created

- **TC-TOKEN-IN-REQUEST**  
  Description: Ensure token sent with apply/upload.  
  Procedure:  
  - Apply normally  
  - Inspect network request headers  
  Expected Result:  
  - Header `Authorization: Bearer {token}` present  
  - Missing token would yield 401

---

## 5) UI/UX & Loading

- **TC-UI-CLOSE-MODAL**  
  Description: Close modal via X / Cancel / overlay.  
  Procedure:  
  - Open modal  
  - Close via X / Cancel / overlay  
  Expected Result:  
  - Modal closes; form resets to defaults  
  - No API call sent

- **TC-UI-LOADING-CV-LIST**  
  Description: Show loading while fetching CV lists.  
  Procedure:  
  - Open modal while CV list fetch in progress  
  - Observe UI state  
  Expected Result:  
  - Loading indicator visible  
  - Submit may be disabled; CVs render after load

- **TC-TOAST-SUCCESS**  
  Description: Success notification after apply.  
  Procedure:  
  - Complete a successful apply  
  - Observe notifications/UI  
  Expected Result:  
  - Toast success shows then auto-hides  
  - Modal closes; button/state updated

- **TC-TOAST-ERROR**  
  Description: Error notification on failed apply.  
  Procedure:  
  - Trigger server/validation error on submit  
  - Observe UI  
  Expected Result:  
  - Toast error shown; modal stays open  
  - Form data retained for retry

- **TC-RESPONSIVE**  
  Description: Check modal on mobile/tablet.  
  Procedure:  
  - Open Apply modal on mobile/tablet sizes  
  - Interact with fields/buttons/upload  
  Expected Result:  
  - Layout fits; buttons tappable  
  - Upload area usable on touch devices

---

## 6) View Applied Jobs List

- **TC-LIST-LOAD**  
  Description: Load applied jobs list with data.  
  Procedure:  
  - Login as candidate  
  - Open Applied Jobs page  
  - Wait for list fetch  
  Expected Result:  
  - Spinner while loading; hidden after load  
  - Each row shows job title, company, location, applied date/status

- **TC-LIST-PAGINATION**  
  Description: Navigate pages when many applications.  
  Procedure:  
  - Ensure more than one page of applications  
  - Click next/previous or page numbers  
  Expected Result:  
  - Page changes; list updates accordingly  
  - Current page highlighted; total count consistent

- **TC-LIST-FILTER-STATUS**  
  Description: Filter by application status (e.g., Submitted, Viewed).  
  Procedure:  
  - Open status filter  
  - Select a status  
  Expected Result:  
  - List shows only matching status items  
  - Clearing filter restores full list

- **TC-LIST-FILTER-DATE**  
  Description: Filter by applied date range.  
  Procedure:  
  - Open date filter  
  - Pick from/to dates  
  Expected Result:  
  - Items outside range are hidden  
  - Clearing dates resets list

- **TC-LIST-SEARCH**  
  Description: Search applied jobs by job title/company.  
  Procedure:  
  - Enter keyword in search box  
  - Wait for debounce/trigger search  
  Expected Result:  
  - List narrows to matching items  
  - No results shows empty state

- **TC-LIST-EMPTY**  
  Description: Empty state when no applications.  
  Procedure:  
  - Use account with zero applications or filters yielding none  
  Expected Result:  
  - Empty illustration/text shown  
  - No errors; actions disabled appropriately

- **TC-LIST-ITEM-CLICK**  
  Description: Open job detail from applied list.  
  Procedure:  
  - Click job title in list  
  Expected Result:  
  - Navigates to job detail page  
  - Back navigation returns to same list state/page

- **TC-LIST-STATUS-BADGE**  
  Description: Status badge displays correctly.  
  Procedure:  
  - View list items with varied statuses  
  Expected Result:  
  - Status text and color map correctly (e.g., Submitted, Viewed, Rejected)  
  - Tooltip/legend (if any) matches meaning

- **TC-LIST-NETWORK-ERROR**  
  Description: Handle fetch failure.  
  Procedure:  
  - Simulate network error during list load  
  Expected Result:  
  - Error toast/message shown  
  - Retry/refresh option available; no crash

- **TC-LIST-AUTH-REQUIRED**  
  Description: Auth required to view applied jobs.  
  Procedure:  
  - Logout  
  - Open Applied Jobs page  
  Expected Result:  
  - Redirect/prompt to login  
  - List API not called without token

- **TC-LIST-REFRESH-AFTER-APPLY**  
  Description: Newly applied job appears in list.  
  Procedure:  
  - Apply to a job successfully  
  - Open/refresh Applied Jobs page  
  Expected Result:  
  - New application row present with correct date/status  
  - Count increments accordingly

---

## 6) RECRUITER SEARCH CV FUNCTIONALITY

### 6.1) Basic Search

- **TC-SEARCH-BASIC-KEYWORD**  
  Description: Search candidates by keyword only.  
  Procedure:  
  - Login as recruiter  
  - Navigate to Find Candidate page  
  - Enter keyword in "Từ khóa cần tìm" field (e.g., "Java Developer")  
  - Click "TÌM CV" button  
  Expected Result:  
  - Loading indicator shows during search  
  - Results display with candidates matching keyword  
  - Total count shown: "TÌM THẤY X ỨNG VIÊN PHÙ HỢP"  
  - API `/api/profile/candidate-search/search` called with `keyword`, `skipCount=0`, `maxResultCount=10`, bearer token

- **TC-SEARCH-EMPTY-KEYWORD**  
  Description: Search without keyword (show all candidates).  
  Procedure:  
  - Login as recruiter  
  - Leave keyword field empty  
  - Click "TÌM CV"  
  Expected Result:  
  - All candidates with `isSeekingJob=true` displayed  
  - Results sorted by default priority (newest)  
  - No error shown

- **TC-SEARCH-LOCATION**  
  Description: Search by location only.  
  Procedure:  
  - Enter location in "Địa điểm" field (e.g., "Hà Nội")  
  - Leave keyword empty  
  - Click "TÌM CV"  
  Expected Result:  
  - Results filtered by `workLocation` matching input  
  - API includes `workLocation` parameter

- **TC-SEARCH-KEYWORD-LOCATION**  
  Description: Search with both keyword and location.  
  Procedure:  
  - Enter keyword (e.g., "Frontend")  
  - Enter location (e.g., "TP.HCM")  
  - Click "TÌM CV"  
  Expected Result:  
  - Results match both keyword AND location  
  - API includes both `keyword` and `workLocation`

- **TC-SEARCH-SPECIAL-CHARS**  
  Description: Search with special characters in keyword.  
  Procedure:  
  - Enter keyword with special chars (e.g., "C#", "C++", "React.js")  
  - Click "TÌM CV"  
  Expected Result:  
  - Search handles special chars correctly  
  - Results show if matches found, or empty state if none

- **TC-SEARCH-NUMERIC-KEYWORD**  
  Description: Search with numeric keyword (years of experience).  
  Procedure:  
  - Enter number as keyword (e.g., "5")  
  - Click "TÌM CV"  
  Expected Result:  
  - System treats as experience years if applicable  
  - Results sorted by experience relevance  
  - Candidates with matching experience years prioritized

---

### 6.2) Search Scope Filters

- **TC-SCOPE-ALL-DEFAULT**  
  Description: Default search scope (all fields when keyword provided).  
  Procedure:  
  - Enter keyword  
  - Do not check any scope checkboxes  
  - Click "TÌM CV"  
  Expected Result:  
  - All scope flags set to `true` in API: `searchInJobTitle`, `searchInActivity`, `searchInEducation`, `searchInExperience`, `searchInSkills`  
  - Search covers all candidate fields

- **TC-SCOPE-SINGLE-FIELD**  
  Description: Search in single scope field only.  
  Procedure:  
  - Enter keyword  
  - Check only "Vị trí ứng tuyển"  
  - Uncheck others  
  - Click "TÌM CV"  
  Expected Result:  
  - Only `searchInJobTitle=true`, others `false`  
  - Results limited to job title matches

- **TC-SCOPE-MULTIPLE-FIELDS**  
  Description: Search in multiple selected scope fields.  
  Procedure:  
  - Enter keyword  
  - Check "Kinh nghiệm" and "Kỹ năng"  
  - Uncheck others  
  - Click "TÌM CV"  
  Expected Result:  
  - `searchInExperience=true`, `searchInSkills=true`, others `false`  
  - Results match keyword in experience OR skills

- **TC-SCOPE-NO-KEYWORD**  
  Description: Search scope behavior when no keyword.  
  Procedure:  
  - Leave keyword empty  
  - Check/uncheck scope fields  
  - Click "TÌM CV"  
  Expected Result:  
  - All scope flags set to `false` (show all candidates)  
  - Scope checkboxes do not affect results when no keyword

- **TC-SCOPE-TOGGLE**  
  Description: Toggle scope checkboxes on/off.  
  Procedure:  
  - Check "Học vấn"  
  - Uncheck it  
  - Check "Hoạt động"  
  - Click "TÌM CV"  
  Expected Result:  
  - Checkbox states update correctly  
  - Only checked scopes included in search

---

### 6.3) CV Classification Filter

- **TC-CLASSIFICATION-ALL**  
  Description: Show all CVs (default).  
  Procedure:  
  - Select "Tất cả" radio  
  - Click "TÌM CV"  
  Expected Result:  
  - API `cvClassification` parameter is `undefined` or not sent  
  - All candidates shown regardless of view status

- **TC-CLASSIFICATION-UNSEEN**  
  Description: Show only unseen CVs.  
  Procedure:  
  - Select "Chưa xem" radio  
  - Click "TÌM CV"  
  Expected Result:  
  - API includes `cvClassification: "unseen"`  
  - Only candidates not viewed by recruiter shown

- **TC-CLASSIFICATION-SEEN**  
  Description: Show only seen CVs.  
  Procedure:  
  - Select "Đã xem" radio  
  - Click "TÌM CV"  
  Expected Result:  
  - API includes `cvClassification: "seen"`  
  - Only previously viewed candidates shown

- **TC-CLASSIFICATION-SWITCH**  
  Description: Switch between classification options.  
  Procedure:  
  - Select "Chưa xem" → search  
  - Switch to "Đã xem" → search  
  - Switch to "Tất cả" → search  
  Expected Result:  
  - Radio selection updates correctly  
  - Each search uses correct classification parameter  
  - Results update accordingly

---

### 6.4) Display Priority

- **TC-PRIORITY-NEWEST**  
  Description: Sort by newest (default).  
  Procedure:  
  - Select "Mới cập nhật" radio  
  - Perform search  
  Expected Result:  
  - API `sorting: "LastModificationTime DESC, CreationTime DESC"`  
  - Results sorted by last update time (newest first)

- **TC-PRIORITY-SEEKING**  
  Description: Sort by seeking job status.  
  Procedure:  
  - Select "Đang tìm việc" radio  
  - Perform search  
  Expected Result:  
  - API `sorting: "Status DESC, ProfileVisibility DESC, LastModificationTime DESC"`  
  - Candidates with `isSeekingJob=true` appear first

- **TC-PRIORITY-EXPERIENCED**  
  Description: Sort by experience level.  
  Procedure:  
  - Select "Có kinh nghiệm" radio  
  - Perform search  
  Expected Result:  
  - API `sorting: "Experience DESC, LastModificationTime DESC"`  
  - Results sorted by experience years (highest first)

- **TC-PRIORITY-SUITABLE**  
  Description: Sort by suitability (keyword relevance).  
  Procedure:  
  - Enter keyword  
  - Select "Ứng viên phù hợp" radio  
  - Perform search  
  Expected Result:  
  - API `sorting: "LastModificationTime DESC, Experience DESC"`  
  - Client-side sorting prioritizes keyword matches  
  - Most relevant candidates appear first

- **TC-PRIORITY-AUTO-SEARCH**  
  Description: Changing priority triggers automatic search.  
  Procedure:  
  - Perform initial search  
  - Change priority radio (e.g., from "Mới cập nhật" to "Có kinh nghiệm")  
  Expected Result:  
  - Search automatically re-executes  
  - Results re-sorted without clicking "TÌM CV" again

---

### 6.5) Search Results Display

- **TC-RESULTS-CARD-LAYOUT**  
  Description: Candidate card displays all required information.  
  Procedure:  
  - Perform search with results  
  - Observe candidate cards  
  Expected Result:  
  - Each card shows: avatar/initials, name, job title, location, updated time, salary, view count, contact open count  
  - "Đang tìm việc" badge shown if `isSeekingJob=true`  
  - Experience section shows formatted experience (e.g., "5 năm 3 tháng")  
  - Skills list displayed if available  
  - Education shown if available

- **TC-RESULTS-AVATAR-FALLBACK**  
  Description: Avatar fallback to initials when no image.  
  Procedure:  
  - View candidate without avatar  
  Expected Result:  
  - Initials displayed (first letter of first name + first letter of last name)  
  - Avatar placeholder styled correctly

- **TC-RESULTS-EXPERIENCE-FORMAT**  
  Description: Experience formatted correctly.  
  Procedure:  
  - View candidates with different experience values  
  Expected Result:  
  - "5 năm" for whole years  
  - "5 năm 3 tháng" for years + months  
  - "Chưa cập nhật" if no experience

- **TC-RESULTS-SALARY-FORMAT**  
  Description: Salary formatted in Vietnamese currency.  
  Procedure:  
  - View candidates with salary values  
  Expected Result:  
  - "X triệu" for values >= 1,000,000  
  - "X VNĐ" for smaller values  
  - Empty if no salary

- **TC-RESULTS-TIME-AGO**  
  Description: Updated time shown as relative time.  
  Procedure:  
  - View candidates with different update times  
  Expected Result:  
  - "Vừa xong" for < 1 minute  
  - "X phút trước" for < 1 hour  
  - "X giờ trước" for < 24 hours  
  - "X ngày trước" for < 7 days  
  - "X tuần trước" for < 4 weeks  
  - "X tháng trước" for < 12 months  
  - "X năm trước" for >= 12 months

- **TC-RESULTS-EMPTY-SECTIONS**  
  Description: Sections hidden when data unavailable.  
  Procedure:  
  - View candidate with missing skills/education/experience  
  Expected Result:  
  - Missing sections not displayed  
  - Card layout remains clean

---

### 6.6) Pagination

- **TC-PAGINATION-DISPLAY**  
  Description: Pagination controls shown when needed.  
  Procedure:  
  - Perform search returning > 10 results  
  Expected Result:  
  - Pagination controls visible at bottom  
  - Shows "Hiển thị 1 - 10 trong tổng số X ứng viên"  
  - Page numbers, Previous/Next buttons shown

- **TC-PAGINATION-FIRST-PAGE**  
  Description: First page behavior.  
  Procedure:  
  - On first page of results  
  Expected Result:  
  - "Trước" button disabled  
  - Page 1 highlighted as active  
  - "Hiển thị 1 - 10" shown

- **TC-PAGINATION-LAST-PAGE**  
  Description: Last page behavior.  
  Procedure:  
  - Navigate to last page  
  Expected Result:  
  - "Sau" button disabled  
  - Last page number highlighted  
  - "Hiển thị X - Y" shows correct range

- **TC-PAGINATION-NEXT-PAGE**  
  Description: Navigate to next page.  
  Procedure:  
  - Click "Sau" button or page number  
  Expected Result:  
  - `currentPage` increments  
  - API called with updated `skipCount`  
  - Results refresh for new page  
  - Page scrolls to top

- **TC-PAGINATION-PREVIOUS-PAGE**  
  Description: Navigate to previous page.  
  Procedure:  
  - On page 2+, click "Trước" or lower page number  
  Expected Result:  
  - `currentPage` decrements  
  - API called with updated `skipCount`  
  - Results refresh

- **TC-PAGINATION-PAGE-NUMBERS**  
  Description: Page number buttons display correctly.  
  Procedure:  
  - Navigate through multiple pages  
  Expected Result:  
  - Shows max 5 page numbers around current page  
  - Active page highlighted  
  - Clicking page number navigates to that page

- **TC-PAGINATION-RESET-ON-SEARCH**  
  Description: Pagination resets when new search performed.  
  Procedure:  
  - Navigate to page 3  
  - Change keyword/filter and search again  
  Expected Result:  
  - `currentPage` resets to 1  
  - Results show first page of new search

- **TC-PAGINATION-HIDE-SINGLE-PAGE**  
  Description: Pagination hidden when results fit in one page.  
  Procedure:  
  - Perform search returning <= 10 results  
  Expected Result:  
  - Pagination controls not displayed  
  - Only results count shown

---

### 6.7) Candidate Detail Navigation

- **TC-CLICK-CANDIDATE-CARD**  
  Description: Click candidate card to view detail.  
  Procedure:  
  - Click anywhere on candidate card  
  Expected Result:  
  - Navigate to `/recruiter/find-cv/detail/{candidateId}`  
  - Query param `cvId` included if `defaultCvId` exists  
  - Candidate data passed via router state

- **TC-CLICK-BOOKMARK**  
  Description: Click bookmark button (stops propagation).  
  Procedure:  
  - Click bookmark icon on candidate card  
  Expected Result:  
  - Bookmark action triggered (if implemented)  
  - Card click event not fired (no navigation)  
  - Event propagation stopped

- **TC-CLICK-INVALID-CANDIDATE**  
  Description: Click candidate without valid ID.  
  Procedure:  
  - Attempt to click candidate with missing/invalid ID  
  Expected Result:  
  - No navigation occurs  
  - No error thrown

---

### 6.8) Empty State & Loading

- **TC-EMPTY-NO-RESULTS**  
  Description: Show empty state when no results found.  
  Procedure:  
  - Search with filters returning zero results  
  Expected Result:  
  - Empty state message: "Không tìm thấy ứng viên phù hợp"  
  - No candidate cards displayed  
  - Pagination hidden

- **TC-LOADING-DURING-SEARCH**  
  Description: Show loading indicator during API call.  
  Procedure:  
  - Click "TÌM CV" button  
  - Observe UI during API request  
  Expected Result:  
  - Loading spinner/indicator visible  
  - "Đang tìm kiếm..." message shown  
  - Search button shows loading state  
  - Previous results hidden during load

- **TC-LOADING-COMPLETE**  
  Description: Loading state clears after results received.  
  Procedure:  
  - Wait for search to complete  
  Expected Result:  
  - Loading indicator hidden  
  - Results displayed or empty state shown

---

### 6.9) Error Handling

- **TC-ERROR-NETWORK**  
  Description: Handle network error during search.  
  Procedure:  
  - Disconnect network  
  - Click "TÌM CV"  
  Expected Result:  
  - Error toast shown: "Có lỗi xảy ra khi tìm kiếm ứng viên: [error message]"  
  - Loading state cleared  
  - Previous results remain or empty state shown  
  - No crash

- **TC-ERROR-401-UNAUTHORIZED**  
  Description: Handle unauthorized access (token expired).  
  Procedure:  
  - Let token expire or remove it  
  - Perform search  
  Expected Result:  
  - 401 error returned  
  - User prompted to login  
  - No redirect loop

- **TC-ERROR-403-FORBIDDEN**  
  Description: Handle forbidden access (non-recruiter).  
  Procedure:  
  - Login as candidate/employee  
  - Attempt to access Find Candidate page  
  Expected Result:  
  - 403 error or redirect  
  - Access denied message shown

- **TC-ERROR-SERVER-500**  
  Description: Handle server error.  
  Procedure:  
  - Trigger server error (500)  
  - Observe error handling  
  Expected Result:  
  - Error toast shown with message  
  - Loading cleared  
  - UI remains stable

- **TC-ERROR-INVALID-RESPONSE**  
  Description: Handle malformed API response.  
  Procedure:  
  - API returns unexpected format  
  Expected Result:  
  - Error logged to console  
  - Empty results shown  
  - Error toast displayed  
  - No crash

---

### 6.10) Authentication & Authorization

- **TC-AUTH-REQUIRED**  
  Description: Authentication required to search.  
  Procedure:  
  - Logout  
  - Navigate to Find Candidate page  
  Expected Result:  
  - Redirect to login or access denied  
  - Search API not called without token

- **TC-AUTH-RECRUITER-ONLY**  
  Description: Only recruiters can search candidates.  
  Procedure:  
  - Login as candidate  
  - Attempt to access Find Candidate page  
  Expected Result:  
  - Access denied (403) or redirect  
  - Page not accessible

- **TC-AUTH-TOKEN-IN-REQUEST**  
  Description: Bearer token included in search requests.  
  Procedure:  
  - Perform search  
  - Inspect network request headers  
  Expected Result:  
  - Header `Authorization: Bearer {token}` present  
  - Missing token would yield 401

---

### 6.11) UI/UX Interactions

- **TC-UI-RESPONSIVE-LAYOUT**  
  Description: Layout responsive on mobile/tablet.  
  Procedure:  
  - Open Find Candidate page on mobile/tablet  
  - Test filters, results, pagination  
  Expected Result:  
  - Sidebar filters stack or collapse appropriately  
  - Candidate cards readable on small screens  
  - Pagination usable on touch devices  
  - Buttons tappable

- **TC-UI-TOAST-NOTIFICATION**  
  Description: Toast notifications display correctly.  
  Procedure:  
  - Trigger error/success scenarios  
  Expected Result:  
  - Toast appears with correct message and type  
  - Auto-hides after 3 seconds  
  - Can be manually closed

- **TC-UI-FILTER-RESET**  
  Description: Filters persist during session.  
  Procedure:  
  - Set filters and search  
  - Navigate away and return  
  Expected Result:  
  - Filters may reset or persist (depending on implementation)  
  - User can easily re-apply filters

- **TC-UI-SCROLL-TO-TOP**  
  Description: Page scrolls to top on pagination.  
  Procedure:  
  - Scroll down results  
  - Click next page  
  Expected Result:  
  - Page smoothly scrolls to top  
  - New results visible

- **TC-UI-SEARCH-BUTTON-DISABLED**  
  Description: Search button disabled during loading.  
  Procedure:  
  - Click "TÌM CV"  
  - Attempt to click again during loading  
  Expected Result:  
  - Button shows loading state  
  - Button disabled or click ignored during load

---

### 6.12) Search Logic & Data

- **TC-SEARCH-ONLY-SEEKING-JOB**  
  Description: Only candidates with `isSeekingJob=true` shown.  
  Procedure:  
  - Search without filters  
  - Check all results  
  Expected Result:  
  - All displayed candidates have `isSeekingJob=true`  
  - Candidates with `isSeekingJob=false` not shown

- **TC-SEARCH-CLIENT-SORTING**  
  Description: Client-side sorting when keyword provided.  
  Procedure:  
  - Enter keyword  
  - Perform search  
  Expected Result:  
  - Results sorted by relevance score (keyword matches prioritized)  
  - Candidates with keyword in job title/skills/experience appear first

- **TC-SEARCH-SKILLS-PARSING**  
  Description: Skills string parsed correctly.  
  Procedure:  
  - View candidate with skills string (comma/semicolon/newline separated)  
  Expected Result:  
  - Skills split into array  
  - Each skill displayed as separate tag/item

- **TC-SEARCH-EXPERIENCE-DETAILS**  
  Description: Experience details mapped correctly.  
  Procedure:  
  - View candidate with experience details  
  Expected Result:  
  - Experience entries show position and company  
  - Fallback to job title if no experience details  
  - "Chưa cập nhật" if no data

---

## Quick Notes
- Only logged-in candidates can apply.  
- Valid files: .pdf/.doc/.docx, <5MB.  
- Cover letter is optional.  
- Always send bearer token on apply/upload requests.  
- **Recruiter Search CV**: Only candidates with `isSeekingJob=true` are searchable.  
- Default pagination: 10 items per page.  
- Search requires recruiter role; candidates/employees cannot access.  

