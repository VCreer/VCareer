using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.EntityFrameworkCore;
using VCareer.Job;
using VCareer.Models.Job;
using Volo.Abp.Domain.Repositories.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore;

namespace VCareer.Repositories.Job
{
    public class DistrictRepository : EfCoreRepository<VCareerDbContext, District, int>, IDistrictRepository
    {
        public DistrictRepository(IDbContextProvider<VCareerDbContext> dbContextProvider) : base(dbContextProvider) { }





        public async Task<District?> GetByDistrictIdAsync(int? id)
        {
            if (id == null) return null;
            var dbContext = await GetDbContextAsync();
            var district = await dbContext.Districts.FirstOrDefaultAsync(x => x.Id == id);
            if (district == null) return null;
            return district;
        }
    }
}
