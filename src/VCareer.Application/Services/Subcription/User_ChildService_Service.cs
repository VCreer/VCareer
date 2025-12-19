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
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;
using Volo.Abp.Uow;
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
        [UnitOfWork(true)]
        public async Task ActiveServiceAsync(List<User_ChildServiceActiveDto> childServiceIdWithSubcriptionsIds, Guid? jobId)
        {
            var userId = _currentUser.GetId();
            if (userId == Guid.Empty) throw new BusinessException("User not found");

            // xử lý từng childservice được kích hoạt trong 1 hoặc nhiều gói dịch vụ 
            foreach (var item in childServiceIdWithSubcriptionsIds)
            {
                var childService = await _childServiceRepository.FindAsync(item.ChildServiceId);
                if (childService == null) throw new BusinessException("ChildService not found");

                if (childService.IsEnable == false) throw new UserFriendlyException("ChildService is closed by employee");
                if(childService.IsAutoActive) ExecuteChildServiceAutoActive();
                if(childService.IsLifeTime) ExecuteChildServiceLifeTime();
                if(!childService.IsLimitUsedTime) ExecuteChildServiceNotLimitTimeUse();

                var userSubcription = await _user_SubcriptionServicerRepository.FirstOrDefaultAsync(x => x.Id == item.UserSubcriptionServiceId);
                if (userSubcription == null) throw new BusinessException("UserSubcriptionService not found");
                var ownerId = userSubcription.UserId;

                // lấy theo thằng active để phục vụ trường hợp nếu nó chưa active bh thì cho tạo mới
                // các lần sau nếu dùng tiếp thì ko cần tạo mới nữa
                var userChildServices = await _userChildServiceRepository.GetListAsync(
                x => x.ChildServiceId == item.ChildServiceId &&
                 x.UserSubcriptionId == item.UserSubcriptionServiceId) ?? new List<User_ChildService>();

                //là thằng đang xử lý hiện tại
                var userChildServiceNeedActive = userChildServices.Where(x => x.UserActiveId == userId).FirstOrDefault();

                //xử lý trường hợp child service của gói dịch vụ đã được kích hoạt rồi nhưng hết lượt dùng
                var timeUsed = await CalculateTimeUsed(item.ChildServiceId, item.UserSubcriptionServiceId);
                if (timeUsed >= childService.TimeUsedLimit)
                {
                    await SetUsageLimitReach(userChildServices);
                    continue;
                }

                //trường hợp kích hoạt rồi vẫn còn lượt dùng
                // lần đầu kích hoạt child service hoặc  lần đầu thằng user này dùng
                if (userChildServices.Count == 0 || userChildServiceNeedActive == null)
                {
                    var newUserChildService = await ExecuteCreateNewUserChildService(
                         userId, item.ChildServiceId, item.UserSubcriptionServiceId, childService, jobId, timeUsed, userChildServices);

                    await ExecuteJobService(childService, jobId, newUserChildService);
                    continue;
                }

                //trường hợp kích hoạt rồi vẫn còn lượt dùng
                //tăng số lượt dùng riêng mỗi user childservice ko quan trọng owner kích hoạt hay ko
                userChildServiceNeedActive.UsedTime += 1;
                timeUsed += 1;

                //nếu mà dùng nốt lần này hết lượt thì set tất cả hết lượt luôn
                if (timeUsed >= childService.TimeUsedLimit)
                {
                    await SetUsageLimitReach(userChildServices);
                    break;
                }
                await _userChildServiceRepository.UpdateAsync(userChildServiceNeedActive, true);
                //trường hợp nếu dịch vụ là job thì nhảy vào đây chạy logic 
                await ExecuteJobService(childService, jobId, userChildServiceNeedActive);
            }
        }
        #region logic active service
        //ý là lần đầu kích hoạt cái gói con của cái gói dịch vụ này
        private async Task<User_ChildService> ExecuteCreateNewUserChildService(Guid userId, Guid childServiceId, Guid userSubcriptionServiceId, Models.Subcription.ChildService childService, Guid? jobId, int timeUsed, List<User_ChildService>? userChildServices)
        {
            var userChildService = await CreateUserChildServiceAsync(userId, childServiceId, userSubcriptionServiceId);
            //2 truờng hợp này cần quan tâm used time
            if (userChildService.IsLimitUsedTime && !userChildService.IsLifeTime)
            {
                userChildService.UsedTime = 1;
                timeUsed += 1;
                //check trường hợp chỉ dc dùng 1 lần

                //trường hợp chỉ dùng 1 lần là hết hạn
                if (timeUsed >= childService.TimeUsedLimit && userChildServices.Count == 0)
                {
                    userChildService.Status = ChildServiceStatus.UsageLimitReached;
                }

                //trường hợp dùng nốt lần này là hết hạn luôn
                if (timeUsed >= childService.TimeUsedLimit && userChildServices != null)
                {
                    userChildServices.Add(userChildService);
                    await SetUsageLimitReach(userChildServices);
                }

                await _userChildServiceRepository.UpdateAsync(userChildService, true);
            }
            return userChildService;
        }
        private async Task<int> CalculateTimeUsed(Guid childServiceId, Guid userSubcriptionServiceId)
        {

            var userChildServices = await _userChildServiceRepository.GetListAsync(
                        x => x.ChildServiceId == childServiceId &&
                             x.UserSubcriptionId == userSubcriptionServiceId);

            if (userChildServices == null || userChildServices.Count == 0) return 0;
            int totalUsedTime = 0;
            foreach (var item in userChildServices)
            {

                totalUsedTime += (int)item.UsedTime;
            }
            return totalUsedTime;
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

            var ownerId = userSubcriptionService.UserId;
            bool isOwner = userId == ownerId;

            DateTime? endDate = null;
            if (childService.IsLifeTime == false) endDate = DateTime.Now.AddDays((double)childService.DayDuration);
            var userChildService = new User_ChildService()
            {
                UserSubcriptionId = userSubcriptionServiceId,
                TotalUsageLimit = childService.TimeUsedLimit,
                IsLifeTime = childService.IsLifeTime,
                IsLimitUsedTime = childService.IsLimitUsedTime,
                ChildServiceId = childServiceId,
                UserActiveId = userId,
                OwnerId = ownerId,
                Status = SubcriptionContance.ChildServiceStatus.Active,
                StartDate = DateTime.UtcNow,
                EndDate = endDate,
                UsedTime = 0,
                IsPrimaryOwner = isOwner
            };
            return await _userChildServiceRepository.InsertAsync(userChildService, true);
        }
        private async Task SetUsageLimitReach(List<User_ChildService> userChildServices)
        {
            foreach (var userChildService in userChildServices) userChildService.Status = ChildServiceStatus.UsageLimitReached;
            await _userChildServiceRepository.UpdateManyAsync(userChildServices, true);
        }
        private async Task ExecuteJobService(Models.Subcription.ChildService childService, Guid? jobId, User_ChildService userChildService)
        {
            //đây chính là kích hoạt childservice kiểu đẩy job, các service loại action khác thì thêm vào 
            if (childService.Target == SubcriptionContance.ServiceTarget.JobPost &&
                     (childService.Action == ServiceAction.BoostScoreJob ||
                     childService.Action == ServiceAction.TopList))
            {
                if (jobId == null || jobId == Guid.Empty) throw new BusinessException("Job not found");
                await ApplyServiceForJobAsync(childService, jobId, userChildService.Id);
            }
        }
        #endregion
        #region case childservice 
        private void ExecuteChildServiceLifeTime() { 
        throw new UserFriendlyException("This Service is Developing");
        }
        private void ExecuteChildServiceNotLimitTimeUse() {
            throw new UserFriendlyException("This Service is Developing");
        }

        private void ExecuteChildServiceAutoActive() {
            throw new UserFriendlyException("This Service is Developing");
        }
        #endregion

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
