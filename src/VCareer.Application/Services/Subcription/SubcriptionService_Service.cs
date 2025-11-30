using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using VCareer.Constants.JobConstant;
using VCareer.Dto.Subcriptions;
using VCareer.IRepositories.Payment;
using VCareer.IRepositories.Subcriptions;
using VCareer.IServices.Common;
using VCareer.IServices.Subcriptions;
using VCareer.Models.Subcription;
using VCareer.Models.Subcription_Payment;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using static VCareer.Constants.JobConstant.SubcriptionContance;

namespace VCareer.Services.Subcription
{
    public class SubcriptionService_Service : ApplicationService, ISubcriptionService
    {
        private readonly ISubcriptionServiceRepository _subcriptionServiceRepository;
        private readonly IChildService_SubcriptionServiceRepository _childService_SubcriptionServiceRepository;
        private readonly IChildServiceRepository _childServiceRepository;
        private readonly ISubcriptionPriceRepository _subcriptionPriceRepository;

        public SubcriptionService_Service(ISubcriptionServiceRepository subcriptionServiceRepository,
            IChildService_SubcriptionServiceRepository childService_SubcriptionServiceRepository,
            IChildServiceRepository childServiceRepository,
            ISubcriptionPriceRepository subcriptionPriceRepository)
        {
            _subcriptionServiceRepository = subcriptionServiceRepository;
            _childService_SubcriptionServiceRepository = childService_SubcriptionServiceRepository;
            _childServiceRepository = childServiceRepository;
            _subcriptionPriceRepository = subcriptionPriceRepository;
        }
        public async Task AddChildServiceAsync(AddChildServicesDto dto)
        {
            var subcriptionService = await _subcriptionServiceRepository
                .FirstOrDefaultAsync(x => x.Id == dto.SubcriptionId);

            if (subcriptionService == null)
                throw new BusinessException("Cannot find subscription service");
            if (dto.ChildServiceIds == null || dto.ChildServiceIds.Count == 0)
                throw new UserFriendlyException("You must choose at least one child service");

            //check xem co child service nao ko hop le ko
            await CheckChildServiceAsync(dto);
            // Kiểm tra những child-service đã map rồi
            var existingChildService = await GetChildServiceIdsNotMapped(dto);

            //tra ve list childserviceIds chua map
            var newMappings = dto.ChildServiceIds
                .Where(id => !existingChildService.Contains(id))
                .Select(id => new ChildService_SubcriptionService
                {
                    ChildServiceId = id,
                    SubcriptionServiceId = dto.SubcriptionId
                })
                .ToList();
            foreach (var m in newMappings)
            {
                await _childService_SubcriptionServiceRepository.InsertAsync(m);
            }
        }
        private async Task CheckChildServiceAsync(AddChildServicesDto dto)
        {
            var queryable = await _childServiceRepository.GetQueryableAsync();
            queryable = queryable.Where(x => dto.ChildServiceIds.Contains(x.Id) && x.IsActive);

            var childServices = await AsyncExecuter.ToListAsync(queryable);
            if (childServices.Count != dto.ChildServiceIds.Count)
                throw new BusinessException("Some child service not found or inactive");
        }
        private async Task<List<Guid>> GetChildServiceIdsNotMapped(AddChildServicesDto dto)
        {
            var query = await _childService_SubcriptionServiceRepository.GetQueryableAsync();
            var existingChildService = await AsyncExecuter.ToListAsync(
                query
                    .Where(x => x.SubcriptionServiceId == dto.SubcriptionId
                                && dto.ChildServiceIds.Contains(x.ChildServiceId))
                    .Select(x => x.ChildServiceId)
            );
            return existingChildService;

        }
        public async Task CreateSubCriptionAsync(SubcriptionsCreateDto dto)
        {
            if (dto.OriginalPrice < 0) throw new UserFriendlyException("OriginalPrice must be greater than 0");
            if (dto.TotalBuyEachUser <= 0) throw new UserFriendlyException("Incase buy limit , TotalBuyEachUser must be greater than 0");

            var newSubcription = new SubcriptionService()
            {
                Description = dto.Description,
                IsActive = dto.IsActive,
                IsLimited = dto.IsLimited,
                IsBuyLimited = dto.IsBuyLimited,
                Title = dto.Title,
                Target = dto.Target,
                TotalBuyEachUser = dto.TotalBuyEachUser,
                Status = dto.Status,
                OriginalPrice = dto.OriginalPrice,
                IsLifeTime = dto.IsLifeTime,
                DayDuration = dto.DayDuration
            };

            await _subcriptionServiceRepository.InsertAsync(newSubcription, true);
        }
        public async Task RemoveChildServiceAsync(AddChildServicesDto dto)
        {
            var query = await _childService_SubcriptionServiceRepository.GetQueryableAsync();
            var mappingsToRemove = await AsyncExecuter.ToListAsync(
                query.Where(x =>
                    x.SubcriptionServiceId == dto.SubcriptionId &&
                    dto.ChildServiceIds.Contains(x.ChildServiceId)
                )
            );

            if (!mappingsToRemove.Any())
                return;

            // Xóa đúng entity lấy từ DB
            foreach (var entity in mappingsToRemove)
            {
                await _childService_SubcriptionServiceRepository.DeleteAsync(entity);
            }
        }
        //xóa mềm này mục đích chỉ ảnh hưởng tới hiển thị đối với người chưa mua sẽ ko hiển thị
        //với người dùng mua vẫn sẽ hiển thị bình thường thông qua User subcriptionservice - mong là thế
        public async Task DeleteSubcriptionAsync(Guid subcriptionId)
        {
            var subcription = await _subcriptionServiceRepository.FirstOrDefaultAsync(x => x.Id == subcriptionId);
            if (subcription == null) throw new BusinessException("Subcription not found");
            subcription.IsActive = false;
            subcription.Status = SubcriptionContance.SubcriptionStatus.Inactive;
            await _subcriptionServiceRepository.UpdateAsync(subcription);
        }

        public async Task<List<ChildServiceViewDto>> GetChildServicesWithPaging(Guid subcriptionId, bool? isActive, PagingDto pagingDto)
        {
            var query = await _childService_SubcriptionServiceRepository.GetQueryableAsync();
            var childServiceIds = query.Where(x => x.SubcriptionServiceId == subcriptionId).Select(x => x.ChildServiceId);

            var childServiceQuery = await _childServiceRepository.GetQueryableAsync();
            if (isActive.HasValue) childServiceQuery = childServiceQuery.Where(x => x.IsActive == isActive);

            var childServices = childServiceQuery.Where(x => childServiceIds.Contains(x.Id))
                .Skip(pagingDto.PageIndex * pagingDto.PageSize)
                .Take(pagingDto.PageSize)
                .ToList();
            return ObjectMapper.Map<List<ChildService>, List<ChildServiceViewDto>>(childServices);
        }
        public async Task<List<ChildServiceViewDto>> GetChildServices(Guid subcriptionId, bool? isActive)
        {
            var query = await _childService_SubcriptionServiceRepository.GetQueryableAsync();
            var childServiceIds = query.Where(x => x.SubcriptionServiceId == subcriptionId).Select(x => x.ChildServiceId);

            var childServiceQuery = await _childServiceRepository.GetQueryableAsync();
            if (isActive.HasValue) childServiceQuery = childServiceQuery.Where(x => x.IsActive == isActive);

            var childServices = childServiceQuery
                .Where(x => childServiceIds
                .Contains(x.Id))
                .ToList();
            return ObjectMapper.Map<List<ChildService>, List<ChildServiceViewDto>>(childServices);
        }

        public async Task<SubcriptionsViewDto> GetSubcriptionService(Guid subcriptionId)
        {
            var subcriptionService = await _subcriptionServiceRepository.FirstOrDefaultAsync(x => x.Id == subcriptionId);
            if (subcriptionService == null) throw new UserFriendlyException("Subcription not found");
            return ObjectMapper.Map<SubcriptionService, SubcriptionsViewDto>(subcriptionService);
        }

        public async Task<List<SubcriptionPriceViewDto>> GetSubcriptionsPrice(Guid subcriptionId, bool? isExpired, PagingDto pagingDto)
        {
            var query = await _subcriptionPriceRepository.GetQueryableAsync();
            query = query.Where(x => x.SubcriptionServiceId == subcriptionId)
                         .AsNoTracking();

            if (isExpired == true)
                query = query.Where(x => x.EffectiveTo <= DateTime.Now);

            if (isExpired == false)
                query = query.Where(x => x.EffectiveTo >= DateTime.Now);

            query = query
                .Skip(pagingDto.PageIndex * pagingDto.PageSize)
                .Take(pagingDto.PageSize);

            var result = await AsyncExecuter.ToListAsync(query);

            return ObjectMapper.Map<List<SubcriptionPrice>, List<SubcriptionPriceViewDto>>(result);
        }


        public async Task UpdateSubcriptionAsync(SubcriptionsUpdateDto dto)
        {
            var subcriptionService = await _subcriptionServiceRepository.GetAsync(dto.SubcriptionId);
            if (subcriptionService == null) throw new BusinessException("Cannot find subscription service");
            subcriptionService.Title = dto.Title;
            subcriptionService.Description = dto.Description;
            subcriptionService.IsActive = dto.IsActive;
            subcriptionService.DayDuration = dto.DayDuration;

            await _subcriptionServiceRepository.UpdateAsync(subcriptionService);
        }

              public async Task<List<SubcriptionsViewDto>> GetActiveSubscriptionServicesAsync(string? target = null)
        {
            var query = await _subcriptionServiceRepository.GetQueryableAsync();
            query = query.Where(x => x.IsActive == true && x.Status == SubcriptionContance.SubcriptionStatus.Active);

            if (!string.IsNullOrWhiteSpace(target)
      && Enum.TryParse<SubcriptorTarget>(target, true, out var parsedTarget))
            {
                query = query.Where(x => x.Target == parsedTarget);
            }

            var services = await AsyncExecuter.ToListAsync(query);
            return ObjectMapper.Map<List<SubcriptionService>, List<SubcriptionsViewDto>>(services);
        }

    }
}
