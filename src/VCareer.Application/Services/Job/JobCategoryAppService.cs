using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VCareer.Dto.Job;
using VCareer.Dto.JobDto;
using VCareer.IRepositories.Job;
using VCareer.IServices.IJobServices;
using VCareer.Models.Job;
using Volo.Abp.Application.Services;

namespace VCareer.Services.Job
{
    public class JobCategoryAppService : ApplicationService, IJobCategoryAppService
    {
        private readonly IJobCategoryRepository _categoryRepository;

        public JobCategoryAppService(IJobCategoryRepository categoryRepository)
        {
            _categoryRepository = categoryRepository;
        }

        public async Task CreaateCategoryAsync(CategoryUpdateCreateDto dto)
        {
            var category = new Job_Category
            {
                Name = dto.Name,
                Slug = dto.Slug,
                Description = dto.Description,
                IsActive = dto.IsActive,
                SortOrder = dto.SortOrder,
            };
            await _categoryRepository.InsertAsync(category,true);
        }

        public async Task DeleteCategoryAsync(Guid id)
        {
            var category = await _categoryRepository.FindAsync(id);
            if (category == null) throw new Exception("Category not found");
            if (category.Children.Any()) throw new Exception("Category has children");
            await _categoryRepository.DeleteAsync(category, true);
        }

        /// Lấy toàn bộ cây phân cấp category với số lượng job
        public async Task<List<CategoryTreeDto>> GetCategoryTreeAsync()
        {
            try
            {
                // Load tree từ repo
                var rootCategories = await _categoryRepository.GetFullCategoryTreeAsync();

                // Nếu không tồn tại trả về list rỗng
                if (!rootCategories.Any())
                {
                    Logger.LogWarning("No root categories found in database");
                    return new List<CategoryTreeDto>();
                }

                // Tạo list các dto
                var treeDtos = new List<CategoryTreeDto>();

                foreach (var root in rootCategories)
                {
                    var rootDto = await BuildCategoryTreeDtoAsync(root, root.Name);
                    treeDtos.Add(rootDto);
                }

                // Trả về list đó
                return treeDtos;
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "Error occurred while getting category tree");
                throw;
            }
        }
        public async Task<List<CategoryTreeDto>> SearchCategoriesAsync(string keyword)
        {
            try
            {
                // Validate input
                if (string.IsNullOrWhiteSpace(keyword))
                {
                    Logger.LogWarning("Search keyword is empty");
                    return new List<CategoryTreeDto>();
                }

                // Gọi repo: trả về danh sách các node cuối
                var matchedLeafCategories = await _categoryRepository.SearchCategoriesByPathAsync(keyword);

                // Không khớp trả về list trống
                if (!matchedLeafCategories.Any())
                {
                    Logger.LogInformation("No categories found matching keyword: {Keyword}", keyword);
                    return new List<CategoryTreeDto>();
                }

                // Tạo list các dto 
                var searchResults = new List<CategoryTreeDto>();

                foreach (var leafCategory in matchedLeafCategories)
                {
                    // Get path từ root đến leaf
                    var fullPath = await _categoryRepository.GetStringPath(leafCategory.Id);

                    var dto = new CategoryTreeDto
                    {
                        CategoryId = leafCategory.Id,
                        CategoryName = leafCategory.Name,
                        Slug = leafCategory.Slug,
                        Description = leafCategory.Description,
                        FullPath = fullPath,
                        JobCount = leafCategory.JobCount,
                        IsLeaf = true,
                        Children = new List<CategoryTreeDto>() // Leaf không có children
                    };

                    searchResults.Add(dto);
                }

                return searchResults.OrderBy(r => r.FullPath).ToList();
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "Error occurred while searching categories with keyword: {Keyword}", keyword);
                throw;
            }
        }


        public async Task UpdateCategoryAsync(Guid id, CategoryUpdateCreateDto dto)
        {
            var category = await _categoryRepository.FindAsync(id);
            if (category == null)
                throw new Exception("Category not found");

            category.Name = dto.Name;
            category.Slug = dto.Slug;
            category.Description = dto.Description;
            category.IsActive = dto.IsActive;
            category.SortOrder = dto.SortOrder;
            category.ParentId = dto.ParentId;

            await _categoryRepository.UpdateAsync(category, autoSave: true);
        }

        /// Hàm này sẽ tạo ra 1 tree dto từ 1 category, build path từ trên xuống
        private async Task<CategoryTreeDto> BuildCategoryTreeDtoAsync(
            Job_Category entity,
            string currentPath)
        {
            // Tính job count bao gồm cả children
            var totalJobCount = entity.JobCount;
            if (entity.Children != null && entity.Children.Any())
            {
                totalJobCount += entity.Children.Sum(c => CalculateTotalJobCount(c));
            }

            // Tạo DTO
            var dto = new CategoryTreeDto
            {
                CategoryId = entity.Id,
                CategoryName = entity.Name,
                Slug = entity.Slug,
                Description = entity.Description,
                FullPath = currentPath,
                JobCount = totalJobCount,
                IsLeaf = entity.Children == null || !entity.Children.Any(),
                Children = new List<CategoryTreeDto>()
            };

            // Nếu có children → recursive build
            if (entity.Children != null && entity.Children.Any())
            {
                foreach (var child in entity.Children)
                {
                    // Build path cho child: "Parent > Child"
                    var childPath = $"{currentPath} > {child.Name}";

                    // Recursive call
                    var childDto = await BuildCategoryTreeDtoAsync(child, childPath);

                    dto.Children.Add(childDto);
                }
            }

            return dto;
        }

        /// Tính tổng số job bao gồm cả children (đệ quy)
        private int CalculateTotalJobCount(Job_Category category)
        {
            var total = category.JobCount;

            if (category.Children != null && category.Children.Any())
            {
                total += category.Children.Sum(c => CalculateTotalJobCount(c));
            }

            return total;
        }
    }
}
