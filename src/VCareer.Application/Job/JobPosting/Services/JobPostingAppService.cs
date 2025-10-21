//using AutoMapper;
//using System;
//using System.Collections.Generic;
//using System.Linq;
//using System.Text;
//using System.Threading.Tasks;
//using VCareer.Job.JobPosting.ISerices;
//using VCareer.Job.Search;
//using VCareer.Model;
//using VCareer.Models.Job;
//using VCareer.Models.Users;
//using VCareer.Repositories;
//using VCareer.Repositories.Job;
//using Volo.Abp.Application.Services;
//using Volo.Abp.Domain.Entities;
//using Volo.Abp.Domain.Repositories;
//using Volo.Abp.ObjectMapping;

//namespace VCareer.Job.JobPosting.Services
//{
//    public class JobPostingAppService : ApplicationService, IJobPostingAppService
//    {

//        private readonly IJobPostingRepository _jobRepository;
//        private readonly ILuceneJobIndexer _luceneIndexer;
//        private readonly IJobCategoryRepository _categoryRepository;
//        private readonly ILocationRepository _locationRepository;
//        private readonly IDistrictRepository _districtRepository;

//        public JobPostingAppService(IJobPostingRepository jobRepository, ILuceneJobIndexer luceneIndexer, IJobCategoryRepository categoryRepository, ILocationRepository locationRepository, IDistrictRepository districtRepository)
//        {
//            _jobRepository = jobRepository;
//            _luceneIndexer = luceneIndexer;
//            _categoryRepository = categoryRepository;
//            _locationRepository = locationRepository;
//            _districtRepository = districtRepository;
//        }

        

    
//        public async Task<PagedResultDto<JobPostingDto>> SearchJobsAsync(JobSearchInputDto input)
//        {
//            // Validation & normalize input
//            input.SkipCount = Math.Max(0, input.SkipCount);
//            input.MaxResultCount = Math.Clamp(input.MaxResultCount, 1, 100);
//            input.SortBy = input.SortBy?.ToLower() ?? "newest";

//            // STEP 1: Lucene search - trả về list GUID (fast search, ~10-50ms)
//            var allJobIds = await _luceneIndexer.SearchJobIdsAsync(input);

//            // Nếu không có kết quả
//            if (!allJobIds.Any())
//            {
//                return new PagedResultDto<JobPostingDto>
//                {
//                    TotalCount = 0,
//                    Items = new List<JobPostingDto>()
//                };
//            }

//            // STEP 2: Pagination trên list IDs
//            var pagedJobIds = allJobIds
//                .Skip(input.SkipCount)
//                .Take(input.MaxResultCount)
//                .ToList();

//            // STEP 3: EF query chi tiết jobs theo IDs (giữ thứ tự từ Lucene)
//            var jobs = await _jobRepository.GetByIdsAsync(pagedJobIds, includeDetails: true);

//            // STEP 4: Map to DTOs với location data
//            var jobDtos = await MapToJobPostingDtosAsync(jobs);

//            return new PagedResultDto<JobPostingDto>
//            {
//                TotalCount = allJobIds.Count,
//                Items = jobDtos
//            };
//        }

//        #endregion

//        #region Get Job Detail

//        /// <summary>
//        /// Lấy chi tiết job theo slug
//        /// </summary>
//        public async Task<JobDetailDto> GetJobBySlugAsync(string slug)
//        {
//            if (string.IsNullOrWhiteSpace(slug))
//                throw new ArgumentException("Slug không được để trống");

//            var job = await _jobRepository.GetBySlugAsync(slug, includeDetails: true);

//            if (job == null)
//                throw new EntityNotFoundException(typeof(Job_Posting), slug);

//            var jobDto = await MapToJobDetailDtoAsync(job);

//            return jobDto;
//        }

//        /// <summary>
//        /// Lấy chi tiết job theo ID (dùng cho admin/recruiter)
//        /// </summary>
//        public async Task<JobDetailDto> GetJobByIdAsync(Guid jobId)
//        {
//            var job = await _jobRepository.GetByIdAsync(jobId, includeDetails: true);

//            if (job == null)
//                throw new EntityNotFoundException(typeof(Job_Posting), jobId);

//            var jobDto = await MapToJobDetailDtoAsync(job);

//            return jobDto;
//        }

//        #endregion

//        #region Get Related Jobs

//        /// <summary>
//        /// Lấy job liên quan (cùng category)
//        /// </summary>
//        public async Task<List<JobPostingDto>> GetRelatedJobsAsync(Guid jobId, int maxCount = 10)
//        {
//            maxCount = Math.Clamp(maxCount, 1, 50);

//            var relatedJobs = await _jobRepository.GetRelatedJobsAsync(jobId, maxCount);

//            var jobDtos = await MapToJobPostingDtosAsync(relatedJobs);

//            return jobDtos;
//        }

//        #endregion

//        #region Get Featured & Newest Jobs

//        /// <summary>
//        /// Lấy job tuyển gấp (homepage)
//        /// </summary>
//        public async Task<List<JobPostingDto>> GetFeaturedJobsAsync(int maxCount = 20)
//        {
//            maxCount = Math.Clamp(maxCount, 1, 50);

//            var input = new JobSearchInputDto
//            {
//                IsUrgent = true,
//                SortBy = "urgent",
//                SkipCount = 0,
//                MaxResultCount = maxCount
//            };

//            var result = await SearchJobsAsync(input);
//            return result.Items.ToList();
//        }

//        /// <summary>
//        /// Lấy job mới nhất (homepage)
//        /// </summary>
//        public async Task<List<JobPostingDto>> GetNewestJobsAsync(int maxCount = 20)
//        {
//            maxCount = Math.Clamp(maxCount, 1, 50);

//            var input = new JobSearchInputDto
//            {
//                SortBy = "newest",
//                SkipCount = 0,
//                MaxResultCount = maxCount
//            };

//            var result = await SearchJobsAsync(input);
//            return result.Items.ToList();
//        }

//        #endregion

//        #region Get Jobs By Category

//        /// <summary>
//        /// Tìm job theo category (khi user click vào category)
//        /// Tự động expand category cha thành tất cả leaf categories
//        /// </summary>
//        public async Task<PagedResultDto<JobPostingDto>> GetJobsByCategoryAsync(
//            Guid categoryId,
//            JobSearchInputDto input)
//        {
//            // Lấy tất cả leaf category IDs từ category cha
//            var leafCategoryIds = await _categoryRepository.GetAllChildrenCategoryIdsAsync(categoryId);

//            // Nếu không có children → chính nó là leaf node
//            if (!leafCategoryIds.Any())
//                leafCategoryIds = new List<Guid> { categoryId };

//            // Merge với CategoryIds từ input (nếu có thêm filters)
//            input.CategoryIds = input.CategoryIds ?? new List<Guid>();
//            input.CategoryIds.AddRange(leafCategoryIds);
//            input.CategoryIds = input.CategoryIds.Distinct().ToList();

//            return await SearchJobsAsync(input);
//        }

//        #endregion

//        #region Get Jobs By Location

//        /// <summary>
//        /// Tìm job theo location
//        /// </summary>
//        public async Task<PagedResultDto<JobPostingDto>> GetJobsByLocationAsync(
//            int provinceId,
//            List<int> districtIds,
//            JobSearchInputDto input)
//        {
//            input.ProvinceIds = new List<int> { provinceId };

//            if (districtIds != null && districtIds.Any())
//                input.DistrictIds = districtIds;

//            return await SearchJobsAsync(input);
//        }

//        #endregion

//        #region Get Jobs By Recruiter

//        /// <summary>
//        /// Lấy jobs của recruiter (trang profile recruiter)
//        /// </summary>
//        public async Task<List<JobPostingDto>> GetJobsByRecruiterAsync(Guid recruiterId)
//        {
//            var jobs = await _jobRepository.GetJobsByRecruiterAsync(recruiterId, activeOnly: true);

//            var jobDtos = await MapToJobPostingDtosAsync(jobs);

//            return jobDtos;
//        }

//        #endregion

//        #region Lucene Indexing

//        /// <summary>
//        /// Reindex toàn bộ jobs (admin function hoặc background job)
//        /// </summary>
//        public async Task ReindexAllJobsAsync()
//        {
//            // Clear index cũ
//            await _luceneIndexer.ClearIndexAsync();

//            // Lấy tất cả active jobs
//            var allJobs = await _jobRepository.GetAllActiveJobsAsync();

//            // Batch reindex
//            await _luceneIndexer.IndexMultipleJobsAsync(allJobs);
//        }

//        /// <summary>
//        /// Index 1 job (gọi khi tạo/update job)
//        /// </summary>
//        public async Task IndexJobAsync(Guid jobId)
//        {
//            var job = await _jobRepository.GetForIndexingAsync(jobId);

//            if (job == null)
//                return;

//            if (job.IsActive())
//            {
//                // Job active → Index/Update
//                await _luceneIndexer.IndexJobAsync(job);
//            }
//            else
//            {
//                // Job không active → Xóa khỏi index
//                await _luceneIndexer.DeleteJobFromIndexAsync(jobId);
//            }
//        }

//        /// <summary>
//        /// Xóa job khỏi index
//        /// </summary>
//        public async Task RemoveJobFromIndexAsync(Guid jobId)
//        {
//            await _luceneIndexer.DeleteJobFromIndexAsync(jobId);
//        }

//        #endregion

//        #region Mapping - List

//        /// <summary>
//        /// Map List<Job_Posting> → List<JobPostingDto>
//        /// Optimize: Load location data 1 lần cho tất cả jobs
//        /// </summary>
//        private async Task<List<JobPostingDto>> MapToJobPostingDtosAsync(List<Job_Posting> jobs)
//        {
//            if (!jobs.Any())
//                return new List<JobPostingDto>();

//            // Load location data một lần (optimize N+1 queries)
//            var locationCache = await LoadLocationDataAsync(jobs);

//            // Map từng job
//            var dtos = jobs.Select(job => MapToJobPostingDto(job, locationCache)).ToList();

//            return dtos;
//        }

//        /// <summary>
//        /// Map Job_Posting → JobPostingDto (single)
//        /// </summary>
//        private JobPostingDto MapToJobPostingDto(Job_Posting job, LocationDataCache locationCache)
//        {
//            return new JobPostingDto
//            {
//                // Basic info
//                Id = job.Id,
//                Image = job.Image,
//                Title = job.Title,
//                Slug = job.Slug,

//                // Salary
//                SalaryMin = job.SalaryMin,
//                SalaryMax = job.SalaryMax,
//                SalaryDeal = job.SalaryDeal,
//                SalaryDisplay = FormatSalaryDisplay(job),

//                // Work details
//                EmploymentType = job.EmploymentType,
//                EmploymentTypeDisplay = GetEmploymentTypeDisplay(job.EmploymentType),
//                PositionType = job.PositionType,
//                PositionTypeDisplay = GetPositionTypeDisplay(job.PositionType),

//                // Location
//                WorkLocation = job.WorkLocation,
//                ProvinceId = job.ProvinceId,
//                ProvinceName = locationCache.GetProvinceName(job.ProvinceId),
//                DistrictId = job.DistrictId,
//                DistrictName = locationCache.GetDistrictName(job.DistrictId),

//                // Category
//                JobCategoryId = job.JobCategoryId,
//                CategoryName = job.JobCategory?.Name,
//                CategoryPath = BuildCategoryPath(job.JobCategory),

//                // Recruiter
//                RecruiterId = job.RecruiterId,
//                RecruiterName = job.RecruiterProfile?.CompanyName,
//                RecruiterLogo = job.RecruiterProfile?.Logo,

//                // Dates & flags
//                PostedAt = job.PostedAt,
//                ExpiresAt = job.ExpiresAt,
//                IsUrgent = job.IsUrgent,
//                TimeAgo = FormatTimeAgo(job.PostedAt),

//                // Stats
//                ApplyCount = job.ApplyCount
//            };
//        }

//        #endregion

//        #region Mapping - Detail

//        /// <summary>
//        /// Map Job_Posting → JobDetailDto
//        /// </summary>
//        private async Task<JobDetailDto> MapToJobDetailDtoAsync(Job_Posting job)
//        {
//            // Load location cho 1 job
//            var locationCache = await LoadLocationDataAsync(new List<Job_Posting> { job });

//            // Map base DTO
//            var baseDto = MapToJobPostingDto(job, locationCache);

//            // Map detail DTO
//            return new JobDetailDto
//            {
//                // Copy tất cả properties từ base
//                Id = baseDto.Id,
//                Image = baseDto.Image,
//                Title = baseDto.Title,
//                Slug = baseDto.Slug,
//                SalaryMin = baseDto.SalaryMin,
//                SalaryMax = baseDto.SalaryMax,
//                SalaryDeal = baseDto.SalaryDeal,
//                SalaryDisplay = baseDto.SalaryDisplay,
//                EmploymentType = baseDto.EmploymentType,
//                EmploymentTypeDisplay = baseDto.EmploymentTypeDisplay,
//                PositionType = baseDto.PositionType,
//                PositionTypeDisplay = baseDto.PositionTypeDisplay,
//                WorkLocation = baseDto.WorkLocation,
//                ProvinceId = baseDto.ProvinceId,
//                ProvinceName = baseDto.ProvinceName,
//                DistrictId = baseDto.DistrictId,
//                DistrictName = baseDto.DistrictName,
//                JobCategoryId = baseDto.JobCategoryId,
//                CategoryName = baseDto.CategoryName,
//                CategoryPath = baseDto.CategoryPath,
//                RecruiterId = baseDto.RecruiterId,
//                RecruiterName = baseDto.RecruiterName,
//                RecruiterLogo = baseDto.RecruiterLogo,
//                PostedAt = baseDto.PostedAt,
//                ExpiresAt = baseDto.ExpiresAt,
//                IsUrgent = baseDto.IsUrgent,
//                TimeAgo = baseDto.TimeAgo,
//                ApplyCount = baseDto.ApplyCount,

//                // Detail-specific properties
//                Description = job.Description,
//                Requirements = job.Requirements,
//                Benefits = job.Benefits,

//                // Experience
//                ExperienceYearsMin = job.ExperienceYearsMin,
//                ExperienceYearsMax = job.ExperienceYearsMax,
//                ExperienceDisplay = FormatExperienceDisplay(job),

//                // Work time
//                WorkTimeStart = job.WorkTimeStart,
//                WorkTimeEnd = job.WorkTimeEnd,
//                TimeDeal = job.TimeDeal,
//                WorkTimeDisplay = FormatWorkTimeDisplay(job),

//                // Tags
//                Tags = job.JobPostingTags?
//                    .Select(jpt => jpt.Tag?.Name)
//                    .Where(name => !string.IsNullOrEmpty(name))
//                    .ToList() ?? new List<string>(),

//                // Recruiter detail
//                Recruiter = MapToRecruiterBasicDto(job.RecruiterProfile)
//            };
//        }

//        /// <summary>
//        /// Map RecruiterProfile → RecruiterBasicDto
//        /// </summary>
//        private RecruiterBasicDto MapToRecruiterBasicDto(RecruiterProfile recruiter)
//        {
//            if (recruiter == null)
//                return null;

//            return new RecruiterBasicDto
//            {
//                Id = recruiter.Id,
//                Name = recruiter.CompanyName,
//                Logo = recruiter.Logo,
//                Description = recruiter.Description,
//                Website = recruiter.Website,
//                Address = recruiter.Address
//            };
//        }

//        #endregion

//        #region Helper - Location Data

//        /// <summary>
//        /// Load location data một lần cho nhiều jobs (optimize performance)
//        /// </summary>
//        private async Task<LocationDataCache> LoadLocationDataAsync(List<Job_Posting> jobs)
//        {
//            var cache = new LocationDataCache();

//            if (!jobs.Any())
//                return cache;

//            // Lấy unique IDs
//            var provinceIds = jobs.Select(j => j.ProvinceId).Distinct().ToList();
//            var districtIds = jobs.Select(j => j.DistrictId).Distinct().ToList();

//            // Load provinces batch
//            var provinceTasks = provinceIds.Select(async id =>
//            {
//                var province = await _locationRepository.GetByIDAsync(id);
//                return new { Id = id, Name = province?.Name };
//            });
//            var provinceResults = await Task.WhenAll(provinceTasks);
//            foreach (var result in provinceResults.Where(r => r.Name != null))
//            {
//                cache.Provinces[result.Id] = result.Name;
//            }

//            // Load districts batch
//            var districtTasks = districtIds.Select(async id =>
//            {
//                var district = await _districtRepository.GetByDistrictIdAsync(id);
//                return new { Id = id, Name = district?.Name };
//            });
//            var districtResults = await Task.WhenAll(districtTasks);
//            foreach (var result in districtResults.Where(r => r.Name != null))
//            {
//                cache.Districts[result.Id] = result.Name;
//            }

//            return cache;
//        }

//        /// <summary>
//        /// Cache cho location data
//        /// </summary>
//        private class LocationDataCache
//        {
//            public Dictionary<int, string> Provinces { get; set; } = new Dictionary<int, string>();
//            public Dictionary<int, string> Districts { get; set; } = new Dictionary<int, string>();

//            public string GetProvinceName(int id) => Provinces.GetValueOrDefault(id);
//            public string GetDistrictName(int id) => Districts.GetValueOrDefault(id);
//        }

//        #endregion

//        #region Helper - Format Display Strings

//        /// <summary>
//        /// Format salary display: "10 - 20 triệu VNĐ" hoặc "Thỏa thuận"
//        /// </summary>
//        private string FormatSalaryDisplay(Job_Posting job)
//        {
//            if (job.SalaryDeal)
//                return "Thỏa thuận";

//            if (job.SalaryMin.HasValue && job.SalaryMax.HasValue)
//            {
//                var min = job.SalaryMin.Value / 1_000_000m;
//                var max = job.SalaryMax.Value / 1_000_000m;
//                return $"{min:0.#} - {max:0.#} triệu VNĐ";
//            }

//            if (job.SalaryMin.HasValue)
//            {
//                var min = job.SalaryMin.Value / 1_000_000m;
//                return $"Từ {min:0.#} triệu VNĐ";
//            }

//            if (job.SalaryMax.HasValue)
//            {
//                var max = job.SalaryMax.Value / 1_000_000m;
//                return $"Đến {max:0.#} triệu VNĐ";
//            }

//            return "Thỏa thuận";
//        }

//        /// <summary>
//        /// Format experience display: "2 - 5 năm" hoặc "Không yêu cầu"
//        /// </summary>
//        private string FormatExperienceDisplay(Job_Posting job)
//        {
//            if (job.ExperienceYearsMin.HasValue && job.ExperienceYearsMax.HasValue)
//            {
//                if (job.ExperienceYearsMin == 0 && job.ExperienceYearsMax == 0)
//                    return "Không yêu cầu";

//                return $"{job.ExperienceYearsMin} - {job.ExperienceYearsMax} năm";
//            }

//            if (job.ExperienceYearsMin.HasValue)
//            {
//                if (job.ExperienceYearsMin == 0)
//                    return "Không yêu cầu";

//                return $"Tối thiểu {job.ExperienceYearsMin} năm";
//            }

//            if (job.ExperienceYearsMax.HasValue)
//                return $"Tối đa {job.ExperienceYearsMax} năm";

//            return "Không yêu cầu";
//        }

//        /// <summary>
//        /// Format work time display: "08:00 - 17:00" hoặc "Thỏa thuận"
//        /// </summary>
//        private string FormatWorkTimeDisplay(Job_Posting job)
//        {
//            if (job.TimeDeal)
//                return "Thỏa thuận";

//            if (job.WorkTimeStart.HasValue && job.WorkTimeEnd.HasValue)
//                return $"{job.WorkTimeStart:hh\\:mm} - {job.WorkTimeEnd:hh\\:mm}";

//            return "Thỏa thuận";
//        }

//        /// <summary>
//        /// Get employment type display text
//        /// </summary>
//        private string GetEmploymentTypeDisplay(EmploymentTye type)
//        {
//            return type switch
//            {
//                EmploymentTye.ToanThoiGian => "Toàn thời gian",
//                EmploymentTye.BanThoiGian => "Bán thời gian",
//                EmploymentTye.ThucTap => "Thực tập",
//                EmploymentTye.Khac => "Khác",
//                _ => "Không xác định"
//            };
//        }

//        /// <summary>
//        /// Get position type display text
//        /// </summary>
//        private string GetPositionTypeDisplay(PositionTye type)
//        {
//            return type switch
//            {
//                PositionTye.ThucTapSinh => "Thực tập sinh",
//                PositionTye.Nhanvien => "Nhân viên",
//                PositionTye.Truongnhom => "Trưởng nhóm",
//                PositionTye.Truongphong_phophong => "Trưởng/Phó phòng",
//                PositionTye.Quanli_giamsat => "Quản lý/Giám sát",
//                PositionTye.Truongchinhanh => "Trưởng chi nhánh",
//                PositionTye.PhoGiamDoc => "Phó Giám đốc",
//                PositionTye.GiamDoc => "Giám đốc",
//                _ => "Không xác định"
//            };
//        }

//        /// <summary>
//        /// Build category path: "Công nghệ thông tin > Lập trình > Backend Developer"
//        /// </summary>
//        private string BuildCategoryPath(Job_Category category)
//        {
//            if (category == null)
//                return string.Empty;

//            var pathParts = new List<string>();
//            var current = category;

//            // Traverse từ leaf lên root
//            while (current != null)
//            {
//                pathParts.Insert(0, current.Name);
//                current = current.Parent;
//            }

//            return string.Join(" > ", pathParts);
//        }

//        /// <summary>
//        /// Format time ago: "2 ngày trước", "3 giờ trước"
//        /// </summary>
//        private string FormatTimeAgo(DateTime postedAt)
//        {
//            var timeSpan = DateTime.UtcNow - postedAt;

//            if (timeSpan.TotalMinutes < 1)
//                return "Vừa xong";

//            if (timeSpan.TotalMinutes < 60)
//                return $"{(int)timeSpan.TotalMinutes} phút trước";

//            if (timeSpan.TotalHours < 24)
//                return $"{(int)timeSpan.TotalHours} giờ trước";

//            if (timeSpan.TotalDays < 7)
//                return $"{(int)timeSpan.TotalDays} ngày trước";

//            if (timeSpan.TotalDays < 30)
//                return $"{(int)(timeSpan.TotalDays / 7)} tuần trước";

//            if (timeSpan.TotalDays < 365)
//                return $"{(int)(timeSpan.TotalDays / 30)} tháng trước";

//            return $"{(int)(timeSpan.TotalDays / 365)} năm trước";
//        }

//        Task<PagedResultDto<JobViewDto>> IJobPostingAppService.SearchJobsAsync(JobSearchInputDto input)
//        {
//            throw new NotImplementedException();
//        }

//        Task<JobViewDetail> IJobPostingAppService.GetJobBySlugAsync(string slug)
//        {
//            throw new NotImplementedException();
//        }

//        Task<JobViewDetail> IJobPostingAppService.GetJobByIdAsync(Guid jobId)
//        {
//            throw new NotImplementedException();
//        }

//        Task<List<JobViewDto>> IJobPostingAppService.GetRelatedJobsAsync(Guid jobId, int maxCount)
//        {
//            throw new NotImplementedException();
//        }

//        #endregion
//    }
//}

//}
