using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Dto.GeoDto;
using Volo.Abp;
using Volo.Abp.Application.Services;

namespace VCareer.IServices.IGeoServices
{
    public interface IGeoService : IApplicationService
    {
        public Task<ICollection<ProvinceDto>> GetProvincesAsync();
        public Task<string> GetProvinceNameByCode(int provinceCode);
        public Task<string> GetWardNameByCode(int? wardCode, int provinceCode);
    }
}
