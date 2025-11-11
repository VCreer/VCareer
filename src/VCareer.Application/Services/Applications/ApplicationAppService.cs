using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using VCareer.Application.Contracts.Applications;
using VCareer.Helpers;
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
using System.IO;
using System.IO.Compression;
using System.Text;
using VCareer.Models.FileMetadata;
using Volo.Abp.BlobStoring;
using VCareer.Files.BlobContainers;
using Microsoft.Extensions.Logging;

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
        private readonly IRepository<Job_Posting, Guid> _jobPostingRepository;
        private readonly IRepository<CandidateCv, Guid> _candidateCvRepository;
        private readonly IRepository<UploadedCv, Guid> _uploadedCvRepository;
        private readonly IRepository<RecruiterProfile, Guid> _recruiterProfileRepository;
        private readonly IRepository<Company, int> _companyRepository;
        private readonly IRepository<Volo.Abp.Identity.IdentityUser, Guid> _identityUserRepository;
        private readonly IRepository<FileDescriptor, Guid> _fileDescriptorRepository;
        private readonly IBlobContainerFactory _blobFactory;
        private readonly ICandidateCvAppService _candidateCvAppService;
        private readonly IUploadedCvAppService _uploadedCvAppService;
        private readonly TokenClaimsHelper _tokenClaimsHelper;

        public ApplicationAppService(
            IRepository<JobApplication, Guid> applicationRepository,
            IRepository<CandidateProfile, Guid> candidateRepository,
            IRepository<Job_Posting, Guid> jobPostingRepository,
            IRepository<CandidateCv, Guid> candidateCvRepository,
            IRepository<UploadedCv, Guid> uploadedCvRepository,
            IRepository<RecruiterProfile, Guid> recruiterProfileRepository,
            IRepository<Company, int> companyRepository,
            IRepository<Volo.Abp.Identity.IdentityUser, Guid> identityUserRepository,
            IRepository<FileDescriptor, Guid> fileDescriptorRepository,
            IBlobContainerFactory blobFactory,
            ICandidateCvAppService candidateCvAppService,
            IUploadedCvAppService uploadedCvAppService,
            TokenClaimsHelper tokenClaimsHelper)
        {
            _applicationRepository = applicationRepository;
            _candidateRepository = candidateRepository;
            _jobPostingRepository = jobPostingRepository;
            _candidateCvRepository = candidateCvRepository;
            _uploadedCvRepository = uploadedCvRepository;
            _recruiterProfileRepository = recruiterProfileRepository;
            _companyRepository = companyRepository;
            _identityUserRepository = identityUserRepository;
            _fileDescriptorRepository = fileDescriptorRepository;
            _blobFactory = blobFactory;
            _candidateCvAppService = candidateCvAppService;
            _uploadedCvAppService = uploadedCvAppService;
            _tokenClaimsHelper = tokenClaimsHelper;
        }

        /// <summary>
        /// Nộp đơn ứng tuyển với CV online (CandidateCv)
        /// </summary>
        /*[Authorize(VCareerPermission.Application.Apply)]*/
        public async Task<ApplicationDto> ApplyWithOnlineCVAsync(ApplyWithOnlineCVDto input)
        {
            // Lấy thông tin user hiện tại
            var userId = _tokenClaimsHelper.GetUserIdFromTokenOrThrow();

            // Lấy thông tin candidate profile
            var candidate = await _candidateRepository.FirstOrDefaultAsync(c => c.UserId == userId);
            if (candidate == null)
                throw new UserFriendlyException("Không tìm thấy thông tin ứng viên");

            // Kiểm tra CV online có tồn tại và thuộc về ứng viên không
            // Lưu ý: CandidateCv.CandidateId = UserId (không phải CandidateProfile.Id)
            var cv = await _candidateCvRepository.FirstOrDefaultAsync(c => c.Id == input.CandidateCvId && c.CandidateId == userId);
            if (cv == null)
                throw new UserFriendlyException("CV không tồn tại hoặc không thuộc về bạn");

            // Kiểm tra đã ứng tuyển công việc này chưa
            // Lưu ý: JobApplication.CandidateId = CandidateProfile.UserId
            var existingApplication = await _applicationRepository.FirstOrDefaultAsync(
                a => a.JobId == input.JobId && a.CandidateId == candidate.UserId);
            if (existingApplication != null)
                throw new UserFriendlyException("Bạn đã ứng tuyển công việc này rồi");

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
            var userId = _tokenClaimsHelper.GetUserIdFromTokenOrThrow();

            // Lấy thông tin candidate profile
            var candidate = await _candidateRepository.FirstOrDefaultAsync(c => c.UserId == userId);
            if (candidate == null)
                throw new UserFriendlyException("Không tìm thấy thông tin ứng viên");

            // Kiểm tra CV uploaded có tồn tại và thuộc về ứng viên không
            // Lưu ý: UploadedCv.CandidateId = UserId (không phải CandidateProfile.Id)
            var uploadedCv = await _uploadedCvRepository.FirstOrDefaultAsync(c => c.Id == input.UploadedCvId && c.CandidateId == userId);
            if (uploadedCv == null)
                throw new UserFriendlyException("CV không tồn tại hoặc không thuộc về bạn");

            // Kiểm tra đã ứng tuyển công việc này chưa
            // Lưu ý: JobApplication.CandidateId = CandidateProfile.UserId
            var existingApplication = await _applicationRepository.FirstOrDefaultAsync(
                a => a.JobId == input.JobId && a.CandidateId == candidate.UserId);
            if (existingApplication != null)
                throw new UserFriendlyException("Bạn đã ứng tuyển công việc này rồi");

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
        [Authorize(VCareerPermission.Application.View)]
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
        [Authorize(VCareerPermission.Application.View)]
        public async Task<ApplicationDto> GetApplicationAsync(Guid id)
        {
            var application = await _applicationRepository.GetAsync(id);
            return await MapToDtoAsync(application);
        }

        /// <summary>
        /// Cập nhật trạng thái đơn ứng tuyển (cho nhà tuyển dụng)
        /// </summary>
        [Authorize(VCareerPermission.Application.Manage)]
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
                var userId = _tokenClaimsHelper.GetUserIdFromTokenOrThrow();
                application.RespondedBy = userId;
            }

            await _applicationRepository.UpdateAsync(application);

            return await MapToDtoAsync(application);
        }

        /// <summary>
        /// Hủy đơn ứng tuyển (cho ứng viên)
        /// </summary>
        [Authorize(VCareerPermission.Application.Withdraw)]
        public async Task<ApplicationDto> WithdrawApplicationAsync(Guid id, WithdrawApplicationDto input)
        {
            var application = await _applicationRepository.GetAsync(id);

            // Kiểm tra quyền sở hữu
            // Lưu ý: JobApplication.CandidateId = CandidateProfile.UserId
            var userId = _tokenClaimsHelper.GetUserIdFromTokenOrThrow();
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
        [Authorize(VCareerPermission.Application.Manage)]
        public async Task<ApplicationDto> MarkAsViewedAsync(Guid id)
        {
            var application = await _applicationRepository.GetAsync(id);

            if (!application.ViewedAt.HasValue)
            {
                application.ViewedAt = DateTime.UtcNow;
                var userId = _tokenClaimsHelper.GetUserIdFromTokenOrThrow();
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
            var userId = _tokenClaimsHelper.GetUserIdFromTokenOrThrow();
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
        [Authorize(VCareerPermission.Application.Manage)]
        public async Task<PagedResultDto<ApplicationDto>> GetCompanyApplicationsAsync(GetApplicationListDto input)
        {
            var userId = _tokenClaimsHelper.GetUserIdFromTokenOrThrow();
            var recruiter = await _recruiterProfileRepository.FirstOrDefaultAsync(r => r.UserId == userId);
            if (recruiter == null)
                throw new UserFriendlyException("Chỉ có nhà tuyển dụng mới có thể xem đơn ứng tuyển của công ty");

            input.CompanyId = recruiter.CompanyId;
            return await GetApplicationListAsync(input);
        }

        /// <summary>
        /// Lấy danh sách đơn ứng tuyển cho một công việc cụ thể
        /// </summary>
        [Authorize(VCareerPermission.Application.Manage)]
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
            var userId = _tokenClaimsHelper.GetUserIdFromTokenOrThrow();
            var application = await _applicationRepository.GetAsync(id);

            // Kiểm tra quyền: Recruiter chỉ có thể download CV của applications thuộc công ty của họ
            var recruiter = await _recruiterProfileRepository.FirstOrDefaultAsync(r => r.UserId == userId);
            if (recruiter != null)
            {
                // Nếu là recruiter, kiểm tra application có thuộc công ty của họ không
                if (application.CompanyId != recruiter.CompanyId)
                {
                    throw new UserFriendlyException("Bạn không có quyền download CV này.");
                }
            }
            else
            {
                // Nếu là candidate, kiểm tra application có thuộc về họ không
                var candidate = await _candidateRepository.FirstOrDefaultAsync(c => c.UserId == userId);
                if (candidate == null || application.CandidateId != candidate.UserId)
                {
                    throw new UserFriendlyException("Bạn không có quyền download CV này.");
                }
            }

            if (application.CVType == "Online" && application.CandidateCvId.HasValue)
            {
                // Render CV online thành HTML
                var renderResult = await _candidateCvAppService.RenderCvAsync(application.CandidateCvId.Value);
                if (renderResult != null && !string.IsNullOrEmpty(renderResult.HtmlContent))
                {
                    // Trả về HTML content (có thể convert sang PDF sau)
                    return Encoding.UTF8.GetBytes(renderResult.HtmlContent);
                }
                throw new UserFriendlyException("Không thể render CV online.");
            }
            else if (application.CVType == "Uploaded" && application.UploadedCvId.HasValue)
            {
                // Download trực tiếp từ blob storage (không qua DownloadCvAsync để tránh check quyền candidate)
                var uploadedCv = await _uploadedCvRepository.FirstOrDefaultAsync(c => c.Id == application.UploadedCvId.Value);
                if (uploadedCv == null)
                    throw new UserFriendlyException("Không tìm thấy CV đã upload.");

                var fileDescriptor = await _fileDescriptorRepository.FirstOrDefaultAsync(f => f.Id == uploadedCv.FileDescriptorId);
                if (fileDescriptor == null)
                    throw new UserFriendlyException("Không tìm thấy thông tin file CV.");

                // Download trực tiếp từ blob storage
                var container = _blobFactory.Create(fileDescriptor.ContainerName);
                var fileBytes = await container.GetAllBytesAsync(fileDescriptor.StorageName);
                
                return fileBytes;
            }

            throw new UserFriendlyException("Không tìm thấy file CV");
        }

        /// <summary>
        /// Tải xuống CV của đơn ứng tuyển với thông tin file (PDF hoặc render HTML)
        /// </summary>
        //[Authorize(VCareerPermission.Application.DownloadCV)]
        public async Task<DownloadApplicationCVResultDto> DownloadApplicationCVWithInfoAsync(Guid id)
        {
            var userId = _tokenClaimsHelper.GetUserIdFromTokenOrThrow();
            var application = await _applicationRepository.GetAsync(id);

            // Kiểm tra quyền: Recruiter chỉ có thể download CV của applications thuộc công ty của họ
            var recruiter = await _recruiterProfileRepository.FirstOrDefaultAsync(r => r.UserId == userId);
            if (recruiter != null)
            {
                // Nếu là recruiter, kiểm tra application có thuộc công ty của họ không
                if (application.CompanyId != recruiter.CompanyId)
                {
                    throw new UserFriendlyException("Bạn không có quyền download CV này.");
                }
            }
            else
            {
                // Nếu là candidate, kiểm tra application có thuộc về họ không
                var candidate = await _candidateRepository.FirstOrDefaultAsync(c => c.UserId == userId);
                if (candidate == null || application.CandidateId != candidate.UserId)
                {
                    throw new UserFriendlyException("Bạn không có quyền download CV này.");
                }
            }

            byte[] fileBytes = null;
            string contentType = "application/octet-stream";
            string fileName = $"CV_Application_{id}";

            if (application.CVType == "Online" && application.CandidateCvId.HasValue)
            {
                // Render CV online thành HTML
                var renderResult = await _candidateCvAppService.RenderCvAsync(application.CandidateCvId.Value);
                if (renderResult != null && !string.IsNullOrEmpty(renderResult.HtmlContent))
                {
                    fileBytes = Encoding.UTF8.GetBytes(renderResult.HtmlContent);
                    contentType = "text/html";
                    fileName = $"CV_Application_{id}.html";
                }
                else
                {
                    throw new UserFriendlyException("Không thể render CV online.");
                }
            }
            else if (application.CVType == "Uploaded" && application.UploadedCvId.HasValue)
            {
                // Download trực tiếp từ blob storage (không qua DownloadCvAsync để tránh check quyền candidate)
                var uploadedCv = await _uploadedCvRepository.FirstOrDefaultAsync(c => c.Id == application.UploadedCvId.Value);
                if (uploadedCv == null)
                    throw new UserFriendlyException("Không tìm thấy CV đã upload.");

                var fileDescriptor = await _fileDescriptorRepository.FirstOrDefaultAsync(f => f.Id == uploadedCv.FileDescriptorId);
                if (fileDescriptor == null)
                    throw new UserFriendlyException("Không tìm thấy thông tin file CV.");

                // Download trực tiếp từ blob storage
                var container = _blobFactory.Create(fileDescriptor.ContainerName);
                fileBytes = await container.GetAllBytesAsync(fileDescriptor.StorageName);
                
                // Xác định content type và file name từ FileDescriptor
                contentType = fileDescriptor.MimeType ?? "application/pdf";
                var originalFileName = fileDescriptor.OriginalName ?? uploadedCv.CvName ?? $"CV_{id}";
                var extension = fileDescriptor.Extension;
                if (string.IsNullOrEmpty(extension))
                    extension = Path.GetExtension(originalFileName);
                if (string.IsNullOrEmpty(extension))
                    extension = ".pdf";
                
                fileName = $"{Path.GetFileNameWithoutExtension(originalFileName)}{extension}";
            }
            else
            {
                throw new UserFriendlyException("Không tìm thấy file CV");
            }

            return new DownloadApplicationCVResultDto
            {
                FileBytes = fileBytes,
                ContentType = contentType,
                FileName = fileName
            };
        }

        /// <summary>
        /// Đánh giá ứng viên (Rating từ 1-10)
        /// </summary>
        //[Authorize(VCareerPermission.Application.Manage)]
        public async Task<ApplicationDto> RateApplicationAsync(Guid id, RateApplicationDto input)
        {
            var userId = _tokenClaimsHelper.GetUserIdFromTokenOrThrow();
            var application = await _applicationRepository.GetAsync(id);

            // Kiểm tra quyền: Chỉ recruiter của công ty mới có thể đánh giá ứng viên
            var recruiter = await _recruiterProfileRepository.FirstOrDefaultAsync(r => r.UserId == userId);
            if (recruiter == null)
                throw new UserFriendlyException("Chỉ có nhà tuyển dụng mới có thể đánh giá ứng viên");

            if (application.CompanyId != recruiter.CompanyId)
                throw new UserFriendlyException("Bạn không có quyền đánh giá ứng viên này");

            // Validate rating
            if (input.Rating < 1 || input.Rating > 10)
                throw new UserFriendlyException("Điểm đánh giá phải từ 1 đến 10");

            // Cập nhật rating
            application.Rating = input.Rating;
            
            // Cập nhật notes nếu có
            if (!string.IsNullOrEmpty(input.Notes))
            {
                application.RecruiterNotes = input.Notes;
            }

            // Cập nhật thời gian phản hồi nếu chưa có
            if (!application.RespondedAt.HasValue)
            {
                application.RespondedAt = DateTime.UtcNow;
                application.RespondedBy = userId;
            }

            await _applicationRepository.UpdateAsync(application);

            return await MapToDtoAsync(application);
        }

        /// <summary>
        /// Xóa đơn ứng tuyển (soft delete)
        /// </summary>
        [Authorize(VCareerPermission.Application.Delete)]
        public async Task DeleteApplicationAsync(Guid id)
        {
            await _applicationRepository.DeleteAsync(id);
        }

        /// <summary>
        /// Tải xuống hàng loạt CV của các ứng viên đã ứng tuyển vào công ty
        /// Dành cho Leader Recruiter (IsLead = 1) và HR Staff (IsLead = 0)
        /// </summary>
        //[Authorize(VCareerPermission.Application.BulkDownloadCV)]
        public async Task<byte[]> BulkDownloadCompanyCVsAsync(BulkDownloadCVsDto input)
        {
            // Lấy thông tin user hiện tại
            var userId = _tokenClaimsHelper.GetUserIdFromTokenOrThrow();
            
            // Kiểm tra user có phải là recruiter không (Leader Recruiter hoặc HR Staff)
            // IsLead = 1: Leader Recruiter, IsLead = 0: HR Staff
            var recruiter = await _recruiterProfileRepository.FirstOrDefaultAsync(r => r.UserId == userId);
            if (recruiter == null)
                throw new UserFriendlyException("Chỉ có nhà tuyển dụng (Leader Recruiter hoặc HR Staff) mới có thể tải xuống CV hàng loạt");

            // Lấy tất cả applications của công ty với filters
            var query = await _applicationRepository.GetQueryableAsync();
            query = query.Where(a => a.CompanyId == recruiter.CompanyId);

            // Apply filters
            if (input.JobId.HasValue)
                query = query.Where(a => a.JobId == input.JobId.Value);

            if (!string.IsNullOrEmpty(input.Status))
                query = query.Where(a => a.Status == input.Status);

            if (input.FromDate.HasValue)
                query = query.Where(a => a.CreationTime >= input.FromDate.Value);

            if (input.ToDate.HasValue)
                query = query.Where(a => a.CreationTime <= input.ToDate.Value);

            // Get applications list
            var applications = await query.ToListAsync();

            if (applications == null || !applications.Any())
                throw new UserFriendlyException("Không có đơn ứng tuyển nào để tải xuống");

            Logger.LogInformation($"BulkDownloadCVs: Tìm thấy {applications.Count} đơn ứng tuyển cho công ty {recruiter.CompanyId}");

            // Tạo ZIP file trong memory
            using (var memoryStream = new MemoryStream())
            {
                using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
                {
                    int successCount = 0;
                    int failCount = 0;
                    int skipNoCvCount = 0;
                    int skipUploadedCvNotFound = 0;
                    int skipFileDescriptorNotFound = 0;
                    int skipBlobError = 0;
                    int skipRenderError = 0;
                    
                    // Track các tên file đã sử dụng để tránh trùng lặp (không thể dùng archive.Entries trong Create mode)
                    var usedFileNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                    foreach (var application in applications)
                    {
                        try
                        {
                            byte[] cvBytes = null;
                            string fileName = null;
                            string fileExtension = null;

                            // Lấy tên ứng viên để đặt tên file
                            // Lưu ý: JobApplication.CandidateId = CandidateProfile.UserId
                            var candidateName = "Unknown";
                            var candidate = await _candidateRepository.FirstOrDefaultAsync(c => c.UserId == application.CandidateId);
                            if (candidate != null)
                            {
                                var candidateUser = await _identityUserRepository.FirstOrDefaultAsync(u => u.Id == candidate.UserId);
                                if (candidateUser != null)
                                {
                                    candidateName = !string.IsNullOrEmpty(candidateUser.Name) 
                                        ? $"{candidateUser.Name}_{candidateUser.Surname}".Trim().Replace(" ", "_")
                                        : candidateUser.UserName ?? "Unknown";
                                }
                            }

                            // Sanitize filename
                            candidateName = System.Text.RegularExpressions.Regex.Replace(candidateName, @"[^\w\-_\.]", "_");

                            // Xử lý theo CVType: "Online" hoặc "Uploaded"
                            if (application.CVType == "Online" && application.CandidateCvId.HasValue)
                            {
                                try
                                {
                                    // CV Online: Render CV online thành HTML từ CandidateCvId
                                    var renderResult = await _candidateCvAppService.RenderCvAsync(application.CandidateCvId.Value);
                                    if (renderResult != null && !string.IsNullOrEmpty(renderResult.HtmlContent))
                                    {
                                        cvBytes = Encoding.UTF8.GetBytes(renderResult.HtmlContent);
                                        fileName = $"{candidateName}_CV_{application.Id}";
                                        fileExtension = ".html";
                                    }
                                    else
                                    {
                                        Logger.LogWarning($"BulkDownloadCVs: Application {application.Id} - RenderCvAsync trả về null hoặc empty HTML");
                                        skipRenderError++;
                                        failCount++;
                                        continue;
                                    }
                                }
                                catch (Exception ex)
                                {
                                    Logger.LogWarning(ex, $"BulkDownloadCVs: Application {application.Id} - Lỗi khi render CV Online (CandidateCvId: {application.CandidateCvId}): {ex.Message}");
                                    skipRenderError++;
                                    failCount++;
                                    continue;
                                }
                            }
                            else if (application.CVType == "Uploaded" && application.UploadedCvId.HasValue)
                            {
                                // CV Uploaded: Download trực tiếp từ blob storage qua FileDescriptor
                                // Lấy UploadedCv để lấy FileDescriptorId
                                var uploadedCv = await _uploadedCvRepository.FirstOrDefaultAsync(c => c.Id == application.UploadedCvId.Value);
                                if (uploadedCv == null)
                                {
                                    Logger.LogWarning($"BulkDownloadCVs: Application {application.Id} - Không tìm thấy UploadedCv với ID {application.UploadedCvId.Value}");
                                    skipUploadedCvNotFound++;
                                    failCount++;
                                    continue;
                                }

                                // Load FileDescriptor để lấy thông tin file
                                var fileDescriptor = await _fileDescriptorRepository.FirstOrDefaultAsync(f => f.Id == uploadedCv.FileDescriptorId);
                                if (fileDescriptor == null)
                                {
                                    Logger.LogWarning($"BulkDownloadCVs: Application {application.Id} - Không tìm thấy FileDescriptor với ID {uploadedCv.FileDescriptorId}");
                                    skipFileDescriptorNotFound++;
                                    failCount++;
                                    continue;
                                }

                                // Download trực tiếp từ blob storage (không cần check quyền vì đã có quyền xem application)
                                try
                                {
                                    var container = _blobFactory.Create(fileDescriptor.ContainerName);
                                    cvBytes = await container.GetAllBytesAsync(fileDescriptor.StorageName);
                                    
                                    // Lấy tên file và extension từ FileDescriptor
                                    var originalFileName = fileDescriptor.OriginalName ?? uploadedCv.CvName;
                                    fileExtension = fileDescriptor.Extension;
                                    if (string.IsNullOrEmpty(fileExtension))
                                        fileExtension = Path.GetExtension(originalFileName);
                                    if (string.IsNullOrEmpty(fileExtension))
                                        fileExtension = ".pdf"; // Default to PDF if no extension
                                    
                                    fileName = $"{candidateName}_{Path.GetFileNameWithoutExtension(originalFileName)}";
                                }
                                catch (Exception ex)
                                {
                                    // Log error và skip CV này
                                    Logger.LogWarning(ex, $"BulkDownloadCVs: Application {application.Id} - Lỗi khi download từ blob storage (StorageName: {fileDescriptor.StorageName}, ContainerName: {fileDescriptor.ContainerName}): {ex.Message}");
                                    skipBlobError++;
                                    failCount++;
                                    continue;
                                }
                            }
                            else
                            {
                                // Skip applications without CV
                                Logger.LogWarning($"BulkDownloadCVs: Application {application.Id} - Không có CV (CVType: {application.CVType}, CandidateCvId: {application.CandidateCvId}, UploadedCvId: {application.UploadedCvId})");
                                skipNoCvCount++;
                                failCount++;
                                continue;
                            }

                            if (cvBytes != null && cvBytes.Length > 0)
                            {
                                // Tạo entry trong ZIP
                                var entryName = $"{fileName}{fileExtension}";
                                // Đảm bảo tên file không trùng lặp (sử dụng HashSet thay vì archive.Entries vì không thể truy cập trong Create mode)
                                int counter = 1;
                                while (usedFileNames.Contains(entryName))
                                {
                                    entryName = $"{fileName}_{counter}{fileExtension}";
                                    counter++;
                                }
                                
                                // Thêm tên file vào HashSet
                                usedFileNames.Add(entryName);

                                var entry = archive.CreateEntry(entryName, CompressionLevel.Fastest);
                                using (var entryStream = entry.Open())
                                {
                                    await entryStream.WriteAsync(cvBytes, 0, cvBytes.Length);
                                }
                                successCount++;
                            }
                            else
                            {
                                failCount++;
                            }
                        }
                        catch (Exception ex)
                        {
                            // Log error but continue with other CVs
                            Logger.LogError(ex, $"BulkDownloadCVs: Application {application.Id} - Lỗi không xác định: {ex.Message}");
                            failCount++;
                        }
                    }

                    // Log tổng kết
                    Logger.LogInformation($"BulkDownloadCVs: Tổng kết - Thành công: {successCount}, Thất bại: {failCount} " +
                        $"(Không có CV: {skipNoCvCount}, UploadedCv không tìm thấy: {skipUploadedCvNotFound}, " +
                        $"FileDescriptor không tìm thấy: {skipFileDescriptorNotFound}, Lỗi blob: {skipBlobError}, Lỗi render: {skipRenderError})");

                    if (successCount == 0)
                    {
                        var errorDetails = $"Không thể tải xuống bất kỳ CV nào. " +
                            $"Tổng số đơn ứng tuyển: {applications.Count}, " +
                            $"Không có CV: {skipNoCvCount}, " +
                            $"UploadedCv không tìm thấy: {skipUploadedCvNotFound}, " +
                            $"FileDescriptor không tìm thấy: {skipFileDescriptorNotFound}, " +
                            $"Lỗi blob storage: {skipBlobError}, " +
                            $"Lỗi render CV: {skipRenderError}";
                        throw new UserFriendlyException(errorDetails);
                    }
                }

                memoryStream.Position = 0;
                return memoryStream.ToArray();
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

            // Load Candidate để lấy CandidateName
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
    }
}
