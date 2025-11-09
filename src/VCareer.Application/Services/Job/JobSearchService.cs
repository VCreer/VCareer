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
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;

namespace VCareer.Services.Job
{

    public class JobSearchService : ApplicationService, IJobSearchService
    {
        private readonly IJobSearchRepository _jobPostingRepository;
        private readonly ILuceneJobIndexer _luceneIndexer;
        private readonly ILogger<JobSearchService> _logger;

        public JobSearchService(
                IJobSearchRepository jobPostingRepository,
                ILuceneJobIndexer luceneIndexer,
                ILogger<JobSearchService> logger)
        {
            _jobPostingRepository = jobPostingRepository;
            _luceneIndexer = luceneIndexer;
            _logger = logger;
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
        }

        /// Map Job_Posting -> JobViewDetail (chi tiết đầy đủ)
        private async Task<JobViewDetail> MapToJobViewDetail(Job_Post job)
        {

            return new JobViewDetail
            {
            };
        }
    }
}
