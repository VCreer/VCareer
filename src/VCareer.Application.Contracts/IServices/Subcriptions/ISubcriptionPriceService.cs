using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Dto.Subcriptions;
using VCareer.IServices.Common;
using Volo.Abp.Application.Services;

namespace VCareer.IServices.Subcriptions
{
    public interface ISubcriptionPriceService : IApplicationService
    {
        public Task CreateSubcriptionPrice(SubcriptionPriceCreateDto createSubCriptionDto);
        public Task UpdateSubcriptionPriceAsync(SubcriptionPriceUpdateDto createSubCriptionDto);
        public Task SetStatusSubcriptionPrice(Guid subcriptionPriceId,bool isActive);
        public Task<List<SubcriptionPriceViewDto>> GetSubcriptionPriceService(Guid subcriptionPriceId);
        public Task<SubcriptionPriceViewDto> GetCurrentPriceOfSubcription(Guid subcriptionId);
      
    }
}
