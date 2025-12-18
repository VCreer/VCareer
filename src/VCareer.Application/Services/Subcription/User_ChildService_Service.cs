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
using VCareer.Models.Job;
using VCareer.Models.Subcription;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Identity;
using Volo.Abp.Users;
using static VCareer.Constants.JobConstant.SubcriptionContance;
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
        public readonly IUser_SubcriptionServicerRepository _user_SubcriptionServicerRepository;

        public User_ChildService_Service(
            IJobAffectingService jobAffectingService,
            IUser_ChildServiceRepository userChildServiceRepository,
            IChildServiceRepository childServiceRepository,
            ICurrentUser currentUser,
            ISubcriptionService subcriptionService,
            IJobPostService jobPostService,
            IUser_SubcriptionServicerRepository user_SubcriptionServicerRepository,
            IdentityUserManager identityManager)
        {
            _jobAffectingService = jobAffectingService;
            _userChildServiceRepository = userChildServiceRepository;
            _childServiceRepository = childServiceRepository;
            _identityManager = identityManager;
            _jobPostService = jobPostService;
            _subcriptionService = subcriptionService;
            _user_SubcriptionServicerRepository = user_SubcriptionServicerRepository;
            _currentUser = currentUser;
        }

        //hàm tổng xử lý khi kích hoạt các dịch vụ con , vứt các dịch vụ con khác vào đây mà xử lý dựa theo action haowcj target
        public async Task ActiveServiceAsync(List<User_ChildServiceActiveDto> childServiceIdWithSubcriptionsIds, Guid? jobId)
        {
            var userId = _currentUser.GetId();
            if (userId == Guid.Empty) throw new BusinessException("User not found");

            foreach (var item in childServiceIdWithSubcriptionsIds)
            {
                var childService = await _childServiceRepository.FindAsync(item.ChildServiceId);
                if (childService == null) throw new BusinessException("ChildService not found");
                if (childService.IsActive == false) throw new BusinessException("ChildService not active");


                // nói cách khác là user mua các gói dịch vụ có chung childservice sẽ có các user childservice  có chung userid , childserviceid
                //nên phải list ra để check cái nào có số lượng dùng thfi dùng , cái nào hết thì bỏ qua
                var userChildService = await _userChildServiceRepository.FindAsync(
                    x => x.ChildServiceId == item.ChildServiceId &&
                         x.UserId == userId && x.UserSubcriptionId == item.UserSubcriptionServiceId);

                // lần đầu user dùng child service → tạo mới đúng cái đang xử lý
                if (userChildService == null)
                {
                    userChildService = await CreateUserChildServiceAsync(userId, item.ChildServiceId, item.UserSubcriptionServiceId);
                    userChildService.UsedTime = 1;
                    //check trường hợp chỉ dc dùng 1 lần
                    if (userChildService.UsedTime >= userChildService.TotalUsageLimit)
                        userChildService.Status = ChildServiceStatus.UsageLimitReached;

                    await _userChildServiceRepository.UpdateAsync(userChildService, true);
                    //đây chính là kích hoạt childservice kiểu đẩy job, các service loại action khác thì thêm vào 
                    if (childService.Target == SubcriptionContance.ServiceTarget.JobPost &&
                             (childService.Action == ServiceAction.BoostScoreJob ||
                             childService.Action == ServiceAction.TopList)) await ApplyServiceForJobAsync(childService, jobId, userChildService.Id);
                    continue;
                }


                if (userChildService.Status != ChildServiceStatus.Active) continue;
                //trường hợp hết số lần dùng 
                if (userChildService.UsedTime >= userChildService.TotalUsageLimit)
                {
                    userChildService.Status = ChildServiceStatus.UsageLimitReached;
                    await _userChildServiceRepository.UpdateAsync(userChildService, true);
                    continue;
                }

                //vẫn còn lượt dùng
                userChildService.UsedTime += 1;

                if (userChildService.UsedTime >= userChildService.TotalUsageLimit)
                    userChildService.Status = ChildServiceStatus.UsageLimitReached;


                await _userChildServiceRepository.UpdateAsync(userChildService, true);
                if (childService.Target == SubcriptionContance.ServiceTarget.JobPost &&
                        (childService.Action == ServiceAction.BoostScoreJob ||
                        childService.Action == ServiceAction.TopList)) await ApplyServiceForJobAsync(childService, jobId, userChildService.Id);
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

        private async Task<User_ChildService> CreateUserChildServiceAsync(Guid userId, Guid childServiceId, Guid userSubcriptionServiceId)
        {
            var childService = await _childServiceRepository.GetAsync(childServiceId);
            if (childService == null) throw new BusinessException("ChildService not found");

            var userSubcriptionService = await _user_SubcriptionServicerRepository.FindAsync(userSubcriptionServiceId);
            if (userSubcriptionService == null) throw new BusinessException("UserSubcriptionService not found");

            DateTime? endDate = null;
            if (childService.IsLifeTime == false) endDate = DateTime.Now.AddDays((double)childService.DayDuration);
            var userChildService = new User_ChildService()
            {
                UserSubcriptionId = userSubcriptionServiceId,
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
        public async Task<List<User_ChildServiceViewDto>> GetUserChildServiceByUserSubcriptionIdAsync(Guid userSubcriptionId)
        {
            var list = await _user_SubcriptionServicerRepository.FindAsync(x => x.Id == userSubcriptionId);
            if (list == null) throw new BusinessException("UserSubcriptionService not found");

            var listUserCHildService = await _userChildServiceRepository.GetListAsync(x => x.UserSubcriptionId == userSubcriptionId);
            if (listUserCHildService == null) return new List<User_ChildServiceViewDto>();
            return ObjectMapper.Map<List<User_ChildService>, List<User_ChildServiceViewDto>>(listUserCHildService);
        }
        public Task UpdateUser_ChildServiceAsync(User_ChildServiceUpdateDto dto)
        {
            throw new NotImplementedException();
        }
    }
}
