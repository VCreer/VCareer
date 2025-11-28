using AutoMapper.Internal.Mappers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants.JobConstant;
using VCareer.Dto.Job;
using VCareer.Dto.JobDto;
using Volo.Abp;
using Volo.Abp.Application.Services;

namespace VCareer.IServices.IJobServices
{
    public interface IRecruitmentCompainService :IApplicationService
    {
        public Task<List<RecruimentCampainViewDto>> LoadRecruitmentCompain(bool? isActive);
        public Task CreateRecruitmentCompain(RecruimentCampainCreateDto input);
        //compain dang co job chay thi ko cho close
        public Task SetRecruitmentCompainStatus(Guid compainId, bool? isActive);
        public Task UpdateRecruitmentCompain(RecruimentCampainUpdateDto input);
        public Task<List<RecruimentCampainViewDto>> GetCompainByCompanyId(int companyId, bool? isActive);
        public Task<List<JobViewDetail>> GetJobsByCompainId(Guid compainId);
        public Task<List<RecruimentCampainViewDto>> GetCompainsByRecruiterId(Guid recruiterId, bool? isActive);
        public Task<RecruimentCampainViewDto?> GetCompainById(Guid recruimentId);
    }
}
