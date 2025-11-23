using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants.JobConstant;
using VCareer.Dto.Subcriptions;
using VCareer.IServices.Common;
using Volo.Abp.Application.Services;
using static VCareer.Constants.JobConstant.SubcriptionContance;

namespace VCareer.IServices.Subcriptions
{
    public interface IUserSubcriptionService : IApplicationService
    {
        public Task BuySubcription(User_SubcirptionCreateDto dto);// hàm này chạy sau khi đã payment
        public Task<User_SubcirptionViewDto> CreateUserSubcription(User_SubcirptionCreateDto dto);  //api chỉ dùng để test 
        public Task CancleUserSubcription(Guid UserSubcriptionId);
        public Task UpdateUserSubcription(User_SubcirptionUpdateDto dto);
        public Task<User_SubcirptionViewDto> GetUserSubcriptionService(Guid UserSubcriptionServiceId);
        public Task<List<SubcriptionsViewDto>> GetAllSubcriptionsByUser(Guid userId, SubcriptionContance.SubcriptionStatus? status, PagingDto pagingDto);

    }
}
