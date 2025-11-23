using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using VCareer.Constants.JobConstant;
using VCareer.Dto.JobDto;
using VCareer.IRepositories.Category;
using VCareer.IRepositories.ICompanyRepository;
using VCareer.IRepositories.Job;
using VCareer.IRepositories.Profile;
using VCareer.IServices.IGeoServices;
using VCareer.IServices.IJobServices;
using VCareer.Job.JobPosting.ISerices;
using VCareer.Models.Job;
using VCareer.Models.Users;
using VCareer.Services.Geo;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Authorization;
using Volo.Abp.Identity;
using Volo.Abp.Uow;
using Volo.Abp.Users;

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


        public JobPostService(IJobPostRepository repository, IJobSearchService jobSearchService, IJobPriorityRepository jobPriorityRepository, ICompanyRepository companyRepository, ICurrentUser currentUser, IIdentityUserRepository identityUserRepository, IRecruiterRepository recruiterRepository, IGeoService geoService, IJobCategoryRepository jobCategoryRepository)
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
        }

        public async Task ApproveJobPostAsync(string id)
        {
            var jobPost = await _jobPostRepository.GetAsync(Guid.Parse(id));
            if (jobPost == null)
                throw new Volo.Abp.BusinessException($"Job với ID '{id}' không tồn tại hoặc được xóa.");

            jobPost.Status = JobStatus.Open;
            jobPost.ApprovedBy = CurrentUser.Id;
            jobPost.ApproveAt = DateTime.Now;
            await _jobPostRepository.UpdateAsync(jobPost, true);

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
        public Task PostJobAsync(PostJobDto dto)
        {
            throw new NotImplementedException();
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

            };

            await _jobPostRepository.InsertAsync(job);
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
        }
        public async Task<List<JobViewDto>> GetJobPostBySatus(JobStatus status, int maxCount = 10) // check been job search cos chuaw
        {
            throw new NotImplementedException();
        }
        public Task<List<JobViewDto>> GetJobByCompanyId(int companyId, int maxCount = 10)
        {
            throw new NotImplementedException();
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
        public Task UpdateJobPost(JobPostUpdateDto dto)
        {
            throw new NotImplementedException();
        }
        public Task UpDateViewCount(string id)
        {
            throw new NotImplementedException();
        }

        #region helper
        private IQueryable<Job_Post> FilterJob(JobFilterDto dto, IQueryable<Job_Post> jobs)
        {

            if (dto.PriorityLevel != null)
                jobs = jobs.Where(p => p.Job_Priority.PriorityLevel== dto.PriorityLevel);

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
                .ThenByDescending(j => j.Job_Priority.PriorityLevel )
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
