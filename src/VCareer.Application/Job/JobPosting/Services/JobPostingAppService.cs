using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VCareer.Dto.Job;
using VCareer.Job.JobPosting.ISerices;
using VCareer.Job.Search;
using VCareer.Models.Job;
using VCareer.Repositories.Job;
using Volo.Abp.Application.Services;

namespace VCareer.Job.JobPosting.Services
{
    /// <summary>
    /// Application Service cho Job Posting
    /// Xử lý tìm kiếm, lấy chi tiết, related jobs, và indexing
    /// </summary>
    public class JobPostingAppService : ApplicationService, IJobPostingAppService
    {
        private readonly IJobPostingRepository _jobPostingRepository;
        private readonly ILocationRepository _locationRepository;
        private readonly ILuceneJobIndexer _luceneIndexer;
        private readonly ILogger<JobPostingAppService> _logger;

        public JobPostingAppService(
            IJobPostingRepository jobPostingRepository,
            ILuceneJobIndexer luceneIndexer,
            ILocationRepository locationRepository,
            ILogger<JobPostingAppService> logger)
        {
            _jobPostingRepository = jobPostingRepository;
            _luceneIndexer = luceneIndexer;
            _logger = logger;
            _locationRepository = locationRepository;
        }

        #region Search & List

        /// <summary>
        /// Tìm kiếm job bằng Lucene (full-text search)
        /// </summary>
        public async Task<PagedResultDto<JobViewDto>> SearchJobsAsync(JobSearchInputDto input)
        {
            try
            {
                // Step 1: Lucene search -> Get list of Guid
                var jobIds = await _luceneIndexer.SearchJobIdsAsync(input);

                if (!jobIds.Any())
                {
                    return new PagedResultDto<JobViewDto>(new List<JobViewDto>(), 0);
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

                List<JobViewDto> list = new List<JobViewDto>();
                foreach (var relatedJob in orderedJobs)
                {
                    var job = await MapToJobViewDto(relatedJob);
                    list.Add(job);
                }
                return new PagedResultDto<JobViewDto>(list, jobIds.Count);

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tìm kiếm jobs với input: {@Input}", input);
                throw;
            }
        }

        #endregion

        #region Detail

        /// <summary>
        /// Lấy chi tiết job theo slug
        /// </summary>
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

        /// <summary>
        /// Lấy chi tiết job theo ID
        /// </summary>
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

        #endregion

        #region Related Jobs

        /// <summary>
        /// Lấy danh sách job liên quan
        /// Dựa trên: cùng category, cùng province, cùng district
        /// </summary>
        public async Task<List<JobViewDto>> GetRelatedJobsAsync(Guid jobId, int maxCount = 10)
        {
            var relatedJobs = await _jobPostingRepository.GetRelatedJobsAsync(jobId, maxCount);
            //   return relatedJobs.Select(MapToJobViewDto).ToList();

            List<JobViewDto> list = new List<JobViewDto>();
            foreach (var relatedJob in relatedJobs)
            {
                var job = await MapToJobViewDto(relatedJob);
                list.Add(job);
            }
            return list;



        }

        #endregion

        #region Indexing

        /// <summary>
        /// Reindex toàn bộ jobs (Admin only)
        /// </summary>
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

        /// <summary>
        /// Index 1 job cụ thể (khi create/update job)
        /// </summary>
        public async Task IndexJobAsync(Guid jobId)
        {
            try
            {
                var job = await _jobPostingRepository.GetForIndexingAsync(jobId);
                if (job != null)
                {
                    await _luceneIndexer.IndexJobAsync(job);
                    _logger.LogInformation($"Đã index job: {job.Title} (ID: {jobId})");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi index job: {jobId}");
                throw;
            }
        }

        /// <summary>
        /// Xóa job khỏi index (khi delete job)
        /// </summary>
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

        #endregion

        #region Mapping

        /// <summary>
        /// Map Job_Posting -> JobViewDto (thông tin cơ bản cho list)
        /// </summary>
        private async Task<JobViewDto> MapToJobViewDto(Job_Posting job)
        {

            var province = await _locationRepository.GetProvinceByIdAsync(job.ProvinceId);
            return new JobViewDto
            {
                Id = job.Id,

                Title = job.Title,
                //CompanyLogo = job.CompanyLogo,
                //CompanyName = job.CompanyName,
                SalaryText = job.SalaryText,
                ExperienceText = job.ExperienceText,  // ✨ String (đã format sẵn)
                                                      //  WorkLocation = job.WorkLocation,
                                                      //CategoryName = job.JobCategory?.Name,
                ProvinceName = province.Name,
                //DistrictName = job.District?.Name,

                IsUrgent = job.IsUrgent,
                PostedAt = job.PostedAt,
                ExpiresAt = job.ExpiresAt.Value,
            };
        }

        /// <summary>
        /// Map Job_Posting -> JobViewDetail (chi tiết đầy đủ)
        /// </summary>
        private async Task<JobViewDetail> MapToJobViewDetail(Job_Posting job)
        {

            var province = await _locationRepository.GetProvinceByIdAsync(job.ProvinceId);

            return new JobViewDetail
            {
                Id = job.Id,
                Slug = job.Slug,
                Title = job.Title,
                Description = job.Description,
                Requirements = job.Requirements,
                Benefits = job.Benefits,
                //CompanyLogo = job.CompanyLogo,
                //CompanyName = job.CompanyName,
                SalaryText = job.SalaryText,
                ExperienceText = job.ExperienceText,  // ✨ String (đã format sẵn)
                Quantity = job.Quantity,

                //CategoryName = job.JobCategory?.Name,
                ProvinceName = province.Name,
                //DistrictName = job.District?.Name,
                WorkLocation = job.WorkLocation,
                EmploymentType = job.EmploymentType,
                PositionType = job.PositionType,
                IsUrgent = job.IsUrgent,
                PostedAt = job.PostedAt,
                ExpiresAt = job.ExpiresAt.Value,
                ViewCount = job.ViewCount,
                ApplyCount = job.ApplyCount
            };
        }

        #endregion

        #region Debug & Admin Tools

        /// <summary>
        /// DEBUG: Test tokenization
        /// </summary>
        //public async Task<List<string>> TestTokenizeAsync(string text)
        //{
        //    return await Task.FromResult(_luceneJobIndexer.TestTokenize(text));
        //}

        #endregion


        //public Task IncrementViewCountAsync(Guid jobId)
        //{
        //    return _jobPostingRepository.IncrementViewCountAsync(jobId);
        //}
    }
}
