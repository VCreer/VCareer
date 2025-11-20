using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants.JobConstant;
using VCareer.Dto.Subcriptions;
using VCareer.IServices.Common;
using VCareer.IServices.Subcriptions;
using Volo.Abp.Application.Services;

namespace VCareer.Services.Subcription
{
    public class UserSubcriptionService : ApplicationService, IUserSubcriptionService
    {
        public Task BuySubcription(User_SubcirptionCreateDto dto)
        {
            throw new NotImplementedException();
        }

        public Task CancleUserSubcription(User_SubcirptionUpdateDto dto)
        {
            throw new NotImplementedException();
        }

        public Task<List<SubcriptionsViewDto>> GetAllSubcriptionsByUser(Guid userId, SubcriptionContance.SubcriptionStatus status, PagingDto pagingDto)
        {
            throw new NotImplementedException();
        }

        public Task<User_SubcirptionViewDto> GetUserSubcriptionService(Guid UserSubcriptionServiceId)
        {
            throw new NotImplementedException();
        }

        public Task UpdateUserSubcription(User_SubcirptionUpdateDto dto)
        {
            throw new NotImplementedException();
        }
    }
}
