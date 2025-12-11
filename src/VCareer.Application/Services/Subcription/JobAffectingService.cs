using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants.JobConstant;
using VCareer.Dto.Subcriptions;
using VCareer.IRepositories.Job;
using VCareer.IRepositories.Subcriptions;
using VCareer.IServices.Common;
using VCareer.IServices.Subcriptions;
using VCareer.Job.JobPosting.ISerices;
using VCareer.Models.Job;
using VCareer.Models.Subcription;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using static VCareer.Constants.JobConstant.SubcriptionContance;

namespace VCareer.Services.Subcription
{
    public class JobAffectingService : ApplicationService, IJobAffectingService
    {
        private readonly IJobPostRepository _jobPostRepository;
        private readonly IJobSearchService _jobSearchService;
        private readonly IChildServiceRepository _childServiceRepository;
        private readonly IEffectingJobServiceRepository _effectingJobServiceRepository;
        private readonly IJobPriorityRepository _jobPriorityRepository;

        public JobAffectingService(
            IJobPostRepository jobPostRepository,
            IChildServiceRepository childServiceRepository,
            IEffectingJobServiceRepository effectingJobServiceRepository,
            IJobSearchService jobSearchService,
            IJobPriorityRepository jobPriorityRepository)
        {
            _jobSearchService = jobSearchService;
            _jobPostRepository = jobPostRepository;
            _childServiceRepository = childServiceRepository;
            _effectingJobServiceRepository = effectingJobServiceRepository;
            _jobPriorityRepository = jobPriorityRepository;
        }
        public async Task ApplyServiceToJob(EffectingJobServiceCreateDto jobAffectingDto)
        {
            //check job
            var job = await _jobPostRepository.FindAsync(x => x.Id == jobAffectingDto.JobPostId);
            if (job == null) throw new BusinessException("Job not found");
            if (job.ExpiresAt < DateTime.Now ||
                job.IsDeleted ||
                job.Status == JobStatus.Closed ||
                job.Status == JobStatus.Expired ||
                job.Status == JobStatus.Rejected
               ) throw new BusinessException("Job is is not avaiable to Apply service subcription");

            //check childserrvice
            var childService = await _childServiceRepository.FindAsync(x => x.Id == jobAffectingDto.ChildServiceId);
            if (childService == null) throw new BusinessException("ChildService not found");
            if (childService.Target != SubcriptionContance.ServiceTarget.JobPost) throw new BusinessException("ChildService is not avaiable to Apply service subcription");
            DateTime? endDate = null;
            if (childService.IsEnable == false) throw new BusinessException("ChildService is not avaiable to Apply service subcription");

            //check truong hop muốn gắn vào job dang open + đã gắn dịch vụ vẫn chua het han
            if (job.Status == JobStatus.Open)
            {
                var jobAffectings = await _effectingJobServiceRepository.GetListAsync(x => x.JobPostId == job.Id && x.Status == SubcriptionContance.ChildServiceStatus.Active);
                foreach (var action in jobAffectings.Select(x => x.Action).ToList())
                    if (childService.Action == action) throw new BusinessException("Job is already have this type of action service, you must wait it expired or cancle it to add more service");
            }

            //tao 1 effectingJobService
            if (!childService.IsLifeTime) endDate = DateTime.Now.AddDays((double)childService.DayDuration);
            var effectService = new EffectingJobService
            {
                User_ChildServiceId = jobAffectingDto.User_ChildServiceId,
                JobPostId = jobAffectingDto.JobPostId,
                ChildServiceId = jobAffectingDto.ChildServiceId,
                StartDate = DateTime.UtcNow,
                Action = childService.Action,
                Status = SubcriptionContance.ChildServiceStatus.Active,
                Target = childService.Target,
                Value = childService.Value,
                PriorityLevel = childService.Priority,
                EndDate = endDate,
            };
            await _effectingJobServiceRepository.InsertAsync(effectService);

            if (childService.Target == ServiceTarget.JobPost && childService.Action == ServiceAction.BoostScoreJob)
                await AddJobBoostLogic(job, effectService);
            //co the them logic xu ly cac job voi target =job voi action khac
        }

        private async Task AddJobBoostLogic(Job_Post job, EffectingJobService effectService)
        {
            var priority = await _jobPriorityRepository.FirstAsync(x => x.JobId == job.Id);
            if (priority == null) throw new BusinessException("Job_Priority not found");
            if (effectService.PriorityLevel != null)
            {
                if (effectService.PriorityLevel > priority.PriorityLevel) priority.PriorityLevel = effectService.PriorityLevel ?? priority.PriorityLevel;
            }
            if (effectService.Value != null) priority.SortScore += (float)effectService.Value;
            await _jobPriorityRepository.UpdateAsync(priority);
            await _jobSearchService.IndexJobAsync(job.Id);
        }
        private async Task RemoveJobBoostLogic(EffectingJobService effectService)
        {
            var priority = await _jobPriorityRepository.FirstAsync(x => x.JobId == effectService.JobPostId);
            if (priority == null) throw new BusinessException("Job_Priority not found");

            priority.PriorityLevel = JobPriorityLevel.Low;
            if (effectService.Value != null) priority.SortScore -= (float)effectService.Value;
            if (priority.SortScore < 0) priority.SortScore = 0;
            await _jobPriorityRepository.UpdateAsync(priority);
            await _jobSearchService.IndexJobAsync(effectService.JobPostId);
        }

        //chay job background de cap nhat thoi gian het han cuar effectingJobService
        public async Task UpdateExpiredEffectingJobServiceBackgroundJob()
        {
            var expiredJobEffectings = await _effectingJobServiceRepository.GetListAsync(x => x.EndDate < DateTime.Now && x.Status == SubcriptionContance.ChildServiceStatus.Active);
            if (expiredJobEffectings == null || expiredJobEffectings.Count == 0) return;
            foreach (var expiredJobEffecting in expiredJobEffectings)
            {
                expiredJobEffecting.Status = SubcriptionContance.ChildServiceStatus.Inactive;
                await RemoveJobBoostLogic(expiredJobEffecting);
            }
        }

        public async Task DeactiveAllEffectingJobByJobID(Guid JobId)
        {
            var jobAffectings = await _effectingJobServiceRepository.GetListAsync(x => x.JobPostId == JobId && x.Status == SubcriptionContance.ChildServiceStatus.Active);
            if(jobAffectings == null || jobAffectings.Count == 0) return;
            foreach (var jobAffecting in jobAffectings)
            {
                jobAffecting.Status = SubcriptionContance.ChildServiceStatus.Inactive;
                await RemoveJobBoostLogic(jobAffecting);
            }
            await _effectingJobServiceRepository.UpdateManyAsync(jobAffectings);
        }
        public async Task DeactiveAllEffectingJobByChildServiceId(Guid childServiceId)
        {
            var jobAffectings = await _effectingJobServiceRepository.GetListAsync(x => x.ChildServiceId == childServiceId && x.Status == SubcriptionContance.ChildServiceStatus.Active);
            if(jobAffectings == null || jobAffectings.Count == 0) return;
            foreach (var jobAffecting in jobAffectings)
            {
                jobAffecting.Status = SubcriptionContance.ChildServiceStatus.Inactive;
                await RemoveJobBoostLogic(jobAffecting);
            }
            await _effectingJobServiceRepository.UpdateManyAsync(jobAffectings);

        }
        public async Task CancleEffectingJobService(EffectingJobServiceUpdateDto jobAffectingDto)
        {
            var effectService = await _effectingJobServiceRepository.FindAsync(x => x.Id == jobAffectingDto.EffectingJobServiceId);
            if (effectService == null) throw new BusinessException("EffectingJobService not found");
            if (effectService.Status != SubcriptionContance.ChildServiceStatus.Active) throw new BusinessException("EffectingJobService already inactive");

            effectService.Status = SubcriptionContance.ChildServiceStatus.Inactive;
            await _effectingJobServiceRepository.UpdateAsync(effectService);
        }

        public async Task<EffectingJobServiceViewDto> GetEffectingJobService(Guid effectingJobServiceId)
        {
            var effectService = await _effectingJobServiceRepository.FindAsync(x => x.Id == effectingJobServiceId);
            if (effectService == null) throw new BusinessException("EffectingJobService not found");

            return ObjectMapper.Map<EffectingJobService, EffectingJobServiceViewDto>(effectService);
        }

        public async Task<List<EffectingJobServiceViewDto>> GetEffectingJobServicesWithPaging(Guid jobId, int? status, PagingDto pagingDto)
        {
            var query = await _effectingJobServiceRepository.GetQueryableAsync();
            query = query.Where(x => x.JobPostId == jobId);

            if (status.HasValue)
            {
                if (Enum.IsDefined(typeof(ChildServiceStatus), status.Value))
                {
                    var parsedStatus = (ChildServiceStatus)status.Value;
                    query = query.Where(x => x.Status == parsedStatus);
                }
            }

            var result = await query
                .Skip(pagingDto.PageIndex * pagingDto.PageSize)
                .Take(pagingDto.PageSize)
                .ToListAsync();

            return ObjectMapper.Map<List<EffectingJobService>, List<EffectingJobServiceViewDto>>(result);
        }
        public async Task<List<EffectingJobServiceViewDto>> GetEffectingJobServices(Guid JobId, int? status)
        {
            var query = await _effectingJobServiceRepository.GetQueryableAsync();
            query = query.Where(x => x.JobPostId == JobId);

            if (status.HasValue)
            {
                if (Enum.IsDefined(typeof(ChildServiceStatus), status.Value)) ;
                var parsedStatus = (ChildServiceStatus)status.Value;
                query = query.Where(x => x.Status == parsedStatus);
            }
            var result = await query.ToListAsync();
            return ObjectMapper.Map<List<EffectingJobService>, List<EffectingJobServiceViewDto>>(result);
        }

        public async Task UpdateEffectingJobService(EffectingJobServiceUpdateDto jobAffectingDto)
        {
            var effectService = await _effectingJobServiceRepository.FindAsync(x => x.Id == jobAffectingDto.EffectingJobServiceId);
            if (effectService == null) throw new BusinessException("EffectingJobService not found");

            effectService.EndDate = jobAffectingDto.EndDate;
            effectService.Status = jobAffectingDto.Status;
            await _effectingJobServiceRepository.UpdateAsync(effectService);

        }
    }
}
