using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using VCareer.Models.Job;
using Volo.Abp.Domain.Repositories;

namespace VCareer.Repositories.Job
{
    /// <summary>
    /// Repository interface cho Province (Tỉnh/Thành phố) và District (Quận/Huyện)
    /// Sử dụng cho: 
    /// - Lấy danh sách provinces/districts cho home page
    /// - Validate provinceId và districtId từ FE
    /// </summary>
    public interface ILocationRepository : IRepository<Province, int>
    {
        /// <summary>
        /// Lấy tất cả tỉnh/thành phố kèm danh sách quận/huyện (cho home page)
        /// </summary>
        Task<List<Province>> GetFullProvincesAsync();

        /// <summary>
        /// Tìm kiếm tỉnh/thành phố theo tên (không search district)
        /// </summary>
        Task<List<Province>> SearchProvincesAsync(string searchTerm);

        ///// <summary>
        ///// Lấy province theo ID (để validate provinceId từ FE)
        ///// </summary>
        //Task<Province?> GetProvinceByIdAsync(int provinceId);

        ///// <summary>
        ///// Lấy district theo ID (để validate districtId từ FE)
        ///// </summary>
        //Task<District?> GetDistrictByIdAsync(int districtId);
    }
}
