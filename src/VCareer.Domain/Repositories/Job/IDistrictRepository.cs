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
    public interface IDistrictRepository : IRepository<District, int>
    {
        //tim kiem thoe id
        Task<District?> GetByDistrictIdAsync(int? id);




    }
}
