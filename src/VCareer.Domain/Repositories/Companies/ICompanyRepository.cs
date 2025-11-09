using System;
using System.Collections.Generic;
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

        /// <summary>
        /// Tìm kiếm danh sách công ty với filter và phân trang
        /// </summary>
        /// <param name="keyword">Keyword để tìm kiếm theo tên công ty (không phân biệt hoa thường)</param>
        /// <param name="status">Lọc theo status (true = active, false = inactive, null = all)</param>
        /// <param name="skipCount">Số bản ghi bỏ qua</param>
        /// <param name="maxResultCount">Số bản ghi tối đa</param>
        /// <param name="sorting">Chuỗi sắp xếp (ví dụ: "CreationTime DESC")</param>
        /// <returns>Tuple chứa danh sách companies và totalCount</returns>
        Task<(List<Company> Companies, int TotalCount)> SearchCompaniesAsync(
            string keyword = null,
            bool? status = null,
            int skipCount = 0,
            int maxResultCount = 10,
            string sorting = null);
    }
}

