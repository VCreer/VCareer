using AutoMapper.Internal.Mappers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Dto.JobDto;
using Volo.Abp;
using Volo.Abp.Application.Services;
using static VCareer.Dto.JobDto.JobTagViewDto;

namespace VCareer.IServices.IJobServices
{
    public interface IJobTagService : IApplicationService
    {
        public Task AddTagsToJob(JobTagCreateUpdateDto dto);
        public Task<List<JobTagViewDto>> GetTagByJobId(Guid jobId);
        public Task<JobTagViewDto> GetTagByTagId(int tagId);
        public Task UpdateTagOfJob(JobTagCreateUpdateDto dto);
    }
}
