using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using VCareer.Dto.Category;
using Volo.Abp.Application.Services;

namespace VCareer.IServices.IJobServices
{
    public interface IJobCategoryAppService : IApplicationService
    {
        public Task<List<CategoryTreeDto>> GetCategoryTreeAsync(); /// Lấy cây phân cấp category đầy đủ với số lượng job
        public Task<List<CategoryTreeDto>> SearchCategoriesAsync(string keyword); // Trả về danh sách các leaf categories có path chứa từ khóa
        public Task DeleteCategoryAsync(Guid id);
        public Task UpdateCategoryAsync(Guid id, CategoryUpdateCreateDto dto);
        public Task CreateCategoryAsync(CategoryUpdateCreateDto dto);
    }
}
