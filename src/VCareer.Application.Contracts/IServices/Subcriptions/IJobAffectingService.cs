using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants.JobConstant;
using VCareer.Dto.Subcriptions;
using VCareer.IServices.Common;
using static VCareer.Constants.JobConstant.SubcriptionContance;
using static VCareer.Permission.VCareerPermission;

namespace VCareer.IServices.Subcriptions
{
    public interface IJobAffectingService
    {
        public Task ApplyServiceToJob(EffectingJobServiceCreateDto jobAffectingDto);
        public Task UpdateEffectingJobService(EffectingJobServiceUpdateDto jobAffectingDto);
        public Task CancleEffectingJobService(EffectingJobServiceUpdateDto jobAffectingDto);
        public Task<EffectingJobServiceViewDto> GetEffectingJobService(Guid effectingJobServiceId);
        public Task<List<EffectingJobServiceViewDto>> GetEffectingJobServicesWithPaging(Guid JobId, int? status, PagingDto pagingDto);
        public Task<List<EffectingJobServiceViewDto>> GetEffectingJobServices(Guid JobId, int? status);
        public Task DeactiveAllEffectingJobByJobID(Guid JobId);
        public Task DeactiveAllEffectingJobByChildServiceId(Guid childServiceId);
        public Task UpdateExpiredEffectingJobServiceBackgroundJob();
        public Task AddJobBoostLogic(Guid jobid, Guid jobEffectingIdS);
         }
}
