using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VCareer.Dto.Subcriptions;
using VCareer.IServices.Subcriptions;
using Volo.Abp.AspNetCore.Mvc;
using static VCareer.Constants.JobConstant.SubcriptionContance;

namespace VCareer.Controllers
{
    [ApiController]
    [Route("api/subscription-services")]
    public class SubscriptionServiceController : AbpControllerBase
    {
        private readonly ISubcriptionService _subcriptionService;

        public SubscriptionServiceController(ISubcriptionService subcriptionService)
        {
            _subcriptionService = subcriptionService;
        }

        /// <summary>
        /// Get active subscription services for purchase
        /// </summary>
        [HttpGet("active")]
        [AllowAnonymous] // Allow anonymous access for viewing services
        public async Task<ActionResult<List<SubcriptionsViewDto>>> GetActiveSubscriptionServicesAsync([FromQuery] SubcriptorTarget? target = null)
        {
            try
            {
                var services = await _subcriptionService.GetActiveSubscriptionServicesAsync(target);
                return Ok(services);
            }
            catch (Exception ex)
            {
                //Logger.LogError(ex, "Error getting active subscription services");
                return StatusCode(500, new { message = "Error getting subscription services", error = ex.Message });
            }
        }
    }
}


