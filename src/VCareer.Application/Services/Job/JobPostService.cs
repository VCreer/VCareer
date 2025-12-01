using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using VCareer.Constants.JobConstant;
using VCareer.Dto.JobDto;
using VCareer.Dto.Subcriptions;
using VCareer.IRepositories.Category;
using VCareer.IRepositories.ICompanyRepository;
using VCareer.IRepositories.Job;
using VCareer.IRepositories.Profile;
using VCareer.IRepositories.Subcriptions;
using VCareer.IServices.IGeoServices;
using VCareer.IServices.IJobServices;
using VCareer.IServices.Subcriptions;
using VCareer.Job.JobPosting.ISerices;
using VCareer.Models.Job;
using VCareer.Models.Subcription;
using VCareer.Models.Users;
using VCareer.Services.Geo;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Authorization;
using Volo.Abp.Identity;
using Volo.Abp.Uow;
using Volo.Abp.Users;
using static VCareer.Constants.JobConstant.SubcriptionContance;

namespace VCareer.Services.Job
{
    public class JobPostService : ApplicationService, IJobPostService
    {
        private readonly IJobPostRepository _jobPostRepository;
        private readonly IJobPriorityRepository _jobPriorityRepository;
        private readonly IJobSearchService _jobSearchService;
        private readonly ICompanyRepository _companyRepository;
        private readonly ICurrentUser _currentUser;
        private readonly IIdentityUserRepository _identityUserRepository;
        private readonly IRecruiterRepository _recruiterRepository;
        private readonly IGeoService _geoService;
        private readonly IJobCategoryRepository _jobCategoryRepository;
        private readonly IJobAffectingService _effectingJobService;
        private readonly IChildServiceRepository _childServiceRepository;
        private readonly ITagService _tagService;
        private readonly IJobTagService _jobTagService;


        public JobPostService(IJobPostRepository repository, IJobSearchService jobSearchService, IJobPriorityRepository jobPriorityRepository, ICompanyRepository companyRepository, ICurrentUser currentUser, IIdentityUserRepository identityUserRepository, IRecruiterRepository recruiterRepository, IGeoService geoService, IJobCategoryRepository jobCategoryRepository, IJobAffectingService jobAffectingService,
            IChildServiceRepository childServiceRepository, ITagService tagService, IJobTagService jobTagService)
        {
            _jobPostRepository = repository;
            _jobSearchService = jobSearchService;
            _jobPriorityRepository = jobPriorityRepository;
            _companyRepository = companyRepository;
            _currentUser = currentUser;
            _identityUserRepository = identityUserRepository;
            _recruiterRepository = recruiterRepository;
            _geoService = geoService;
            _jobCategoryRepository = jobCategoryRepository;
            _effectingJobService = jobAffectingService;
            _childServiceRepository = childServiceRepository;
            _tagService = tagService;
            _jobTagService = jobTagService;
        }

        public async Task ApproveJobPostAsync(string id)
        {
            var jobPost = await _jobPostRepository.GetAsync(Guid.Parse(id));
            if (jobPost == null)
                throw new Volo.Abp.BusinessException($"Job với ID '{id}' không tồn tại hoặc được xóa.");
            if(jobPost.ExpiresAt < DateTime.Now) throw new Volo.Abp.BusinessException($"This job is expired !");

            jobPost.Status = JobStatus.Open;
            jobPost.ApprovedBy = CurrentUser.Id;
            jobPost.ApproveAt = DateTime.Now;
            await _jobPostRepository.UpdateAsync(jobPost, true);

            await _jobSearchService.IndexJobAsync(jobPost.Id);
            //
            //send email cho recruiter báo đăng bài thành công
            //
        }

        public async Task RejectJobPostAsync(string id)
        {
            var jobPost = await _jobPostRepository.GetAsync(Guid.Parse(id));
            if (jobPost == null)
                throw new Volo.Abp.BusinessException($"Job với ID '{id}' không tồn tại hoặc được xóa.");

            jobPost.Status = JobStatus.Rejected;
            await _jobPostRepository.UpdateAsync(jobPost, true);

            //
            //send email cho recruiter với nội dung từ Reject reason 
            //
        }

        public async Task<List<JobApproveViewDto>> ShowJobPostNeedApprove(JobFilterDto dto)
        {
            var jobs = await SortJobNeedApproved();
            jobs = FilterJob(dto, jobs);
            jobs = jobs.Where(x => x.Status == JobStatus.Pending);

            int skip = (dto.Page - 1) * dto.PageSize;
            var jobPaged = await jobs
                .Skip(skip)
                .Take(dto.PageSize)
                .ToListAsync();

            List<JobApproveViewDto> result = new List<JobApproveViewDto>();
            foreach (var job in jobs)
            {
                var provinceName = await _geoService.GetProvinceNameByCode(job.ProvinceCode);
                var wardName = await _geoService.GetWardNameByCode(job.WardCode, job.ProvinceCode);
                var categoryName = await _jobCategoryRepository.FindAsync(job.JobCategoryId)
                    ?? throw new BusinessException("Category not found");

                await AutomationCheckJobPost(job);
                result.Add(new JobApproveViewDto
                {
                    Id = job.Id,
                    CompanyImageUrl = job.CompanyImageUrl,
                    CompanyName = job.CompanyName,
                    CompanyId = job.CompanyId,
                    ExpiresAt = job.ExpiresAt,
                    ProvinceName = provinceName,
                    WardName = wardName,
                    Title = job.Title,
                    RiskJobLevel = job.RiskJobLevel,
                    Benefits = job.Benefits,
                    Description = job.Description,
                    Requirements = job.Requirements,
                    EmploymentType = job.EmploymentType,
                    SalaryMax = job.SalaryMax,
                    SalaryMin = job.SalaryMin,
                    SalaryDeal = job.SalaryDeal,
                    PositionType = job.PositionType,
                    Experience = job.Experience,
                    Quantity = job.Quantity,
                    WorkLocation = job.WorkLocation,
                    WorkTime = job.WorkTime,
                    Slug = job.Slug,
                    JobCategoryId = job.JobCategoryId,
                    PostedAt = job.PostedAt,
                    RejectedReason = job.RejectedReason,
                    CategoryName = categoryName.Name,
                    RecruiterLevel = job.RecruiterProfile.RecruiterLevel,
                    PriorityLevel = job.Job_Priority.PriorityLevel,
                    Status = job.Status
                    // sau thêm cả tag và category
                });
            }
            return result;
        }

        #region logic show list job  need approve
        private async Task<string> AutomationCheckJobPost(Job_Post job)
        {
            var riskScore = 0;
            var msg = "";
            var tempMsg = "";

            int score = CheckLengthInformation(job, out tempMsg);
            if (score > 0) msg += tempMsg + "\n";
            riskScore += score;

            score = CheckSalary(job, out tempMsg);
            if (score > 0) msg += tempMsg + "\n";
            riskScore += score;

            score = CheckRiskExternalLink(job, out tempMsg) * 5;
            if (score > 0) msg += tempMsg + "\n";
            riskScore += score;

            if (riskScore < 10) job.RiskJobLevel = RiskJobLevel.Low;
            if (riskScore >= 10 && riskScore <= 20) job.RiskJobLevel = RiskJobLevel.Normal;
            if (riskScore > 20) job.RiskJobLevel = RiskJobLevel.Hight;

            job.RejectedReason = msg;
            await _jobPostRepository.UpdateAsync(job, true);

            return msg;

        }
        private int CheckLengthInformation(Job_Post job, out string msg)
        {
            msg = "Description or title or Requirement or benefit is empty";
            int riskScore = 0;
            if (string.IsNullOrEmpty(job.Description) ||
               string.IsNullOrEmpty(job.Title) ||
               string.IsNullOrEmpty(job.Requirements) ||
               string.IsNullOrEmpty(job.Benefits)
               ) return 10;

            if (job.Description.Length < RiskInfomationLength.RiskDescriptionLengthMin ||
                job.Description.Length > RiskInfomationLength.RiskDescriptionLengthMax) riskScore++;
            if (job.Title.Length < RiskInfomationLength.RiskTitleLengthMin ||
                job.Title.Length > RiskInfomationLength.RiskTitleLengthMax) riskScore++;
            if (job.Requirements.Length < RiskInfomationLength.RiskRequirementLengthMin ||
                job.Requirements.Length > RiskInfomationLength.RiskRequirementLengthMax) riskScore++;
            if (job.Benefits.Length < RiskInfomationLength.RiskBenefitLengthMin ||
                job.Benefits.Length > RiskInfomationLength.RiskBenefitLengthMax) riskScore++;
            msg = "Description or title or Requirement or benefit is empty is seem lack of information";
            return riskScore;
        }

        private int CheckSalary(Job_Post job, out string msg)
        {
            msg = "Your Salary is Suspicious";
            var riskScore = 0;
            if (job.SalaryMin < RiskSalaryRange.SALARY_MIN) riskScore += 10;
            if (job.SalaryMax > RiskSalaryRange.SALARY_MAX) riskScore += 10;
            return riskScore;
        }

        private int CheckRiskExternalLink(Job_Post job, out string msg)
        {
            int numberOfRiskExternalLinks = 0;
            numberOfRiskExternalLinks += CheckRiskExternalLink(job.Description);
            numberOfRiskExternalLinks += CheckRiskExternalLink(job.Benefits);
            numberOfRiskExternalLinks += CheckRiskExternalLink(job.Requirements);
            numberOfRiskExternalLinks += CheckRiskExternalLink(job.Title);
            msg = $"Your job post is have{numberOfRiskExternalLinks} Suspicious External Link";
            return numberOfRiskExternalLinks;
        }
        private int CheckRiskExternalLink(string? input)
        {
            var count = 0;
            var riskLink = JobValidatorHelper.DetectExternalLinks(input);
            foreach (var link in riskLink)
            {
                count++;
            }
            return count;
        }

        //dùng ML.NET
        private string[]? CheckRiskKeyWord(Job_Post job)
        {
            throw new NotImplementedException();
        }

        #endregion
        public async Task PostJobAsync(PostJobDto dto)
        {
            //chir cho phep job o status Draft duoc post
            var job = await _jobPostRepository.GetAsync(dto.JobId);
            if (job == null || job.Status == JobStatus.Deleted) throw new Volo.Abp.BusinessException($"This job doesn't exist or deleted.");
            if (job.Status == JobStatus.Closed || job.Status == JobStatus.Rejected || job.Status == JobStatus.Expired) throw new Volo.Abp.UserFriendlyException($"This job is expired or rejected , you have to update to post!");
            if (job.Status == JobStatus.Pending || job.Status == JobStatus.Open) throw new Volo.Abp.BusinessException($"This job is already open or waiting for approval.");


            //chay cac child service duoc gan vao job
            if (dto.ChildServiceIds != null && dto.ChildServiceIds.Count > 0)
            {
                foreach (var childServiceId in dto.ChildServiceIds)
                {
                    var childService = await _childServiceRepository.GetAsync(childServiceId);
                    if (childService == null || childService.IsDeleted == true || childService.IsActive == false) throw new Volo.Abp.BusinessException($"This child service doesn't exist or deleted.");
                    await _effectingJobService.ApplyServiceToJob(new EffectingJobServiceCreateDto()
                    {
                        ChildServiceId = childServiceId,
                        JobPostId = dto.JobId
                    });
                }
            }

            job.Status = JobStatus.Pending;
            await _jobPostRepository.UpdateAsync(job, true);

        }
        public async Task CloseJobPost(string id)
        {
            var jobPost = await _jobPostRepository.GetAsync(Guid.Parse(id));
            if (jobPost == null)
                throw new Volo.Abp.BusinessException($"Job với ID '{id}' không tồn tại hoặc được xóa.");

            jobPost.Status = JobStatus.Closed;
            await _jobPostRepository.UpdateAsync(jobPost, true);
        }
        public async Task ExecuteExpiredJobPostAutomatically(string id)
        {
            var jobPost = await _jobPostRepository.GetAsync(Guid.Parse(id));
            if (jobPost == null)
                throw new Volo.Abp.BusinessException($"Job với ID '{id}' không tồn tại hoặc được xóa.");

            jobPost.Status = JobStatus.Closed;
            await _jobPostRepository.UpdateAsync(jobPost, true);
        }
        public async Task CreateJobPost(JobPostCreateDto dto)
        {
            if (_currentUser.IsAuthenticated == false) throw new AbpAuthorizationException("User is not authenticated");
            var recruiter = await _recruiterRepository.FindAsync(r => r.UserId == _currentUser.GetId());
            var company = await _companyRepository.GetAsync(recruiter.CompanyId);
            if (company == null) throw new BusinessException("Company not found");

            var job = new Job_Post
            {
                CompanyId = company.Id,
                CompanyImageUrl = company.LogoUrl,
                CompanyName = company.CompanyName,
                Benefits = dto.Benefits,
                Description = dto.Description,
                IsDeleted = false,
                PositionType = dto.PositionType,
                EmploymentType = dto.EmploymentType,
                ProvinceCode = dto.ProvinceCode,
                Experience = dto.Experience,
                ExpiresAt = dto.ExpiresAt,
                Quantity = dto.Quantity,
                Requirements = dto.Requirements,
                RiskJobLevel = RiskJobLevel.NonCalculated,
                SalaryMax = dto.SalaryMax,
                SalaryMin = dto.SalaryMin,
                Status = JobStatus.Draft,
                Title = dto.Title,
                RecruiterId = recruiter.UserId,
                Slug = dto.Slug,
                WardCode = dto.WardCode,
                WorkLocation = dto.WorkLocation,
                WorkTime = dto.WorkTime,
                SalaryDeal = dto.SalaryDeal,
                PostedAt = DateTime.Now,
                JobCategoryId = dto.JobCategoryId,
                RecruitmentCampaignId = dto.RecruitmentCampaignId

            };
            await _jobPostRepository.InsertAsync(job, true);
            if (dto.TagIds != null && dto.TagIds.Count > 0) await _jobTagService
                    .AddTagsToJob(new JobTagViewDto.JobTagCreateUpdateDto { JobId = job.Id, TagIds = dto.TagIds });
            await AddDefaultJobPriority(job);
        }
        public Task CreateJobPostByOldPost(JobPostCreateDto dto)
        {
            throw new NotImplementedException();
        }
        public async Task DeleteJobPost(string id)
        {
            var job = await _jobPostRepository.FindAsync(Guid.Parse(id));
            if (job == null || job.Status == JobStatus.Deleted) throw new BusinessException($"Job không tồn tại hoặc được xóa.");
            job.Status = JobStatus.Deleted;
            if (job.Status == JobStatus.Open) throw new BusinessException($"Job trong trang thai Open khong the xóa.");
            await _jobPostRepository.UpdateAsync(job, true);
            await _jobSearchService.RemoveJobFromIndexAsync(job.Id);
        }
        public async Task<List<JobViewDto>> GetJobPostBySatus(int? status, int maxCount = 10) // check been job search cos chuaw
        {
            throw new NotImplementedException();
        }
        public async Task<List<JobViewDto>> GetJobByCompanyId(int companyId, int page = 0, int pageSize = 10)
        {
            var query = await _jobPostRepository.GetQueryableAsync();

            var jobs = await query
                .Where(x => x.CompanyId == companyId )
                .OrderByDescending(x => x.PostedAt)
                .Skip(page * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return ObjectMapper.Map<List<Job_Post>, List<JobViewDto>>(jobs);
        }


        public Task<JobPostStatisticDto> GetJobPostStatistic(string id)
        {
            throw new NotImplementedException();
        }
        public Task UpdateApplyCount(string id)
        {
            throw new NotImplementedException();
        }
        public Task UpdateExpiredJobPost(string id)
        {
            throw new NotImplementedException();
        }
        public async Task UpdateJobPost(JobPostUpdateDto dto)
        {
            var job = await _jobPostRepository.GetAsync(dto.Id);
            if (job == null) throw new Volo.Abp.BusinessException($"job not found");
            if (job.Status == JobStatus.Pending || job.Status == JobStatus.Open || job.Status == JobStatus.Deleted) throw new Volo.Abp.UserFriendlyException($"This job is running or pending or deleted , you can't update now !");

            job.PositionType = dto.PositionType;
            job.ProvinceCode = dto.ProvinceCode;
            job.Quantity = dto.Quantity;
            job.Requirements = dto.Requirements;
            job.Title = dto.Title;
            job.Slug = dto.Slug;
            job.Description = dto.Description;
            job.Benefits = dto.Benefits;
            job.SalaryMax = dto.SalaryMax;
            job.SalaryMin = dto.SalaryMin;
            job.SalaryDeal = dto.SalaryDeal;
            job.EmploymentType = dto.EmploymentType;
            job.Experience = dto.Experience;
            job.WorkTime = dto.WorkTime;
            job.WorkLocation = dto.WorkLocation;
            job.WardCode = dto.WardCode;
            job.ExpiresAt = dto.ExpiresAt;
            job.JobCategoryId = dto.JobCategoryId;
            job.Status = JobStatus.Draft;//khi update phai doi status thanh draf
            await _jobPostRepository.UpdateAsync(job, true);
            await _jobTagService.UpdateTagOfJob(new JobTagViewDto.JobTagCreateUpdateDto { JobId = dto.Id, TagIds = dto.TagIds });

            await _jobSearchService.IndexJobAsync(dto.Id);

        }
        public Task UpDateViewCount(string id)
        {
            throw new NotImplementedException();
        }

        #region helper
        private IQueryable<Job_Post> FilterJob(JobFilterDto dto, IQueryable<Job_Post> jobs)
        {

            if (dto.PriorityLevel != null)
                jobs = jobs.Where(p => p.Job_Priority.PriorityLevel == dto.PriorityLevel);

            if (dto.RecruiterLevel != null)
                jobs = jobs.Where(x => x.RecruiterProfile.RecruiterLevel == dto.RecruiterLevel);

            if (dto.RiskJobLevel != null)
                jobs = jobs.Where(x => x.RiskJobLevel == dto.RiskJobLevel);

            return jobs;
        }

        private async Task<IQueryable<Job_Post>> SortJobNeedApproved()
        {
            IQueryable<Job_Post> jobs = (await _jobPostRepository
                .GetQueryableAsync())
                .Include(job => job.RecruiterProfile)
                .Include(job => job.Job_Priority);

            return jobs
                .OrderByDescending(j => j.RecruiterProfile.RecruiterLevel)
                .ThenByDescending(j => j.ExpiresAt)
                .ThenByDescending(j => j.Job_Priority.PriorityLevel)
                .ThenByDescending(j => j.RiskJobLevel)
                .ThenByDescending(j => j.PostedAt);
        }

        private async Task AddDefaultJobPriority(Job_Post job)
        {
            try
            {
                await _jobPriorityRepository.InsertAsync(new Job_Priority
                {
                    JobId = job.Id,
                    PriorityLevel = JobPriorityLevel.Low,
                    SortScore = 0
                });
            }
            catch (Exception ex)
            {
                throw new BusinessException("Error when create job priority" + ex.Message);
            }


        }

        public Task<List<JobViewDto>> GetJobByRecruiterId(Guid id, int maxCount = 10)
        {
            throw new NotImplementedException();
        }


        #endregion
    }
}
