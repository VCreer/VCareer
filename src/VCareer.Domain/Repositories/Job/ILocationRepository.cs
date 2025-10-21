using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Job;
using VCareer.Models.Job;
using Volo.Abp.Domain.Repositories;

namespace VCareer.Repositories.Job
{
    public interface ILocationRepository : IRepository<Province, int>
    {
        // lấy danh sách tất cả category
        Task<List<Province>> GetAllProvincesAsync();



        // tìm kiếm provicne theo tên province
        Task<List<Province>> SearchProvincesByNameAsync(string searchTerm);

        //tim kiem thoe id
        Task<Province?> GetByIDAsync(int? provinceID);


    }
}
