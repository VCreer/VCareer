using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants.JobConstant;
using VCareer.Dto.JobDto;
using VCareer.Dto.Subcriptions;
using VCareer.IRepositories.Subcriptions;
using VCareer.IServices.Common;
using VCareer.IServices.IJobServices;
using VCareer.IServices.Subcriptions;
using VCareer.Models.Subcription;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Identity;
using Volo.Abp.Users;
using static VCareer.Permission.VCareerPermission;

namespace VCareer.Services.Subcription
{
    public class User_ChildService_Service : ApplicationService, IUser_ChildService
    {
        private readonly IJobAffectingService _jobAffectingService;
        private readonly IUser_ChildServiceRepository _userChildServiceRepository;
        private readonly IChildServiceRepository _childServiceRepository;
        private readonly IdentityUserManager _identityManager;
        public readonly ICurrentUser _currentUser;
        public readonly ISubcriptionService _subcriptionService;
        public readonly IJobPostService _jobPostService;

        public User_ChildService_Service(
            IJobAffectingService jobAffectingService,
            IUser_ChildServiceRepository userChildServiceRepository,
            IChildServiceRepository childServiceRepository,
            ICurrentUser currentUser,
            ISubcriptionService subcriptionService,
            IJobPostService jobPostService,
            IdentityUserManager identityManager)
        {
            _jobAffectingService = jobAffectingService;
            _userChildServiceRepository = userChildServiceRepository;
            _childServiceRepository = childServiceRepository;
            _identityManager = identityManager;
            _jobPostService = jobPostService;
            _subcriptionService = subcriptionService;
            _currentUser = currentUser;
        }

        public async Task ActiveServiceAsync(List<Guid> childServiceIds, Guid? jobId)
        {
            var userId = _currentUser.GetId();
            if (userId == Guid.Empty) throw new BusinessException("User not found");

            foreach (var childServiceId in childServiceIds)
            {
                var childService = await _childServiceRepository.GetAsync(childServiceId);
                if (childService.IsActive == false) throw new BusinessException("ChildService not active");
                if (childService == null) throw new BusinessException("ChildService not found");

                var userChildService = await _userChildServiceRepository.FindAsync(
                    x => x.ChildServiceId == childServiceId &&
                         x.UserId == userId);

                // lần đầu user dùng child service → tạo mới đúng cái đang xử lý
                if (userChildService == null)
                {
                    var newUserChildService = await CreateUserChildServiceAsync(userId, childServiceId);
                    await ApplyServiceForJobAsync(childService, jobId, newUserChildService.Id);
                    continue;
                }

                // user đang sử dụng dở
                if (userChildService.Status == SubcriptionContance.ChildServiceStatus.Active)
                {
                    if (userChildService.UsedTime >= userChildService.TotalUsageLimit)
                        throw new BusinessException("Used time limit");

                    userChildService.UsedTime += 1;
                }
                else
                {
                    // mua mới, reset lại
                    userChildService.Status = SubcriptionContance.ChildServiceStatus.Active;
                    userChildService.UsedTime = 0;
                }

                await _userChildServiceRepository.UpdateAsync(userChildService, true);
                await ApplyServiceForJobAsync(childService, jobId, userChildService.Id);
            }
        }
        private async Task ApplyServiceForJobAsync(Models.Subcription.ChildService childService, Guid? jobId, Guid userChildServiceId)
        {

            if (childService.Target == SubcriptionContance.ServiceTarget.JobPost)
            {
                if (jobId == null || jobId == Guid.Empty) throw new BusinessException("Job not found");
                await _jobAffectingService.ApplyServiceToJob(
                    new EffectingJobServiceCreateDto
                    {
                        ChildServiceId = childService.Id,
                        JobPostId = jobId ?? Guid.Empty,
                        User_ChildServiceId = userChildServiceId
                    });
            }

            await _jobPostService.PostJobAsync(new PostJobDto
            {
                JobId = jobId ?? Guid.Empty,
                ChildServiceIds = null
            });
        }


        private async Task<User_ChildService> CreateUserChildServiceAsync(Guid userId, Guid childServiceId)
        {
            var childService = await _childServiceRepository.GetAsync(childServiceId);
            if (childService == null) throw new BusinessException("ChildService not found");

            DateTime? endDate = null;
            if (childService.IsLifeTime == false) endDate = DateTime.Now.AddDays((double)childService.DayDuration);
            var userChildService = new User_ChildService()
            {
                TotalUsageLimit = childService.TimeUsedLimit,
                IsLifeTime = childService.IsLifeTime,
                IsLimitUsedTime = childService.IsLimitUsedTime,
                ChildServiceId = childServiceId,
                UserId = userId,
                Status = SubcriptionContance.ChildServiceStatus.Active,
                StartDate = DateTime.UtcNow,
                EndDate = endDate,
                UsedTime = 0,
            };
            return await _userChildServiceRepository.InsertAsync(userChildService, true);
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
