using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Dto.Subcriptions;
using VCareer.IServices.Common;
using VCareer.IServices.Subcriptions;
using Volo.Abp.Application.Services;

namespace VCareer.Services.Subcription
{
    public class SubcriptionPriceService : ApplicationService, ISubcriptionPriceService
    {
        public Task CreateSubcriptionPrice(SubcriptionsCreateDto createSubCriptionDto)
        {
            throw new NotImplementedException();
        }

        public Task DeleteSoftSubcriptionPriceAsync(SubcriptionsUpdateDto createSubCriptionDto)
        {
            throw new NotImplementedException();
        }

        public Task<SubcriptionPriceViewDto> GetSubcriptionPriceService(Guid subcriptionPriceId, PagingDto pagingDto)
        {
            throw new NotImplementedException();
        }

        public Task UpdateSubcriptionPriceAsync(SubcriptionsUpdateDto createSubCriptionDto)
        {
            throw new NotImplementedException();
        }
    }
}
