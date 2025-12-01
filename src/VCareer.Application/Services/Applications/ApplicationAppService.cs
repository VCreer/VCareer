using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using VCareer.Models.Applications;
using VCareer.Models.CV;
using VCareer.Models.Job;
using VCareer.Models.Users;
using VCareer.Models.Companies;
using VCareer.Services.CV;
using VCareer;
using VCareer.Permission;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Domain.Repositories;
using VCareer.CV;
using VCareer.Application.Contracts.CV;
using Volo.Abp.Users;
using Volo.Abp.Emailing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using VCareer.Dto.Applications;
using VCareer.IServices.Application;
using Volo.Abp.Application.Services;

namespace VCareer.Application.Applications
{
    /// <summary>
    /// Application Management Service - Refactored để hỗ trợ CandidateCv và UploadedCv
    /// </summary>
    /*[Authorize(VCareerPermission.Application.Default)]*/
    public class ApplicationAppService : ApplicationService , IJobApply
    {
        private readonly IRepository<JobApplication, Guid> _applicationRepository;
        private readonly IRepository<CandidateProfile, Guid> _candidateRepository;
        private readonly IRepository<Job_Post, Guid> _jobPostingRepository;
        private readonly IRepository<CandidateCv, Guid> _candidateCvRepository;
        private readonly IRepository<UploadedCv, Guid> _uploadedCvRepository;
        private readonly IRepository<RecruiterProfile, Guid> _recruiterProfileRepository;
        private readonly IRepository<Company, int> _companyRepository;
        private readonly IRepository<Volo.Abp.Identity.IdentityUser, Guid> _identityUserRepository;
        private readonly ICandidateCvAppService _candidateCvAppService;
        private readonly IUploadedCvAppService _uploadedCvAppService;
        private readonly ICurrentUser _currentUser;
        private readonly IEmailSender _emailSender;
        private readonly IConfiguration _configuration;

        public ApplicationAppService(
            IRepository<JobApplication, Guid> applicationRepository,
            IRepository<CandidateProfile, Guid> candidateRepository,
            IRepository<Job_Post, Guid> jobPostingRepository,
            IRepository<CandidateCv, Guid> candidateCvRepository,
            IRepository<UploadedCv, Guid> uploadedCvRepository,
            IRepository<RecruiterProfile, Guid> recruiterProfileRepository,
            IRepository<Company, int> companyRepository,
            IRepository<Volo.Abp.Identity.IdentityUser, Guid> identityUserRepository,
            ICandidateCvAppService candidateCvAppService,
            IUploadedCvAppService uploadedCvAppService,
            ICurrentUser currentUser,
            IEmailSender emailSender,
            IConfiguration configuration)
        {
            _applicationRepository = applicationRepository;
            _candidateRepository = candidateRepository;
            _jobPostingRepository = jobPostingRepository;
            _candidateCvRepository = candidateCvRepository;
            _uploadedCvRepository = uploadedCvRepository;
            _recruiterProfileRepository = recruiterProfileRepository;
            _companyRepository = companyRepository;
            _identityUserRepository = identityUserRepository;
            _candidateCvAppService = candidateCvAppService;
            _uploadedCvAppService = uploadedCvAppService;
            _currentUser = currentUser;
            _emailSender = emailSender;
            _configuration = configuration;
        }

        /// <summary>
        /// Nộp đơn ứng tuyển với CV online (CandidateCv)
        /// </summary>
        /*[Authorize(VCareerPermission.Application.Apply)]*/
        public async Task<ApplicationDto> ApplyWithOnlineCVAsync(ApplyWithOnlineCVDto input)
        {
            // Lấy thông tin user hiện tại
            var userId = _currentUser.GetId();

            // Lấy thông tin candidate profile
            var candidate = await _candidateRepository.FirstOrDefaultAsync(c => c.UserId == userId);
            if (candidate == null)
                throw new UserFriendlyException("Không tìm thấy thông tin ứng viên");

            // Kiểm tra CV online có tồn tại và thuộc về ứng viên không
            // Lưu ý: CandidateCv.CandidateId = UserId (không phải CandidateProfile.Id)
            var cv = await _candidateCvRepository.FirstOrDefaultAsync(c => c.Id == input.CandidateCvId && c.CandidateId == userId);
            if (cv == null)
                throw new UserFriendlyException("CV không tồn tại hoặc không thuộc về bạn");

            // Cho phép ứng tuyển lại (giống TopCV) - không check duplicate

            // Lấy thông tin Job và Company - Include RecruiterProfile để lấy CompanyId
            var queryable = await _jobPostingRepository.GetQueryableAsync();
            var job = await queryable
                .Include(j => j.RecruiterProfile)
                .FirstOrDefaultAsync(j => j.Id == input.JobId);

            if (job == null)
                throw new UserFriendlyException("Công việc không tồn tại");

            if (job.RecruiterProfile == null)
                throw new UserFriendlyException("Không tìm thấy thông tin nhà tuyển dụng");

            // Tạo đơn ứng tuyển
            // Lưu ý: JobApplication.CandidateId = CandidateProfile.UserId (không phải CandidateProfile.Id)
            var application = new JobApplication
            {
                JobId = input.JobId,
                CandidateId = candidate.UserId,
                CompanyId = job.RecruiterProfile.CompanyId,
                CVType = "Online",
                CandidateCvId = input.CandidateCvId,
                CoverLetter = input.CoverLetter,
                Status = "Pending"
            };

            await _applicationRepository.InsertAsync(application);

            // Tăng ApplyCount của Job - Reload job để tránh concurrency exception
            var jobToUpdate = await _jobPostingRepository.GetAsync(input.JobId);
            if (jobToUpdate != null)
            {
                jobToUpdate.ApplyCount++;
                await _jobPostingRepository.UpdateAsync(jobToUpdate);
            }

            return await MapToDtoAsync(application);
        }

        /// <summary>
        /// Nộp đơn ứng tuyển với CV đã tải lên (UploadedCv)
        /// </summary>
        /*[Authorize(VCareerPermission.Application.Apply)]*/
        public async Task<ApplicationDto> ApplyWithUploadedCVAsync(ApplyWithUploadedCVDto input)
        {
            // Lấy thông tin user hiện tại
            var userId = _currentUser.GetId();

            // Lấy thông tin candidate profile
            var candidate = await _candidateRepository.FirstOrDefaultAsync(c => c.UserId == userId);
            if (candidate == null)
                throw new UserFriendlyException("Không tìm thấy thông tin ứng viên");

            // Kiểm tra CV uploaded có tồn tại và thuộc về ứng viên không
            // Lưu ý: UploadedCv.CandidateId = UserId (không phải CandidateProfile.Id)
            var uploadedCv = await _uploadedCvRepository.FirstOrDefaultAsync(c => c.Id == input.UploadedCvId && c.CandidateId == userId);
            if (uploadedCv == null)
                throw new UserFriendlyException("CV không tồn tại hoặc không thuộc về bạn");

            // Cho phép ứng tuyển lại (giống TopCV) - không check duplicate

            // Lấy thông tin Job và Company - Include RecruiterProfile để lấy CompanyId
            var queryable = await _jobPostingRepository.GetQueryableAsync();
            var job = await queryable
                .Include(j => j.RecruiterProfile)
                .FirstOrDefaultAsync(j => j.Id == input.JobId);

            if (job == null)
                throw new UserFriendlyException("Công việc không tồn tại");

            if (job.RecruiterProfile == null)
                throw new UserFriendlyException("Không tìm thấy thông tin nhà tuyển dụng");

            // Tạo đơn ứng tuyển
            // Lưu ý: JobApplication.CandidateId = CandidateProfile.UserId (không phải CandidateProfile.Id)
            var application = new JobApplication
            {
                JobId = input.JobId,
                CandidateId = candidate.UserId,
                CompanyId = job.RecruiterProfile.CompanyId,
                CVType = "Uploaded",
                UploadedCvId = input.UploadedCvId,
                CoverLetter = input.CoverLetter,
                Status = "Pending"
            };

            await _applicationRepository.InsertAsync(application);

            // Tăng ApplyCount của Job - Reload job để tránh concurrency exception
            var jobToUpdate = await _jobPostingRepository.GetAsync(input.JobId);
            if (jobToUpdate != null)
            {
                jobToUpdate.ApplyCount++;
                await _jobPostingRepository.UpdateAsync(jobToUpdate);
            }

            return await MapToDtoAsync(application);
        }

        /// <summary>
        /// Lấy danh sách đơn ứng tuyển
        /// </summary>
        //[Authorize(VCareerPermission.Application.View)]
        public async Task<PagedResultDto<ApplicationDto>> GetApplicationListAsync(GetApplicationListDto input)
        {
            var query = await _applicationRepository.GetQueryableAsync();

            // Apply filters
            if (input.JobId.HasValue)
                query = query.Where(a => a.JobId == input.JobId.Value);

            if (input.CandidateId.HasValue)
                query = query.Where(a => a.CandidateId == input.CandidateId.Value);

            if (input.CompanyId.HasValue)
                query = query.Where(a => a.CompanyId == input.CompanyId.Value);

            if (!string.IsNullOrEmpty(input.Status))
                query = query.Where(a => a.Status == input.Status);

            if (!string.IsNullOrEmpty(input.CVType))
                query = query.Where(a => a.CVType == input.CVType);

            if (input.FromDate.HasValue)
                query = query.Where(a => a.CreationTime >= input.FromDate.Value);

            if (input.ToDate.HasValue)
                query = query.Where(a => a.CreationTime <= input.ToDate.Value);

            if (input.IsViewed.HasValue)
                query = query.Where(a => input.IsViewed.Value ? a.ViewedAt.HasValue : !a.ViewedAt.HasValue);

            if (input.IsResponded.HasValue)
                query = query.Where(a => input.IsResponded.Value ? a.RespondedAt.HasValue : !a.RespondedAt.HasValue);

            // Apply sorting
            /*query = string.IsNullOrEmpty(input.Sorting)
                ? query.OrderByDescending(a => a.CreationTime)
                : query.OrderBy(input.Sorting);*/

            // Get total count
            var totalCount = query.Count();

            // Apply paging
            var applications = query
                .Skip(input.SkipCount)
                .Take(input.MaxResultCount)
                .ToList();

            var applicationDtos = new List<ApplicationDto>();
            foreach (var app in applications)
            {
                applicationDtos.Add(await MapToDtoAsync(app));
            }

            return new PagedResultDto<ApplicationDto>(totalCount, applicationDtos);
        }

        /// <summary>
        /// Lấy thông tin chi tiết đơn ứng tuyển
        /// </summary>
        //[Authorize(VCareerPermission.Application.View)]
        public async Task<ApplicationDto> GetApplicationAsync(Guid id)
        {
            var application = await _applicationRepository.GetAsync(id);
            return await MapToDtoAsync(application);
        }

        /// <summary>
        /// Cập nhật trạng thái đơn ứng tuyển (cho nhà tuyển dụng)
        /// </summary>
        //[Authorize(VCareerPermission.Application.Manage)]
        public async Task<ApplicationDto> UpdateApplicationStatusAsync(Guid id, UpdateApplicationStatusDto input)
        {
            var application = await _applicationRepository.GetAsync(id);

            var oldStatus = application.Status;
            application.Status = input.Status;
            application.RecruiterNotes = input.RecruiterNotes;
            application.Rating = input.Rating;
            application.RejectionReason = input.RejectionReason;
            application.InterviewDate = input.InterviewDate;
            application.InterviewLocation = input.InterviewLocation;
            application.InterviewNotes = input.InterviewNotes;

            // Cập nhật thời gian phản hồi
            if (input.Status != "Pending")
            {
                application.RespondedAt = DateTime.UtcNow;
                var userId = _currentUser.GetId();
                application.RespondedBy = userId;
            }

            await _applicationRepository.UpdateAsync(application);

            // Gửi email thông báo khi chuyển sang trạng thái "offer" (Gửi đề nghị)
            var applicationDto = await MapToDtoAsync(application);
            if (input.Status == "offer" && oldStatus != "offer")
            {
                await SendOfferEmailAsync(application, applicationDto);
            }

            return applicationDto;
        }

        private async Task SendOfferEmailAsync(JobApplication application, ApplicationDto applicationDto)
        {
            try
            {
                var candidateEmail = applicationDto.CandidateEmail;
                if (string.IsNullOrWhiteSpace(candidateEmail))
                {
                    Logger.LogWarning($"Offer email skipped: candidate email not found for application {application.Id}");
                    return;
                }

                // Load thông tin công việc
                var job = await _jobPostingRepository.FirstOrDefaultAsync(j => j.Id == application.JobId);
                if (job == null)
                {
                    Logger.LogWarning($"Offer email skipped: job not found for application {application.Id}");
                    return;
                }

                // Load thông tin công ty
                var company = await _companyRepository.FirstOrDefaultAsync(c => c.Id == application.CompanyId);
                var companyName = company?.CompanyName ?? (applicationDto.CompanyName ?? "Công ty");

                // Load thông tin nhà tuyển dụng
                var recruiterName = "Nhà tuyển dụng";
                if (application.RespondedBy.HasValue)
                {
                    var recruiterUser = await _identityUserRepository.FirstOrDefaultAsync(u => u.Id == application.RespondedBy.Value);
                    if (recruiterUser != null)
                    {
                        recruiterName = !string.IsNullOrWhiteSpace(recruiterUser.Name)
                            ? $"{recruiterUser.Name} {recruiterUser.Surname}".Trim()
                            : recruiterUser.UserName ?? recruiterName;
                    }
                }

                // Tạo tên ứng viên
                var candidateName = !string.IsNullOrWhiteSpace(applicationDto.CandidateName)
                    ? applicationDto.CandidateName
                    : "Ứng viên";

                // Tạo email body
                var emailBody = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }}
        .header {{
            background: linear-gradient(135deg, #0F83BA 0%, #0a6a94 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }}
        .content {{
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
        }}
        .greeting {{
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
        }}
        .message {{
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 20px;
        }}
        .job-info {{
            background: #f9fafb;
            border-left: 4px solid #0F83BA;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }}
        .job-title {{
            font-size: 20px;
            font-weight: 600;
            color: #0F83BA;
            margin-bottom: 10px;
        }}
        .company-name {{
            font-size: 16px;
            color: #6b7280;
        }}
        .highlight {{
            background: #fef3c7;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            border-left: 4px solid #f59e0b;
        }}
        .footer {{
            background: #f9fafb;
            padding: 20px;
            text-align: center;
            border-radius: 0 0 8px 8px;
            border: 1px solid #e5e7eb;
            border-top: none;
            color: #6b7280;
            font-size: 14px;
        }}
        .button {{
            display: inline-block;
            background: #0F83BA;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
        }}
    </style>
</head>
<body>
    <div class='header'>
        <h1 style='margin: 0; font-size: 28px;'>🎉 Chúc mừng bạn!</h1>
    </div>
    <div class='content'>
        <div class='greeting'>
            Xin chào {candidateName},
        </div>
        <div class='message'>
            Chúng tôi rất vui mừng thông báo rằng bạn đã được chọn để nhận <strong>đề nghị công việc</strong> từ chúng tôi!
        </div>
        <div class='job-info'>
            <div class='job-title'>{job.Title}</div>
            <div class='company-name'>{companyName}</div>
        </div>
        <div class='highlight'>
            <strong>📋 Bước tiếp theo:</strong><br/>
            Vui lòng kiểm tra hộp thư và liên hệ với chúng tôi để trao đổi thêm về đề nghị này. Chúng tôi rất mong được hợp tác với bạn!
        </div>
        <div class='message'>
            Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với chúng tôi.
        </div>
        <div style='margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;'>
            <p style='margin: 0; color: #6b7280; font-size: 14px;'>
                Trân trọng,<br/>
                <strong>{recruiterName}</strong><br/>
                {companyName}
            </p>
        </div>
    </div>
    <div class='footer'>
        <p style='margin: 0;'>Email này được gửi tự động từ hệ thống VCareer.</p>
        <p style='margin: 5px 0 0 0;'>Vui lòng không trả lời email này.</p>
    </div>
</body>
        </html>";

                var subject = $"Đề nghị công việc - {job.Title} tại {companyName}";

                await TrySendEmailAsync(candidateEmail, subject, emailBody);
            }
            catch (Exception ex)
            {
                // Log error but don't throw - email sending failure shouldn't break the status update
                Logger.LogWarning($"Failed to send offer email for application {application.Id}: {ex.Message}");
            }
        }

        private async Task TrySendEmailAsync(string toEmail, string subject, string body)
        {
            var sent = false;
            try
            {
                await _emailSender.SendAsync(toEmail, subject, body, true);
                sent = true;
                Logger.LogInformation($"Offer email sent to {toEmail} using IEmailSender.");
            }
            catch (Exception ex)
            {
                Logger.LogWarning($"Primary email sender failed: {ex.Message}");
            }

            if (!sent)
            {
                await SendEmailViaSmtpAsync(toEmail, subject, body);
            }
        }

        private async Task SendEmailViaSmtpAsync(string toEmail, string subject, string body)
        {
            try
            {
                var smtpHost = _configuration["Settings:Abp.Mailing.Smtp.Host"];
                var smtpPort = _configuration.GetValue<int?>("Settings:Abp.Mailing.Smtp.Port") ?? 587;
                var smtpUser = _configuration["Settings:Abp.Mailing.Smtp.UserName"];
                var smtpPass = _configuration["Settings:Abp.Mailing.Smtp.Password"];
                var fromAddress = _configuration["Settings:Abp.Mailing.DefaultFromAddress"] ?? smtpUser;
                var fromName = _configuration["Settings:Abp.Mailing.DefaultFromDisplayName"] ?? "VCareer";
                var enableSsl = _configuration.GetValue<bool?>("Settings:Abp.Mailing.Smtp.EnableSsl") ?? true;

                using var message = new System.Net.Mail.MailMessage();
                message.From = new System.Net.Mail.MailAddress(fromAddress, fromName);
                message.To.Add(toEmail);
                message.Subject = subject;
                message.Body = body;
                message.IsBodyHtml = true;

                using var smtpClient = new System.Net.Mail.SmtpClient(smtpHost, smtpPort)
                {
                    EnableSsl = enableSsl,
                    UseDefaultCredentials = false,
                    Credentials = new System.Net.NetworkCredential(smtpUser, smtpPass)
                };

                await smtpClient.SendMailAsync(message);
                Logger.LogInformation($"Offer email sent to {toEmail} using fallback SMTP client.");
            }
            catch (Exception ex)
            {
                Logger.LogError($"Fallback SMTP send failed for {toEmail}: {ex}");
            }
        }

        /// <summary>
        /// Hủy đơn ứng tuyển (cho ứng viên)
        /// </summary>
        //[Authorize(VCareerPermission.Application.Withdraw)]
        public async Task<ApplicationDto> WithdrawApplicationAsync(Guid id, WithdrawApplicationDto input)
        {
            var application = await _applicationRepository.GetAsync(id);

            // Kiểm tra quyền sở hữu
            // Lưu ý: JobApplication.CandidateId = CandidateProfile.UserId
            var userId = _currentUser.GetId();
            var candidate = await _candidateRepository.FirstOrDefaultAsync(c => c.UserId == userId);
            if (candidate == null || application.CandidateId != candidate.UserId)
                throw new UserFriendlyException("Bạn không có quyền hủy đơn ứng tuyển này");

            application.Status = "Withdrawn";
            application.WithdrawnAt = DateTime.UtcNow;
            application.WithdrawalReason = input.WithdrawalReason;

            await _applicationRepository.UpdateAsync(application);

            return await MapToDtoAsync(application);
        }

        /// <summary>
        /// Đánh dấu đã xem đơn ứng tuyển
        /// </summary>
        //[Authorize(VCareerPermission.Application.Manage)]
        public async Task<ApplicationDto> MarkAsViewedAsync(Guid id)
        {
            var application = await _applicationRepository.GetAsync(id);

            if (!application.ViewedAt.HasValue)
            {
                application.ViewedAt = DateTime.UtcNow;
                var userId = _currentUser.GetId();
                application.ViewedBy = userId;
                await _applicationRepository.UpdateAsync(application);
            }

            return await MapToDtoAsync(application);
        }

        /// <summary>
        /// Lấy thống kê đơn ứng tuyển
        /// </summary>
        [Authorize(VCareerPermission.Application.Statistics)]
        public async Task<ApplicationStatisticsDto> GetApplicationStatisticsAsync(Guid? jobId = null, int? companyId = null)
        {
            var query = await _applicationRepository.GetQueryableAsync();

            if (jobId.HasValue)
                query = query.Where(a => a.JobId == jobId.Value);

            if (companyId.HasValue)
                query = query.Where(a => a.CompanyId == companyId.Value);

            var totalApplications = query.Count();
            var pendingApplications = query.Count(a => a.Status == "Pending");
            var reviewedApplications = query.Count(a => a.Status == "Reviewed");
            var shortlistedApplications = query.Count(a => a.Status == "Shortlisted");
            var acceptedApplications = query.Count(a => a.Status == "Accepted");
            var rejectedApplications = query.Count(a => a.Status == "Rejected");
            var withdrawnApplications = query.Count(a => a.Status == "Withdrawn");

            var respondedApplications = query.Count(a => a.RespondedAt.HasValue);
            var responseRate = totalApplications > 0 ? (decimal)respondedApplications / totalApplications * 100 : 0;
            var acceptanceRate = totalApplications > 0 ? (decimal)acceptedApplications / totalApplications * 100 : 0;

            return new ApplicationStatisticsDto
            {
                TotalApplications = totalApplications,
                PendingApplications = pendingApplications,
                ReviewedApplications = reviewedApplications,
                ShortlistedApplications = shortlistedApplications,
                AcceptedApplications = acceptedApplications,
                RejectedApplications = rejectedApplications,
                WithdrawnApplications = withdrawnApplications,
                ResponseRate = Math.Round(responseRate, 2),
                AcceptanceRate = Math.Round(acceptanceRate, 2)
            };
        }

        /// <summary>
        /// Lấy danh sách đơn ứng tuyển của ứng viên
        /// </summary>
        //[Authorize(VCareerPermission.Application.View)]
        public async Task<PagedResultDto<ApplicationDto>> GetMyApplicationsAsync(GetApplicationListDto input)
        {
            var userId = _currentUser.GetId();
            var candidate = await _candidateRepository.FirstOrDefaultAsync(c => c.UserId == userId);
            if (candidate == null)
                throw new UserFriendlyException("Không tìm thấy thông tin ứng viên");

            // Lưu ý: JobApplication.CandidateId = CandidateProfile.UserId
            input.CandidateId = candidate.UserId;
            return await GetApplicationListAsync(input);
        }

        /// <summary>
        /// Lấy danh sách đơn ứng tuyển của công ty
        /// </summary>
        //[Authorize(VCareerPermission.Application.Manage)]
        public async Task<PagedResultDto<ApplicationDto>> GetCompanyApplicationsAsync(GetApplicationListDto input)
        {
            var userId = _currentUser.GetId();
            var recruiter = await _recruiterProfileRepository.FirstOrDefaultAsync(r => r.UserId == userId);
            if (recruiter == null)
                throw new UserFriendlyException("Chỉ có nhà tuyển dụng mới có thể xem đơn ứng tuyển của công ty");

            input.CompanyId = recruiter.CompanyId;
            return await GetApplicationListAsync(input);
        }

        /// <summary>
        /// Lấy danh sách đơn ứng tuyển cho một công việc cụ thể
        /// </summary>
        //[Authorize(VCareerPermission.Application.Manage)]
        public async Task<PagedResultDto<ApplicationDto>> GetJobApplicationsAsync(Guid jobId, GetApplicationListDto input)
        {
            input.JobId = jobId;
            return await GetApplicationListAsync(input);
        }

        /// <summary>
        /// Tải xuống CV của đơn ứng tuyển (PDF hoặc render HTML)
        /// </summary>
        //[Authorize(VCareerPermission.Application.DownloadCV)]
        public async Task<byte[]> DownloadApplicationCVAsync(Guid id)
        {
            var application = await _applicationRepository.GetAsync(id);

            if (application.CVType == "Online" && application.CandidateCvId.HasValue)
            {
                // Render CV online thành HTML, sau đó convert sang PDF (cần implement)
                // Tạm thời throw exception, cần implement PDF generation từ HTML
                throw new UserFriendlyException("Tính năng download CV online đang được phát triển");
            }
            else if (application.CVType == "Uploaded" && application.UploadedCvId.HasValue)
            {
                // Download uploaded CV từ blob storage
                return await _uploadedCvAppService.DownloadCvAsync(application.UploadedCvId.Value);
            }

            throw new UserFriendlyException("Không tìm thấy file CV");
        }

        /// <summary>
        /// Xóa đơn ứng tuyển (soft delete)
        /// </summary>
        //[Authorize(VCareerPermission.Application.Delete)]
        public async Task DeleteApplicationAsync(Guid id)
        {
            await _applicationRepository.DeleteAsync(id);
        }

        /// <summary>
        /// Kiểm tra xem user đã ứng tuyển job chưa
        /// </summary>
        public async Task<ApplicationStatusDto> CheckApplicationStatusAsync(Guid jobId)
        {
            try
            {
                var userId = _currentUser.GetId();
                var candidate = await _candidateRepository.FirstOrDefaultAsync(c => c.UserId == userId);

                if (candidate == null)
                {
                    return new ApplicationStatusDto { HasApplied = false };
                }

                // Lấy đơn ứng tuyển mới nhất (nếu có nhiều đơn)
                var queryable = await _applicationRepository.GetQueryableAsync();
                var application = await queryable
                    .Where(a => a.JobId == jobId && a.CandidateId == candidate.UserId)
                    .OrderByDescending(a => a.CreationTime)
                    .FirstOrDefaultAsync();

                if (application == null)
                {
                    return new ApplicationStatusDto { HasApplied = false };
                }

                return new ApplicationStatusDto
                {
                    HasApplied = true,
                    ApplicationId = application.Id,
                    Status = application.Status
                };
            }
            catch
            {
                // Nếu không authenticated hoặc có lỗi, trả về false
                return new ApplicationStatusDto { HasApplied = false };
            }
        }

        /// <summary>
        /// Map JobApplication entity to DTO với đầy đủ thông tin
        /// </summary>
        private async Task<ApplicationDto> MapToDtoAsync(JobApplication application)
        {
            var dto = ObjectMapper.Map<JobApplication, ApplicationDto>(application);

            // Load Job để lấy JobTitle và thông tin lương
            var job = await _jobPostingRepository.FirstOrDefaultAsync(j => j.Id == application.JobId);
            if (job != null)
            {
                dto.JobTitle = job.Title;
                dto.JobSalaryText = FormatJobSalary(job);
            }

            // Load Company để lấy CompanyName
            var company = await _companyRepository.FirstOrDefaultAsync(c => c.Id == application.CompanyId);
            if (company != null)
            {
                dto.CompanyName = company.CompanyName;
            }

            // Load Candidate để lấy CandidateName, Email, Phone
            // Lưu ý: JobApplication.CandidateId = CandidateProfile.UserId (không phải CandidateProfile.Id)
            var candidate = await _candidateRepository.FirstOrDefaultAsync(c => c.UserId == application.CandidateId);
            if (candidate != null)
            {
                // Load User từ IdentityUser repository
                var user = await _identityUserRepository.FirstOrDefaultAsync(u => u.Id == candidate.UserId);
                if (user != null)
                {
                    dto.CandidateName = !string.IsNullOrEmpty(user.Name)
                        ? $"{user.Name} {user.Surname}".Trim()
                        : user.UserName;
                    dto.CandidateEmail = user.Email;
                    dto.CandidatePhone = user.PhoneNumber;
                }
            }

            // Load CV info
            if (application.CVType == "Online" && application.CandidateCvId.HasValue)
            {
                var cv = await _candidateCvRepository.FirstOrDefaultAsync(c => c.Id == application.CandidateCvId.Value);
                if (cv != null)
                {
                    dto.CandidateCvName = cv.CvName;
                }
            }
            else if (application.CVType == "Uploaded" && application.UploadedCvId.HasValue)
            {
                var uploadedCv = await _uploadedCvRepository.FirstOrDefaultAsync(c => c.Id == application.UploadedCvId.Value);
                if (uploadedCv != null)
                {
                    dto.UploadedCvName = uploadedCv.CvName;
                }
            }

            return dto;
        }

        public Task<byte[]> BulkDownloadCompanyCVsAsync(BulkDownloadCVsDto input)
        {
            throw new NotImplementedException();
        }

         public Task<ApplicationDto> RateApplicationAsync(Guid id, RateApplicationDto input)
         {
             throw new NotImplementedException();
         }

         /// <summary>
         /// Helper format mức lương job thành text hiển thị (VD: \"Tới 3 triệu\", \"Từ 4 - 8 triệu\", \"Thoả thuận\")
         /// </summary>
         private string? FormatJobSalary(Job_Post job)
         {
             if (job == null)
             {
                 return null;
             }

             if (job.SalaryDeal)
             {
                 return "Thoả thuận";
             }

             decimal? min = job.SalaryMin;
             decimal? max = job.SalaryMax;

             if (!min.HasValue && !max.HasValue)
             {
                 return null;
             }

             // Chuyển sang đơn vị \"triệu\" nếu >= 1,000,000
             string FormatToMillion(decimal value)
             {
                 if (value >= 1_000_000)
                 {
                     var millions = Math.Round(value / 1_000_000, 0, MidpointRounding.AwayFromZero);
                     return $"{millions} triệu";
                 }

                 return $"{value:N0} VNĐ";
             }

             if (min.HasValue && max.HasValue)
             {
                 return $"{FormatToMillion(min.Value)} - {FormatToMillion(max.Value)}";
             }

             if (max.HasValue)
             {
                 return $"Tới {FormatToMillion(max.Value)}";
             }

             // Chỉ có min
             return $"Từ {FormatToMillion(min!.Value)}";
         }
     }
 }
