using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using VCareer.Dto.Job;
using Volo.Abp.Application.Services;

namespace VCareer.IServices.IJobServices
{
    /// <summary>
    /// Service interface cho quản lý địa điểm (tỉnh/thành phố, quận/huyện)
    /// </summary>
    public interface ILocationService : IApplicationService
    {



        Task<List<ProvinceDto>> GetAllProvincesAsync();


        Task<List<ProvinceDto>> SearchProvincesByNameAsync(string searchTerm);


        //Task<ProvinceDto> GetProvinceByIdAsync(int provinceId);

        //Task<DistrictDto> GetDistrictByIdAsync(int districtId);


    }
}
