using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VCareer.Constants.JobConstant;
using VCareer.Dto.Job;
using VCareer.Dto.JobDto;
using VCareer.IRepositories.Job;
using VCareer.IRepositories.ICompanyRepository;
using VCareer.Job.JobPosting.ISerices;
using VCareer.Models.Companies;
using VCareer.Models.Job;
using VCareer.Models.Users;
using VCareer.Repositories.Job;
using VCareer.Services.LuceneService.JobSearch;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Auditing;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;
using Volo.Abp.ObjectMapping;
using Volo.Abp.Users;

namespace VCareer.Services.Job
{

    public class JobSearchService : ApplicationService, IJobSearchService
    {
        private readonly IJobPostRepository _jobPostingRepository;
        private readonly ILuceneJobIndexer _luceneIndexer;
        private readonly ILogger<JobPostService> _logger;
          private readonly ISavedJobRepository _savedJobRepository;
        private readonly IRepository<CandidateProfile, Guid> _candidateProfileRepository;
        private readonly ICurrentUser _currentUser;
        private readonly IdentityUserManager _userManager;
        private readonly ICompanyRepository _companyRepository;

        public JobSearchService(
                IJobPostRepository jobPostingRepository,
                ILuceneJobIndexer luceneIndexer,
                ILogger<JobPostService> logger,
                ISavedJobRepository savedJobRepository,
                IRepository<CandidateProfile, Guid> candidateProfileRepository,
                ICurrentUser currentUser,
                IdentityUserManager userManager,
                ICompanyRepository companyRepository)
        {
            _jobPostingRepository = jobPostingRepository;
            _luceneIndexer = luceneIndexer;
            _logger = logger;
            _candidateProfileRepository = candidateProfileRepository;
            _currentUser = currentUser;
            _userManager = userManager;
              _savedJobRepository = savedJobRepository;
            _companyRepository = companyRepository;
        }
        [DisableAuditing]
        public async Task<List<JobViewDto>> SearchJobsAsync(JobSearchInputDto input)
        {
            var jobIds = await _luceneIndexer.SearchJobIdsAsync(input);
            if (!jobIds.Any())
                return new List<JobViewDto>();

            var jobsQuery = await _jobPostingRepository.GetQueryableAsync();
            var jobs = await jobsQuery
                .Where(j => jobIds.Contains(j.Id))
                .ToListAsync();

            // Giữ thứ tự Lucene
            var orderedJobs = jobIds
                .Select(id => jobs.FirstOrDefault(j => j.Id == id))
                .Where(j => j != null)
                .ToList();

            if (orderedJobs.Count == 0) return new List<JobViewDto>();
            
            // Map jobs to DTOs
            var jobViewDtos = ObjectMapper.Map<List<Job_Post>, List<JobViewDto>>(orderedJobs);
            
            // Load Company names from Companies table
            var companyIds = jobViewDtos.Select(j => j.CompanyId).Distinct().ToList();
            var companies = await _companyRepository.GetListAsync(c => companyIds.Contains(c.Id));
            var companyDict = companies.ToDictionary(c => c.Id, c => c.CompanyName);
            
            // Update CompanyName from Companies table
            foreach (var jobDto in jobViewDtos)
            {
                if (companyDict.TryGetValue(jobDto.CompanyId, out var companyName))
                {
                    jobDto.CompanyName = companyName;
                }
            }
            
            return jobViewDtos;
        }
        [DisableAuditing]
        public async Task<List<JobViewDto>> GetRelatedJobsAsync(Guid jobId, int maxCount = 10)
        {
            var job = await _jobPostingRepository.GetForIndexingAsync(jobId);
            if (job == null) return new List<JobViewDto>();
            var listPositionType = new List<PositionType>();
            listPositionType.Add(job.PositionType);
            var listCategoryId = new List<Guid>();
            listCategoryId.Add(job.JobCategoryId);
            var jobSearchInput = new JobSearchInputDto()
            {
                Keyword = job.Title,
                PositionTypes = listPositionType,
                CategoryIds = listCategoryId,
                ExperienceFilter = job.Experience,
            };

            var jobs = await SearchJobsAsync(jobSearchInput);
            jobs = jobs.Where(x => x.Id != jobId).Take(maxCount).ToList();
            // CompanyName đã được load từ Companies trong SearchJobsAsync
            return jobs;
        }
        public async Task ReindexAllJobsAsync()
        {
            try
            {
                _logger.LogInformation("Bắt đầu reindex toàn bộ jobs...");

                // Clear index cũ
                await _luceneIndexer.ClearIndexAsync();

                // Load tất cả jobs active
                var jobs = await _jobPostingRepository.GetAllActiveJobsAsync();

                // Index batch
                await _luceneIndexer.IndexMultipleJobsAsync(jobs);

                _logger.LogInformation($"Reindex thành công {jobs.Count} jobs!");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi reindex toàn bộ jobs");
                throw;
            }
        }
        public async Task IndexJobAsync(Guid jobId)
        {
            try
            {
                var job = await _jobPostingRepository.GetForIndexingAsync(jobId);
                if (job != null)
                {
                    await _luceneIndexer.UpsertJobAsync(job);
                }
            }
            catch (Exception ex)
            {
                throw new BusinessException(ex.Message);
            }
        }
        public async Task RemoveJobFromIndexAsync(Guid jobId)
        {
            try
            {
                await _luceneIndexer.DeleteJobFromIndexAsync(jobId);
            }
            catch (Exception ex) { throw new BusinessException(ex.Message); }
        }
        public async Task RemoveJobsFromIndexAsync(List<Guid> jobId)
        {
            try
            {
                await _luceneIndexer.DeleteJobsFromIndexAsync(jobId);
            }
            catch (Exception ex) { throw new BusinessException(ex.Message); }
        }
        public async Task<JobViewDetail> GetJobBySlugAsync(string slug)
        {
            var job = await _jobPostingRepository.GetBySlugAsync(slug);
            if (job == null) throw new Volo.Abp.BusinessException($"Job với slug '{slug}' không tồn tại hoặc đã bị xóa.");
            await _jobPostingRepository.IncrementViewCountAsync(job.Id);

            var jobViewDetail = ObjectMapper.Map<Job_Post, JobViewDetail>(job);
            
            // Load CompanyName from Companies table
            var company = await _companyRepository.FindAsync(job.CompanyId);
            if (company != null)
            {
                jobViewDetail.CompanyName = company.CompanyName;
            }
            
            return jobViewDetail;
        }
        public async Task<JobViewDetail> GetJobByIdAsync(Guid jobId)
        {
            var job = await _jobPostingRepository.FindAsync(jobId);
            if (job == null) throw new Volo.Abp.BusinessException($"Job với ID '{jobId}' không tồn tại hoặc đã bị xóa.");

            var jobViewDetail = ObjectMapper.Map<Job_Post, JobViewDetail>(job);
            
            // Load CompanyName from Companies table
            var company = await _companyRepository.FindAsync(job.CompanyId);
            if (company != null)
            {
                jobViewDetail.CompanyName = company.CompanyName;
            }
            
            return jobViewDetail;
        }



        #region Saved Jobs (Favorite)

        /// <summary>
        /// Lưu job vào danh sách yêu thích
        /// </summary>
        [DisableAuditing]
        public async Task SaveJobAsync(Guid jobId)
        {
              if (!_currentUser.IsAuthenticated)
              {
                  throw new Volo.Abp.BusinessException("Bạn cần đăng nhập để lưu công việc.");
              }

              var userId = _currentUser.Id.Value;

              // Lấy CandidateProfile từ UserId
              var candidateProfile = await _candidateProfileRepository.FirstOrDefaultAsync(c => c.UserId == userId);
              if (candidateProfile == null)
              {
                  throw new Volo.Abp.BusinessException("Không tìm thấy thông tin ứng viên.");
              }

              // Kiểm tra job có tồn tại không
              var job = await _jobPostingRepository.GetAsync(jobId);
              if (job == null)
              {
                  throw new Volo.Abp.BusinessException("Công việc không tồn tại.");
              }

              // Kiểm tra đã lưu chưa
              var existing = await _savedJobRepository.FirstOrDefaultAsync(s => s.CandidateId == candidateProfile.UserId && s.JobId == jobId);
              if (existing != null)
              {
                  return; // Đã lưu rồi, không cần làm gì
              }

              // Tạo mới SavedJob
              var savedJob = new SavedJob
              {
                  CandidateId = candidateProfile.UserId,
                  JobId = jobId,
                  CreationTime = DateTime.UtcNow
              };

              await _savedJobRepository.InsertAsync(savedJob);
           
        }

        /// <summary>
        /// Bỏ lưu job khỏi danh sách yêu thích
        /// </summary>
        [DisableAuditing]
        public async Task UnsaveJobAsync(Guid jobId)
        {
            if (!_currentUser.IsAuthenticated)
                throw new BusinessException("Bạn cần đăng nhập để bỏ lưu công việc.");

            var userId = _currentUser.Id!.Value;

            var candidateProfile = await _candidateProfileRepository.FirstOrDefaultAsync(c => c.UserId == userId)
                ?? throw new BusinessException("Không tìm thấy thông tin ứng viên.");

            var savedJob = await _savedJobRepository.FirstOrDefaultAsync(
                s => s.CandidateId == candidateProfile.UserId && s.JobId == jobId);

            if (savedJob != null)
                await _savedJobRepository.DeleteAsync(savedJob);
        }
        [DisableAuditing]
        public async Task<SavedJobStatusDto> GetSavedJobStatusAsync(Guid jobId)
        {
            if (!_currentUser.IsAuthenticated)
                return new SavedJobStatusDto { IsSaved = false, SavedAt = null };

            var userId = _currentUser.Id!.Value;

            var candidateProfile = await _candidateProfileRepository.FirstOrDefaultAsync(c => c.UserId == userId);
            if (candidateProfile == null)
                return new SavedJobStatusDto { IsSaved = false, SavedAt = null };

            var savedJob = await _savedJobRepository.FirstOrDefaultAsync(
                s => s.CandidateId == candidateProfile.UserId && s.JobId == jobId);

            return new SavedJobStatusDto
            {
                IsSaved = savedJob != null,
                SavedAt = savedJob?.CreationTime
            };
        }

        [DisableAuditing]
        public async Task<PagedResultDto<SavedJobDto>> GetSavedJobsAsync(int skipCount = 0, int maxResultCount = 20)
        {
            if (!_currentUser.IsAuthenticated)
            {
                return new PagedResultDto<SavedJobDto>(
                    totalCount: 0,
                    items: new List<SavedJobDto>()
                );
            }

            var userId = _currentUser.Id!.Value;

            // Lấy CandidateProfile từ UserId
            var candidateProfile = await _candidateProfileRepository.FirstOrDefaultAsync(c => c.UserId == userId);
            if (candidateProfile == null)
            {
                return new PagedResultDto<SavedJobDto>(
                    totalCount: 0,
                    items: new List<SavedJobDto>()
                );
            }

            // Lấy danh sách SavedJob với JobPosting (từ Repository)
            var savedJobs = await _savedJobRepository.GetSavedJobsWithDetailsAsync(
                candidateProfile.UserId,
                skipCount,
                maxResultCount
            );

            var totalCount = await _savedJobRepository.CountSavedJobsAsync(candidateProfile.UserId);

            // Map sang DTO
            var items = new List<SavedJobDto>();
            
            // Load Company names from Companies table
            var companyIds = savedJobs
                .Where(s => s.JobPosting != null)
                .Select(s => s.JobPosting.CompanyId)
                .Distinct()
                .ToList();
            var companies = await _companyRepository.GetListAsync(c => companyIds.Contains(c.Id));
            var companyDict = companies.ToDictionary(c => c.Id, c => c.CompanyName);
            
            foreach (var savedJob in savedJobs)
            {
                var job = savedJob.JobPosting;
                if (job == null) continue;

                var jobViewDto = ObjectMapper.Map<Job_Post, JobViewDto>(job);
                
                // Update CompanyName from Companies table
                if (companyDict.TryGetValue(job.CompanyId, out var companyName))
                {
                    jobViewDto.CompanyName = companyName;
                }

                items.Add(new SavedJobDto
                {
                    JobId = savedJob.JobId,
                    JobTitle = job.Title ?? string.Empty,
                    CompanyName = jobViewDto.CompanyName ?? "Chưa có thông tin",
                    SalaryText = BuildSalaryText(job),
                    Location = job.WorkLocation ?? "Chưa có thông tin",
                    SavedAt = savedJob.CreationTime,
                    JobDetail = jobViewDto
                });
            }

            return new PagedResultDto<SavedJobDto>(
                totalCount: totalCount,
                items: items
            );
        }

        #endregion
        [DisableAuditing]
        private string BuildSalaryText(Job_Post job)
        {
            if (job == null) return string.Empty;

            if (job.SalaryDeal)
            {
                return "Lương thỏa thuận";
            }

            if (job.SalaryMin.HasValue && job.SalaryMax.HasValue)
            {
                return $"{job.SalaryMin.Value:N0} - {job.SalaryMax.Value:N0} VND";
            }

            if (job.SalaryMin.HasValue)
            {
                return $"{job.SalaryMin.Value:N0} VND";
            }

            if (job.SalaryMax.HasValue)
            {
                return $"{job.SalaryMax.Value:N0} VND";
            }

            return "Không hiển thị";
        }


    }
}
