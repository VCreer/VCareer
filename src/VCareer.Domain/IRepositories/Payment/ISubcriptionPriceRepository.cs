using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Models.Subcription_Payment;
using Volo.Abp.Domain.Repositories;

namespace VCareer.IRepositories.Payment
{
    public interface ISubcriptionPriceRepository : IRepository<SubcriptionPrice, Guid>
    {
    }
}
