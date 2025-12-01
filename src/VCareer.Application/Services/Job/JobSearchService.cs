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
using VCareer.Job.JobPosting.ISerices;
using VCareer.Models.Companies;
using VCareer.Models.Job;
using VCareer.Models.Users;
using VCareer.Services.LuceneService.JobSearch;
using Volo.Abp;
using Volo.Abp.Application.Services;
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
        //  private readonly ISavedJobRepository _savedJobRepository;
        private readonly IRepository<CandidateProfile, Guid> _candidateProfileRepository;
        private readonly ICurrentUser _currentUser;
        private readonly IdentityUserManager _userManager;

        public JobSearchService(
                IJobPostRepository jobPostingRepository,
                ILuceneJobIndexer luceneIndexer,
                ILogger<JobPostService> logger,
        //        ISavedJobRepository savedJobRepository,
                IRepository<CandidateProfile, Guid> candidateProfileRepository,
                ICurrentUser currentUser,
                IdentityUserManager userManager)
        {
            _jobPostingRepository = jobPostingRepository;
            _luceneIndexer = luceneIndexer;
            _logger = logger;
            _candidateProfileRepository = candidateProfileRepository;
            _currentUser = currentUser;
            _userManager = userManager;
            //  _savedJobRepository = savedJobRepository;
            //_companyRepository = companyRepository;
            //_recruiterRepository = recruiterRepository;
        }

        public async Task<List<JobViewDto>> SearchJobsAsync(JobSearchInputDto input)
        {
            var jobIds = await _luceneIndexer.SearchJobIdsAsync(input);
            if (!jobIds.Any())
                return new List<JobViewDto>();

            // Lấy list Id hết hạn ngay từ DB
            var now = DateTime.Now;

            var jobsQuery = await _jobPostingRepository.GetQueryableAsync();
            var jobs = await jobsQuery
                .Where(j => jobIds.Contains(j.Id) && j.ExpiresAt >= now)
                .ToListAsync();

            // Nếu bị Lucene trả về job đã hết hạn → xóa khỏi Lucene
            var validJobIds = jobs.Select(x => x.Id).ToHashSet();
            var expiredIds = jobIds.Where(id => !validJobIds.Contains(id)).ToList();

            foreach (var expiredId in expiredIds)
            {
                await _luceneIndexer.DeleteJobFromIndexAsync(expiredId);
            }

            // Giữ đúng thứ tự từ Lucene
            var jobDict = jobs.ToDictionary(j => j.Id, j => j);

            var orderedJobs = jobIds
                .Where(id => jobDict.ContainsKey(id))
                .Select(id => jobDict[id])
                .ToList();

            return ObjectMapper.Map<List<Job_Post>, List<JobViewDto>>(orderedJobs);
        }


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
        public async Task<JobViewDetail> GetJobBySlugAsync(string slug)
        {
            var job = await _jobPostingRepository.GetBySlugAsync(slug);
            if (job == null) throw new Volo.Abp.BusinessException($"Job với slug '{slug}' không tồn tại hoặc đã bị xóa.");
            await _jobPostingRepository.IncrementViewCountAsync(job.Id);

            return ObjectMapper.Map<Job_Post, JobViewDetail>(job);
        }
        public async Task<JobViewDetail> GetJobByIdAsync(Guid jobId)
        {
            var job = await _jobPostingRepository.FindAsync(jobId);
            if (job == null) throw new Volo.Abp.BusinessException($"Job với ID '{jobId}' không tồn tại hoặc đã bị xóa.");

            return ObjectMapper.Map<Job_Post, JobViewDetail>(job);
        }



        #region Saved Jobs (Favorite)

        /// <summary>
        /// Lưu job vào danh sách yêu thích
        /// </summary>
        public async Task SaveJobAsync(Guid jobId)
        {
            /*  if (!_currentUser.IsAuthenticated)
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

              await _savedJobRepository.InsertAsync(savedJob);*/
            throw new NotImplementedException();
        }

        /// <summary>
        /// Bỏ lưu job khỏi danh sách yêu thích
        /// </summary>
        public async Task UnsaveJobAsync(Guid jobId)
        {
            //if (!_currentUser.IsAuthenticated)
            //{
            //    throw new Volo.Abp.BusinessException("Bạn cần đăng nhập để bỏ lưu công việc.");
            //}

            //var userId = _currentUser.Id.Value;

            //// Lấy CandidateProfile từ UserId
            //var candidateProfile = await _candidateProfileRepository.FirstOrDefaultAsync(c => c.UserId == userId);
            //if (candidateProfile == null)
            //{
            //    throw new Volo.Abp.BusinessException("Không tìm thấy thông tin ứng viên.");
            //}

            //// Xóa SavedJob
            //var savedJob = await _savedJobRepository.FirstOrDefaultAsync(s => s.CandidateId == candidateProfile.UserId && s.JobId == jobId);
            //if (savedJob != null)
            //{
            //    await _savedJobRepository.DeleteAsync(savedJob);
            //}
            throw new NotImplementedException();
        }

        /// <summary>
        /// Kiểm tra xem job đã được lưu chưa
        /// </summary>
        public async Task<SavedJobStatusDto> GetSavedJobStatusAsync(Guid jobId)
        {
            /*  if (!_currentUser.IsAuthenticated)
              {
                  return new SavedJobStatusDto { IsSaved = false, SavedAt = null };
              }

              var userId = _currentUser.Id.Value;

              // Lấy CandidateProfile từ UserId
              var candidateProfile = await _candidateProfileRepository.FirstOrDefaultAsync(c => c.UserId == userId);
              if (candidateProfile == null)
              {
                  return new SavedJobStatusDto { IsSaved = false, SavedAt = null };
              }

              var savedJob = await _savedJobRepository.FirstOrDefaultAsync(s => s.CandidateId == candidateProfile.Id && s.JobId == jobId);

              return new SavedJobStatusDto
              {
                  IsSaved = savedJob != null,
                  SavedAt = savedJob?.CreationTime
              };*/
            throw new NotImplementedException();
        }

        public Task<PagedResultDto<SavedJobDto>> GetSavedJobsAsync(int skipCount = 0, int maxResultCount = 20)
        {
            throw new NotImplementedException();
        }

        // Nếu người dùng đã đăng nhập → kiểm tra đã lưu hay chưa
        /*   if (_currentUser.IsAuthenticated)
           {
               var userId = _currentUser.Id.Value;
               var candidate = await _candidateProfileRepository.FirstOrDefaultAsync(c => c.UserId == userId);
               if (candidate != null)
               {
                   // CandidateProfile sử dụng UserId làm khóa chính → so sánh theo UserId
                   var saved = await _savedJobRepository.FirstOrDefaultAsync(s => s.CandidateId == candidate.UserId && s.JobId == job.Id);
                   detail.IsSaved = saved != null;
               }

           }
           else detail.IsSaved = false;

           return detail;
       }*/

        /// <summary>
        /// Lấy danh sách job đã lưu của user hiện tại
        /// </summary>
        /*   public async Task<PagedResultDto<SavedJobDto>> GetSavedJobsAsync(int skipCount = 0, int maxResultCount = 20)
           {
               if (!_currentUser.IsAuthenticated)
               {
                   return new PagedResultDto<SavedJobDto>(new List<SavedJobDto>(), 0);
               }
               var userId = _currentUser.Id.Value;

               // Lấy CandidateProfile từ UserId
               var candidateProfile = await _candidateProfileRepository.FirstOrDefaultAsync(c => c.UserId == userId);
               if (candidateProfile == null)
               {
                   return new PagedResultDto<SavedJobDto>(new List<SavedJobDto>(), 0);
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
               foreach (var savedJob in savedJobs)
               {
                   var job = savedJob.JobPosting;
                   if (job == null) continue;
                   var jobViewDto = await MapToJobViewDto(job);

                   items.Add(new SavedJobDto
                   {
                       JobId = savedJob.JobId,
                       JobTitle = job.Title,
                       CompanyName = jobViewDto.CompanyName ?? "Chưa có thông tin",
                       SalaryText = job.SalaryText,
                       Location = jobViewDto.ProvinceName ?? "Chưa có thông tin",
                       SavedAt = savedJob.CreationTime,
                       JobDetail = jobViewDto
                   });
               }
               return new PagedResultDto<SavedJobDto>(items, totalCount);
           }*/

        #endregion


    }
}
