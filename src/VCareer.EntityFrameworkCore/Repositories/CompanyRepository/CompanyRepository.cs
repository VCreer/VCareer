using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.EntityFrameworkCore;
using VCareer.IRepositories.ICompanyRepository;
using VCareer.Models.Companies;
using Volo.Abp.Domain.Repositories.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore;

namespace VCareer.Repositories.CompanyRepository
{
    public class CompanyRepository : EfCoreRepository<VCareerDbContext, Company, int>, ICompanyRepository
    {
        public CompanyRepository(IDbContextProvider<VCareerDbContext> dbContextProvider) : base(dbContextProvider)
        {
        }
    }
}
