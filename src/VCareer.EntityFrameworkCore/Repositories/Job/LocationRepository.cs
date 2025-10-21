using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.EntityFrameworkCore;
using VCareer.Models.Job;
using Volo.Abp.Domain.Repositories.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore;

namespace VCareer.Repositories.Job
{
    public class LocationRepository : EfCoreRepository<VCareerDbContext, Province, int>, ILocationRepository
    {
        public LocationRepository(IDbContextProvider<VCareerDbContext> dbContextProvider) : base(dbContextProvider) { }

        // trar veef full danh sách cả tỉnh kèm danh sách huyện
        public async Task<List<Province>> GetAllProvincesAsync()
        {
            var dbContext = await GetDbContextAsync();
            var province = await dbContext.Provinces.Include(x => x.Districts).ToListAsync();
            return province;
        }


        // search theo tên
        public async Task<List<Province>> SearchProvincesByNameAsync(string searchTerm)
        {

            var dbContext = await GetDbContextAsync();
            if (string.IsNullOrEmpty(searchTerm))
            {
                return await dbContext.Provinces.ToListAsync();
            }


            var province = await dbContext.Provinces.Include(x => x.Districts).Where(x => x.Name.Trim().ToLower().Contains(searchTerm.Trim().ToLower())).ToListAsync();
            return province;
        }

        //tìm kiếm theo id
        public async Task<Province?> GetByIDAsync(int? provinceID)
        {
            if (provinceID == null) return null;
            var dbContext = await GetDbContextAsync();
            var province = await dbContext.Provinces.FirstOrDefaultAsync(x => x.Id == provinceID);
            if (province == null) return null;
            return province;


        }
    }
}
