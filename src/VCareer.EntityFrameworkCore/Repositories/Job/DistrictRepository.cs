using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VCareer.EntityFrameworkCore;
using VCareer.Models.Job;
using Volo.Abp.Domain.Repositories.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore;

namespace VCareer.Repositories.Job
{
    public class DistrictRepository : EfCoreRepository<VCareerDbContext, District, int>, IDistrictRepository
    {
        public DistrictRepository(IDbContextProvider<VCareerDbContext> dbContextProvider) : base(dbContextProvider)
        {
        }

        /// <summary>
        /// Lấy thông tin quận/huyện theo ID
        /// </summary>
        public async Task<District?> GetByDistrictIdAsync(int? districtId)
        {
            if (districtId == null || districtId <= 0)
            {
                return null;
            }

            var dbContext = await GetDbContextAsync();

            return await dbContext.Districts
                .Where(d => d.IsActive)
                .FirstOrDefaultAsync(d => d.Id == districtId);
        }


    }
}
