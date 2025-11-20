using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
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

        public async Task<PagedResultDto<JobViewWithPriorityDto>> SearchJobsAsync(JobSearchInputDto input)
        {
            try
            {
                // Step 1: Lucene search -> Get list of Guid
                var jobIds = await _luceneIndexer.SearchJobIdsAsync(input);

                if (!jobIds.Any())
                {
                    return new PagedResultDto<JobViewWithPriorityDto>(new List<JobViewWithPriorityDto>(), 0);
                }

                // Step 2: Load jobs từ DB theo thứ tự của Lucene
                var jobs = await _jobPostingRepository.GetJobsByIdsAsync(jobIds);

                // Step 3: Sort theo thứ tự của Lucene (giữ nguyên relevance)
                var orderedJobs = jobIds
                    .Select(id => jobs.FirstOrDefault(j => j.Id == id))
                    .Where(j => j != null)

                    .ToList();

                // Step 4: Map sang DTO
                //var jobViewDtos = orderedJobs.Select(MapToJobViewDto).ToList();

                //return new PagedResultDto<JobViewDto>(jobViewDtos, jobIds.Count);

                List<JobViewWithPriorityDto> list = new List<JobViewWithPriorityDto>();
                foreach (var relatedJob in orderedJobs)
                {
                    var job = await MapToJobViewDto(relatedJob);
                    list.Add(job);
                }
                return new PagedResultDto<JobViewWithPriorityDto>(list, jobIds.Count);

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tìm kiếm jobs với input: {@Input}", input);
                throw;
            }
        }
        public async Task<JobViewDetail> GetJobBySlugAsync(string slug)
        {
            var job = await _jobPostingRepository.GetBySlugAsync(slug);

            if (job == null)
            {
                throw new Volo.Abp.BusinessException($"Job với slug '{slug}' không tồn tại hoặc đã bị xóa.");
            }

            // Tăng view count
            await _jobPostingRepository.IncrementViewCountAsync(job.Id);

            return await MapToJobViewDetail(job);
        }
        public async Task<JobViewDetail> GetJobByIdAsync(Guid jobId)
        {
            var job = await _jobPostingRepository.GetDetailByIdAsync(jobId);

            if (job == null)
            {
                throw new Volo.Abp.BusinessException($"Job với ID '{jobId}' không tồn tại hoặc đã bị xóa.");
            }

            // Tăng view count
            await _jobPostingRepository.IncrementViewCountAsync(job.Id);

            return await MapToJobViewDetail(job);
        }
        public async Task<List<JobViewWithPriorityDto>> GetRelatedJobsAsync(Guid jobId, int maxCount = 10)
        {
            var relatedJobs = await _jobPostingRepository.GetRelatedJobsAsync(jobId, maxCount);
            //   return relatedJobs.Select(MapToJobViewDto).ToList();

            List<JobViewWithPriorityDto> list = new List<JobViewWithPriorityDto>();
            foreach (var relatedJob in relatedJobs)
            {
                var job = await MapToJobViewDto(relatedJob);
                list.Add(job);
            }
            return list;
        }

        // Reindex toàn bộ jobs (Admin only)
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

        // Index 1 job cụ thể (khi create/update job)
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

        /// Xóa job khỏi index (khi delete job)
        public async Task RemoveJobFromIndexAsync(Guid jobId)
        {
            try
            {
                await _luceneIndexer.DeleteJobFromIndexAsync(jobId);
                _logger.LogInformation($"Đã xóa job khỏi index: {jobId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi xóa job khỏi index: {jobId}");
                throw;
            }
        }

        /// Map Job_Posting -> JobViewDto (thông tin cơ bản cho list)
        private async Task<JobViewWithPriorityDto> MapToJobViewDto(Job_Post job)
        {
            var namecompany = await _jobPostingRepository.GetNameComany(job.Id);

            return new JobViewWithPriorityDto
            {

            };

            // Nếu người dùng đã đăng nhập → kiểm tra đã lưu hay chưa
            /*   if (_currentUser.IsAuthenticated)
               {
                   var userId = _currentUser.Id.Value;
                   var candidate = await _candidateProfileRepository.FirstOrDefaultAsync(c => c.UserId == userId);
                   if (candidate != null)
                   {
                       // CandidateProfile sử dụng UserId làm khóa chính → so sánh theo UserId
                       var saved = await _savedJobRepository.FirstOrDefaultAsync(s => s.CandidateId == candidate.UserId && s.JobId == job.Id);
                       dto.IsSaved = saved != null;
                   }
               }

               return dto;*/
        }

        /// <summary>
        /// Map Job_Posting -> JobViewDetail (chi tiết đầy đủ)
        private async Task<JobViewDetail> MapToJobViewDetail(Job_Post job)
        {

            return new JobViewDetail
            {
            };

            // Build category path (level 1 -> level 3)
            /*  if (job.JobCategory != null)
              {
                  var items = new List<CategoryItemDto>();
                  var level3 = job.JobCategory;
                  var level2 = level3.Parent;
                  var level1 = level2?.Parent;

                  if (level1 != null)
                  {
                      items.Add(new CategoryItemDto { Id = level1.Id, Name = level1.Name, Slug = level1.Slug });
                  }
                  if (level2 != null)
                  {
                      items.Add(new CategoryItemDto { Id = level2.Id, Name = level2.Name, Slug = level2.Slug });
                  }
                  items.Add(new CategoryItemDto { Id = level3.Id, Name = level3.Name, Slug = level3.Slug });

                  detail.CategoryPath = items;*/
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


        #region Debug & Admin Tools

        /// <summary>
        /// DEBUG: Test tokenization
        /// </summary>
        //public async Task<List<string>> TestTokenizeAsync(string text)
        //{
        //    return await Task.FromResult(_luceneJobIndexer.TestTokenize(text));
        //}

        #endregion

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
