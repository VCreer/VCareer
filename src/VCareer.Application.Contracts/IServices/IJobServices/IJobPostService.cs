using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Dto.JobDto;
using Volo.Abp;
using Volo.Abp.Application.Services;

namespace VCareer.IServices.IJobServices
{
    //nhớ đặt anotation tránh tự tạo api dynamic
    public interface IJobPostService : IApplicationService
    {
        public Task CreateJobPost(JobPostCreateDto dto);
        public Task PostJobAsync(PostJobDto dto);
        public Task CreateJobPostByOldPost(JobPostCreateDto dto);
        public Task UpdateJobPost(JobPostUpdateDto dto);
        public Task DeleteJobPost(string id);
        public Task ApproveJobPostAsync(string id);
        public Task RejectJobPostAsync(string id);
        [RemoteService(false)]
        public Task UpDateViewCount(string id);
        [RemoteService(false)]
        public Task UpdateApplyCount(string id);
        [RemoteService(false)]
        public Task UpdateExpiredJobPost(string id);
        Task<List<JobViewWithPriorityDto>> GetJobByRecruiterId(Guid id, int maxCount = 10);
        Task<List<JobViewDto>> GetJobByCompanyId(int id, int maxCount = 10);
        public Task<JobPostStatisticDto> GetJobPostStatistic(string id); //view ,aapply count
        public Task<List<JobApproveViewDto>> ShowJobPostNeedApprove(JobFilterDto dto);
        public Task ExecuteExpiredJobPostAutomatically(string id);


    }
}
