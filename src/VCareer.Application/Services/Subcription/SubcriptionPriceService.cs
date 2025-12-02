using AutoMapper.Internal.Mappers;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Dto.Subcriptions;
using VCareer.IRepositories.Payment;
using VCareer.IRepositories.Subcriptions;
using VCareer.IServices.Common;
using VCareer.IServices.Subcriptions;
using VCareer.Models.Subcription_Payment;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;

namespace VCareer.Services.Subcription
{
    public class SubcriptionPriceService : ApplicationService, ISubcriptionPriceService
    {
        private readonly ISubcriptionPriceRepository _subcriptionPriceRepository;
        private readonly ISubcriptionServiceRepository _subcriptionServiceRepository;
        public SubcriptionPriceService(ISubcriptionPriceRepository subcriptionPriceRepository, ISubcriptionServiceRepository subcriptionServiceRepository)
        {
            _subcriptionPriceRepository = subcriptionPriceRepository;
            _subcriptionServiceRepository = subcriptionServiceRepository;
        }
        //ko dduoc tao gia moi trung thoi gian effect voi 1 gia  khac 
        public async Task CreateSubcriptionPrice(SubcriptionPriceCreateDto dto)
        {
            if (dto.SalePercent < 0 || dto.SalePercent > 100) throw new UserFriendlyException("Sale percent must be between 0 and 100");
            var subcriptionService = await _subcriptionServiceRepository.FirstOrDefaultAsync(x => x.Id == dto.SubcriptionServiceId);
            if (subcriptionService == null) throw new UserFriendlyException("Subcription not found");

            if (dto.EffectiveFrom > dto.EffectiveTo) throw new UserFriendlyException("EffectiveFrom must be less than EffectiveTo");
            if (dto.EffectiveTo < DateTime.UtcNow) throw new UserFriendlyException("EffectiveTo must be greater than now");

            if (await IsConflictTimeWithOtherPrice(dto.SubcriptionServiceId, dto.EffectiveFrom, dto.EffectiveTo))
                throw new UserFriendlyException("Conflict time with other price");

            await _subcriptionPriceRepository.InsertAsync(new Models.Subcription_Payment.SubcriptionPrice()
            {
                OriginalPrice = subcriptionService.OriginalPrice,
                EffectiveFrom = (dto.EffectiveFrom < DateTime.UtcNow) ? DateTime.UtcNow : dto.EffectiveFrom,
                EffectiveTo = dto.EffectiveTo,
                SubcriptionServiceId = dto.SubcriptionServiceId,
                SalePercent = dto.SalePercent
            });
        }
        // la lay price dang effect hien tai
        public async Task<decimal> GetCurrentPriceOfSubcription(Guid subcriptionId)
        {
            var subcriptionService = await _subcriptionServiceRepository.FirstOrDefaultAsync(x => x.Id == subcriptionId);
            if (subcriptionService == null) throw new UserFriendlyException("Subcription not found");

            var listPrice = await _subcriptionPriceRepository.GetListAsync(x => x.SubcriptionServiceId == subcriptionId);
            if (listPrice == null || listPrice.Count == 0) return subcriptionService.OriginalPrice;

            var current = listPrice
     .Where(x => x.IsActive &&
            x.EffectiveFrom <= DateTime.UtcNow &&
            x.EffectiveTo >= DateTime.UtcNow)
     .FirstOrDefault();

            if (current == null) return subcriptionService.OriginalPrice;
            return current.OriginalPrice * (1 - current.SalePercent / 100m);

        }


        public async Task<List<SubcriptionPriceViewDto>> GetSubcriptionPricesService(Guid subcriptionId, int pageIndex)
        {
            var listPrice = await _subcriptionPriceRepository.GetQueryableAsync();
            listPrice = listPrice
                .Where(x => x.SubcriptionServiceId == subcriptionId)
                .Skip(pageIndex * 10)
                .Take(10);
            var result = await listPrice.ToListAsync();
            if (result == null || result.Count == 0) return new List<SubcriptionPriceViewDto>();
            await UpdateExpiredStatus(result);
            return ObjectMapper.Map<List<SubcriptionPrice>, List<SubcriptionPriceViewDto>>(result);
        }


        //chi cho edit cac price chua hoat dong 
        // han che viec employee chinh thoi gian trung vao cac price khac va vao thoi gian qua khu
        public async Task UpdateSubcriptionPriceAsync(SubcriptionPriceUpdateDto dto)
        {
            var subcriptionPrice = await _subcriptionPriceRepository.FirstOrDefaultAsync(x => x.Id == dto.SubcriptionPriceId);
            if (subcriptionPrice == null) throw new BusinessException("SubcriptionPrice not found");
            if (subcriptionPrice.IsExpried) throw new BusinessException("You cant edit expired subcription price");

            // Validate input
            if (dto.SalePercent < 0 || dto.SalePercent > 100)
                throw new BusinessException("Sale percent must be between 0 and 100");
            if (dto.EffectiveFrom > dto.EffectiveTo)
                throw new BusinessException("EffectiveFrom must be less than EffectiveTo");
            if (dto.EffectiveTo < DateTime.UtcNow)
                throw new BusinessException("EffectiveTo must be greater than now");

            bool isCurrentlyEffective =
                 subcriptionPrice.IsActive &&
                 subcriptionPrice.EffectiveFrom <= DateTime.UtcNow &&
                 subcriptionPrice.EffectiveTo >= DateTime.UtcNow;
            if (isCurrentlyEffective) throw new BusinessException("You can't edit active price in effect period");

            if (await IsConflictTimeWithOtherPrice(dto.SubcriptionServiceId, dto.EffectiveFrom, dto.EffectiveTo, dto.SubcriptionPriceId))
                throw new BusinessException("Conflict time with other price");

            subcriptionPrice.EffectiveFrom = (dto.EffectiveFrom < DateTime.UtcNow) ? DateTime.UtcNow : dto.EffectiveFrom;
            subcriptionPrice.EffectiveTo = dto.EffectiveTo;
            subcriptionPrice.SalePercent = dto.SalePercent;
            await _subcriptionPriceRepository.UpdateAsync(subcriptionPrice);
        }
        //chi cho phep xoa cac price chua effect  va chua het han
        public async Task DeleteSubcriptionPriceAsync(Guid subcriptionPriceId)
        {
            var subcriptionPrice = await _subcriptionPriceRepository.FirstOrDefaultAsync(x => x.Id == subcriptionPriceId);
            if (subcriptionPrice == null) throw new BusinessException("SubcriptionPrice not found");
            if (subcriptionPrice.IsExpried) throw new BusinessException("You cant delete expired subcription price");
            bool isCurrentlyEffective =
                 subcriptionPrice.EffectiveFrom <= DateTime.UtcNow &&
                 subcriptionPrice.EffectiveTo >= DateTime.UtcNow;

            if (subcriptionPrice.IsActive && isCurrentlyEffective)
                throw new BusinessException("You can't delete active price in effect period");


            await _subcriptionPriceRepository.DeleteAsync(subcriptionPrice);
        }
        //deactive thi thoai mai
        // nhung ko cho active price da het han hoac bi trung thoi diem effect cua price khac
        public async Task SetStatusSubcriptionPriceAsync(Guid subcriptionPriceId, bool isActive)
        {
            var subcriptionPrice = await _subcriptionPriceRepository.FirstOrDefaultAsync(x => x.Id == subcriptionPriceId);
            if (subcriptionPrice == null) throw new BusinessException("SubcriptionPrice not found");
            if (isActive)
            {
                if (subcriptionPrice.EffectiveTo < DateTime.UtcNow)
                    throw new UserFriendlyException("You can't activate an expired price.");
                if (await IsConflictTimeWithOtherPrice(subcriptionPrice.SubcriptionServiceId, subcriptionPrice.EffectiveFrom, subcriptionPrice.EffectiveTo, subcriptionPriceId))
                    throw new UserFriendlyException("Conflict time with other price");
                subcriptionPrice.IsActive = true;
            }
            else { subcriptionPrice.IsActive = false; }
            await _subcriptionPriceRepository.UpdateAsync(subcriptionPrice);

        }

        #region helper
        private async Task UpdateExpiredStatus(List<SubcriptionPrice> list)
        {
            var expiredItems = list
                .Where(x => !x.IsExpried && x.EffectiveTo < DateTime.UtcNow)
                .ToList();

            if (expiredItems.Count == 0) return;

            foreach (var item in expiredItems)
            {
                item.IsExpried = true;
            }

            await _subcriptionPriceRepository.UpdateManyAsync(expiredItems);
        }
        //check xem co gia nao bi trung voi gia khac ko , ko tinh cac gia inactive va expired
        //check tat ca cac gia dang active va chua expried du co dang effective hay ko
        private async Task<bool> IsConflictTimeWithOtherPrice(
       Guid subcriptionServiceId,
       DateTime Start,
       DateTime End,
       Guid? excludeId = null)
        {
            var query = await _subcriptionPriceRepository.GetListAsync(
                x => x.SubcriptionServiceId == subcriptionServiceId
                && x.IsActive
                && !x.IsExpried
                && x.EffectiveFrom < End
                && x.EffectiveTo > Start
            );

            // Exclude record hiện tại nếu có
            if (excludeId.HasValue)
            {
                query = query.Where(x => x.Id != excludeId.Value).ToList();
            }

            return query != null && query.Count > 0;
        }
        #endregion
    }
}
