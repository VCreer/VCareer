using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Models.Job;
using Volo.Abp.Domain.Repositories;

namespace VCareer.Repositories
{
    /// <summary>
    /// Repository cho Job_Category - Chỉ tương tác database, trả về Entity
    /// </summary>
    public interface IJobCategoryRepository : IRepository<Job_Category, Guid>
    {

        // lấy toàn bộ  cây category
        Task<List<Job_Category>> GetFullCategoryTreeAsync();


        // lấy string path của 1 category , chác chắn nó sẽ là category cấp 3
        Task<string> GetStringPath(Guid categoryId);


        // trả về danh sách các category khi mà tìm kiếm
        Task<List<Job_Category>> SearchCategoriesByPathAsync(string keyword);


        // tìm các category con của 1 category id
        Task<List<Guid>> GetAllChildrenCategoryIdsAsync(Guid categoryId);






    }
}
