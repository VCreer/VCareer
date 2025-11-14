using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using VCareer.Constants.JobConstant;
using VCareer.Dto.JobDto;
using VCareer.IRepositories.ICompanyRepository;
using VCareer.IRepositories.Job;
using VCareer.IRepositories.Profile;
using VCareer.IServices.IJobServices;
using VCareer.Job.JobPosting.ISerices;
using VCareer.Models.Job;
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


        public JobPostService(IJobPostRepository repository, IJobSearchService jobSearchService, IJobPriorityRepository jobPriorityRepository, ICompanyRepository companyRepository, ICurrentUser currentUser, IIdentityUserRepository identityUserRepository, IRecruiterRepository recruiterRepository)
        {
            _jobPostRepository = repository;
            _jobSearchService = jobSearchService;
            _jobPriorityRepository = jobPriorityRepository;
            _companyRepository = companyRepository;
            _currentUser = currentUser;
            _identityUserRepository = identityUserRepository;
            _recruiterRepository = recruiterRepository;
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

        public async Task<List<JobApproveViewDto>> ShowJobPostNeedApprove()
        {
            var jobs = await _jobPostRepository.GetListAsync(x => x.Status == JobStatus.Draft);
            List<JobApproveViewDto> listJob = new List<JobApproveViewDto>();
            foreach (var job in jobs)
            {
                await AutomationCheckJobPost(job);
                listJob.Add(new JobApproveViewDto()
                {
                    CompanyImageUrl = job.CompanyImageUrl,
                    CompanyName = job.CompanyName,
                    CompanyId = job.CompanyId,
                    ExpiresAt = job.ExpiresAt,
                    ProvinceCode = job.ProvinceCode,
                    Title = job.Title,
                    RiskJobLevel = job.RiskJobLevel
                });
            }
            return listJob;
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
            var recruiter = await _recruiterRepository.FindAsync(r=>r.UserId == _currentUser.GetId());
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
                DistrictCode = dto.DistrictCode,
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
                RecruiterId = recruiter.Id,
                Slug = dto.Slug,
                WardCode = dto.WardCode,
                WorkLocation = dto.WorkLocation,
                WorkTime = dto.WorkTime,
                CreatorId = _currentUser.GetId(),
                SalaryDeal = dto.SalaryDeal,
                PostedAt = DateTime.Now,
                JobCategoryId = dto.JobCategoryId,
                //        ExperienceText = dto.ExperienceText,

            };

            if (recruiter.RecruiterLevel == RecruiterLevel.Premium) job.Status = JobStatus.Open;

            await _jobPostRepository.InsertAsync(job, true);
        }
        public Task CreateJobPostByOldPost(JobPostCreateDto dto)
        {
            throw new NotImplementedException();
        }
        public async Task DeleteJobPost(string id)
        {
            var job = await _jobPostRepository.FindAsync(Guid.Parse(id));
            if (job == null || job.Status == JobStatus.Deleted) throw new BusinessException($"Job với ID '{id}' không tồn tại hoặc được xóa.");
            job.Status = JobStatus.Deleted;
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
        public Task<List<JobViewWithPriorityDto>> GetJobByRecruiterId(Guid id, int maxCount = 10)
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

    }
}
