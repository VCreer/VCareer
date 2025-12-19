using AutoMapper.Execution;
using AutoMapper.Internal.Mappers;
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
using Volo.Abp.Domain.Repositories;
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
        private readonly ISubcriptionServiceRepository _subcriptionServiceRepository;
        private readonly IJobAffectingService _jobAffectingService;
        private readonly IChildService_SubcriptionServiceRepository _childService_SubcriptionServiceRepository;

        public ChildService_Service(
            IJobAffectingService jobAffectingService,
            IUser_ChildServiceRepository user_ChildServiceRepository,
            ISubcriptionServiceRepository subcriptionServiceRepository,
            IChildService_SubcriptionServiceRepository childService_SubcriptionServiceRepository,
            IChildServiceRepository childServiceRepository,
            IEffectingJobServiceRepository effectingJobServiceRepository
            )
        {
            _jobAffectingService = jobAffectingService;
            _userChildServiceRepository = user_ChildServiceRepository;
            _effectingJobServiceRepository = effectingJobServiceRepository;
            _childServiceRepository = childServiceRepository;
            _subcriptionServiceRepository = subcriptionServiceRepository;
            _childService_SubcriptionServiceRepository = childService_SubcriptionServiceRepository;
        }
        [HttpPost("create-childservice")]
        [Authorize(VCareerPermission.ChildService.Create)]
        public async Task CreateChildServiceAsync(ChildServiceCreateDto dto)
        {
            if (dto.IsLifeTime && dto.TimeUsedLimit > 0) throw new BusinessException("Can't Have timelimit when IsLifeTime");
            if (dto.IsLifeTime == false && dto.TimeUsedLimit <= 0) throw new BusinessException("Need have timeUsedLimit when not IsLifeTime");
            if (dto.DayDuration < 0 || dto.TimeUsedLimit < 0) throw new BusinessException("DayDuration and TimeUsedLimit must be greater than 0");
            RuleTypeCreateChildService(dto);
            var newChildService = ObjectMapper.Map<ChildServiceCreateDto, ChildService>(dto);
            await _childServiceRepository.InsertAsync(newChildService, true);
        }
        private void RuleTypeCreateChildService(ChildServiceCreateDto dto)
        {
            switch (dto.Action)
            {
                case ServiceAction.BoostScoreJob:
                    dto.DayDuration = dto.DayDuration ?? 0;
                    dto.Description = dto.Description ?? string.Empty;
                    dto.IsActive = dto.IsActive;
                    dto.IsEnable = dto.IsEnable;
                    dto.IsLifeTime = false;
                    dto.IsLimitUsedTime = true;
                    dto.IsAutoActive = false;
                    dto.Name = dto.Name ?? string.Empty;
                    dto.Priority = dto.Priority;
                    dto.TimeUsedLimit = dto.TimeUsedLimit ?? 0;
                    dto.Value = dto.Value ?? 0;
                    dto.Target = ServiceTarget.JobPost;
                    break;

                case ServiceAction.TopList:
                    dto.DayDuration = dto.DayDuration ?? 0;
                    dto.Description = dto.Description ?? string.Empty;
                    dto.IsActive = dto.IsActive;
                    dto.IsEnable = dto.IsEnable;
                    dto.IsLifeTime = false;
                    dto.IsLimitUsedTime = true;
                    dto.IsAutoActive = false;
                    dto.Name = dto.Name ?? string.Empty;
                    dto.Priority = dto.Priority;
                    dto.TimeUsedLimit = dto.TimeUsedLimit ?? 0;
                    dto.Value = dto.Value ?? 0;
                    dto.Target = ServiceTarget.JobPost;
                    break;

                case ServiceAction.JobBadge:
                    dto.DayDuration = dto.DayDuration ?? 0;
                    dto.Description = dto.Description ?? string.Empty;
                    dto.IsActive = dto.IsActive;
                    dto.IsEnable = dto.IsEnable;
                    dto.IsLifeTime = false;
                    dto.IsLimitUsedTime = true;
                    dto.IsAutoActive = false;
                    dto.Name = dto.Name ?? string.Empty;
                    dto.Priority = null;
                    dto.TimeUsedLimit = dto.TimeUsedLimit ?? 0;
                    dto.Value = dto.Value ?? 0;
                    dto.Target = ServiceTarget.JobPost;
                    break;

                case ServiceAction.ThemeCompany:
                    dto.DayDuration = dto.DayDuration ?? 0;
                    dto.Description = dto.Description ?? string.Empty;
                    dto.IsActive = dto.IsActive;
                    dto.IsEnable = dto.IsEnable;
                    dto.IsLifeTime = false;
                    dto.IsLimitUsedTime = false;
                    dto.IsAutoActive = true;
                    dto.Name = dto.Name ?? string.Empty;
                    dto.Priority = null;
                    dto.TimeUsedLimit = null;
                    dto.Value = dto.Value ?? 0;
                    dto.Target = ServiceTarget.Company;
                    break;

            }
        }

        //sẽ ko hiển thị để người dùng mới dùng nữa
        //đối với người dùng đã mua gói thì vẫn sẽ cho dùng nốt đến hết hạn 
        [HttpPost("set-status-childservice")]
        [Authorize(VCareerPermission.ChildService.Create)]
        public async Task SetStatusChildServiceAsync(Guid childServiceId, bool status)
        {
            var childService = await _childServiceRepository.FindAsync(childServiceId);
            if (childService == null) throw new BusinessException("ChildService not found");
            childService.IsActive = status;

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
            childService.IsEnable = false;
            childService.IsActive = false;

            //dừng hết các dịch vụ con đang chạy liên quan tới child service này
            await _jobAffectingService.DeactiveAllEffectingJobByChildServiceId(childServiceId);
            //   await StopUserChildServiceAsync(childServiceId);

            await _childServiceRepository.UpdateAsync(childService, true);
            //gui mail thong bao user
        }


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

        [HttpDelete("delete-childservice")]
        [Authorize(VCareerPermission.ChildService.Delete)]
        public async Task DeleteChildServiceAsync(Guid childServiceId)
        {
            var childService = await _childServiceRepository.GetAsync(childServiceId);
            if (childService == null) throw new BusinessException("child service not found");
            //check xem da tung duoc user nao su dung chua
            var userChildService = await _userChildServiceRepository.FirstOrDefaultAsync(x => x.ChildServiceId == childServiceId);
            if (userChildService != null) throw new UserFriendlyException("You can just delete child service that never used");
            //check xem da dang o trong goi subcription service nao chua
            var subcirptionChildService = _childService_SubcriptionServiceRepository.FirstOrDefaultAsync(x => x.ChildServiceId == childServiceId);
            if (subcirptionChildService != null) throw new UserFriendlyException("You can't delete child service that is exist in another subcription service");
            await _childServiceRepository.DeleteAsync(childServiceId);
        }
    }
}
