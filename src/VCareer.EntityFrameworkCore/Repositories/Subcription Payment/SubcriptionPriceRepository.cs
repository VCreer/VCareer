using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.EntityFrameworkCore;
using VCareer.IRepositories.Payment;
using VCareer.Models.Subcription_Payment;
using Volo.Abp.Domain.Repositories.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore;

namespace VCareer.Repositories.Subcription_Payment
{
    public class SubcriptionPriceRepository : EfCoreRepository<VCareerDbContext, SubcriptionPrice, Guid>, ISubcriptionPriceRepository
    {
        public SubcriptionPriceRepository(IDbContextProvider<VCareerDbContext> dbContextProvider) : base(dbContextProvider)
        {
        }
    }
}
