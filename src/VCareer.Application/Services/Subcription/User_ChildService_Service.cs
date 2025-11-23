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
    public class User_ChildService_Service : ApplicationService, IUser_ChildService
    {
        public Task ActiveServiceAsync(User_ChildServiceCreateDto dto)
        {
            throw new NotImplementedException();
        }

        public Task<List<User_ChildServiceViewDto>> GetAllChildServiceByUserAsync(Guid userId, SubcriptionContance.ChildServiceStatus status, PagingDto pagingDto)
        {
            throw new NotImplementedException();
        }

        public Task<User_ChildServiceViewDto> GetUser_ChildServiceAsync(Guid userChildServiceId)
        {
            throw new NotImplementedException();
        }

        public Task UpdateUser_ChildServiceAsync(User_ChildServiceUpdateDto dto)
        {
            throw new NotImplementedException();
        }
    }
}
