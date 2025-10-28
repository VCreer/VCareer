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
    /// <summary>
    /// Repository cho Location (Province và District)
    /// Dùng để:
    /// 1. Lấy danh sách provinces/districts cho home page (cây dữ liệu)
    /// 2. Validate provinceId và districtId từ FE
    /// </summary>
    public class LocationRepository : EfCoreRepository<VCareerDbContext, Province, int>, ILocationRepository
    {
        private readonly IDistrictRepository _districtRepository;


        public LocationRepository(
            IDbContextProvider<VCareerDbContext> dbContextProvider,
            IDistrictRepository districtRepository) : base(dbContextProvider)
        {
            _districtRepository = districtRepository;
        }


        public async Task<List<Province>> GetFullProvincesAsync()
        {
            var dbContext = await GetDbContextAsync();

            return await dbContext.Provinces
                .Include(p => p.Districts.Where(d => d.IsActive))
                .Where(p => p.IsActive)
                .OrderBy(p => p.Name)
                .ToListAsync();
        }


        public async Task<List<Province>> SearchProvincesAsync(string searchTerm)
        {
            var dbContext = await GetDbContextAsync();

            // Nếu search term trống, trả về tất cả
            if (string.IsNullOrWhiteSpace(searchTerm))
            {
                return await GetFullProvincesAsync();
            }

            var normalizedSearchTerm = searchTerm.Trim().ToLower();

            return await dbContext.Provinces
                .Include(p => p.Districts.Where(d => d.IsActive))
                .Where(p => p.IsActive && p.Name.ToLower().Contains(normalizedSearchTerm))
                .OrderBy(p => p.Name)
                .ToListAsync();
        }

        //public async Task<string?> GetNameProvince(int provinedId)
        //{
        //    var dbContext = await GetDbContextAsync();
        //    var x = dbContext.Provinces.FirstOrDefault(x => x.Id == provinedId);
        //    if (x == null) return null;
        //    return x.Name;
        //}


        public async Task<Province?> GetProvinceByIdAsync(int provinceId)
        {
            if (provinceId <= 0)
            {
                return null;
            }

            var dbContext = await GetDbContextAsync();

            return await dbContext.Provinces
                .Include(p => p.Districts.Where(d => d.IsActive))
                .Where(p => p.IsActive)
                .FirstOrDefaultAsync(p => p.Id == provinceId);
        }

        //public async Task<District?> GetDistrictByIdAsync(int districtId)
        //{
        //    if (districtId <= 0)
        //    {
        //        return null;
        //    }

        //    // Sử dụng DistrictRepository để tránh duplicate code
        //    return await _districtRepository.GetByDistrictIdAsync(districtId);
        //}
    }
}
