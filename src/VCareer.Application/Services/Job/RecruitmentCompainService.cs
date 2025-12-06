using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using VCareer.Constants.JobConstant;
using VCareer.Dto.Job;
using VCareer.Dto.JobDto;
using VCareer.IRepositories.ICompanyRepository;
using VCareer.IRepositories.Job;
using VCareer.IRepositories.Profile;
using VCareer.IServices.IJobServices;
using VCareer.Models.Job;
using VCareer.Permission;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;
using Volo.Abp.ObjectMapping;
using Volo.Abp.Users;

namespace VCareer.Services.Job
{
    public class RecruitmentCompainService : ApplicationService, IRecruitmentCompainService
    {
        private readonly IRecruitmentCampainRepository _recuirementRepository;
        private readonly IJobPostRepository _jobRepository;
        private readonly ICompanyRepository _companyRepository;
        private readonly ICurrentUser _currentUser;
        private readonly IRecruiterRepository _recruiterRepository;
        private readonly IdentityUserManager _userManager;

        public RecruitmentCompainService(IRecruitmentCampainRepository repository, IJobPostRepository jobPostRepository, ICompanyRepository companyRepository, ICurrentUser currentUser, IRecruiterRepository recruiterRepository, IdentityUserManager uesrManager)
        {
            _recuirementRepository = repository;
            _jobRepository = jobPostRepository;
            _companyRepository = companyRepository;
            _currentUser = currentUser;
            _recruiterRepository = recruiterRepository;
            _userManager = uesrManager;
        }
        [Authorize(VCareerPermission.RecruimentCampaign.LoadRecruiment)]
        public async Task<List<RecruimentCampainViewDto>> LoadRecruitmentCompain(bool? isActive)
        {
            var userId = _currentUser.GetId();
            var recruiter = await _recruiterRepository.GetAsync(x => x.UserId == userId);
            if (recruiter == null) throw new BusinessException("Recruiter not found");

            var user = await _userManager.GetByIdAsync(_currentUser.GetId());
            if (user == null) throw new BusinessException("you are not login");

            var roles = await _userManager.GetRolesAsync(user);
            // Lead Recruiter và HR Staff đều xem được tất cả chiến dịch của công ty
            if (roles.Contains("lead_recruiter") || roles.Contains("hr_staff"))
            {
                var companyId = recruiter.CompanyId;
                if (companyId == null) throw new BusinessException("Company not found");
                return await GetCompainByCompanyId(companyId, isActive);
            }
            return await GetCompainsByRecruiterId(recruiter.Id, isActive);
        }
        [Authorize(VCareerPermission.RecruimentCampaign.Create)]
        public async Task CreateRecruitmentCompain(RecruimentCampainCreateDto input)
        {
            var userId = _currentUser.GetId();
            var recruiter = await _recruiterRepository.GetAsync(x => x.UserId == userId);
            if (recruiter == null) throw new BusinessException("Recruiter not found");
            int? companyId = recruiter.CompanyId;
            if (companyId == null) throw new BusinessException("Company not found");

            var compain = new RecruitmentCampaign()
            {
                CompanyId = companyId ?? 0,  //de cai nay cho do bao loi thoi
                Description = input.Description,
                IsActive = input.IsActive,
                Name = input.Name,
                RecruiterId = recruiter.UserId
            };
            await _recuirementRepository.InsertAsync(compain, true);
        }
        //compain dang co job chay thi ko cho close
        [Authorize(VCareerPermission.RecruimentCampaign.SetStatus)]
        public async Task SetRecruitmentCompainStatus(Guid compainId, bool? isActive)
        {
            var compain = await _recuirementRepository.GetAsync(compainId);
            if (isActive == false && compain.IsActive)
            {
                var jobsActive = await _jobRepository.GetListAsync(x => x.RecruitmentCampaignId == compainId && x.Status == JobStatus.Open);
                if (jobsActive != null) throw new UserFriendlyException("There are jobs in active status in this compain. You cant not close this compain.");
                compain.IsActive = false;
            }
            else
            {
                compain.IsActive = true;
            }
            await _recuirementRepository.UpdateAsync(compain, true);
        }

        [Authorize(VCareerPermission.RecruimentCampaign.Update)]
        public async Task UpdateRecruitmentCompain(RecruimentCampainUpdateDto input)
        {
            var compain = await _recuirementRepository.GetAsync(input.Id);
            if (compain == null) throw new BusinessException("Compain not found");
            compain.Name = input.Name;
            compain.Description= input.Description;
            await _recuirementRepository.UpdateAsync(compain, true);
        }
        [Authorize(VCareerPermission.RecruimentCampaign.LoadRecruiment)]
        public async Task<List<RecruimentCampainViewDto>> GetCompainByCompanyId(int companyId, bool? isActive)
        {
            var company = await _companyRepository.GetAsync(companyId);
            if (company == null) throw new BusinessException("Company not found");
            var campains = await _recuirementRepository.GetListAsync(x => x.CompanyId == companyId);
            if (campains == null) return new List<RecruimentCampainViewDto> { };
            if (isActive != null) campains = campains.Where(x => x.IsActive == isActive).ToList();
            return ObjectMapper.Map<List<RecruitmentCampaign>, List<RecruimentCampainViewDto>>(campains);
        }
        [Authorize(VCareerPermission.RecruimentCampaign.LoadJobOfRecruiment)]
        public async Task<List<JobViewDetail>> GetJobsByCompainId(Guid compainId)
        {
            var campain = await _recuirementRepository.GetAsync(x => x.Id == compainId);
            if (campain == null) throw new BusinessException("Compain not found");
            var jobs = await _jobRepository.GetListAsync(x => x.RecruitmentCampaignId == compainId);
            if (jobs == null) return new List<JobViewDetail>();
            return ObjectMapper.Map<List<Job_Post>, List<JobViewDetail>>(jobs);
        }
        [Authorize(VCareerPermission.RecruimentCampaign.LoadRecruiment)]
        public async Task<List<RecruimentCampainViewDto>> GetCompainsByRecruiterId(Guid recruiterId, bool? isActive)
        {
            var query = await _recuirementRepository.GetQueryableAsync();
            query = query.Where(x => x.RecruiterId == recruiterId);
            if (isActive != null) query = query.Where(x => x.IsActive == isActive);
            var compains = await query.ToListAsync();
            return ObjectMapper.Map<List<RecruitmentCampaign>, List<RecruimentCampainViewDto>>(compains);
        }
        [Authorize(VCareerPermission.RecruimentCampaign.LoadRecruiment)]
        public async Task<RecruimentCampainViewDto?> GetCompainById(Guid recruimentId)
        {
            var campain = await _recuirementRepository.GetAsync(x => x.Id == recruimentId);
            if (campain == null) return null;
            return ObjectMapper.Map<RecruitmentCampaign, RecruimentCampainViewDto>(campain);
        }

    }

}
