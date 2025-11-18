using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Models.JobCategory;
using Volo.Abp.Domain.Repositories;

namespace VCareer.IRepositories.Category
{
    public interface IJobTagRepository:IRepository<JobTag, int>
    {
    }
}
