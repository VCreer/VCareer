using AutoMapper.Execution;
using JetBrains.Annotations;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Dto.Subcriptions;
using VCareer.IRepositories.Subcriptions;
using VCareer.IServices.Common;
using VCareer.IServices.Subcriptions;
using VCareer.Models.Subcription;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.ObjectMapping;
using Volo.Abp.Uow;
using static VCareer.Constants.JobConstant.SubcriptionContance;

namespace VCareer.Services.Subcription
{
    [Route("api/app/childservice-service")]
    public class ChildService_Service : ApplicationService, IChildService_Service
    {
        private readonly IChildServiceRepository _childServiceRepository;
        private readonly IUser_ChildServiceRepository _userChildServiceRepository;
        private readonly IEffectingJobServiceRepository _effectingJobServiceRepository;

        public ChildService_Service(
            IChildServiceRepository childServiceRepository,
            IUser_ChildServiceRepository user_ChildServiceRepository,
            IEffectingJobServiceRepository effectingJobServiceRepository
            )
        {
            _childServiceRepository = childServiceRepository;
            _userChildServiceRepository = user_ChildServiceRepository;
            _effectingJobServiceRepository = effectingJobServiceRepository;
        }
        [HttpPost("create-childservice")]
         public async Task CreateChildServiceAsync(ChildServiceCreateDto dto)
        {
            if (dto.IsLifeTime && dto.TimeUsedLimit > 0) throw new BusinessException("Can't Have timelimit when IsLifeTime");
            if (dto.IsLifeTime == false && dto.TimeUsedLimit <= 0) throw new BusinessException("Need have timeUsedLimit when not IsLifeTime");
            if (dto.DayDuration < 0 || dto.TimeUsedLimit < 0) throw new BusinessException("DayDuration and TimeUsedLimit must be greater than 0");
            var newChildService = new ChildService
            {
                Action = dto.Action,
                DayDuration = dto.DayDuration,
                Description = dto.Description,
                IsActive = dto.IsActive,
                IsAutoActive = dto.IsAutoActive,
                IsLifeTime = dto.IsLifeTime,
                Name = dto.Name,
                Target = dto.Target,
                TimeUsedLimit = dto.TimeUsedLimit,
                Value = dto.Value,
            };
            await _childServiceRepository.InsertAsync(newChildService, true);
        }

        //sẽ ko hiển thị để người dùng mới dùng nữa
        //đối với người dùng đã mua gói thì vẫn sẽ cho dùng nốt đến hết hạn 
        [HttpDelete("delete-childservice")]
           public async Task DeleteChildServiceAsync(Guid childServiceId)
        {
            var childService = await _childServiceRepository.FindAsync(childServiceId);
            if (childService == null) throw new BusinessException("ChildService not found");
            childService.IsActive = false;

            await _childServiceRepository.UpdateAsync(childService, true);
        }

        //khẩn cấp dừng dịch vụ trên tất cả user
        [UnitOfWork(true)]
        [HttpPut("stop-agent-childservice")]
        public async Task StopAgentCHildServiceAsync(Guid childServiceId)
        {
            var childService = await _childServiceRepository.FindAsync(childServiceId);
            if (childService == null) throw new BusinessException("ChildService not found");
            if (childService.IsActive == false) return;
            childService.IsActive = false;

            await StopEffectingJobServiceAsync(childServiceId);
            await StopUserChildServiceAsync(childServiceId);

            //gui mail thong bao user
        }

        #region logic stop agent child service
        private async Task StopEffectingJobServiceAsync(Guid childServiceId)
        {
            var effectingJobs = await _effectingJobServiceRepository.GetListAsync(es =>
            es.ChildServiceId == childServiceId &&
            es.Status == ChildServiceStatus.Active);
            if (effectingJobs.Count == 0) return;

            foreach (var effectingJob in effectingJobs)
                effectingJob.Status = Constants.JobConstant.SubcriptionContance.ChildServiceStatus.Inactive;
        }

        private async Task StopUserChildServiceAsync(Guid childServiceId)
        {
            var userChildServices = await _userChildServiceRepository.GetListAsync(u =>
            u.ChildServiceId == childServiceId &&
            u.Status == ChildServiceStatus.Active);
            if (userChildServices.Count == 0) return;

            foreach (var userChildService in userChildServices) userChildService.Status = ChildServiceStatus.Inactive;
        }


        #endregion

        // chi cho phep update 1 so truong noi dung
        [HttpPut("update-childservice")]
        public async Task UpdateChildServiceAsync(ChildServiceUpdateDto dto)
        {
            var childrenService = await _childServiceRepository.FindAsync(dto.CHildServiceId);
            if (childrenService == null) throw new BusinessException("Cann't find child service");

            childrenService.Name = dto.Name;
            childrenService.Description = dto.Description;
            childrenService.IsActive = dto.IsActive;

            await _childServiceRepository.UpdateAsync(childrenService);
        }

        [HttpPost("GetChildServices")]
        public async Task<List<ChildServiceViewDto>> GetChildServicesAsync(string? serviceAction, string? target, PagingDto paging)
        {
            var childServices = (await _childServiceRepository.GetQueryableAsync());
            if (!string.IsNullOrEmpty(serviceAction) && Enum.TryParse<ServiceAction>(serviceAction, true, out var parsedServiceAction)) childServices = childServices.Where(cs => cs.Action == parsedServiceAction);

            if (string.IsNullOrEmpty(target)&& Enum.TryParse<ServiceTarget>(target, true, out var parsedTarget)) childServices = childServices.Where(cs => cs.Target == parsedTarget);
            childServices = childServices.Skip(paging.PageIndex * paging.PageSize).Take(paging.PageSize);

            var result = await AsyncExecuter.ToListAsync(childServices);
            return ObjectMapper.Map<List<ChildService>, List<ChildServiceViewDto>>(result);
        }

    }
}
