using System;
using System.Linq;
using System.Threading.Tasks;
using VCareer.Dto.CandidateCVDto;
using VCareer.IServices.ICandidateCVService;
using VCareer.Models.Users;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Users;

namespace VCareer.Services.CandidateCVService
{
    /// <summary>
    /// Implementation của service để xem CVs
    /// </summary>
    public class CandidateCVViewService : ApplicationService, ICandidateCVViewService
    {
        private readonly IRepository<CurriculumVitae, Guid> _cvRepository;
        private readonly IRepository<RecruiterProfile, Guid> _recruiterProfileRepository;
        private readonly ICurrentUser _currentUser;

        public CandidateCVViewService(
            IRepository<CurriculumVitae, Guid> cvRepository,
            IRepository<RecruiterProfile, Guid> recruiterProfileRepository,
            ICurrentUser currentUser)
        {
            _cvRepository = cvRepository;
            _recruiterProfileRepository = recruiterProfileRepository;
            _currentUser = currentUser;
        }

        /// <summary>
        /// Lấy danh sách CVs công khai
        /// </summary>
        public async Task<ViewCandidateCVsResponseDto> GetPublicCVsAsync(ViewCandidateCVsRequestDto request)
        {
            // Verify user là Recruiter (Leader hoặc HR Staff)
            await VerifyRecruiterAccessAsync();

            // Get all public CVs
            var queryable = await _cvRepository.WithDetailsAsync(cv => cv.Candidate, cv => cv.User);
            
            var query = queryable
                .Where(cv => cv.IsPublic && cv.Status == "Published");

            // Apply filters
            if (!string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                var searchLower = request.SearchTerm.ToLower();
                query = query.Where(cv => 
                    cv.FullName.ToLower().Contains(searchLower) ||
                    cv.Email.ToLower().Contains(searchLower) ||
                    (cv.Skills != null && cv.Skills.ToLower().Contains(searchLower)) ||
                    (cv.CareerObjective != null && cv.CareerObjective.ToLower().Contains(searchLower))
                );
            }

            if (!string.IsNullOrWhiteSpace(request.CVType))
            {
                query = query.Where(cv => cv.CVType == request.CVType);
            }

            if (!string.IsNullOrWhiteSpace(request.Status))
            {
                query = query.Where(cv => cv.Status == request.Status);
            }

            // Get total count
            var totalCount = query.Count();

            // Apply sorting
            query = request.SortBy?.ToLower() switch
            {
                "fullname" => request.SortAscending 
                    ? query.OrderBy(cv => cv.FullName) 
                    : query.OrderByDescending(cv => cv.FullName),
                "lastmodificationtime" => request.SortAscending 
                    ? query.OrderBy(cv => cv.LastModificationTime) 
                    : query.OrderByDescending(cv => cv.LastModificationTime),
                _ => request.SortAscending 
                    ? query.OrderBy(cv => cv.CreationTime) 
                    : query.OrderByDescending(cv => cv.CreationTime)
            };

            // Apply pagination
            var cvs = query
                .Skip(request.PageIndex * request.PageSize)
                .Take(request.PageSize)
                .Select(cv => new CandidateCVListDto
                {
                    CVId = cv.Id,
                    CVName = cv.CVName,
                    CVType = cv.CVType,
                    Status = cv.Status,
                    FullName = cv.FullName,
                    Email = cv.Email,
                    PhoneNumber = cv.PhoneNumber,
                    Address = cv.Address,
                    CareerObjective = cv.CareerObjective,
                    WorkExperience = cv.WorkExperience,
                    Education = cv.Education,
                    Skills = cv.Skills,
                    FileUrl = cv.FileUrl,
                    OriginalFileName = cv.OriginalFileName,
                    CreationTime = cv.CreationTime,
                    LastModificationTime = cv.LastModificationTime,
                    CandidateId = cv.CandidateId
                })
                .ToList();

            var totalPages = (int)Math.Ceiling((double)totalCount / request.PageSize);

            return new ViewCandidateCVsResponseDto
            {
                CVs = cvs,
                TotalCount = totalCount,
                PageIndex = request.PageIndex,
                PageSize = request.PageSize,
                TotalPages = totalPages
            };
        }

        /// <summary>
        /// Lấy chi tiết một CV
        /// </summary>
        public async Task<CandidateCVListDto> GetCVDetailAsync(Guid cvId)
        {
            // Verify user là Recruiter
            await VerifyRecruiterAccessAsync();

            var queryable = await _cvRepository.WithDetailsAsync(cv => cv.Candidate, cv => cv.User);
            var cv = queryable.FirstOrDefault(c => c.Id == cvId);

            if (cv == null)
            {
                throw new UserFriendlyException("Không tìm thấy CV.");
            }

            // Chỉ cho phép xem CV công khai
            if (!cv.IsPublic || cv.Status != "Published")
            {
                throw new UserFriendlyException("CV này không công khai hoặc chưa được publish.");
            }

            return new CandidateCVListDto
            {
                CVId = cv.Id,
                CVName = cv.CVName,
                CVType = cv.CVType,
                Status = cv.Status,
                FullName = cv.FullName,
                Email = cv.Email,
                PhoneNumber = cv.PhoneNumber,
                Address = cv.Address,
                CareerObjective = cv.CareerObjective,
                WorkExperience = cv.WorkExperience,
                Education = cv.Education,
                Skills = cv.Skills,
                FileUrl = cv.FileUrl,
                OriginalFileName = cv.OriginalFileName,
                CreationTime = cv.CreationTime,
                LastModificationTime = cv.LastModificationTime,
                CandidateId = cv.CandidateId
            };
        }

        #region Private Helper Methods

        /// <summary>
        /// Verify user hiện tại là Recruiter (Leader hoặc HR Staff)
        /// </summary>
        private async Task VerifyRecruiterAccessAsync()
        {
            if (!_currentUser.IsAuthenticated)
            {
                throw new UserFriendlyException("Bạn cần đăng nhập để thực hiện thao tác này.");
            }

            var currentUserId = _currentUser.Id.Value;
            var queryable = await _recruiterProfileRepository.GetQueryableAsync();
            var recruiter = queryable.FirstOrDefault(r => r.UserId == currentUserId);

            if (recruiter == null)
            {
                throw new UserFriendlyException("Bạn không có quyền truy cập chức năng này. Chỉ Recruiter mới được xem CVs.");
            }

            // Verify recruiter is active
            if (!recruiter.Status)
            {
                throw new UserFriendlyException("Tài khoản Recruiter của bạn đã bị vô hiệu hóa.");
            }
        }

        #endregion
    }
}

