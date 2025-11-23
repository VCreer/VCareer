using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants.JobConstant;
using VCareer.Dto.Subcriptions;
using VCareer.IServices.Common;
using VCareer.IServices.Subcriptions;
using VCareer.Models.Subcription;
using Volo.Abp.Application.Services;

namespace VCareer.Services.Subcription
{
    public class JobAffectingService : ApplicationService, IJobAffectingService
    {
        public Task ApplyServiceToJob(EffectingJobServiceCreateDto jobAffectingDto)
        {
            //check job
            //check childserrvice
            var effectService = new EffectingJobService
            {
                JobPostId = jobAffectingDto.JobPostId,
                ChildServiceId = jobAffectingDto.ChildServiceId,
                StartDate = DateTime.UtcNow,
            };

            throw new NotImplementedException();
        }

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
