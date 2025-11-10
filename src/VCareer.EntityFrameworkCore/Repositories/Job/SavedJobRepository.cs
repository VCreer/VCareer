using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VCareer.EntityFrameworkCore;
using VCareer.Models.Job;
using Volo.Abp.Domain.Repositories.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore;

namespace VCareer.Repositories.Job
{
    /// <summary>
    /// Repository implementation cho SavedJob
    /// </summary>
 /*   public class SavedJobRepository : EfCoreRepository<VCareerDbContext, SavedJob>, ISavedJobRepository
    {
        public SavedJobRepository(
            IDbContextProvider<VCareerDbContext> dbContextProvider) : base(dbContextProvider)
        {
        }

        /// <summary>
        /// Lấy danh sách SavedJob của một candidate với JobPosting đã được Include
        /// </summary>
        public async Task<List<SavedJob>> GetSavedJobsWithDetailsAsync(Guid candidateId, int skipCount = 0, int maxResultCount = 20)
        {
            var dbContext = await GetDbContextAsync();

            return await dbContext.SavedJobs
                .Where(s => s.CandidateId == candidateId)
                .Include(s => s.JobPosting)
                    .ThenInclude(j => j.RecruiterProfile)
                        .ThenInclude(r => r.Company)
                .Include(s => s.JobPosting)
                    .ThenInclude(j => j.ProvinceCode)
                .OrderByDescending(s => s.CreationTime)
                .Skip(skipCount)
                .Take(maxResultCount)
                .ToListAsync();
        }

        /// <summary>
        /// Đếm số lượng SavedJob của một candidate
        /// </summary>
        public async Task<int> CountSavedJobsAsync(Guid candidateId)
        {
            var dbContext = await GetDbContextAsync();

            return await dbContext.SavedJobs
                .Where(s => s.CandidateId == candidateId)
                .CountAsync();
        }
    }*/
}

