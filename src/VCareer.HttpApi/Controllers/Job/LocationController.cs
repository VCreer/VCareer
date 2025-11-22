using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using VCareer.Dto.GeoDto;
using VCareer.IServices.IGeoServices;
using Volo.Abp.AspNetCore.Mvc;

namespace VCareer.Controllers.Job
{
    /// <summary>
    /// API Controller cho quản lý địa điểm (tỉnh/thành phố, quận/huyện)
    /// </summary>
    [ApiController]
    [Route("api/locations")]
    public class LocationController : AbpControllerBase
    {
        private readonly IGeoService _geoService;

        public LocationController(IGeoService geoService)
        {
            _geoService = geoService;
        }

        /// <summary>
        /// Lấy tất cả tỉnh/thành phố với danh sách quận/huyện
        /// </summary>
        /// <returns>Danh sách tỉnh/thành phố</returns>
        [HttpGet]
        [Route("provinces")]
        public async Task<ActionResult<List<ProvinceDto>>> GetAllProvincesAsync()
        {
            try
            {
                var provinces = await _geoService.GetProvincesAsync();
                // Convert ICollection to List
                var provinceList = new List<ProvinceDto>(provinces);
                return Ok(provinceList);
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "Error getting provinces");
                return StatusCode(500, new { message = "Lỗi khi lấy danh sách tỉnh/thành phố", error = ex.Message });
            }
        }

        /// <summary>
        /// Tìm kiếm tỉnh/thành phố theo tên
        /// </summary>
        /// <param name="searchTerm">Từ khóa tìm kiếm</param>
        /// <returns>Danh sách tỉnh/thành phố phù hợp</returns>
        [HttpGet]
        [Route("provinces/search")]
        public async Task<ActionResult<List<ProvinceDto>>> SearchProvincesByNameAsync([FromQuery] string searchTerm)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(searchTerm))
                {
                    return BadRequest(new { message = "Search term cannot be empty" });
                }

                var provinces = await _geoService.GetProvincesAsync();
                // Filter by search term (case-insensitive)
                var filteredProvinces = new List<ProvinceDto>();
                foreach (var province in provinces)
                {
                    if (province.Name != null && province.Name.Contains(searchTerm, StringComparison.OrdinalIgnoreCase))
                    {
                        filteredProvinces.Add(province);
                    }
                }

                return Ok(filteredProvinces);
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "Error searching provinces");
                return StatusCode(500, new { message = "Lỗi khi tìm kiếm tỉnh/thành phố", error = ex.Message });
            }
        }
    }
}

