using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Dto.JobDto;
using VCareer.Models.Job;

namespace VCareer.Services.LuceneService.JobSearch
{
    public interface ILuceneJobIndexer
    {
        //dùng để index 1 job , gọi khi update hoặc tạo job mới
        Task UpsertJobAsync(Job_Post job);

        // dùng để index nhiều job cùng lúc
        Task IndexMultipleJobsAsync(List<Job_Post> jobs);

        //xóa job khỏi index bằng id của job  dùng khi xóa job , hoặc là is actie job đó
        Task DeleteJobFromIndexAsync(Guid jobId);
        Task DeleteJobsFromIndexAsync(List<Guid> jobId);

        //xóa hết index
        Task ClearIndexAsync();
        
        //tìm kiếm job theo input , trả về list các id của job
        Task<List<Guid>> SearchJobIdsAsync(JobSearchInputDto searchInput);
        
        /// <summary>
        /// Tìm kiếm jobs theo category ID (bao gồm tất cả subcategories)
        /// </summary>
        /// <param name="categoryId">ID của category cha</param>
        /// <param name="input">JobSearchInputDto với các filter khác (nếu có)</param>
        /// <returns>Danh sách Job IDs</returns>
        Task<List<Guid>> SearchJobIdsByCategoryIdAsync(Guid categoryId, JobSearchInputDto input = null);
        
        List<Guid> GetExpiredJobIds();
    }
}
