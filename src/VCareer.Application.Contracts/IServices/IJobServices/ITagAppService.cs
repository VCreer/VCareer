using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Volo.Abp.Application.Services;

namespace VCareer.Job.JobPosting.ISerices
{
    public interface ITagAppService : IApplicationService
    {
        //Task<TagDto> CreateOrGetTagAsync(string name); // Để add khi create job.
        //Task<List<TagDto>> GetPopularTagsAsync(int topN);
    }
}
