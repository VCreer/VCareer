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
        public Task CreateSubcriptionPrice(SubcriptionsCreateDto createSubCriptionDto);
        public Task UpdateSubcriptionPriceAsync(SubcriptionsUpdateDto createSubCriptionDto);
        public Task DeleteSoftSubcriptionPriceAsync(SubcriptionsUpdateDto createSubCriptionDto);
        public Task<SubcriptionPriceViewDto> GetSubcriptionPriceService(Guid subcriptionPriceId,PagingDto pagingDto);
      
    }
}
