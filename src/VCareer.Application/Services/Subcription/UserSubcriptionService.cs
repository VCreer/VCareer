using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
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
using VCareer.Permission;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Uow;
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
        public UserSubcriptionService(ISubcriptionServiceRepository subcriptionServiceRepository, IUser_SubcriptionServicerRepository user_SubcriptionServicerRepository, ISubcriptionService subcriptionService, IUser_ChildServiceRepository user_ChildServiceRepository, IUser_ChildService user_ChildService_Service)
        {
            _subcriptionServiceRepository = subcriptionServiceRepository;
            _user_SubcriptionServicerRepository = user_SubcriptionServicerRepository;
            _subcriptionService = subcriptionService;
            _user_ChildServiceRepository = user_ChildServiceRepository;
            _user_ChildService_Service = user_ChildService_Service;
        }
        [Authorize(VCareerPermission.SubcriptionService.Buy)]
        public async Task BuySubcription(User_SubcirptionCreateDto dto)
        {
            // chạy luồng payment nếu thành công thì tạo 1 UserSubcription
            var userSubcription = await CreateUserSubcription(dto);
            if (userSubcription == null) throw new BusinessException("Error when create user subcription");

            //logic chay cac child subcription ma auto active
            var childServices = await _subcriptionService.GetChildServices(userSubcription.SubcriptionServiceId, true);
            foreach (var childService in childServices)
            {
                if (childService.IsAutoActive)
                {
                    await _user_ChildService_Service.ActiveServiceAsync(new User_ChildServiceCreateDto()
                    {
                        UserId = dto.UserId,
                        ChildServiceId = childService.CHildServiceId,
                    });
                }
            }
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

            var userSubcription = new User_SubcriptionService()
            {
                UserId = dto.UserId,
                SubcriptionServiceId = dto.SubcriptionServiceId,
                EndDate = endDate,
                StartDate = startDate,
                status = dto.status,
            };

            await _user_SubcriptionServicerRepository.InsertAsync(userSubcription);
            return ObjectMapper.Map<User_SubcriptionService, User_SubcirptionViewDto>(userSubcription);
        }
        public async Task CancleUserSubcription(Guid UserSubcriptionId)
        {
            var userSubcriptionService = await _user_SubcriptionServicerRepository.FirstOrDefaultAsync(x => x.Id == UserSubcriptionId);
            if (userSubcriptionService == null) throw new BusinessException("UserSubcriptionService not found");

            userSubcriptionService.status = SubcriptionContance.SubcriptionStatus.Cancelled;
            await _user_SubcriptionServicerRepository.UpdateAsync(userSubcriptionService);
        }
        public async Task<List<SubcriptionsViewDto>> GetAllSubcriptionsByUser(Guid userId, int? status, PagingDto pagingDto)
        {
            var query = await _user_SubcriptionServicerRepository.GetQueryableAsync();
            query = query
              .Where(x => x.UserId == userId)
              .Include(x => x.SubcriptionService);

            if (status != null && Enum.IsDefined(typeof(SubcriptionStatus), status))
            {
                var parsedStatus = (SubcriptionStatus)status;
                query = query.Where(x => x.status == parsedStatus);
            }
            var result = await query
                .Skip(pagingDto.PageIndex * pagingDto.PageSize)
                .Take(pagingDto.PageSize)
                .Select(x => x.SubcriptionService)
                .ToListAsync();

            if (!result.Any()) return new List<SubcriptionsViewDto>();
            return ObjectMapper.Map<List<SubcriptionService>, List<SubcriptionsViewDto>>(result);

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


    }
}
