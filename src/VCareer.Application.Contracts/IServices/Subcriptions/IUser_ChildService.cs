using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Dto.Subcriptions;
using VCareer.IServices.Common;
using static VCareer.Constants.JobConstant.SubcriptionContance;

namespace VCareer.IServices.Subcriptions
{
    public interface IUser_ChildService
    {
        public Task ActiveServiceAsync(List<Guid> childServiceIds, Guid? jobId);//là tạo 1 bản ghi UserChildservice mới 
        public Task UpdateUser_ChildServiceAsync(User_ChildServiceUpdateDto dto);
        public Task<User_ChildServiceViewDto> GetUser_ChildServiceAsync(Guid userChildServiceId);
        }
}
