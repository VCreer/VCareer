using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using VCareer.Models.Job;
using Volo.Abp.Domain.Repositories;

namespace VCareer.Repositories.Job
{
    /// <summary>
    /// Repository interface cho District (Quận/Huyện)
    /// </summary>
    public interface IDistrictRepository : IRepository<District, int>
    {
        // tìm district theo id
        Task<District?> GetByDistrictIdAsync(int? districtId);





    }
}
