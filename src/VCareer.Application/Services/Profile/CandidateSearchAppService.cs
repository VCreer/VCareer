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
using VCareer.Dto.CVDto;
using VCareer.Permission;
using VCareer.Permissions;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Users;
using Volo.Abp.Validation;
using Volo.Abp.Emailing;
using VCareer.CV;

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

            // Kiểm tra xem có scope nào được chọn không
            var hasAnyScopeSelected = input.SearchInJobTitle || input.SearchInActivity ||
                                      input.SearchInEducation || input.SearchInExperience || input.SearchInSkills;

            // Nếu recruiter chọn phạm vi tìm kiếm, lọc bỏ ứng viên không có dữ liệu ở các trường đó
            if (hasAnyScopeSelected)
            {
                if (input.SearchInJobTitle)
                {
                    queryable = queryable.Where(c => c.JobTitle != null && !string.IsNullOrWhiteSpace(c.JobTitle));
                }

                if (input.SearchInActivity)
                {
                    queryable = queryable.Where(c =>
                        (c.Location != null && !string.IsNullOrWhiteSpace(c.Location)) ||
                        (c.WorkLocation != null && !string.IsNullOrWhiteSpace(c.WorkLocation))
                    );
                }

                if (input.SearchInExperience)
                {
                    queryable = queryable.Where(c => c.Experience.HasValue);
                }

                if (input.SearchInSkills)
                {
                    queryable = queryable.Where(c => c.Skills != null && !string.IsNullOrWhiteSpace(c.Skills));
                }
            }

            // Filter theo Keyword nếu có
            // Lưu danh sách candidate IDs đã match trong profile để tránh search lại trong CV
            List<Guid>? profileMatchedCandidateIds = null;
            
            if (!string.IsNullOrWhiteSpace(input.Keyword))
            {
                var keyword = input.Keyword.Trim();
                var keywordLower = keyword.ToLower();
                
                // Parse keyword thành các từ khóa riêng lẻ (hỗ trợ comma, semicolon, space)
                var keywords = ParseKeywords(keyword);
                var keywordsLower = keywords.Select(k => k.ToLower()).ToList();

                if (hasAnyScopeSelected)
                {
                    // Nếu có scope được chọn, chỉ tìm trong các trường tương ứng trong profile
                    queryable = queryable.Where(c =>
                        (input.SearchInJobTitle && c.JobTitle != null && ContainsAnyKeyword(c.JobTitle, keywordsLower)) ||
                        (input.SearchInSkills && c.Skills != null && ContainsAnyKeyword(c.Skills, keywordsLower)) ||
                        (input.SearchInExperience && c.Experience.HasValue && keywordsLower.Any(k => c.Experience.ToString().Contains(k))) ||
                        (input.SearchInActivity && c.Location != null && ContainsAnyKeyword(c.Location, keywordsLower)) ||
                        (input.SearchInActivity && c.WorkLocation != null && ContainsAnyKeyword(c.WorkLocation, keywordsLower))
                    );
                }
                else
                {
                    // Nếu không chọn phạm vi nào, tìm trong tất cả các trường hiện có trong profile
                    queryable = queryable.Where(c =>
                        (c.JobTitle != null && ContainsAnyKeyword(c.JobTitle, keywordsLower)) ||
                        (c.Skills != null && ContainsAnyKeyword(c.Skills, keywordsLower)) ||
                        (c.Experience.HasValue && keywordsLower.Any(k => c.Experience.ToString().Contains(k))) ||
                        (c.Location != null && ContainsAnyKeyword(c.Location, keywordsLower)) ||
                        (c.WorkLocation != null && ContainsAnyKeyword(c.WorkLocation, keywordsLower))
                    );
                }
                
                // Lưu danh sách candidate IDs đã match trong profile
                // Sẽ được sử dụng sau để tìm thêm trong CV nếu cần
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

            // Nếu có keyword, cần search thêm trong CV mặc định cho các candidates không match trong profile
            List<Guid>? additionalCandidateIdsFromCv = null;
            if (!string.IsNullOrWhiteSpace(input.Keyword))
            {
                // Lấy tất cả candidates đã được filter (trừ keyword) để search trong CV
                var allCandidatesQuery = await _candidateProfileRepository.GetQueryableAsync();
                allCandidatesQuery = allCandidatesQuery.Include(c => c.User);
                allCandidatesQuery = allCandidatesQuery.Where(c => c.Status && c.ProfileVisibility);
                
                // Apply các filter khác (không phải keyword)
                if (hasAnyScopeSelected)
                {
                    if (input.SearchInJobTitle)
                        allCandidatesQuery = allCandidatesQuery.Where(c => c.JobTitle != null && !string.IsNullOrWhiteSpace(c.JobTitle));
                    if (input.SearchInActivity)
                        allCandidatesQuery = allCandidatesQuery.Where(c => (c.Location != null && !string.IsNullOrWhiteSpace(c.Location)) || (c.WorkLocation != null && !string.IsNullOrWhiteSpace(c.WorkLocation)));
                    if (input.SearchInExperience)
                        allCandidatesQuery = allCandidatesQuery.Where(c => c.Experience.HasValue);
                    if (input.SearchInSkills)
                        allCandidatesQuery = allCandidatesQuery.Where(c => c.Skills != null && !string.IsNullOrWhiteSpace(c.Skills));
                }
                
                // Apply các filter khác
                if (!string.IsNullOrWhiteSpace(input.JobTitle))
                {
                    var jobTitle = input.JobTitle.Trim().ToLower();
                    allCandidatesQuery = allCandidatesQuery.Where(c => c.JobTitle != null && c.JobTitle.ToLower().Contains(jobTitle));
                }
                if (!string.IsNullOrWhiteSpace(input.Skills))
                {
                    var skills = input.Skills.Trim().ToLower();
                    allCandidatesQuery = allCandidatesQuery.Where(c => c.Skills != null && c.Skills.ToLower().Contains(skills));
                }
                if (input.MinExperience.HasValue)
                    allCandidatesQuery = allCandidatesQuery.Where(c => c.Experience.HasValue && c.Experience >= input.MinExperience.Value);
                if (input.MaxExperience.HasValue)
                    allCandidatesQuery = allCandidatesQuery.Where(c => c.Experience.HasValue && c.Experience <= input.MaxExperience.Value);
                if (input.MinSalary.HasValue)
                    allCandidatesQuery = allCandidatesQuery.Where(c => c.Salary.HasValue && c.Salary >= input.MinSalary.Value);
                if (input.MaxSalary.HasValue)
                    allCandidatesQuery = allCandidatesQuery.Where(c => c.Salary.HasValue && c.Salary <= input.MaxSalary.Value);
                if (!string.IsNullOrWhiteSpace(input.WorkLocation))
                {
                    var workLocation = input.WorkLocation.Trim().ToLower();
                    allCandidatesQuery = allCandidatesQuery.Where(c => (c.WorkLocation != null && c.WorkLocation.ToLower().Contains(workLocation)) || (c.Location != null && c.Location.ToLower().Contains(workLocation)));
                }
                
                // Lấy tất cả candidate IDs để search trong CV
                var allCandidateIds = await AsyncExecuter.ToListAsync(
                    allCandidatesQuery.Select(c => c.Id)
                );
                
                // Lấy danh sách candidate IDs đã match trong profile
                var profileMatchedIds = await AsyncExecuter.ToListAsync(
                    queryable.Select(c => c.Id)
                );
                
                // Chỉ search trong CV cho các candidates chưa match trong profile
                var candidatesToSearchInCv = allCandidateIds.Except(profileMatchedIds).ToList();
                
                if (candidatesToSearchInCv.Any())
                {
                    // Search trong CV mặc định
                    additionalCandidateIdsFromCv = await SearchInDefaultCvsAsync(candidatesToSearchInCv, input.Keyword, hasAnyScopeSelected, input);
                    
                    // Merge với query từ profile
                    if (additionalCandidateIdsFromCv != null && additionalCandidateIdsFromCv.Any())
                    {
                        var additionalCandidatesQuery = await _candidateProfileRepository.GetQueryableAsync();
                        additionalCandidatesQuery = additionalCandidatesQuery.Include(c => c.User);
                        additionalCandidatesQuery = additionalCandidatesQuery.Where(c => c.Status && c.ProfileVisibility && additionalCandidateIdsFromCv.Contains(c.Id));
                        
                        // Apply các filter khác cho additional candidates
                        if (hasAnyScopeSelected)
                        {
                            if (input.SearchInJobTitle)
                                additionalCandidatesQuery = additionalCandidatesQuery.Where(c => c.JobTitle != null && !string.IsNullOrWhiteSpace(c.JobTitle));
                            if (input.SearchInActivity)
                                additionalCandidatesQuery = additionalCandidatesQuery.Where(c => (c.Location != null && !string.IsNullOrWhiteSpace(c.Location)) || (c.WorkLocation != null && !string.IsNullOrWhiteSpace(c.WorkLocation)));
                            if (input.SearchInExperience)
                                additionalCandidatesQuery = additionalCandidatesQuery.Where(c => c.Experience.HasValue);
                            if (input.SearchInSkills)
                                additionalCandidatesQuery = additionalCandidatesQuery.Where(c => c.Skills != null && !string.IsNullOrWhiteSpace(c.Skills));
                        }
                        
                        // Apply các filter khác
                        if (!string.IsNullOrWhiteSpace(input.JobTitle))
                        {
                            var jobTitle = input.JobTitle.Trim().ToLower();
                            additionalCandidatesQuery = additionalCandidatesQuery.Where(c => c.JobTitle != null && c.JobTitle.ToLower().Contains(jobTitle));
                        }
                        if (!string.IsNullOrWhiteSpace(input.Skills))
                        {
                            var skills = input.Skills.Trim().ToLower();
                            additionalCandidatesQuery = additionalCandidatesQuery.Where(c => c.Skills != null && c.Skills.ToLower().Contains(skills));
                        }
                        if (input.MinExperience.HasValue)
                            additionalCandidatesQuery = additionalCandidatesQuery.Where(c => c.Experience.HasValue && c.Experience >= input.MinExperience.Value);
                        if (input.MaxExperience.HasValue)
                            additionalCandidatesQuery = additionalCandidatesQuery.Where(c => c.Experience.HasValue && c.Experience <= input.MaxExperience.Value);
                        if (input.MinSalary.HasValue)
                            additionalCandidatesQuery = additionalCandidatesQuery.Where(c => c.Salary.HasValue && c.Salary >= input.MinSalary.Value);
                        if (input.MaxSalary.HasValue)
                            additionalCandidatesQuery = additionalCandidatesQuery.Where(c => c.Salary.HasValue && c.Salary <= input.MaxSalary.Value);
                        if (!string.IsNullOrWhiteSpace(input.WorkLocation))
                        {
                            var workLocation = input.WorkLocation.Trim().ToLower();
                            additionalCandidatesQuery = additionalCandidatesQuery.Where(c => (c.WorkLocation != null && c.WorkLocation.ToLower().Contains(workLocation)) || (c.Location != null && c.Location.ToLower().Contains(workLocation)));
                        }
                        
                        // Merge với query từ profile bằng cách lấy union của IDs
                        var profileIds = await AsyncExecuter.ToListAsync(queryable.Select(c => c.Id));
                        var additionalIds = await AsyncExecuter.ToListAsync(additionalCandidatesQuery.Select(c => c.Id));
                        var allMatchedIds = profileIds.Union(additionalIds).ToList();
                        
                        // Rebuild query với tất cả matched IDs
                        queryable = await _candidateProfileRepository.GetQueryableAsync();
                        queryable = queryable.Include(c => c.User);
                        queryable = queryable.Where(c => c.Status && c.ProfileVisibility && allMatchedIds.Contains(c.Id));
                    }
                }
            }

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

        /// <summary>
        /// Parse keyword thành các từ khóa riêng lẻ (hỗ trợ comma, semicolon, space)
        /// </summary>
        private List<string> ParseKeywords(string keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword))
                return new List<string>();

            // Split by comma, semicolon, hoặc space (nếu có nhiều từ)
            var keywords = keyword
                .Split(new[] { ',', ';', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(k => k.Trim())
                .Where(k => !string.IsNullOrWhiteSpace(k))
                .ToList();

            // Nếu không split được (chỉ có 1 từ), trả về keyword gốc
            if (keywords.Count == 0)
                keywords.Add(keyword.Trim());

            return keywords;
        }

        /// <summary>
        /// Kiểm tra xem text có chứa bất kỳ keyword nào không (case-insensitive)
        /// </summary>
        private bool ContainsAnyKeyword(string text, List<string> keywords)
        {
            if (string.IsNullOrWhiteSpace(text) || keywords == null || keywords.Count == 0)
                return false;

            var textLower = text.ToLower();
            return keywords.Any(k => textLower.Contains(k));
        }

        /// <summary>
        /// Search keyword trong CV mặc định của các candidates
        /// </summary>
        private async Task<List<Guid>> SearchInDefaultCvsAsync(
            List<Guid> candidateProfileIds,
            string keyword,
            bool hasAnyScopeSelected,
            SearchCandidateInputDto input)
        {
            if (candidateProfileIds == null || candidateProfileIds.Count == 0 || string.IsNullOrWhiteSpace(keyword))
                return new List<Guid>();

            var keywords = ParseKeywords(keyword);
            var keywordsLower = keywords.Select(k => k.ToLower()).ToList();

            // Lấy CV mặc định của các candidates
            var cvQueryable = await _candidateCvRepository.GetQueryableAsync();
            var defaultCvs = await AsyncExecuter.ToListAsync(
                cvQueryable
                    .Where(cv => candidateProfileIds.Contains(cv.CandidateId) && cv.IsDefault && !string.IsNullOrEmpty(cv.DataJson))
                    .Select(cv => new { cv.CandidateId, cv.DataJson })
            );

            var matchedCandidateIds = new List<Guid>();

            foreach (var cv in defaultCvs)
            {
                try
                {
                    // Parse DataJson
                    var cvData = System.Text.Json.JsonSerializer.Deserialize<CvDataDto>(cv.DataJson, new System.Text.Json.JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (cvData == null)
                        continue;

                    bool isMatch = false;

                    if (hasAnyScopeSelected)
                    {
                        // Nếu có scope được chọn, chỉ tìm trong các trường tương ứng
                        if (input.SearchInJobTitle && cvData.PersonalInfo != null && !string.IsNullOrWhiteSpace(cvData.PersonalInfo.FullName))
                        {
                            isMatch = ContainsAnyKeyword(cvData.PersonalInfo.FullName, keywordsLower);
                        }
                        else if (input.SearchInSkills && cvData.Skills != null && cvData.Skills.Any())
                        {
                            var skillsText = string.Join(" ", cvData.Skills.Select(s => s.SkillName ?? "").Where(s => !string.IsNullOrWhiteSpace(s)));
                            isMatch = ContainsAnyKeyword(skillsText, keywordsLower);
                        }
                        else if (input.SearchInEducation && cvData.Educations != null && cvData.Educations.Any())
                        {
                            var educationText = string.Join(" ", cvData.Educations.Select(e => 
                                $"{e.InstitutionName} {e.Major} {e.Degree}").Where(e => !string.IsNullOrWhiteSpace(e)));
                            isMatch = ContainsAnyKeyword(educationText, keywordsLower);
                        }
                        else if (input.SearchInExperience && cvData.WorkExperiences != null && cvData.WorkExperiences.Any())
                        {
                            var experienceText = string.Join(" ", cvData.WorkExperiences.Select(e => 
                                $"{e.CompanyName} {e.Position} {e.Description}").Where(e => !string.IsNullOrWhiteSpace(e)));
                            isMatch = ContainsAnyKeyword(experienceText, keywordsLower);
                        }
                    }
                    else
                    {
                        // Nếu không chọn phạm vi nào, tìm trong tất cả các trường trong CV
                        var allText = new List<string>();

                        // PersonalInfo
                        if (cvData.PersonalInfo != null)
                        {
                            if (!string.IsNullOrWhiteSpace(cvData.PersonalInfo.FullName))
                                allText.Add(cvData.PersonalInfo.FullName);
                            if (!string.IsNullOrWhiteSpace(cvData.PersonalInfo.Email))
                                allText.Add(cvData.PersonalInfo.Email);
                            if (!string.IsNullOrWhiteSpace(cvData.PersonalInfo.Address))
                                allText.Add(cvData.PersonalInfo.Address);
                        }

                        // Skills
                        if (cvData.Skills != null && cvData.Skills.Any())
                        {
                            allText.AddRange(cvData.Skills.Select(s => s.SkillName ?? "").Where(s => !string.IsNullOrWhiteSpace(s)));
                        }

                        // WorkExperiences
                        if (cvData.WorkExperiences != null && cvData.WorkExperiences.Any())
                        {
                            allText.AddRange(cvData.WorkExperiences.Select(e => 
                                $"{e.CompanyName} {e.Position} {e.Description}").Where(e => !string.IsNullOrWhiteSpace(e)));
                        }

                        // Educations
                        if (cvData.Educations != null && cvData.Educations.Any())
                        {
                            allText.AddRange(cvData.Educations.Select(e => 
                                $"{e.InstitutionName} {e.Major} {e.Degree}").Where(e => !string.IsNullOrWhiteSpace(e)));
                        }

                        // Projects
                        if (cvData.Projects != null && cvData.Projects.Any())
                        {
                            allText.AddRange(cvData.Projects.Select(p => 
                                $"{p.ProjectName} {p.Description} {p.Technologies}").Where(p => !string.IsNullOrWhiteSpace(p)));
                        }

                        // CareerObjective
                        if (!string.IsNullOrWhiteSpace(cvData.CareerObjective))
                            allText.Add(cvData.CareerObjective);

                        var combinedText = string.Join(" ", allText);
                        isMatch = ContainsAnyKeyword(combinedText, keywordsLower);
                    }

                    if (isMatch)
                    {
                        matchedCandidateIds.Add(cv.CandidateId);
                    }
                }
                catch
                {
                    // Nếu parse CV data lỗi, bỏ qua
                    continue;
                }
            }

            return matchedCandidateIds;
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

