using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Model;
using VCareer.Models.Job;
using Volo.Abp.Domain.Repositories;

namespace VCareer.Repositories.Job
{

    public interface IJobPostingRepository : IRepository<Job_Posting, Guid>
    {


        // lấy chi tiết job theo id
        Task<Job_Posting> GetDetailByIdAsync(Guid jobId, bool includeDetails = true);


        // lấy chi tiết 1 job thoe slug
        Task<Job_Posting> GetBySlugAsync(string slug, bool includeDetails = true);


        //lấy danh sách các job theo list id của job trả về từ LUENCE
        Task<List<Job_Posting>> GetByIdsAsync(List<Guid> ids, bool includeDetails = true);


        // lấy full 1 job để index
        Task<Job_Posting> GetForIndexingAsync(Guid jobId);


        // lấy danh sách job liên quan
        Task<List<Job_Posting>> GetRelatedJobsAsync(Guid jobId, int maxCount = 10);





        // đếm số luowngj job theo category
        Task<int> CountActiveJobsByCategoryAsync(Guid categoryId);


        // đếm số lượng job active theo địa điểm
        Task<int> CountActiveJobsByLocationAsync(int provinceId, int? districtId = null);


        /// <summary>
        /// Lấy danh sách jobs theo list IDs (giữ nguyên thứ tự)
        /// Dùng cho Lucene search results
        /// </summary>
        Task<List<Job_Posting>> GetJobsByIdsAsync(List<Guid> jobIds);

        /// <summary>
        /// Lấy tất cả jobs active (cho reindex)
        /// </summary>
        Task<List<Job_Posting>> GetAllActiveJobsAsync();

        /// <summary>
        /// Tăng view count của job
        /// </summary>
        Task IncrementViewCountAsync(Guid jobId);


        // lấy thông itn name company theo id cua job
        Task<string> GetNameComany(Guid job);
    }
}
