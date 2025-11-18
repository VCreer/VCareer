using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Models.JobCategory;
using Volo.Abp.Domain.Repositories;

namespace VCareer.IRepositories.Job
{
    public interface ICategoryTagRepository : IRepository<Categoty_Tag, int>
    {
    }
}
