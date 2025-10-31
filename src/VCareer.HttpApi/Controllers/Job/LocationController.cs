using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using VCareer.Dto.Job;
using VCareer.IServices.IJobServices;
using Volo.Abp.AspNetCore.Mvc;

namespace VCareer.Controllers.Job
{
    /// <summary>
    /// API Controller cho quản lý địa điểm (Tỉnh/Thành phố, Quận/Huyện)
    /// </summary>
    [ApiController]
    [Route("api/locations")]
    public class LocationController : AbpControllerBase
    {
        private readonly ILocationService _locationService;

        public LocationController(ILocationService locationService)
        {
            _locationService = locationService;
        }

        // lấy tất cả proince
        [HttpGet]
        [Route("provinces")]
        public async Task<ActionResult<List<ProvinceDto>>> GetAllProvincesAsync()
        {
            try
            {
                var provinces = await _locationService.GetAllProvincesAsync();
                return Ok(provinces);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }


        // tìm theo tư khóa
        [HttpGet]
        [Route("provinces/search")]
        public async Task<ActionResult<List<ProvinceDto>>> SearchProvincesByNameAsync([FromQuery] string searchTerm)
        {
            try
            {
                var provinces = await _locationService.SearchProvincesByNameAsync(searchTerm);
                return Ok(provinces);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }


        //[HttpGet]
        //[Route("provinces/{provinceId}")]
        //public async Task<ActionResult<ProvinceDto>> GetProvinceByIdAsync(int provinceId)
        //{
        //    try
        //    {
        //        var province = await _locationService.GetProvinceByIdAsync(provinceId);
        //        return Ok(province);
        //    }
        //    catch (Volo.Abp.Domain.Entities.EntityNotFoundException)
        //    {
        //        return NotFound(new { message = $"Province with ID {provinceId} not found" });
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        //    }
        //}


        //[HttpGet]
        //[Route("districts/{districtId}")]
        //public async Task<ActionResult<DistrictDto>> GetDistrictByIdAsync(int districtId)
        //{
        //    try
        //    {
        //        var district = await _locationService.GetDistrictByIdAsync(districtId);
        //        return Ok(district);
        //    }
        //    catch (Volo.Abp.Domain.Entities.EntityNotFoundException)
        //    {
        //        return NotFound(new { message = $"District with ID {districtId} not found" });
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        //    }
        //}



    }
}
