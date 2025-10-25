using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using VCareer.Models.Job;
using Volo.Abp.Domain.Repositories;

namespace VCareer.Repositories
{
    /// <summary>
    /// Repository interface cho Job_Category - Chỉ tương tác database, trả về Entity
    /// </summary>
    public interface IJobCategoryRepository : IRepository<Job_Category, Guid>
    {

        // lấy fu danh sách caegopry 
        Task<List<Job_Category>> GetFullCategoryTreeAsync();



        // lấy full ath của 1 category
        Task<string> GetStringPath(Guid categoryId);



        /// <summary>
        /// Tìm kiếm category theo keyword trong path
        /// Trả về danh sách các leaf categories có path chứa keyword
        /// </summary>
        /// <param name="keyword">Từ khóa tìm kiếm</param>
        /// <returns>Danh sách leaf categories phù hợp</returns>
        Task<List<Job_Category>> SearchCategoriesByPathAsync(string keyword);



        // lấy tất cả id node cuối của 1 category id
        Task<List<Guid>> GetAllChildrenCategoryIdsAsync(Guid categoryId);


        // update số lượng job của 1 caegory
        Task UpdateJobCountAsync(Guid categoryId, int jobCount);

        /// <summary>
        /// Lấy category theo ID với children đã load
        /// </summary>
        /// <param name="categoryId">ID của category</param>
        /// <returns>Category entity với children</returns>
        Task<Job_Category> GetWithChildrenAsync(Guid categoryId);
    }
}
