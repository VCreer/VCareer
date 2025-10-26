using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;
using Volo.Abp.Users;
using VCareer.Application.Contracts.Applications;
using VCareer.Application.Contracts.Permissions;
using VCareer.Models.Applications;
using VCareer.Models.Users;
using VCareer.Models.Companies;

using Volo.Abp.BlobStoring;
using VCareer.BlobStoring;
using VCareer.Constants.FileConstant;

namespace VCareer.Application.Applications
{
    /// <summary>
    /// Application Management Service
    /// </summary>
    [Authorize(VCareerPermissions.Application.Default)]
    public class ApplicationAppService : ApplicationService, IApplicationAppService
    {
        private readonly IRepository<JobApplication, Guid> _applicationRepository;
        private readonly IRepository<ApplicationDocument, Guid> _documentRepository;
        private readonly IRepository<CurriculumVitae, Guid> _cvRepository;
        private readonly IRepository<CandidateProfile, Guid> _candidateRepository;
        private readonly IRepository<Company, int> _companyRepository;
        private readonly IBlobContainer<CvContainer> _cvBlobContainer;
        private readonly IdentityUserManager _userManager;
        private readonly ICurrentUser _currentUser;
        

        public ApplicationAppService(
            IRepository<JobApplication, Guid> applicationRepository,
            IRepository<ApplicationDocument, Guid> documentRepository,
            IRepository<CurriculumVitae, Guid> cvRepository,
            IRepository<CandidateProfile, Guid> candidateRepository,
            IRepository<Company, int> companyRepository,
            IBlobContainer<CvContainer> cvBlobContainer,
            IdentityUserManager userManager)
        {
            _applicationRepository = applicationRepository;
            _documentRepository = documentRepository;
            _cvRepository = cvRepository;
            _candidateRepository = candidateRepository;
            _companyRepository = companyRepository;
            _cvBlobContainer = cvBlobContainer;
            _userManager = userManager;
        }

        /// <summary>
        /// Nộp đơn ứng tuyển với CV từ thư viện
        /// </summary>
        [Authorize(VCareerPermissions.Application.Apply)]
        public async Task<ApplicationDto> ApplyWithLibraryCVAsync(ApplyWithLibraryCVDto input)
        {
            // Lấy thông tin user hiện tại
            var userId = _currentUser.GetId();
            if (userId == null)
            {
                // Development fallback
                var users = await _userManager.GetUsersInRoleAsync("Candidate");
                userId = (Guid)(users.FirstOrDefault()?.Id);
                if (userId == null)
                    throw new UserFriendlyException("Không tìm thấy ứng viên");
            }

            // Lấy thông tin candidate profile
            var candidate = await _candidateRepository.FirstOrDefaultAsync(c => c.UserId == userId);
            if (candidate == null)
                throw new UserFriendlyException("Không tìm thấy thông tin ứng viên");

            // Kiểm tra CV có tồn tại và thuộc về ứng viên không
            var cv = await _cvRepository.FirstOrDefaultAsync(c => c.Id == input.CVId && c.CandidateId == candidate.Id);
            if (cv == null)
                throw new UserFriendlyException("CV không tồn tại hoặc không thuộc về bạn");

            // Kiểm tra đã ứng tuyển công việc này chưa
            var existingApplication = await _applicationRepository.FirstOrDefaultAsync(
                a => a.JobId == input.JobId && a.CandidateId == candidate.Id);
            if (existingApplication != null)
                throw new UserFriendlyException("Bạn đã ứng tuyển công việc này rồi");

            // TODO: Lấy thông tin Job và Company từ JobId
            // Tạm thời sử dụng giá trị mặc định
            var companyId = 1; // Cần implement Job entity và lấy CompanyId từ Job

            // Tạo đơn ứng tuyển
            var application = new JobApplication
            {
                JobId = input.JobId,
                CandidateId = candidate.Id,
                CompanyId = companyId,
                CVType = "Library",
                CVId = input.CVId,
                CoverLetter = input.CoverLetter,
                Status = "Pending",
                IsInterested = true
            };

            await _applicationRepository.InsertAsync(application);

            return ObjectMapper.Map<JobApplication, ApplicationDto>(application);
        }

        /// <summary>
        /// Nộp đơn ứng tuyển với CV tải lên mới
        /// </summary>
        [Authorize(VCareerPermissions.Application.Apply)]
        public async Task<ApplicationDto> ApplyWithUploadCVAsync(ApplyWithUploadCVDto input)
        {
            // Validate file
            if (!CvUploadConstants.IsValidFileSize(input.CVFile.Length))
                throw new UserFriendlyException($"Kích thước file không được vượt quá {CvUploadConstants.MaxFileSize / (1024 * 1024)}MB");

            if (!CvUploadConstants.IsValidFileExtension(Path.GetExtension(input.CVFile.FileName)))
                throw new UserFriendlyException("Định dạng file không được hỗ trợ");

            if (!CvUploadConstants.IsValidMimeType(input.CVFile.ContentType))
                throw new UserFriendlyException("Loại file không được hỗ trợ");

            // Lấy thông tin user hiện tại
            var userId = _currentUser.GetId();
            if (userId == null)
            {
                // Development fallback
                var users = await _userManager.GetUsersInRoleAsync("Candidate");
                userId = (Guid)(users.FirstOrDefault()?.Id);
                if (userId == null)
                    throw new UserFriendlyException("Không tìm thấy ứng viên");
            }

            // Lấy thông tin candidate profile
            var candidate = await _candidateRepository.FirstOrDefaultAsync(c => c.UserId == userId);
            if (candidate == null)
                throw new UserFriendlyException("Không tìm thấy thông tin ứng viên");

            // Kiểm tra đã ứng tuyển công việc này chưa
            var existingApplication = await _applicationRepository.FirstOrDefaultAsync(
                a => a.JobId == input.JobId && a.CandidateId == candidate.Id);
            if (existingApplication != null)
                throw new UserFriendlyException("Bạn đã ứng tuyển công việc này rồi");

            // Upload file CV
            var fileName = CvUploadConstants.GenerateFileName(input.CVFile.FileName);
            using var stream = input.CVFile.OpenReadStream();
            await _cvBlobContainer.SaveAsync(fileName, stream);

            // TODO: Lấy thông tin Job và Company từ JobId
            var companyId = 1; // Cần implement Job entity và lấy CompanyId từ Job

            // Tạo đơn ứng tuyển
            var application = new JobApplication
            {
                JobId = input.JobId,
                CandidateId = candidate.Id,
                CompanyId = companyId,
                CVType = "Upload",
                UploadedCVUrl = $"/api/files/cv/{fileName}",
                UploadedCVName = input.CVFile.FileName,
                UploadedCVSize = input.CVFile.Length,
                UploadedCVType = input.CVFile.ContentType,
                CandidateName = input.CandidateName,
                CandidateEmail = input.CandidateEmail,
                CandidatePhone = input.CandidatePhone,
                CoverLetter = input.CoverLetter,
                Status = "Pending",
                IsInterested = true
            };

            await _applicationRepository.InsertAsync(application);

            return ObjectMapper.Map<JobApplication, ApplicationDto>(application);
        }

        /// <summary>
        /// Lấy danh sách đơn ứng tuyển
        /// </summary>
        [Authorize(VCareerPermissions.Application.View)]
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
            query = query.OrderByDescending(a => a.CreationTime);

            // Get total count
            var totalCount = query.Count();

            // Apply paging
            var applications = query
                .Skip(input.SkipCount)
                .Take(input.MaxResultCount)
                .ToList();

            var applicationDtos = ObjectMapper.Map<List<JobApplication>, List<ApplicationDto>>(applications);

            return new PagedResultDto<ApplicationDto>(totalCount, applicationDtos);
        }

        /// <summary>
        /// Lấy thông tin chi tiết đơn ứng tuyển
        /// </summary>
        [Authorize(VCareerPermissions.Application.View)]
        public async Task<ApplicationDto> GetApplicationAsync(Guid id)
        {
            var application = await _applicationRepository.GetAsync(id);
            return ObjectMapper.Map<JobApplication, ApplicationDto>(application);
        }

        /// <summary>
        /// Cập nhật trạng thái đơn ứng tuyển (cho nhà tuyển dụng)
        /// </summary>
        [Authorize(VCareerPermissions.Application.Manage)]
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
                application.RespondedBy = _currentUser.GetId();
            }

            await _applicationRepository.UpdateAsync(application);

            return ObjectMapper.Map<JobApplication, ApplicationDto>(application);
        }

        /// <summary>
        /// Hủy đơn ứng tuyển (cho ứng viên)
        /// </summary>
        [Authorize(VCareerPermissions.Application.Withdraw)]
        public async Task<ApplicationDto> WithdrawApplicationAsync(Guid id, WithdrawApplicationDto input)
        {
            var application = await _applicationRepository.GetAsync(id);

            // Kiểm tra quyền sở hữu
            var userId = _currentUser.GetId();
            if (userId == null)
            {
                var users = await _userManager.GetUsersInRoleAsync("Candidate");
                userId = (Guid)(users.FirstOrDefault()?.Id);
            }

            var candidate = await _candidateRepository.FirstOrDefaultAsync(c => c.UserId == userId);
            if (candidate == null || application.CandidateId != candidate.Id)
                throw new UserFriendlyException("Bạn không có quyền hủy đơn ứng tuyển này");

            application.Status = "Withdrawn";
            application.WithdrawnAt = DateTime.UtcNow;
            application.WithdrawalReason = input.WithdrawalReason;

            await _applicationRepository.UpdateAsync(application);

            return ObjectMapper.Map<JobApplication, ApplicationDto>(application);
        }

        /// <summary>
        /// Đánh dấu đã xem đơn ứng tuyển
        /// </summary>
        [Authorize(VCareerPermissions.Application.Manage)]
        public async Task<ApplicationDto> MarkAsViewedAsync(Guid id)
        {
            var application = await _applicationRepository.GetAsync(id);

            if (!application.ViewedAt.HasValue)
            {
                application.ViewedAt = DateTime.UtcNow;
                application.ViewedBy = _currentUser.GetId();
                await _applicationRepository.UpdateAsync(application);
            }

            return ObjectMapper.Map<JobApplication, ApplicationDto>(application);
        }

        /// <summary>
        /// Lấy thống kê đơn ứng tuyển
        /// </summary>
        [Authorize(VCareerPermissions.Application.Statistics)]
        public async Task<ApplicationStatisticsDto> GetApplicationStatisticsAsync(Guid? jobId = null, Guid? companyId = null)
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
        [Authorize(VCareerPermissions.Application.View)]
        public async Task<PagedResultDto<ApplicationDto>> GetMyApplicationsAsync(GetApplicationListDto input)
        {
            var userId = _currentUser.GetId();
            if (userId == null)
            {
                var users = await _userManager.GetUsersInRoleAsync("Candidate");
                userId = (Guid)(users.FirstOrDefault()?.Id);
            }

            var candidate = await _candidateRepository.FirstOrDefaultAsync(c => c.UserId == userId);
            if (candidate == null)
                throw new UserFriendlyException("Không tìm thấy thông tin ứng viên");

            input.CandidateId = candidate.Id;
            return await GetApplicationListAsync(input);
        }

        /// <summary>
        /// Lấy danh sách đơn ứng tuyển của công ty
        /// </summary>
        [Authorize(VCareerPermissions.Application.Manage)]
        public async Task<PagedResultDto<ApplicationDto>> GetCompanyApplicationsAsync(GetApplicationListDto input)
        {
            // TODO: Lấy CompanyId từ user hiện tại (Recruiter)
            input.CompanyId = 1; // Tạm thời
            return await GetApplicationListAsync(input);
        }

        /// <summary>
        /// Lấy danh sách đơn ứng tuyển cho một công việc cụ thể
        /// </summary>
        [Authorize(VCareerPermissions.Application.Manage)]
        public async Task<PagedResultDto<ApplicationDto>> GetJobApplicationsAsync(Guid jobId, GetApplicationListDto input)
        {
            input.JobId = jobId;
            return await GetApplicationListAsync(input);
        }

        /// <summary>
        /// Tải xuống CV của đơn ứng tuyển
        /// </summary>
        [Authorize(VCareerPermissions.Application.DownloadCV)]
        public async Task<byte[]> DownloadApplicationCVAsync(Guid id)
        {
            var application = await _applicationRepository.GetAsync(id);

            if (application.CVType == "Library" && application.CVId.HasValue)
            {
                var cv = await _cvRepository.GetAsync(application.CVId.Value);
                if (!string.IsNullOrEmpty(cv.FileUrl))
                {
                    return await _cvBlobContainer.GetAllBytesAsync(Path.GetFileName(cv.FileUrl));
                }
            }
            else if (application.CVType == "Upload" && !string.IsNullOrEmpty(application.UploadedCVUrl))
            {
                return await _cvBlobContainer.GetAllBytesAsync(Path.GetFileName(application.UploadedCVUrl));
            }

            throw new UserFriendlyException("Không tìm thấy file CV");
        }

        /// <summary>
        /// Xóa đơn ứng tuyển (soft delete)
        /// </summary>
        [Authorize(VCareerPermissions.Application.Delete)]
        public async Task DeleteApplicationAsync(Guid id)
        {
            await _applicationRepository.DeleteAsync(id);
        }
    }
}

