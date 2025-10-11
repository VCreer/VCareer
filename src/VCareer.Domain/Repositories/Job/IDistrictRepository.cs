using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Models.Job;
using Volo.Abp.Domain.Repositories;

namespace VCareer.Repositories.Job
{
    public interface IDistrictRepository : IRepository<District, int>
    {
        // lấy danh sách các huyện theo tỉnh
        Task<List<District>> GetByProvinceIdAsync(int provinceId); 
    }
}
