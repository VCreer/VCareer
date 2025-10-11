using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Models.Job;
using Volo.Abp.Domain.Repositories;

namespace VCareer.Repositories.Job
{
    public interface IProvinceRepository : IRepository<Province, int>
    {
        

       // tìm kiếm province theo tên
        Task<List<Province>> SearchByNameAsync(string keyword);
    }
}
