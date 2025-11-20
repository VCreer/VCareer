using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Models.Subcription;
using Volo.Abp.Domain.Repositories;

namespace VCareer.IRepositories.Subcriptions
{
    public interface ISubcriptionServiceRepository : IRepository<SubcriptionService, Guid>
    {
    }
}
