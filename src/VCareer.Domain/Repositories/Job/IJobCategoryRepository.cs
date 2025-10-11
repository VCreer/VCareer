using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Models.Job;
using Volo.Abp.Domain.Repositories;

namespace VCareer.Repositories
{
    public interface IJobCategoryRepository : IRepository<Job_Category, Guid>
    {
        /// <summary>
        /// Lấy root categories (không có parent)
        /// </summary>
        Task<List<Job_Category>> GetRootCategoriesAsync();

        /// <summary>
        /// Lấy children của một category
        /// </summary>
        Task<List<Job_Category>> GetChildrenAsync(Guid parentId);

        /// <summary>
        /// Lấy toàn bộ cây category (3 cấp)
        /// </summary>
        Task<List<Job_Category>> GetCategoryTreeAsync();

       

        /// <summary>
        /// Lấy path từ root đến category hiện tại
        /// </summary>
        Task<List<Job_Category>> GetCategoryPathAsync(Guid categoryId);

        /// <summary>
        /// Lấy tất cả descendants của một category (bao gồm con, cháu)
        /// </summary>
        Task<List<Guid>> GetAllDescendantIdsAsync(Guid categoryId);
    }
}
