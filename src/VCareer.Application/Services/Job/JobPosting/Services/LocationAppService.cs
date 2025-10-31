using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VCareer.Dto.Job;
using VCareer.IServices.IJobServices;
using VCareer.Models.Job;
using VCareer.Repositories.Job;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Entities;

namespace VCareer.Services.Job.JobPosting.Services
{
    public class LocationAppService : ApplicationService, ILocationService
    {
        private readonly ILocationRepository _locationRepository;
        private readonly IDistrictRepository _districtRepository;

        public LocationAppService(
            ILocationRepository locationRepository,
            IDistrictRepository districtRepository)
        {
            _locationRepository = locationRepository;
            _districtRepository = districtRepository;
        }

        /// <summary>
        /// Lấy tất cả tỉnh/thành phố kèm danh sách quận/huyện
        /// </summary>
        public async Task<List<ProvinceDto>> GetAllProvincesAsync()
        {
            try
            {
                var provinces = await _locationRepository.GetFullProvincesAsync();

                if (provinces == null || !provinces.Any())
                {
                    Logger.LogWarning("No provinces found in database");
                    return new List<ProvinceDto>();
                }

                return MapToProvinceDtos(provinces);
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "Error occurred while getting all provinces");
                throw;
            }
        }

        /// <summary>
        /// Tìm kiếm tỉnh/thành phố theo tên
        /// </summary>
        public async Task<List<ProvinceDto>> SearchProvincesByNameAsync(string searchTerm)
        {
            try
            {
                // Nếu search term trống, trả về tất cả
                if (string.IsNullOrWhiteSpace(searchTerm))
                {
                    Logger.LogInformation("Search term is empty, returning all provinces");
                    return await GetAllProvincesAsync();
                }

                var provinces = await _locationRepository.SearchProvincesAsync(searchTerm);

                if (provinces == null || !provinces.Any())
                {
                    Logger.LogInformation("No provinces found matching search term: {SearchTerm}", searchTerm);
                    return new List<ProvinceDto>();
                }

                return MapToProvinceDtos(provinces);
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "Error occurred while searching provinces with term: {SearchTerm}", searchTerm);
                throw;
            }
        }

        ///// <summary>
        ///// Lấy thông tin tỉnh/thành phố theo ID
        ///// </summary>
        //public async Task<ProvinceDto> GetProvinceByIdAsync(int provinceId)
        //{
        //    try
        //    {
        //        var province = await _locationRepository.GetProvinceByIdAsync(provinceId);

        //        if (province == null)
        //        {
        //            throw new EntityNotFoundException(typeof(Province), provinceId);
        //        }

        //        return MapToProvinceDto(province);
        //    }
        //    catch (EntityNotFoundException)
        //    {
        //        Logger.LogWarning("Province not found with ID: {ProvinceId}", provinceId);
        //        throw;
        //    }
        //    catch (Exception ex)
        //    {
        //        Logger.LogError(ex, "Error occurred while getting province by ID: {ProvinceId}", provinceId);
        //        throw;
        //    }
        //}

        ///// <summary>
        ///// Lấy thông tin quận/huyện theo ID
        ///// </summary>
        //public async Task<DistrictDto> GetDistrictByIdAsync(int districtId)
        //{
        //    try
        //    {
        //        var district = await _districtRepository.GetByDistrictIdAsync(districtId);

        //        if (district == null)
        //        {
        //            throw new EntityNotFoundException(typeof(District), districtId);
        //        }

        //        return MapToDistrictDto(district);
        //    }
        //    catch (EntityNotFoundException)
        //    {
        //        Logger.LogWarning("District not found with ID: {DistrictId}", districtId);
        //        throw;
        //    }
        //    catch (Exception ex)
        //    {
        //        Logger.LogError(ex, "Error occurred while getting district by ID: {DistrictId}", districtId);
        //        throw;
        //    }
        //}



        #region Private Mapping Methods

        /// <summary>
        /// Map danh sách Province entities sang DTOs
        /// </summary>
        private List<ProvinceDto> MapToProvinceDtos(List<Province> provinces)
        {
            return provinces.Select(MapToProvinceDto).ToList();
        }

        /// <summary>
        /// Map Province entity sang DTO
        /// </summary>
        private ProvinceDto MapToProvinceDto(Province province)
        {
            return new ProvinceDto
            {
                Id = province.Id,
                Name = province.Name,
                Code = province.Code,
                Districts = province.Districts?.Select(MapToDistrictDto).ToList() ?? new List<DistrictDto>()
            };
        }

        /// <summary>
        /// Map District entity sang DTO
        /// </summary>
        private DistrictDto MapToDistrictDto(District district)
        {
            return new DistrictDto
            {
                Id = district.Id,
                Name = district.Name,
                Code = district.Code,
                ProvinceId = district.ProvinceId
            };
        }

        #endregion
    }
}
