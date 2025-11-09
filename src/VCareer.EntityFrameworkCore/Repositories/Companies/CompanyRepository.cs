using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
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

        /// <summary>
        /// Tìm kiếm danh sách công ty với filter và phân trang
        /// Logic query được thực hiện ở đây (Repository layer)
        /// </summary>
        public async Task<(List<Company> Companies, int TotalCount)> SearchCompaniesAsync(
            string keyword = null,
            bool? status = null,
            int skipCount = 0,
            int maxResultCount = 10,
            string sorting = null)
        {
            var dbContext = await GetDbContextAsync();
            var queryable = dbContext.Companies.AsQueryable();

            // Lọc theo status nếu có
            if (status.HasValue)
            {
                queryable = queryable.Where(c => c.Status == status.Value);
            }
            else
            {
                // Mặc định chỉ lấy các công ty active
                queryable = queryable.Where(c => c.Status == true);
            }

            // Tìm kiếm theo keyword (tên công ty) - không phân biệt hoa thường
            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var keywordLower = keyword.Trim().ToLower();
                queryable = queryable.Where(c => c.CompanyName.ToLower().Contains(keywordLower));
            }

            // Đếm tổng số trước khi phân trang
            var totalCount = await queryable.CountAsync();

            // Sắp xếp
            if (!string.IsNullOrWhiteSpace(sorting))
            {
                // Có thể xử lý sorting theo yêu cầu
                // Tạm thời giữ nguyên queryable
            }
            else
            {
                // Mặc định sắp xếp theo CreationTime giảm dần (mới nhất trước)
                queryable = queryable.OrderByDescending(c => c.CreationTime);
            }

            // Phân trang
            var companies = await queryable
                .Skip(skipCount)
                .Take(maxResultCount)
                .ToListAsync();

            return (companies, totalCount);
        }
    }
}
