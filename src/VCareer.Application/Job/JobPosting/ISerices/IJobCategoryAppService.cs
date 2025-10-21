using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Volo.Abp.Application.Services;

namespace VCareer.Job.JobPosting.ISerices
{
    public interface IJobCategoryAppService : IApplicationService
    {

        // lấy cây phân cấp category full
        Task<List<CategoryTreeDto>> GetCategoryTreeAsync();



        // hàm để tìm kiếm category , sẽ là categroy node cuối
        Task<List<CategoryTreeDto>> SearchCategoriesAsync(string keyword);

       



    }
}
