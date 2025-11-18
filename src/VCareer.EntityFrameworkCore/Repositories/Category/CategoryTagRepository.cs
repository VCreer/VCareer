using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.EntityFrameworkCore;
using VCareer.IRepositories.Category;
using VCareer.Models.JobCategory;
using Volo.Abp.Domain.Repositories.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore;

namespace VCareer.Repositories.Category
{
    public class CategoryTagRepository : EfCoreRepository<VCareerDbContext, Categoty_Tag, int>, ICategoryTagRepository
    {
        public CategoryTagRepository(IDbContextProvider<VCareerDbContext> dbContextProvider) : base(dbContextProvider)
        {
        }
    }
}
