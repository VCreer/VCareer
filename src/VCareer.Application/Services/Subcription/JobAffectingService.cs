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
using VCareer.Models.Subcription;
using Volo.Abp;
using Volo.Abp.Application.Services;

namespace VCareer.Services.Subcription
{
    public class JobAffectingService : ApplicationService, IJobAffectingService
    {
        private readonly IJobPostRepository _jobPostRepository;
        private readonly IChildServiceRepository _childServiceRepository;

        public JobAffectingService(IJobPostRepository jobPostRepository, IChildServiceRepository childServiceRepository)
        {
            _jobPostRepository = jobPostRepository;
            _childServiceRepository = childServiceRepository;
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
            if (childService.Target !=SubcriptionContance.ServiceTarget.JobPost) throw new BusinessException("ChildService is not avaiable to Apply service subcription");

                var effectService = new EffectingJobService
                {
                    JobPostId = jobAffectingDto.JobPostId,
                    ChildServiceId = jobAffectingDto.ChildServiceId,
                    StartDate = DateTime.UtcNow,
                };

            throw new NotImplementedException();
        }

        //có thể dùng để tắt dịch vụ khi job hết hạn ..vv
        public Task CancleEffectingJobService(EffectingJobServiceUpdateDto jobAffectingDto)
        {
            throw new NotImplementedException();
        }

        public Task<EffectingJobServiceViewDto> GetEffectingJobService(Guid effectingJobServiceId)
        {
            throw new NotImplementedException();
        }

        public Task<List<EffectingJobServiceViewDto>> GetEffectingJobServices(Guid JobId, SubcriptionContance.ChildServiceStatus status, PagingDto pagingDto)
        {
            throw new NotImplementedException();
        }

        public Task UpdateEffectingJobService(EffectingJobServiceUpdateDto jobAffectingDto)
        {
            throw new NotImplementedException();
        }
    }
}
