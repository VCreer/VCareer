using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp.AspNetCore.Mvc;

namespace VCareer.Controllers
{
    [ApiController]
    [Route("api/app/tax-code")]
    [AllowAnonymous] // Public endpoint for registration form
    public class TaxCodeValidationController : AbpControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;

        public TaxCodeValidationController(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        /// <summary>
        /// Validate mã số thuế qua API VietQR
        /// Proxy endpoint để tránh CORS issue
        /// </summary>
        /// <param name="taxCode">Mã số thuế cần kiểm tra</param>
        /// <returns>Response từ VietQR API</returns>
        [HttpGet("validate/{taxCode}")]
        public async Task<IActionResult> ValidateTaxCode(string taxCode)
        {
            if (string.IsNullOrWhiteSpace(taxCode))
            {
                return BadRequest(new { error = "Tax code is required" });
            }

            // Validate format: 10 or 13 digits
            if (!System.Text.RegularExpressions.Regex.IsMatch(taxCode, @"^\d{10}$|^\d{13}$"))
            {
                return BadRequest(new { error = "Tax code must be 10 or 13 digits" });
            }

            try
            {
                var httpClient = _httpClientFactory.CreateClient();
                httpClient.Timeout = TimeSpan.FromSeconds(10);
                var response = await httpClient.GetAsync($"https://api.vietqr.io/v2/business/{taxCode}");

                var content = await response.Content.ReadAsStringAsync();
                
                if (response.IsSuccessStatusCode)
                {
                    try
                    {
                        var jsonContent = JsonSerializer.Deserialize<object>(content);
                        return Ok(jsonContent);
                    }
                    catch
                    {
                        return Ok(new { raw = content });
                    }
                }
                else
                {
                    try
                    {
                        var jsonContent = JsonSerializer.Deserialize<object>(content);
                        return StatusCode((int)response.StatusCode, jsonContent);
                    }
                    catch
                    {
                        return StatusCode((int)response.StatusCode, new { error = content });
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to validate tax code", message = ex.Message });
            }
        }

        /// <summary>
        /// Lấy thông tin công ty từ API thông tin doanh nghiệp
        /// Proxy endpoint để tránh CORS issue
        /// </summary>
        /// <param name="taxCode">Mã số thuế cần lấy thông tin</param>
        /// <returns>Thông tin công ty từ API</returns>
        [HttpGet("company-info/{taxCode}")]
        public async Task<IActionResult> GetCompanyInfo(string taxCode)
        {
            if (string.IsNullOrWhiteSpace(taxCode))
            {
                return BadRequest(new { error = "Tax code is required" });
            }

            // Validate format: 10 or 13 digits
            if (!System.Text.RegularExpressions.Regex.IsMatch(taxCode, @"^\d{10}$|^\d{13}$"))
            {
                return BadRequest(new { error = "Tax code must be 10 or 13 digits" });
            }

            try
            {
                var httpClient = _httpClientFactory.CreateClient();
                httpClient.Timeout = TimeSpan.FromSeconds(10);
                var response = await httpClient.GetAsync($"https://thongtindoanhnghiep.co/api/company/{taxCode}");

                var content = await response.Content.ReadAsStringAsync();
                
                if (response.IsSuccessStatusCode)
                {
                    try
                    {
                        // Parse JSON response
                        var jsonContent = JsonSerializer.Deserialize<object>(content);
                        
                        // Kiểm tra nếu response là một object có Title (thông tin công ty hợp lệ)
                        // Hoặc nếu response là một array/object khác, cần kiểm tra kỹ hơn
                        return Ok(jsonContent);
                    }
                    catch (Exception ex)
                    {
                        // Nếu parse JSON lỗi, trả về raw content để frontend xử lý
                        return Ok(new { raw = content, parseError = ex.Message });
                    }
                }
                else
                {
                    // 404 hoặc lỗi khác - trả về NotFound
                    return NotFound(new { error = "Company not found", message = "Không tìm thấy thông tin công ty với mã số thuế này", statusCode = (int)response.StatusCode });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to get company info", message = ex.Message });
            }
        }
    }
}

