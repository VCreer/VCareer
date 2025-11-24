using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using VCareer.Application.Contracts.Applications;
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

namespace VCareer.Application.Applications
{
    /// <summary>
    /// Application Management Service - Refactored để hỗ trợ CandidateCv và UploadedCv
    /// </summary>
    /*[Authorize(VCareerPermission.Application.Default)]*/
    public class ApplicationAppService : VCareerAppService, IApplicationAppService
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
            ICurrentUser currentUser)
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

            return await MapToDtoAsync(application);
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
        [Authorize(VCareerPermission.Application.View)]
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

            // Load Job để lấy JobTitle
            var job = await _jobPostingRepository.FirstOrDefaultAsync(j => j.Id == application.JobId);
            if (job != null)
            {
                dto.JobTitle = job.Title;
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
    }
}
