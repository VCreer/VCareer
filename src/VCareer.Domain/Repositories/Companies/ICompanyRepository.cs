using System;
using System.Threading.Tasks;
using VCareer.Models.Companies;
using Volo.Abp.Domain.Repositories;

namespace VCareer.Repositories.Companies
{
    /// <summary>
    /// Repository interface cho Company
    /// </summary>
    public interface ICompanyRepository : IRepository<Company, int>
    {
        /// <summary>
        /// Lấy thông tin công ty theo Job ID (để hiển thị trong trang job detail)
        /// Bao gồm cả thông tin CompanyIndustries và Industry
        /// </summary>
        /// <param name="jobId">Job ID</param>
        /// <returns>Company với CompanyIndustries và Industry đã được load</returns>
        Task<Company> GetCompanyByJobIdAsync(Guid jobId);
    }
}

