using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.EntityFrameworkCore;
using VCareer.Model;
using VCareer.Models.Job;
using Volo.Abp.Domain.Repositories.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore;

namespace VCareer.Repositories.Job
{
    /// <summary>
    /// Repository implementation cho Job Posting
    /// Xử lý filter, search, pagination cho job
    /// </summary>
    public class JobPostingRepository : EfCoreRepository<VCareerDbContext, Job_Posting, Guid>, IJobPostingRepository
    {
        private readonly IJobCategoryRepository _jobCategoryRepository;
        private readonly ILocationRepository _locationRepository;


        public JobPostingRepository(
            IDbContextProvider<VCareerDbContext> dbContextProvider,
            IJobCategoryRepository jobCategoryRepository,
            ILocationRepository locationRepository) : base(dbContextProvider)
        {
            _jobCategoryRepository = jobCategoryRepository;
            _locationRepository = locationRepository;
        }


        // base để include các bảng liên quan
        private IQueryable<Job_Posting> ApplyIncludes(IQueryable<Job_Posting> query, bool includeDetails)
        {
            if (!includeDetails)
                return query;

            return query
                // Load category với parent categories (để hiển thị breadcrumb)
                .Include(j => j.JobCategory)
                .ThenInclude(c => c.Parent)
                .ThenInclude(p => p.Parent)
                // Load recruiter với company info
                .Include(j => j.RecruiterProfile)
                    .ThenInclude(r => r.Company)
                // Load tags
                .Include(j => j.JobPostingTags)
                .ThenInclude(jpt => jpt.Tag);
        }


        // build query chung dùng để tìm job : chưa hết hạn và open, chưa delete
        private IQueryable<Job_Posting> BuildActiveJobQuery(IQueryable<Job_Posting> query)
        {
            return query
                .Where(j => j.Status == JobStatus.Open)                          // Chỉ job đang mở
                .Where(j => !j.IsDeleted)                                        // Chưa bị soft delete
                .Where(j => j.ExpiresAt == null || j.ExpiresAt >= DateTime.UtcNow); // Chưa hết hạn
        }



        // search
        private IQueryable<Job_Posting> ApplySorting(IQueryable<Job_Posting> query, string sortBy)
        {
            return sortBy?.ToLower() switch
            {
                "salary" => query
                    .OrderByDescending(j => j.SalaryMax ?? 0)                    // Lương cao → thấp (ưu tiên SalaryMax)
                    .ThenByDescending(j => j.CreationTime),                      // Nếu lương bằng nhau, ưu tiên mới hơn

                "urgent" => query
                    .OrderByDescending(j => j.IsUrgent)                          // Job tuyển gấp lên đầu
                    .ThenByDescending(j => j.CreationTime),                      // Sau đó sort theo ngày tạo

                "updated" => query
                    .OrderByDescending(j => j.LastModificationTime ?? j.CreationTime), // Mới cập nhật lên đầu

                _ => query                                                       // Default: theo thứ tự ngày tạo
                    .OrderByDescending(j => j.CreationTime)
            };
        }


        // lấy chi tiết 1 job thoe id
        public async Task<Job_Posting> GetDetailByIdAsync(Guid jobId, bool includeDetails = true)
        {
            var dbContext = await GetDbContextAsync();

            var query = dbContext.JobPostings
                .Where(j => j.Id == jobId);                                      // Filter theo ID

            query = ApplyIncludes(query, includeDetails);                        // Load navigation properties

            return await query.FirstOrDefaultAsync();                            // Không filter active vì admin cần xem cả job đã đóng
        }


        // lấy job thoe slug
        public async Task<Job_Posting> GetBySlugAsync(string slug, bool includeDetails = true)
        {
            if (string.IsNullOrWhiteSpace(slug))
                return null;

            var dbContext = await GetDbContextAsync();

            var query = dbContext.JobPostings
                .Where(j => j.Slug == slug);                                     // Filter theo slug

            query = ApplyIncludes(query, includeDetails);                        // Load chi tiết
            query = BuildActiveJobQuery(query);                                  // Chỉ lấy active jobs

            return await query.FirstOrDefaultAsync();
        }


        // laayus danh sách guid từ LUCENE và convert sang list posting , giữu nguyên thứ tự 
        public async Task<List<Job_Posting>> GetByIdsAsync(List<Guid> ids, bool includeDetails = true)
        {
            if (ids == null || !ids.Any())
                return new List<Job_Posting>();

            var dbContext = await GetDbContextAsync();

            // Build query với filter IDs
            var query = dbContext.JobPostings
                .Where(j => ids.Contains(j.Id));                                 // Lấy jobs có ID trong list

            query = ApplyIncludes(query, includeDetails);                        // Load chi tiết
            query = BuildActiveJobQuery(query);                                  // Chỉ active jobs

            var jobs = await query.ToListAsync();                                // Execute query

            // ⚠️ QUAN TRỌNG: Sắp xếp lại theo thứ tự IDs từ Lucene
            // Lucene đã sort theo relevance, phải giữ nguyên thứ tự này!
            var orderedJobs = ids
                .Select(id => jobs.FirstOrDefault(j => j.Id == id))              // Map theo thứ tự IDs
                .Where(j => j != null)                                           // Loại bỏ null (job không tồn tại/không active)
              .ToList();

            return orderedJobs;
        }



        // llaasy full 1 job để indeex
        public async Task<Job_Posting> GetForIndexingAsync(Guid jobId)
        {
            var dbContext = await GetDbContextAsync();

            var query = dbContext.JobPostings
                .Where(j => j.Id == jobId)
                // Load đầy đủ để index
                .Include(j => j.JobCategory)
                    .ThenInclude(c => c.Parent)
                    .ThenInclude(p => p.Parent)
                .Include(j => j.RecruiterProfile)
                    .ThenInclude(r => r.Company)
                .Include(j => j.JobPostingTags)
                    .ThenInclude(jpt => jpt.Tag);

            return await query.FirstOrDefaultAsync();                            // Lấy tất cả job (kể cả inactive) để index
        }



        // job liên quan
        public async Task<List<Job_Posting>> GetRelatedJobsAsync(Guid jobId, int maxCount = 10)
        {
            var dbContext = await GetDbContextAsync();

            // Lấy thông tin job hiện tại
            var currentJob = await dbContext.JobPostings
                .Where(j => j.Id == jobId)
                .Select(j => new { j.JobCategoryId, j.ProvinceId, j.DistrictId })              // category và province và district
                .FirstOrDefaultAsync();

            if (currentJob == null)
                return new List<Job_Posting>();

            // Build query job liên quan
            var query = dbContext.JobPostings
                .Where(j => j.Id != jobId)                                       // Loại trừ job hiện tại
                .Where(j => j.JobCategoryId == currentJob.JobCategoryId          // Cùng category
                         || j.ProvinceId == currentJob.ProvinceId
                         || j.DistrictId == currentJob.DistrictId);    // HOẶC cùng province

            query = BuildActiveJobQuery(query);                                  // Chỉ active jobs
            query = ApplyIncludes(query, true);                                  // Load chi tiết

            // ========================================
            // SẮP XẾP ƯU TIÊN theo điểm relevance:
            // ========================================
            // Điểm tối đa = 4 (cùng category + province + district)
            // - Cùng category: +2 điểm
            // - Cùng province: +1 điểm  
            // - Cùng district (khi cùng province): +1 điểm
            var relatedJobs = await query
                .OrderByDescending(j =>
                    (j.JobCategoryId == currentJob.JobCategoryId ? 2 : 0) +      // +2: Cùng category
                    (j.ProvinceId == currentJob.ProvinceId ? 1 : 0) +            // +1: Cùng province
                    (j.DistrictId == currentJob.DistrictId &&
                     j.ProvinceId == currentJob.ProvinceId ? 1 : 0))            // +1: Cùng district (chỉ khi cùng province)
                .ThenByDescending(j => j.IsUrgent)                               // Ưu tiên job tuyển gấp
                .ThenByDescending(j => j.CreationTime)                           // Sort theo ngày mới nhất
                .Take(maxCount)                                                  // Giới hạn số lượng
                .ToListAsync();

            return relatedJobs;
        }



        // đếm sô lượng job thoe category
        public async Task<int> CountActiveJobsByCategoryAsync(Guid categoryId)
        {
            var dbContext = await GetDbContextAsync();

            var query = dbContext.JobPostings
                .Where(j => j.JobCategoryId == categoryId);                      // Filter theo category

            query = BuildActiveJobQuery(query);                                  // Chỉ active jobs

            return await query.CountAsync();                                     // Count
        }


        // đếm số lượng job theo địa điểm
        public async Task<int> CountActiveJobsByLocationAsync(int provinceId, int? districtId = null)
        {
            var dbContext = await GetDbContextAsync();

            var query = dbContext.JobPostings
                .Where(j => j.ProvinceId == provinceId);                         // Filter theo province

            if (districtId.HasValue)
            {
                query = query.Where(j => j.DistrictId == districtId.Value);      // Filter thêm theo district nếu có
            }

            query = BuildActiveJobQuery(query);                                  // Chỉ active jobs

            return await query.CountAsync();                                     // Count
        }



        #region Additional Methods

        /// <summary>
        /// Lấy danh sách jobs theo list IDs (giữ nguyên thứ tự từ Lucene)
        /// </summary>
        public async Task<List<Job_Posting>> GetJobsByIdsAsync(List<Guid> jobIds)
        {
            if (!jobIds.Any())
                return new List<Job_Posting>();

            var dbContext = await GetDbContextAsync();

            // Load jobs từ DB
            var query = dbContext.JobPostings
                .Where(j => jobIds.Contains(j.Id));

            query = ApplyIncludes(query, true);                                  // Include related data

            var jobs = await query.ToListAsync();

            // Sort theo thứ tự của jobIds (giữ nguyên Lucene ranking)
            var orderedJobs = jobIds
                .Select(id => jobs.FirstOrDefault(j => j.Id == id))
                .Where(j => j != null)
                .ToList();

            return orderedJobs;
        }


        /// <summary>
        /// Lấy tất cả jobs active (cho reindex Lucene)
        /// </summary>
        public async Task<List<Job_Posting>> GetAllActiveJobsAsync()
        {
            var dbContext = await GetDbContextAsync();

            var query = dbContext.JobPostings.AsQueryable();
            query = BuildActiveJobQuery(query);                                  // Chỉ active jobs
            query = ApplyIncludes(query, true);                                  // Include related data

            return await query.ToListAsync();
        }

        /// <summary>
        /// Tăng view count của job (atomic operation)
        /// </summary>
        public async Task IncrementViewCountAsync(Guid jobId)
        {
            var dbContext = await GetDbContextAsync();

            // Tìm job theo Id
            var job = await dbContext.JobPostings
                .FirstOrDefaultAsync(j => j.Id == jobId);

            if (job == null)
            {
                // Không tìm thấy job → có thể log hoặc bỏ qua
                return;
            }

            // Tăng ViewCount
            job.ViewCount += 1;

            // Cập nhật database
            await dbContext.SaveChangesAsync();


        }

        public async Task<string> GetNameComany(Guid job)
        {
            var dbContext = await GetDbContextAsync();
            var recruiter = await dbContext.RecruiterProfiles.FirstOrDefaultAsync(x => x.JobPostings.Any(z=>z.Id == job));
            var company = await dbContext.Companies.FirstOrDefaultAsync(x => x.Id == recruiter.CompanyId);
            return company.CompanyName;
        }

        #endregion

        
    }
}
