using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants.JobConstant;
using VCareer.Dto.Subcriptions;
using VCareer.IRepositories.Subcriptions;
using VCareer.IServices.Common;
using VCareer.IServices.Subcriptions;
using VCareer.Models.Subcription;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Identity;
using Volo.Abp.Users;

namespace VCareer.Services.Subcription
{
    public class User_ChildService_Service : ApplicationService, IUser_ChildService
    {
        private readonly IJobAffectingService _jobAffectingService;
        private readonly IUser_ChildServiceRepository _userChildServiceRepository;
        private readonly IChildServiceRepository _childServiceRepository;
        private readonly IdentityUserManager _identityManager;

        public User_ChildService_Service(IJobAffectingService jobAffectingService, IUser_ChildServiceRepository userChildServiceRepository, IChildServiceRepository childServiceRepository, IdentityUserManager identityManager)
        {
            _jobAffectingService = jobAffectingService;
            _userChildServiceRepository = userChildServiceRepository;
            _childServiceRepository = childServiceRepository;
            _identityManager = identityManager;
        }

        public async Task ActiveServiceAsync(User_ChildServiceCreateDto dto)
        {
            var userChildService = await _userChildServiceRepository.GetAsync(x =>
            x.ChildServiceId == dto.ChildServiceId &&
            x.UserId == dto.UserId);
            //nếu đây là lần đầu user dùng childservice này thì tạo mới để còn tính count số lần dùng
            if (userChildService == null)
            {
                await CreateUserChildServiceAsync(dto);
                return;
            }

            //trường hợp user đang sử dụng dở thì sẽ trừ 1 lần sử dụng khi active
            if (userChildService.Status == SubcriptionContance.ChildServiceStatus.Active)
            {
                if(userChildService.UsedTime==userChildService.TotalUsageLimit) throw new BusinessException("Used time limit");
                userChildService.UsedTime += 1;
            }
            //trường hợp mua mới gói thì sẽ cập nhật lại số lần sử dụng
            if (userChildService.Status != SubcriptionContance.ChildServiceStatus.Active)
            {
                userChildService.Status = SubcriptionContance.ChildServiceStatus.Active;
                userChildService.UsedTime = 0;
            }

            await _userChildServiceRepository.UpdateAsync(userChildService);

        }

        private async Task CreateUserChildServiceAsync(User_ChildServiceCreateDto dto)
        {
            var childService = await _childServiceRepository.GetAsync(dto.ChildServiceId);
            if (childService == null) throw new BusinessException("ChildService not found");

            var user = await _identityManager.FindByIdAsync(dto.UserId.ToString());
            if (user == null) throw new BusinessException("User not found");
            if (!user.IsActive || user.IsDeleted == true) throw new BusinessException("User not active or deleted");

            DateTime? endDate = null;
            if (childService.IsLifeTime == false) endDate = DateTime.Now.AddDays((double)childService.DayDuration);
            var userChildService = new User_ChildService()
            {
                TotalUsageLimit = childService.TimeUsedLimit,
                IsLifeTime = childService.IsLifeTime,
                IsLimitUsedTime = childService.IsLimitUsedTime,
                ChildServiceId = dto.ChildServiceId,
                UserId = dto.UserId,
                Status = SubcriptionContance.ChildServiceStatus.Active,
                StartDate = DateTime.UtcNow,
                EndDate = endDate,
                UsedTime = 0,
            };
            await _userChildServiceRepository.InsertAsync(userChildService);
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
