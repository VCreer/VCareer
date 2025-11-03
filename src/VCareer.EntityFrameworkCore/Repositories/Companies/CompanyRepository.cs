using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using VCareer.EntityFrameworkCore;
using VCareer.Models.Companies;
using Volo.Abp.Domain.Repositories.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore;

namespace VCareer.Repositories.Companies
{
    /// <summary>
    /// Repository implementation cho Company
    /// </summary>
    public class CompanyRepository : EfCoreRepository<VCareerDbContext, Company, int>, ICompanyRepository
    {
        public CompanyRepository(
            IDbContextProvider<VCareerDbContext> dbContextProvider) : base(dbContextProvider)
        {
        }

        /// <summary>
        /// Lấy thông tin công ty theo Job ID
        /// Query: Job → Recruiter → Company với include CompanyIndustries và Industry
        /// </summary>
        public async Task<Company> GetCompanyByJobIdAsync(Guid jobId)
        {
            var dbContext = await GetDbContextAsync();

            // Query Job -> Recruiter -> Company với include CompanyIndustries và Industry
            var job = await dbContext.JobPostings
                .Where(j => j.Id == jobId)
                .Include(j => j.RecruiterProfile)
                    .ThenInclude(r => r.Company)
                        .ThenInclude(c => c.CompanyIndustries)
                            .ThenInclude(ci => ci.Industry)
                .FirstOrDefaultAsync();

            if (job == null || job.RecruiterProfile == null || job.RecruiterProfile.Company == null)
            {
                return null;
            }

            return job.RecruiterProfile.Company;
        }
    }
}
