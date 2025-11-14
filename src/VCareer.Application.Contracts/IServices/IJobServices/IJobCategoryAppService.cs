using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using VCareer.Dto.Job;
using VCareer.Dto.JobDto;
using Volo.Abp.Application.Services;

namespace VCareer.IServices.IJobServices
{
    public interface IJobCategoryAppService : IApplicationService
    {
        /// Lấy cây phân cấp category đầy đủ với số lượng job
        /// <returns>Danh sách category tree</returns>
        Task<List<CategoryTreeDto>> GetCategoryTreeAsync();

        /// Tìm kiếm category theo từ khóa
        /// Trả về danh sách các leaf categories có path chứa từ khóa
        Task<List<CategoryTreeDto>> SearchCategoriesAsync(string keyword);
        Task DeleteCategoryAsync(Guid id);
        Task UpdateCategoryAsync(Guid id, CategoryUpdateCreateDto dto);
        Task CreaateCategoryAsync(CategoryUpdateCreateDto dto);
    }
}
