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
    public class JobPostingRepository : EfCoreRepository<VCareerDbContext, Job_Posting, Guid>, IJobPostingRepository
    {
        public JobPostingRepository(IDbContextProvider<VCareerDbContext> dbContextProvider) : base(dbContextProvider) { }



        //  base include sẵn các bảng để dùng sau
        private IQueryable<Job_Posting> ApplyIncludes(IQueryable<Job_Posting> query, bool includeDetails)
        {
            if (!includeDetails)
                return query;

            return query
                .Include(j => j.JobCategory)
                .ThenInclude(c => c.Parent)
                .ThenInclude(p => p.Parent)
                .Include(j => j.RecruiterProfile)
                .Include(j => j.JobPostingTags)
                .ThenInclude(jpt => jpt.Tag);
        }



        // queery dùng chung cho mọi job , lấy trang thais mở và chwua hết hạn
        private IQueryable<Job_Posting> BuildActiveJobQuery(IQueryable<Job_Posting> query)
        {
            return query
                .Where(j => j.Status == JobStatus.Open)  // Chỉ lấy job trạng thái Open
                .Where(j => j.ExpiresAt == null || j.ExpiresAt >= DateTime.UtcNow); // Chưa hết hạn
        }




        // lấy job từ luence nhưng vẫn giữ thứ tự
        public async Task<List<Job_Posting>> GetByIdsAsync(List<Guid> ids, bool includeDetails = true)
        {
            if (ids == null || !ids.Any())
                return new List<Job_Posting>();

            var dbContext = await GetDbContextAsync();

            var query = dbContext.JobPostings.Where(j => ids.Contains(j.Id));
            query = ApplyIncludes(query, includeDetails);
            query = BuildActiveJobQuery(query);

            var jobs = await query.ToListAsync();                            // Lấy tất cả job khớp


            var orderedJobs = ids
              .Select(id => jobs.FirstOrDefault(j => j.Id == id))
              .Where(j => j != null)
              .ToList();



            return orderedJobs;
        }



        // lấy job theo slug
        public async Task<Job_Posting> GetBySlugAsync(string slug, bool includeDetails = true)
        {
            if (string.IsNullOrWhiteSpace(slug))
                return null;

            var dbContext = await GetDbContextAsync();
            var query = dbContext.JobPostings
                .Where(j => j.Slug == slug);                                 // Lọc theo slug
            query = ApplyIncludes(query, includeDetails);                    // Thêm includes
            query = BuildActiveJobQuery(query);                              // Filter active

            return await query.FirstOrDefaultAsync();                        // Trả về job đầu tiên
        }



        //lấy job theo 1 id chi tiết
        public async Task<Job_Posting> GetDetailJobAsync(Guid jobId, bool includeDetails = true)
        {
            var dbContext = await GetDbContextAsync();
            var query = dbContext.JobPostings
                .Where(x => x.Id == jobId);                                  // Lọc theo ID
            query = ApplyIncludes(query, includeDetails);                    // Thêm includes
            return await query.FirstOrDefaultAsync();                        // Trả về job
        }



        // lấy job liên quan
        public async Task<List<Job_Posting>> GetRelatedJobsAsync(Guid jobId, int maxCount = 10)
        {
            var dbContext = await GetDbContextAsync();
            var currentJob = await dbContext.JobPostings.FindAsync(jobId);   // Lấy job hiện tại
            if (currentJob == null)
                return new List<Job_Posting>();

            var query = dbContext.JobPostings
                .Where(j => j.Id != jobId)
                .Where(j => j.JobCategoryId == currentJob.JobCategoryId);

            query = ApplyIncludes(query, true);
            query = BuildActiveJobQuery(query);


            return await query
                .OrderByDescending(j => j.PostedAt)                          // Sắp xếp theo ngày đăng
                .Take(maxCount)                                              // Giới hạn số lượng
                .ToListAsync();
        }





        // Giải thích: Lấy job full để index vào Lucene.
        // - Load tất cả chi tiết cần thiết (category, tags, recruiter) để Lucene xử lý.
        public async Task<Job_Posting> GetForIndexingAsync(Guid jobId)
        {
            return await GetDetailJobAsync(jobId, true);                   // Gọi GetDetailJob với includeDetails
        }





    }
}

