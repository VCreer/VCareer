using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Dto.Subcriptions;
using VCareer.IServices.Common;
using static VCareer.Constants.JobConstant.SubcriptionContance;

namespace VCareer.IServices.Subcriptions
{
    public interface IJobAffectingService
    {
        public Task ApplyServiceToJob(EffectingJobServiceCreateDto jobAffectingDto);
        public Task UpdateEffectingJobService(EffectingJobServiceUpdateDto jobAffectingDto);
        public Task CancleEffectingJobService(EffectingJobServiceUpdateDto jobAffectingDto);
        public Task<EffectingJobServiceViewDto> GetEffectingJobService(Guid effectingJobServiceId);
        public Task<List<EffectingJobServiceViewDto>> GetEffectingJobServicesWithPaging(Guid JobId, ChildServiceStatus? status, PagingDto pagingDto);
        public Task<List<EffectingJobServiceViewDto>> GetEffectingJobServices(Guid JobId, ChildServiceStatus? status);

    }
}
