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

## Quick Notes
- Only logged-in candidates can apply.  
- Valid files: .pdf/.doc/.docx, <5MB.  
- Cover letter is optional.  
- Always send bearer token on apply/upload requests.  

