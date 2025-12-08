using AutoMapper.Execution;
using JetBrains.Annotations;
using Microsoft.AspNetCore.Authorization;
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
using VCareer.Permission;
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
        private readonly ISubcriptionServiceRepository  _subcriptionServiceRepository;

        public ChildService_Service(
            IChildServiceRepository childServiceRepository,
            IUser_ChildServiceRepository user_ChildServiceRepository,
            ISubcriptionServiceRepository subcriptionServiceRepository,
            IEffectingJobServiceRepository effectingJobServiceRepository
            )
        {
            _childServiceRepository = childServiceRepository;
            _userChildServiceRepository = user_ChildServiceRepository;
            _effectingJobServiceRepository = effectingJobServiceRepository;
            _subcriptionServiceRepository = subcriptionServiceRepository;
        }
        [HttpPost("create-childservice")]
        [Authorize(VCareerPermission.ChildService.Create)]
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
        [Authorize(VCareerPermission.ChildService.Delete)]
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
        [Authorize(VCareerPermission.ChildService.StopAgent)]
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
        [Authorize(VCareerPermission.ChildService.Update)]
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
        [Authorize(VCareerPermission.ChildService.Load)]
        public async Task<List<ChildServiceViewDto>> GetChildServicesAsync(ChildServiceGetDto dto)
        {
            var childServices = (await _childServiceRepository.GetQueryableAsync());
            if (dto.ServiceAction != null) childServices = childServices.Where(cs => cs.Action == dto.ServiceAction);
            if (dto.Target != null) childServices = childServices.Where(cs => cs.Target == dto.Target);
            if (dto.IsActive != null) childServices = childServices.Where(cs => cs.IsActive == dto.IsActive);
            childServices = childServices.Skip(dto.PagingDto.PageIndex * dto.PagingDto.PageSize).Take(dto.PagingDto.PageSize);

            var result = await AsyncExecuter.ToListAsync(childServices);
            return ObjectMapper.Map<List<ChildService>, List<ChildServiceViewDto>>(result);
        }

    }
}
