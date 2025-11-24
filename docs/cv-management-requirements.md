# Quản lý CV Ứng viên - Function Requirements

## This screen allows the Leader Recruiter, HR Staff to:

1. View list of candidates who have applied to job positions
2. Search candidates by name, email, or phone number
3. Filter candidates by status, campaign, source, label, and time range
4. Update candidate status inline using dropdown (6 statuses available)
5. Add/edit notes for each candidate
6. View candidate CV details
7. Download candidate CV
8. Copy candidate code to clipboard
9. Edit candidate information
10. Delete candidate from list

## On this screen, the user can also:

- Export candidate list (TODO)
- Assign campaign to candidate (currently null)
- View paginated results (7 items per page)
- See total count of filtered candidates

---

## Field Description

| Field Name | Description |
|------------|-------------|
| **Tìm kiếm** | Search input field to filter candidates by name, email, or phone number. Located in the filter bar at the top of the screen. **Action type:** Text Input |
| **Ứng viên** | Displays candidate name, avatar (or initials), and "Đã xem" badge if CV has been viewed. Data from `ApplicationDto.candidateName` and `ApplicationDto.viewedAt`. **Action type:** Display/Text |
| **Chiến dịch** | Displays campaign name and ID. Currently set to null as per requirement. Data from `ApplicationDto.campaignName` and `ApplicationDto.campaignId`. **Action type:** Display/Text |
| **Thông tin liên hệ** | Displays candidate email and phone number. Currently using placeholder, needs backend to add to `ApplicationDto`. **Action type:** Display/Text |
| **Nguồn CV** | Displays CV source (Find CV, TopCV hỗ trợ, Website, LinkedIn, Facebook, Referral, Other) and date/time when CV was added to system. Data from `ApplicationDto.cvType` and `ApplicationDto.creationTime`. **Action type:** Display/Text |
| **Ngày ứng tuyển** | Displays the date when candidate applied. Format: DD/MM/YYYY. Data from `ApplicationDto.creationTime`. **Action type:** Display/Text |
| **Trạng thái** | Dropdown to change candidate status inline. 6 statuses: CV tiếp nhận (default), Phù hợp, Hẹn phỏng vấn, Gửi đề nghị, Nhận việc, Chưa phù hợp. Data from `ApplicationDto.status`. **Action type:** Dropdown/Select |
| **Ghi chú** | Displays recruiter notes about candidate. Can be added/edited via modal. Data from `ApplicationDto.recruiterNotes`. **Action type:** Text Area (via Modal) |
| **Thao tác** | Action menu (3 dots) with options: Ghi chú, Tải CV, Sao chép mã ứng viên, Xem CV, Chỉnh sửa, Xóa. **Action type:** Action Menu/Dropdown |

---

## Status Values

| Status ID | Status Name | Description |
|-----------|-------------|-------------|
| `received` | CV tiếp nhận | Default status when candidate submits CV |
| `suitable` | Phù hợp | Candidate is suitable for the position |
| `interview` | Hẹn phỏng vấn | Interview scheduled with candidate |
| `offer` | Gửi đề nghị | Job offer sent to candidate |
| `hired` | Nhận việc | Candidate accepted and started work |
| `not-suitable` | Chưa phù hợp | Candidate is not suitable for the position |

---

## Data Source

- **Profile Table**: Candidate information (name, email, phone - needs backend mapping)
- **Application Table**: Application information (status, notes, appliedDate, cvType, etc.)

