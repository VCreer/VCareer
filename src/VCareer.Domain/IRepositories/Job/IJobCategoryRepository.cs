using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using VCareer.Models.JobCategory;
using Volo.Abp.Domain.Repositories;

namespace VCareer.IRepositories.Job
{
    public interface IJobCategoryRepository : IRepository<Job_Category, Guid>
    {
        // lấy fu danh sách caegopry 
        Task<List<Job_Category>> GetFullCategoryTreeAsync();

        // lấy full path của 1 category
        Task<string> GetStringPath(Guid categoryId);

        /// Tìm kiếm category theo keyword trong path
        /// Trả về danh sách các leaf categories có path chứa keyword
        /// <returns>Danh sách leaf categories phù hợp</returns>
        Task<List<Job_Category>> SearchCategoriesByPathAsync(string keyword);

        // lấy tất cả id node cuối của 1 category id
        Task<List<Guid>> GetAllChildrenCategoryIdsAsync(Guid categoryId);

        // update số lượng job của 1 caegory
        Task UpdateJobCountAsync(Guid categoryId, int jobCount);

        /// Lấy category theo ID với children đã load
        /// <param name="categoryId">ID của category</param>
        /// <returns>Category entity với children</returns>
        Task<Job_Category> GetWithChildrenAsync(Guid categoryId);
    }
}
