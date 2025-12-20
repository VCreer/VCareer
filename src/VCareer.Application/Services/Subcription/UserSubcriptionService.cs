using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants.JobConstant;
using VCareer.Dto.Subcriptions;
using VCareer.IRepositories.Profile;
using VCareer.IRepositories.Subcriptions;
using VCareer.IServices.Common;
using VCareer.IServices.IAuth;
using VCareer.IServices.Subcriptions;
using VCareer.Models.Subcription;
using VCareer.Permission;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;
using Volo.Abp.Uow;
using Volo.Abp.Users;
using static VCareer.Constants.JobConstant.SubcriptionContance;

namespace VCareer.Services.Subcription
{
    public class UserSubcriptionService : ApplicationService, IUserSubcriptionService
    {
        private readonly ISubcriptionServiceRepository _subcriptionServiceRepository;
        private readonly IUser_SubcriptionServicerRepository _user_SubcriptionServicerRepository;
        private readonly ISubcriptionService _subcriptionService;
        private readonly IUser_ChildServiceRepository _user_ChildServiceRepository;
        private readonly IUser_ChildService _user_ChildService_Service;
        private readonly IdentityRoleManager _roleManager;
        private readonly IdentityUserManager _userManager;
        private readonly ICurrentUser _currentUser;
        private readonly IRecruiterRepository _recruiterRepository;
        public UserSubcriptionService(
            ISubcriptionServiceRepository subcriptionServiceRepository,
            IUser_SubcriptionServicerRepository user_SubcriptionServicerRepository,
            ISubcriptionService subcriptionService,
            IUser_ChildServiceRepository user_ChildServiceRepository,
            ICurrentUser currentUser,
            IdentityUserManager userManager,
            IdentityRoleManager roleManager,
            IRecruiterRepository recruiterRepository,
            IUser_ChildService user_ChildService_Service)
        {
            _subcriptionServiceRepository = subcriptionServiceRepository;
            _user_SubcriptionServicerRepository = user_SubcriptionServicerRepository;
            _subcriptionService = subcriptionService;
            _user_ChildServiceRepository = user_ChildServiceRepository;
            _user_ChildService_Service = user_ChildService_Service;
            _recruiterRepository = recruiterRepository;
            _roleManager = roleManager;
            _userManager = userManager;
            _currentUser = currentUser;
        }
        [Authorize(VCareerPermission.SubcriptionService.Buy)]
        public async Task BuySubcription(User_SubcirptionCreateDto dto)
        {
            // chạy luồng payment nếu thành công thì tạo 1 UserSubcription
            var userSubcription = await CreateUserSubcription(dto);
            if (userSubcription == null) throw new BusinessException("Error when create user subcription");

            //logic chay cac child subcription ma auto active
            var childServices = await _subcriptionService.GetChildServices(userSubcription.SubcriptionServiceId, true);
            List<User_ChildServiceActiveDto> listAutoActiveChildService = new List<User_ChildServiceActiveDto>();
            foreach (var childService in childServices)
            {
                if (childService.IsAutoActive)
                {
                    listAutoActiveChildService.Add(new User_ChildServiceActiveDto
                    {
                        ChildServiceId = childService.Id,
                        UserSubcriptionServiceId = userSubcription.Id,
                    });
                }
            }
            if (listAutoActiveChildService != null || listAutoActiveChildService.Count > 0)
                await _user_ChildService_Service.ActiveServiceAsync(listAutoActiveChildService, null);
        }
        public async Task<User_SubcirptionViewDto> CreateUserSubcription(User_SubcirptionCreateDto dto)
        {
            var subcriptionService = await _subcriptionServiceRepository.GetAsync(dto.SubcriptionServiceId);
            var startDate = DateTime.Now;
            DateTime? endDate = null;
            if (!subcriptionService.IsLifeTime)
            {
                endDate = startDate.AddDays((double)subcriptionService.DayDuration);
            }
            if (!subcriptionService.IsActive) throw new BusinessException("SubcriptionService is not active");
            var listSerivceBoughtedAndWorking = await SubcriptionBoughtedAndActive(dto.UserId, dto.SubcriptionServiceId);
            if (listSerivceBoughtedAndWorking != null)
            {
                foreach (var serviceId in listSerivceBoughtedAndWorking)
                {
                    if (dto.SubcriptionServiceId == serviceId) throw new BusinessException("You have already bought this subcription and it still working");
                }
            }

            var userSubcription = new User_SubcriptionService()
            {
                UserId = dto.UserId,
                SubcriptionServiceId = dto.SubcriptionServiceId,
                EndDate = endDate,
                StartDate = startDate,
                status = SubcriptionStatus.Active,
            };

            await _user_SubcriptionServicerRepository.InsertAsync(userSubcription);
            return ObjectMapper.Map<User_SubcriptionService, User_SubcirptionViewDto>(userSubcription);
        }
        public async Task CancleUserSubcription(Guid subcriptionServiceId)
        {
            var userId = _currentUser.GetId();
            if (userId == Guid.Empty) throw new UserFriendlyException("User not found");

            var subcriptionService = await _subcriptionServiceRepository.FirstOrDefaultAsync(x => x.Id == subcriptionServiceId);
            if (subcriptionService == null) throw new BusinessException("SubcriptionService not found");

            var userSubcriptionService = await _user_SubcriptionServicerRepository.FirstOrDefaultAsync(x => x.SubcriptionServiceId == subcriptionServiceId && x.UserId == userId && x.status == SubcriptionContance.SubcriptionStatus.Active);

            if (userSubcriptionService == null) throw new BusinessException("UserSubcriptionService not found");
            if (userSubcriptionService.status != SubcriptionStatus.Active) throw new UserFriendlyException("SubcriptionService is aldready cancel or expired");

            userSubcriptionService.status = SubcriptionContance.SubcriptionStatus.Cancelled;
            await _user_SubcriptionServicerRepository.UpdateAsync(userSubcriptionService);
        }

        public async Task<User_SubcirptionViewDto> GetUserSubcriptionService(Guid UserSubcriptionServiceId)
        {
            var userSubcriptionService = await _user_SubcriptionServicerRepository.FirstOrDefaultAsync(x => x.Id == UserSubcriptionServiceId);
            if (userSubcriptionService == null) throw new BusinessException("UserSubcriptionService not found");

            return ObjectMapper.Map<User_SubcriptionService, User_SubcirptionViewDto>(userSubcriptionService);
        }
        public async Task UpdateUserSubcription(User_SubcirptionUpdateDto dto)
        {
            var userSubcriptionService = await _user_SubcriptionServicerRepository.FirstOrDefaultAsync(x => x.Id == dto.User_SubcriptionId);
            if (userSubcriptionService == null) throw new BusinessException("UserSubcriptionService not found");

            userSubcriptionService.status = dto.status;
            userSubcriptionService.EndDate = dto.EndDate;

            await _user_SubcriptionServicerRepository.UpdateAsync(userSubcriptionService);
        }
        public async Task<List<Guid>>? SubcriptionBoughtedAndActive(Guid UserId, Guid SubcriptionServiceId)
        {
            var boughtedServiceAndStillActive = await _user_SubcriptionServicerRepository.GetListAsync(x => x.SubcriptionServiceId == SubcriptionServiceId && x.status == SubcriptionStatus.Active && x.UserId == UserId);

            return boughtedServiceAndStillActive.Select(x => x.Id).ToList();
        }
        //cai nay dung de show len cac childservice voi target laf job post ma nguoi dung co quyen dung sau khi mua goi
        public async Task<List<OptionsChildServiceViewDto>> GetJobChildServiceAllowForUserAsync(int? serviceAction=null)
        {
            var userId = _currentUser.GetId();
            if (userId == Guid.Empty) throw new UserFriendlyException("User not found");

            ServiceAction? parsedServiceAction = null;
            if (serviceAction.HasValue && Enum.IsDefined(typeof(ServiceAction), serviceAction.Value))
                parsedServiceAction = (ServiceAction)serviceAction.Value;

            // lấy các thông tin hiển thị bao gồm 2 trường hợp là tự mua 2 là dùng ké
            var listChildServiceValidLoad = new List<OptionsChildServiceViewDto>();

            var listOptionChildServiceOfUser = await GetAllSubcriptionsByUser(userId, 1, new PagingDto { PageIndex = 0, PageSize = 10 }, parsedServiceAction);
            var listOptionsChildServiceGetShareByCompany = await GetSubcriptionIsSharingInCompany(userId, parsedServiceAction);
            listChildServiceValidLoad.AddRange(listOptionChildServiceOfUser);
            listChildServiceValidLoad.AddRange(listOptionsChildServiceGetShareByCompany);

            return listChildServiceValidLoad;
        }
        #region logic load allow childserrvice
        public async Task<List<OptionsChildServiceViewDto>> GetAllSubcriptionsByUser(Guid userId, int? status, PagingDto pagingDto, ServiceAction? serviceAction)
        {
            await UpdateExpireSatusUserSubcriptionOfUser(userId);

            //lấy ra list các gói người dùng đã mua có lọc theo cả status
            var query = await _user_SubcriptionServicerRepository.GetQueryableAsync();
            query = query
              .Where(x => x.UserId == userId)
              .Include(x => x.SubcriptionService);

            if (status != null && Enum.IsDefined(typeof(SubcriptionStatus), status))
            {
                var parsedStatus = (SubcriptionStatus)status;
                query = query.Where(x => x.status == parsedStatus);
            }
            var listUserSubcription = await query
                .Skip((pagingDto.PageIndex) * pagingDto.PageSize)
                .Take(pagingDto.PageSize)
                              .ToListAsync();
            return await GetOptionsChildService(listUserSubcription, userId, serviceAction);
        }
        private async Task<List<OptionsChildServiceViewDto>> GetSubcriptionIsSharingInCompany(Guid userId, ServiceAction? serviceAction)
        {
            await UpdateExpireSatusUserSubcriptionOfUser(userId);

            //chi lay hr staff
            var recruiterInfo = await _recruiterRepository.FirstOrDefaultAsync(x => x.UserId == _currentUser.GetId());
            if (recruiterInfo == null) return new List<OptionsChildServiceViewDto>();
            if (recruiterInfo.IsLead) return new List<OptionsChildServiceViewDto>();

            var leaderRecruiterIdOfCompany = await _recruiterRepository.FirstOrDefaultAsync(x => x.CompanyId == recruiterInfo.CompanyId && x.IsLead == true);
            if (leaderRecruiterIdOfCompany == null) return new List<OptionsChildServiceViewDto>();

            //lấy ra các gói đang dùng cho phép dùng chung
            var query = await _user_SubcriptionServicerRepository.GetQueryableAsync();
            var listUserSubcription = await query
              .Where(x => x.UserId == leaderRecruiterIdOfCompany.UserId &&
              x.IsShared == true &&
              x.status == SubcriptionStatus.Active)
              .Include(x => x.SubcriptionService).ToListAsync();

            return await GetOptionsChildService(listUserSubcription, userId, serviceAction);
        }
        private async Task<List<OptionsChildServiceViewDto>> GetOptionsChildService(List<User_SubcriptionService> listUserSubcription, Guid userId, ServiceAction? serviceAction)
        {
            // lấy ra list đầy đủ các thông tin để hiển thị cho người dùng bao gồm các gói con, số lượng lần đã dùng , được dùng
            //và handle cả trường hợp  các childservice chưa được dùng hoặc đã được dùng
            var listOptionChildService = new List<OptionsChildServiceViewDto>();
            foreach (var userSubcription in listUserSubcription)
            {
                var userSubcriptionViewDto = ObjectMapper.Map<User_SubcriptionService, User_SubcirptionViewDto>(userSubcription);

                var subcriptionService = await _subcriptionServiceRepository.GetAsync(userSubcription.SubcriptionServiceId);
                var subcriptionsViewDto = ObjectMapper.Map<SubcriptionService, SubcriptionsViewDto>(subcriptionService);

                var listChildService = await _subcriptionService.GetChildServices(userSubcription.SubcriptionServiceId, true);
                if (listChildService == null || listChildService.Count == 0) continue;
                if (serviceAction != null) listChildService.Where(x => x.Action == serviceAction).ToList();

                foreach (var childService in listChildService)
                {
                    if (childService.IsAutoActive) continue; // chi lay cac child service khong auto active
                    var user_childServices = await _user_ChildServiceRepository.FindAsync(
                        x => x.ChildServiceId == childService.Id &&
                        x.UserSubcriptionId == userSubcription.Id);

                    var option = new OptionsChildServiceViewDto();
                    //trường hợp chưa dùng dịch vụ con nên uerchildservice null
                    if (user_childServices == null)
                    {
                        option = new OptionsChildServiceViewDto
                        {
                            childService = childService,
                            user_ChildServices = null,
                            user_subcription = userSubcriptionViewDto,
                            subcriptionsViewDto = subcriptionsViewDto
                        };
                    }
                    else
                    //trường hợp đã dùng dịch vụ con nên có uerchildservice  
                    {
                        option = new OptionsChildServiceViewDto
                        {
                            childService = childService,
                            user_ChildServices = ObjectMapper.Map<User_ChildService, User_ChildServiceViewDto>(user_childServices),
                            user_subcription = userSubcriptionViewDto,
                            subcriptionsViewDto = subcriptionsViewDto
                        };
                    }
                    listOptionChildService.Add(option);
                }
            }
            return listOptionChildService;
        }
        private async Task UpdateExpireSatusUserSubcriptionOfUser(Guid userId)
        {
            var userSubcriptionServices = await _user_SubcriptionServicerRepository.GetListAsync(x => x.UserId == userId && x.status == SubcriptionStatus.Active);

            if (userSubcriptionServices == null || userSubcriptionServices.Count == 0) return;
            foreach (var userSubcription in userSubcriptionServices)
            {
                if (userSubcription.EndDate < DateTime.Now)
                {
                    userSubcription.status = SubcriptionStatus.Expired;
                    await _user_SubcriptionServicerRepository.UpdateAsync(userSubcription);
                }
            }
        }
        public async Task SetStatusShareSuubcriptionService(Guid user_subcriptionServiceId, bool isShare)
        {
            var userSubcription = await _user_SubcriptionServicerRepository.GetAsync(x => x.Id == user_subcriptionServiceId);
            if(userSubcription==null) throw new BusinessException("UserSubcriptionService not found");

            var subcriptionService =await _subcriptionServiceRepository.GetAsync(x => x.Id == userSubcription.SubcriptionServiceId);
            if(subcriptionService==null) throw new BusinessException("SubcriptionService not found");
            if(!subcriptionService.IShareable) throw new UserFriendlyException("This subcription service is not allow to share");
            userSubcription.IsShared = isShare;
            await _user_SubcriptionServicerRepository.UpdateAsync(userSubcription);
        }

        #endregion
    }
}
