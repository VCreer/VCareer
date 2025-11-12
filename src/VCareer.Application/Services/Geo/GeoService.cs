using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using VCareer.Dto.GeoDto;
using VCareer.IServices.IGeoServices;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Caching;

namespace VCareer.Services.Geo
{
    public class GeoService : ApplicationService, IGeoService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IDistributedCache<List<ProvinceDto>> _cache;
        private const string KEY_PREFIX = "Geo:";

        public GeoService(IHttpClientFactory httpClientFactory, IDistributedCache<List<ProvinceDto>> cache)
        {
            _httpClientFactory = httpClientFactory;
            _cache = cache;
        }
        public async Task<ICollection<ProvinceDto>> GetProvincesAsync()
        {
            var cached = await _cache.GetAsync(KEY_PREFIX);
            if (cached != null) return cached;

            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(30);
            
            // Thử các URL khác nhau cho provinces.open-api.vn API
            var apiUrls = new[]
            {
                "https://provinces.open-api.vn/api/p/?depth=2",  // URL với /p/ (provinces)
                "https://provinces.open-api.vn/api/?depth=2",    // URL không có /p/
                "https://provinces.open-api.vn/api/p"            // URL đơn giản nhất
            };
            
            HttpResponseMessage? response = null;
            string? successfulUrl = null;
            
            foreach (var apiUrl in apiUrls)
            {
                try
                {
                    response = await client.GetAsync(apiUrl);
                    if (response.IsSuccessStatusCode)
                    {
                        successfulUrl = apiUrl;
                        break;
                    }
                    Logger.LogWarning($"Failed to get provinces from {apiUrl}. Status: {response.StatusCode}");
                }
                catch (Exception ex)
                {
                    Logger.LogWarning(ex, $"Error calling {apiUrl}");
                }
            }
            
            if (response == null || !response.IsSuccessStatusCode)
            {
                Logger.LogError($"Failed to get provinces from all API URLs. Last status: {response?.StatusCode}");
                throw new BusinessException("Không thể lấy dữ liệu tỉnh/thành phố từ API bên ngoài. Vui lòng thử lại sau.");
            }
            
            Logger.LogInformation($"Successfully fetched provinces from: {successfulUrl}");

            var content = await response.Content.ReadAsStringAsync();
            var provinces = JsonSerializer.Deserialize<List<ProvinceDto>>(content, new JsonSerializerOptions() { PropertyNameCaseInsensitive = true });
            if (provinces == null) throw new BusinessException("Cannot get provinces data from external api");

            await _cache.SetAsync(
                KEY_PREFIX,
                provinces,
                new DistributedCacheEntryOptions() { AbsoluteExpiration = DateTimeOffset.Now.AddDays(1) }
                );

            Console.WriteLine(provinces);

            return provinces;
                   }

    }
}
