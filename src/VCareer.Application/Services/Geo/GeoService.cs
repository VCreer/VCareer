using Microsoft.Extensions.Caching.Distributed;
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
            var response = await client.GetAsync("https://provinces.open-api.vn/api/v2/?depth=2");
            response.EnsureSuccessStatusCode();

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

        public async Task<string> GetProvinceNameByCode(int provinceCode)
        {

            var provinces = await GetProvincesAsync();
            if (provinces == null) throw new BusinessException("Cannot get provinces data from external api");

            var provinceName =provinces.FirstOrDefault(p=>p.Code==provinceCode)?.Name;
            if(provinceName==null) throw new BusinessException("Cannot get province name from external api");

            return provinceName;
        }

        public async Task<string> GetWardNameByCode(int? wardCode , int provinceCode )
        {
            if(wardCode==null) return string.Empty;
            var provinces = await GetProvincesAsync();
            if (provinces == null) throw new BusinessException("Cannot get provinces data from external api");
            var wards =provinces.FirstOrDefault(p=>p.Code==provinceCode)?.Ward;
            if(wards ==null) throw new BusinessException("Cannot get wards data from external api");

            var wardName = wards.FirstOrDefault(w=>w.Code == wardCode)?.Name;
            if (wardName== null) throw new BusinessException("Cannot get province name from external api");

            return wardName;
        }


    }
}
