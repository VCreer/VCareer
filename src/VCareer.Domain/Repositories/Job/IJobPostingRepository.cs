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




        // Giải thích: Lấy danh sách job theo list IDs từ Lucene.
        // - Kiểm tra nếu list rỗng thì trả về list rỗng.
        // - Sử dụng ApplyIncludes để load chi tiết nếu cần.
        // - Giữ thứ tự của IDs (từ Lucene đã sort theo relevance/date/salary).
        Task<List<Job_Posting>> GetByIdsAsync(List<Guid> ids, bool includeDetails = true);



        // tìm kiếm job thoe slug
        Task<Job_Posting> GetBySlugAsync(string slug, bool includeDetails = true);




        // Giải thích: Lấy chi tiết job theo ID.
        // - Load full chi tiết (category, recruiter, tags) nếu includeDetails = true.
        Task<Job_Posting> GetDetailJobAsync(Guid jobId, bool includeDetails = true);



        // lấy job liên quan
        Task<List<Job_Posting>> GetRelatedJobsAsync(Guid jobId, int maxCount = 10);




        // Giải thích: Lấy job full để index vào Lucene.
        // - Load tất cả chi tiết cần thiết (category, tags, recruiter) để Lucene xử lý.
        Task<Job_Posting> GetForIndexingAsync(Guid jobId);





















    }
}
