using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Dto.Subcriptions;
using VCareer.IServices.Common;
using Volo.Abp.Application.Services;
using static VCareer.Constants.JobConstant.SubcriptionContance;

namespace VCareer.IServices.Subcriptions
{
    public interface ISubcriptionService : IApplicationService
    {
        public Task CreateSubCriptionAsync(SubcriptionsCreateDto createSubCriptionDto);
        public Task UpdateSubcriptionAsync(SubcriptionsUpdateDto createSubCriptionDto);
        public Task DeleteSubcriptionAsync(Guid subcriptionId);
        //child service
        public  Task<List<ChildServiceViewDto>> GetChildServices(Guid subcriptionId, bool? isActive, PagingDto pagingDto);
        public Task AddChildServiceAsync(AddChildServicesDto dto);
        public Task RemoveChildServiceAsync(AddChildServicesDto dto);
        //price
        public Task<List<SubcriptionPriceViewDto>> GetSubcriptionsPrice(Guid subcriptionId, bool? isExpired, PagingDto pagingDto);


    }
}
