using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Dto.Job;
using VCareer.Models.Job;

namespace VCareer.Job.Search
{
    public interface ILuceneJobIndexer
    {
        //dùng để index 1 job , gọi khi update hoặc tạo job mới
        Task IndexJobAsync(Job_Posting job);

        // dùng để index nhiều job cùng lúc
        Task IndexMultipleJobsAsync(List<Job_Posting> jobs);

        //xóa job khỏi index bằng id của job  dùng khi xóa job , hoặc là is actie job đó
        Task DeleteJobFromIndexAsync(Guid jobId);

        //xóa hết index
        Task ClearIndexAsync();
        
        //tìm kiếm job theo input , trả về list các id của job
        Task<List<Guid>> SearchJobIdsAsync(JobSearchInputDto searchInput);
    }
}
