using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using VCareer.Dto.Job;
using Volo.Abp.Application.Services;

namespace VCareer.IServices.IJobServices
{
    /// <summary>
    /// Service interface cho quản lý danh mục nghề nghiệp
    /// </summary>
    public interface IJobCategoryAppService : IApplicationService
    {
        /// <summary>
        /// Lấy cây phân cấp category đầy đủ với số lượng job
        /// </summary>
        /// <returns>Danh sách category tree</returns>
        Task<List<CategoryTreeDto>> GetCategoryTreeAsync();

        /// <summary>
        /// Tìm kiếm category theo từ khóa
        /// Trả về danh sách các leaf categories có path chứa từ khóa
        /// </summary>
        /// <param name="keyword">Từ khóa tìm kiếm</param>
        /// <returns>Danh sách category tree phù hợp</returns>
        Task<List<CategoryTreeDto>> SearchCategoriesAsync(string keyword);
    }
}
