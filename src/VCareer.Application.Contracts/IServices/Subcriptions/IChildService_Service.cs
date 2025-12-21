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
    public interface IChildService_Service : IApplicationService
    {
        public Task CreateChildServiceAsync(ChildServiceCreateDto dto);
        public Task UpdateChildServiceAsync(ChildServiceUpdateDto dto);
        public Task DeleteChildServiceAsync(Guid childServiceId); //delete phari de y quan he cac sbang vaf nghiepj vu xoa
        public Task StopAgentCHildServiceAsync(Guid childServiceId);// cai nay tắt child service này ở tất cả mọi nguồn 
        public Task<List<ChildServiceViewDto>> GetChildServicesAsync(ChildServiceGetDto dto);



    }
}
