using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using VCareer.Dto.Profile;
using VCareer.IServices.IProfileServices;
using VCareer.Models.CV;
using VCareer.Models.Users;
using VCareer.Permission;
using VCareer.Permissions;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Users;
using Volo.Abp.Validation;
using Volo.Abp.Emailing;

namespace VCareer.Services.Profile
{
    /*[Authorize(VCareerPermission.Profile.Default)]*/
    public class CandidateSearchAppService : VCareerAppService, ICandidateSearchAppService
    {
        private readonly IRepository<CandidateProfile, Guid> _candidateProfileRepository;
        private readonly IRepository<CandidateCv, Guid> _candidateCvRepository;
        private readonly ICurrentUser _currentUser;
        private readonly IEmailSender _emailSender;

        public CandidateSearchAppService(
            IRepository<CandidateProfile, Guid> candidateProfileRepository,
            IRepository<CandidateCv, Guid> candidateCvRepository,
            ICurrentUser currentUser,
            IEmailSender emailSender)
        {
            _candidateProfileRepository = candidateProfileRepository;
            _candidateCvRepository = candidateCvRepository;
            _currentUser = currentUser;
            _emailSender = emailSender;
        }

        public async Task<PagedResultDto<CandidateSearchResultDto>> SearchCandidatesAsync(SearchCandidateInputDto input)
        {
            if (input == null)
            {
                throw new AbpValidationException("Input không hợp lệ.");
            }

            var queryable = await _candidateProfileRepository.GetQueryableAsync();

            // Include User để lấy thông tin Name, Email, PhoneNumber
            queryable = queryable.Include(c => c.User);

            // Chỉ lấy các candidate có Status = true và ProfileVisibility = true
            queryable = queryable.Where(c => c.Status && c.ProfileVisibility);

            // Filter theo Keyword nếu có
            if (!string.IsNullOrWhiteSpace(input.Keyword))
            {
                var keyword = input.Keyword.Trim().ToLower();
                queryable = queryable.Where(c =>
                    (input.SearchInJobTitle && c.JobTitle != null && c.JobTitle.ToLower().Contains(keyword)) ||
                    (input.SearchInSkills && c.Skills != null && c.Skills.ToLower().Contains(keyword)) ||
                    (input.SearchInExperience && c.Experience.HasValue && c.Experience.ToString().Contains(keyword)) ||
                    (c.Location != null && c.Location.ToLower().Contains(keyword)) ||
                    (c.WorkLocation != null && c.WorkLocation.ToLower().Contains(keyword))
                );
            }

            // Filter theo JobTitle
            if (!string.IsNullOrWhiteSpace(input.JobTitle))
            {
                var jobTitle = input.JobTitle.Trim().ToLower();
                queryable = queryable.Where(c => c.JobTitle != null && c.JobTitle.ToLower().Contains(jobTitle));
            }

            // Filter theo Skills
            if (!string.IsNullOrWhiteSpace(input.Skills))
            {
                var skills = input.Skills.Trim().ToLower();
                queryable = queryable.Where(c => c.Skills != null && c.Skills.ToLower().Contains(skills));
            }

            // Filter theo Experience range
            if (input.MinExperience.HasValue)
            {
                queryable = queryable.Where(c => c.Experience.HasValue && c.Experience >= input.MinExperience.Value);
            }
            if (input.MaxExperience.HasValue)
            {
                queryable = queryable.Where(c => c.Experience.HasValue && c.Experience <= input.MaxExperience.Value);
            }

            // Filter theo Salary range
            if (input.MinSalary.HasValue)
            {
                queryable = queryable.Where(c => c.Salary.HasValue && c.Salary >= input.MinSalary.Value);
            }
            if (input.MaxSalary.HasValue)
            {
                queryable = queryable.Where(c => c.Salary.HasValue && c.Salary <= input.MaxSalary.Value);
            }

            // Filter theo WorkLocation
            if (!string.IsNullOrWhiteSpace(input.WorkLocation))
            {
                var workLocation = input.WorkLocation.Trim().ToLower();
                queryable = queryable.Where(c => 
                    (c.WorkLocation != null && c.WorkLocation.ToLower().Contains(workLocation)) ||
                    (c.Location != null && c.Location.ToLower().Contains(workLocation))
                );
            }

            // TODO: Filter theo CV Classification (seen/unseen) - cần join với bảng JobApplication hoặc bảng khác
            // if (input.CvClassification == "seen")
            // {
            //     // Chỉ lấy các candidate đã được xem
            // }
            // else if (input.CvClassification == "unseen")
            // {
            //     // Chỉ lấy các candidate chưa được xem
            // }

            // Sorting dựa trên DisplayPriority
            var sorting = !string.IsNullOrWhiteSpace(input.Sorting)
                ? input.Sorting
                : GetDefaultSorting(input.DisplayPriority);

            queryable = queryable.OrderBy(sorting);

            // Pagination
            var skipCount = input.SkipCount >= 0 ? input.SkipCount : 0;
            var maxResultCount = input.MaxResultCount > 0 ? input.MaxResultCount : 10;

            var totalCount = await AsyncExecuter.CountAsync(queryable);
            var candidates = await AsyncExecuter.ToListAsync(
                queryable.Skip(skipCount).Take(maxResultCount)
            );

            var candidateUserIds = candidates
                .Where(c => c.UserId != Guid.Empty)
                .Select(c => c.UserId)
                .Distinct()
                .ToList();
            var candidateProfileIds = candidates.Select(c => c.Id).Distinct().ToList();
            
            var defaultCvLookup = await GetDefaultCvLookupAsync(candidateUserIds, candidateProfileIds);
            var candidateDtos = candidates
                .Select(c => MapCandidateToResult(c, defaultCvLookup))
                .ToList();

            return new PagedResultDto<CandidateSearchResultDto>(
                totalCount,
                candidateDtos
            );
        }

        public async Task<CandidateSearchResultDto> GetCandidateDetailAsync(Guid candidateProfileId)
        {
            var queryable = await _candidateProfileRepository.GetQueryableAsync();
            var candidate = await queryable
                .Where(c => c.Id == candidateProfileId && c.Status && c.ProfileVisibility)
                .Include(c => c.User)
                .FirstOrDefaultAsync();

            if (candidate == null)
            {
                throw new UserFriendlyException("Không tìm thấy ứng viên");
            }

            var defaultCvLookup = await GetDefaultCvLookupAsync(
                new List<Guid> { candidate.UserId },
                new List<Guid> { candidate.Id }
            );
            return MapCandidateToResult(candidate, defaultCvLookup);
        }

        public async Task SendConnectionRequestAsync(SendConnectionRequestDto input)
        {
            if (input == null)
            {
                throw new AbpValidationException("Thông tin yêu cầu không hợp lệ");
            }

            if (input.Emails == null || input.Emails.Count == 0)
            {
                throw new AbpValidationException("Vui lòng cung cấp ít nhất một email nhận phản hồi");
            }

            var candidateQueryable = await _candidateProfileRepository.GetQueryableAsync();
            var candidate = await candidateQueryable
                .Where(c => c.Id == input.CandidateProfileId)
                .Include(c => c.User)
                .FirstOrDefaultAsync();

            if (candidate == null || string.IsNullOrWhiteSpace(candidate.Email ?? candidate.User?.Email))
            {
                throw new UserFriendlyException("Ứng viên không có email để gửi yêu cầu kết nối");
            }

            var candidateEmail = candidate.Email ?? candidate.User?.Email;
            var subject = $"VCareer - {input.CompanyName} muốn kết nối với bạn cho vị trí {input.JobTitle}";

            var recruiterEmailsHtml = string.Join("", input.Emails.Select(e => $"<span class=\"email-tag\">{e}</span>"));
            var messageHtml = System.Net.WebUtility.HtmlEncode(input.Message).Replace("\n", "<br/>");
            var candidateDisplayName = !string.IsNullOrWhiteSpace(candidate.User?.Name)
                ? candidate.User!.Name
                : candidateEmail;
            var deadline = Clock.Now.AddDays(7);
            var deadlineString = deadline.ToString("HH:mm dd/MM/yyyy");
            var companyInitials = string.IsNullOrWhiteSpace(input.CompanyName)
                ? "VC"
                : new string(input.CompanyName.Split(' ', StringSplitOptions.RemoveEmptyEntries)
                    .Select(w => char.ToUpperInvariant(w[0]))
                    .Take(2)
                    .ToArray());

            var emailBody = $@"
<!DOCTYPE html>
<html lang=""vi"">
<head>
  <meta charset=""UTF-8"" />
  <title>VCareer - Kết nối ứng viên</title>
  <style>
    body {{
      margin: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f3f4f6;
      color: #111827;
    }}
    .wrapper {{
      padding: 30px 0;
    }}
    .mail-container {{
      max-width: 680px;
      margin: 0 auto;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 20px 50px rgba(15, 131, 186, 0.15);
      overflow: hidden;
    }}
    .mail-header {{
      background: linear-gradient(105deg, #0f83ba, #16a34a);
      padding: 32px 40px;
      color: #fff;
    }}
    .mail-header h1 {{
      margin: 0;
      font-size: 24px;
      letter-spacing: 0.5px;
    }}
    .mail-header p {{
      margin: 8px 0 0;
      font-size: 14px;
      opacity: .9;
    }}
    .mail-body {{
      padding: 32px 40px;
    }}
    .title {{
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 8px;
    }}
    .subtitle {{
      color: #6b7280;
      margin-bottom: 24px;
      font-size: 14px;
    }}
    .card {{
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 18px;
      display: flex;
      gap: 16px;
      align-items: center;
      box-shadow: 0 6px 20px rgba(15, 131, 186, 0.08);
    }}
    .card-logo {{
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: #e0f2fe;
      color: #0369a1;
      font-size: 22px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }}
    .card-content {{
      flex: 1;
    }}
    .card-content h3 {{
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }}
    .card-content .job-title {{
      color: #0f83ba;
      font-weight: 600;
      margin: 4px 0;
    }}
    .card-content .info-row {{
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #6b7280;
    }}
    .card-actions {{
      display: flex;
      flex-direction: column;
      gap: 8px;
    }}
    .btn {{
      display: inline-block;
      min-width: 120px;
      text-align: center;
      padding: 10px 0;
      border-radius: 10px;
      font-weight: 600;
      text-decoration: none;
      color: #fff;
      font-size: 14px;
    }}
    .btn-primary {{
      background: #22c55e;
    }}
    .btn-secondary {{
      background: #d1d5db;
      color: #374151;
    }}
    .message {{
      margin-top: 12px;
      background: #f9fafb;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      line-height: 1.6;
    }}
    .emails {{
      margin-top: 18px;
      font-size: 13px;
      color: #374151;
    }}
    .email-tag {{
      display: inline-block;
      margin: 4px 6px 0 0;
      background: #e0f2fe;
      color: #0369a1;
      padding: 6px 12px;
      border-radius: 999px;
      font-weight: 500;
    }}
    .timeline {{
      margin-top: 20px;
      font-size: 13px;
      color: #6b7280;
      border-top: 1px dashed #e5e7eb;
      padding-top: 16px;
    }}
    .mail-footer {{
      padding: 20px 40px 30px;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
    }}
  </style>
</head>
<body>
  <div class=""wrapper"">
    <div class=""mail-container"">
      <div class=""mail-header"">
        <h1>VCareer · Tiếp lợi thế - Nối thành công</h1>
        <p>Giữ liên lạc với nhà tuyển dụng phù hợp</p>
      </div>
      <div class=""mail-body"">
        <div class=""title"">Nhà tuyển dụng muốn kết nối với bạn</div>
        <div class=""subtitle"">Xin chào {candidateDisplayName},<br/>
          {input.CompanyName} đánh giá cao hồ sơ của bạn và mong muốn trao đổi thêm về vị trí đang tuyển.</div>
        <div class=""card"">
          <div class=""card-logo"">{companyInitials}</div>
          <div class=""card-content"">
            <h3>{input.CompanyName}</h3>
            <div class=""job-title"">{input.JobTitle}</div>
            <div class=""info-row"">
              <span>Thời hạn phản hồi:</span>
              <strong>{deadlineString}</strong>
            </div>
            <div class=""message"">{messageHtml}</div>
            <div class=""emails"">
              Vui lòng phản hồi tới các địa chỉ:
              <div>{recruiterEmailsHtml}</div>
            </div>
          </div>
          <div class=""card-actions"">
            <a class=""btn btn-primary"" href=""mailto:{string.Join(",", input.Emails)}?subject=Phản hồi kết nối từ {candidateDisplayName}"">Đồng ý</a>
            <a class=""btn btn-secondary"" href=""mailto:{string.Join(",", input.Emails)}?subject=Từ chối kết nối"">Từ chối</a>
          </div>
        </div>
        <div class=""timeline"">
          * Chỉ sau khi bạn nhấn <strong>Đồng ý</strong>, VCareer sẽ mở thông tin liên hệ của bạn cho nhà tuyển dụng. Nếu sau {deadlineString} bạn chưa phản hồi, yêu cầu này sẽ hết hạn.
        </div>
      </div>
      <div class=""mail-footer"">
        © {DateTime.UtcNow.Year} VCareer · Tầng 5, GócSeason 37/39 Nguyễn Tuân, Thanh Xuân, Hà Nội
      </div>
    </div>
  </div>
</body>
</html>";

            await _emailSender.SendAsync(
                candidateEmail,
                subject,
                emailBody,
                true
            );
        }

        private string GetDefaultSorting(string? displayPriority)
        {
            return displayPriority switch
            {
                "newest" => "LastModificationTime DESC, CreationTime DESC",
                "seeking" => "Status DESC, ProfileVisibility DESC, LastModificationTime DESC",
                "experienced" => "Experience DESC, LastModificationTime DESC",
                "suitable" => "LastModificationTime DESC, Experience DESC",
                _ => "LastModificationTime DESC, CreationTime DESC"
            };
        }

        private CandidateSearchResultDto MapCandidateToResult(
            CandidateProfile candidate,
            IDictionary<Guid, Guid> defaultCvLookup)
        {
            var name = "N/A";
            if (candidate.User != null)
            {
                var nameParts = new List<string>();
                if (!string.IsNullOrWhiteSpace(candidate.User.Name))
                {
                    nameParts.Add(candidate.User.Name);
                }
                if (!string.IsNullOrWhiteSpace(candidate.User.Surname))
                {
                    nameParts.Add(candidate.User.Surname);
                }
                if (nameParts.Count > 0)
                {
                    name = string.Join(" ", nameParts);
                }
            }

            Guid? defaultCvId = null;
            if (candidate.UserId != Guid.Empty && defaultCvLookup.TryGetValue(candidate.UserId, out var cvIdByUser))
            {
                defaultCvId = cvIdByUser;
            }
            else if (defaultCvLookup.TryGetValue(candidate.Id, out var cvIdByProfile))
            {
                defaultCvId = cvIdByProfile;
            }

            return new CandidateSearchResultDto
            {
                Id = candidate.Id,
                CandidateUserId = candidate.UserId,
                DefaultCvId = defaultCvId,
                Name = name,
                Email = candidate.Email ?? candidate.User?.Email,
                PhoneNumber = candidate.User?.PhoneNumber,
                AvatarUrl = null,
                JobTitle = candidate.JobTitle,
                Skills = candidate.Skills,
                Experience = candidate.Experience,
                Salary = candidate.Salary,
                WorkLocation = candidate.WorkLocation,
                Location = candidate.Location,
                Gender = candidate.Gender,
                DateOfBirth = candidate.DateOfbirth,
                ProfileVisibility = candidate.ProfileVisibility,
                Status = candidate.Status,
                ViewCount = 0,
                ContactOpenCount = 0,
                IsSeekingJob = candidate.Status && candidate.ProfileVisibility,
                LastUpdatedTime = candidate.LastModificationTime ?? candidate.CreationTime,
                ExperienceDetails = null,
                Education = null
            };
        }

        private async Task<Dictionary<Guid, Guid>> GetDefaultCvLookupAsync(List<Guid> candidateUserIds, List<Guid>? candidateProfileIds = null)
        {
            var lookup = new Dictionary<Guid, Guid>();

            if ((candidateUserIds == null || candidateUserIds.Count == 0) &&
                (candidateProfileIds == null || candidateProfileIds.Count == 0))
            {
                return lookup;
            }

            var cvQueryable = await _candidateCvRepository.GetQueryableAsync();

            var cvEntries = await AsyncExecuter.ToListAsync(
                cvQueryable
                    .Where(cv =>
                        (candidateUserIds != null && candidateUserIds.Contains(cv.CandidateId)) ||
                        (candidateProfileIds != null && candidateProfileIds.Contains(cv.CandidateId)))
                    .OrderByDescending(cv => cv.IsDefault)
                    .ThenByDescending(cv => cv.PublishedAt ?? cv.CreationTime)
                    .Select(cv => new { cv.CandidateId, cv.Id })
            );

            lookup = cvEntries
                .GroupBy(x => x.CandidateId)
                .ToDictionary(g => g.Key, g => g.First().Id);

            return lookup;
        }
    }
}

