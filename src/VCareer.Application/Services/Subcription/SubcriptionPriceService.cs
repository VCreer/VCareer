using AutoMapper.Internal.Mappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants.PaymentVNPay;
using VCareer.Dto.Order;
using VCareer.Dto.Subcriptions;
using VCareer.IRepositories.ICompanyRepository;
using VCareer.IRepositories.Payment;
using VCareer.IRepositories.Profile;
using VCareer.IRepositories.Subcriptions;
using VCareer.IServices.Common;
using VCareer.IServices.Subcriptions;
using VCareer.Models.Subcription_Payment;
using VCareer.Permission;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Timing;

namespace VCareer.Services.Subcription
{
    public class SubcriptionPriceService : ApplicationService, ISubcriptionPriceService
    {
        private readonly ISubcriptionPriceRepository _subcriptionPriceRepository;
        private readonly ISubcriptionServiceRepository _subcriptionServiceRepository;
        private readonly IClock _clock;
        private readonly IRepository<Models.Order.Order, Guid> _orderRepository;
        private readonly IRepository<Models.Order.OrderDetail, Guid> _orderDetailRepository;
        private readonly IRecruiterRepository _recruiterRepository;
        private readonly ICompanyRepository _companyRepository;
        public SubcriptionPriceService(
            ISubcriptionPriceRepository subcriptionPriceRepository,
            IClock clock,
            ICompanyRepository companyRepository,
            IRepository<Models.Order.Order, Guid> orderRepository,
            IRepository<Models.Order.OrderDetail, Guid> orderDetailRepository,
            IRecruiterRepository recruiterRepository,
            ISubcriptionServiceRepository subcriptionServiceRepository)
        {
            _subcriptionPriceRepository = subcriptionPriceRepository;
            _subcriptionServiceRepository = subcriptionServiceRepository;
            _clock = clock;
            _recruiterRepository = recruiterRepository;
            _orderDetailRepository = orderDetailRepository;
            _companyRepository = companyRepository;
            _orderRepository = orderRepository;
        }
        //ko dduoc tao gia moi trung thoi gian effect voi 1 gia  khac 
        [Authorize(VCareerPermission.SubcriptionPrice.Create)]
        public async Task CreateSubcriptionPrice(SubcriptionPriceCreateDto dto)
        {
            var now = _clock.Now;
            if (dto.NewPrice < 0) throw new UserFriendlyException("Sale percent must be bigger than 0");
            var subcriptionService = await _subcriptionServiceRepository.FirstOrDefaultAsync(x => x.Id == dto.SubcriptionServiceId);
            if (subcriptionService == null) throw new UserFriendlyException("Subcription not found");

            if (dto.EffectiveFrom > dto.EffectiveTo) throw new UserFriendlyException("EffectiveFrom must be less than EffectiveTo");
            if (dto.EffectiveTo <= now) throw new UserFriendlyException("EffectiveTo must be greater than now");

            if (await IsConflictTimeWithOtherPrice(dto.SubcriptionServiceId, dto.EffectiveFrom, dto.EffectiveTo))
                throw new UserFriendlyException("Conflict time with other price");

            await _subcriptionPriceRepository.InsertAsync(new Models.Subcription_Payment.SubcriptionPrice()
            {
                OriginalPrice = subcriptionService.OriginalPrice,
                EffectiveFrom = (dto.EffectiveFrom < now) ? now : dto.EffectiveFrom,
                EffectiveTo = dto.EffectiveTo,
                SubcriptionServiceId = dto.SubcriptionServiceId,
                NewPrice = dto.NewPrice
            });
        }
        // la lay price dang effect hien tai
        public async Task<decimal> GetCurrentPriceOfSubcription(Guid subcriptionId)
        {
            var now = _clock.Now;
            var subcriptionService = await _subcriptionServiceRepository.FirstOrDefaultAsync(x => x.Id == subcriptionId);
            if (subcriptionService == null) throw new UserFriendlyException("Subcription not found");

            var listPrice = await _subcriptionPriceRepository.GetListAsync(x => x.SubcriptionServiceId == subcriptionId);
            if (listPrice == null || listPrice.Count == 0) return subcriptionService.OriginalPrice;

            var current = listPrice
             .Where(x => x.IsActive &&
            x.EffectiveFrom <= now &&
            x.EffectiveTo >= now)
             .FirstOrDefault();

            if (current == null) return subcriptionService.OriginalPrice;
            return current.NewPrice;

        }
        [Authorize(VCareerPermission.SubcriptionPrice.Load)]
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
        public async Task<List<OrderDashboardViewDto>> GetOrderDashboard(OrderDashBoardRequestDto dto)
        {
            var query = await _orderRepository.GetQueryableAsync();

            // Filter cơ bản
            if (dto.Status.HasValue)
                query = query.Where(x => x.Status == dto.Status.Value);

            if (dto.StartDate.HasValue)
                query = query.Where(x => x.PaidAt >= dto.StartDate.Value);

            if (dto.EndDate.HasValue)
                query = query.Where(x => x.PaidAt <= dto.EndDate.Value);

            // Search
            if (!string.IsNullOrWhiteSpace(dto.SearchField))
            {
                if (Guid.TryParse(dto.SearchField, out var userId))
                {
                    query = query.Where(x => x.UserId == userId);
                }
                else
                {
                    query = query.Where(x => x.OrderCode.Contains(dto.SearchField));
                }
            }

            // Join recruiter + company
            var recruiterQuery = await _recruiterRepository.GetQueryableAsync();
            var companyQuery = await _companyRepository.GetQueryableAsync();

            var result = await query
                .AsNoTracking()
                .OrderByDescending(x => x.PaidAt)
                .Join(recruiterQuery,
                      o => o.UserId,
                      r => r.UserId,
                      (o, r) => new { o, r })
                .Join(companyQuery,
                      or => or.r.CompanyId,
                      c => c.Id,
                      (or, c) => new OrderDashboardViewDto
                      {
                          Id = or.o.Id,
                          PaidAt = or.o.PaidAt,
                          Status = or.o.Status,
                          UserId = or.o.UserId,
                          OrderCode = or.o.OrderCode,
                          PaymentMethod = or.o.PaymentMethod,
                          PaymentStatus = or.o.PaymentStatus,
                          TotalAmount = or.o.TotalAmount,
                          CompanyId = c.Id,
                          CompanyName = c.CompanyName
                      })
                .ToListAsync();

            return result;
        }
        public async Task<List<OrderDetailDashBoardViewDto>> GetOrderDetail(Guid orderId)
        {
            var orderDetailQuery = await _orderDetailRepository.GetQueryableAsync();
            var subcriptionQuery = await _subcriptionServiceRepository.GetQueryableAsync();

            var result = await orderDetailQuery
                .AsNoTracking()
                .Where(x => x.OrderId == orderId)
                .Join(subcriptionQuery,
                      od => od.SubcriptionServiceId,
                      s => s.Id,
                      (od, s) => new OrderDetailDashBoardViewDto
                      {
                          Id = od.Id,
                          SubcriptionServiceId = od.SubcriptionServiceId,
                          SubcriptionServiceTitle = s.Title,
                          Quantity = od.Quantity,
                          UnitPrice = od.UnitPrice,
                          TotalPrice = od.TotalPrice,
                          Notes = od.Notes
                      })
                .ToListAsync();

            return result;
        }

        public async Task<decimal> GetTotalAmount(DateTime? startTime, DateTime? endTime)
        {
            var query = await _orderRepository.GetQueryableAsync();

            query = query.Where(x =>
                x.PaymentStatus == PaymentStatus.Paid&&
                x.Status == OrderStatus.Completed &&
                x.PaidAt.HasValue);

            if (startTime.HasValue)
                query = query.Where(x => x.PaidAt >= startTime.Value);

            if (endTime.HasValue)
                query = query.Where(x => x.PaidAt <= endTime.Value);
            var sql = query.ToQueryString();

            return await query.SumAsync(x => x.TotalAmount);
        }


        //chi cho edit cac price chua hoat dong 
        // han che viec employee chinh thoi gian trung vao cac price khac va vao thoi gian qua khu
        [Authorize(VCareerPermission.SubcriptionPrice.Update)]
        public async Task UpdateSubcriptionPriceAsync(SubcriptionPriceUpdateDto dto)
        {
            var now = _clock.Now;
            var subcriptionPrice = await _subcriptionPriceRepository.FirstOrDefaultAsync(x => x.Id == dto.SubcriptionPriceId);
            if (subcriptionPrice == null) throw new UserFriendlyException("SubcriptionPrice not found");
            if (subcriptionPrice.IsExpried) throw new UserFriendlyException("You cant edit expired subcription price");

            // Validate input
            if (dto.NewPrice < 0) throw new UserFriendlyException("Sale percent must be bigger than 0");
            if (dto.EffectiveFrom > dto.EffectiveTo) throw new UserFriendlyException("EffectiveFrom must be less than EffectiveTo");
            if (dto.EffectiveTo < now) throw new UserFriendlyException("EffectiveTo must be greater than now");

            bool isCurrentlyEffective =
                 subcriptionPrice.IsActive &&
                 subcriptionPrice.EffectiveFrom <= now &&
                 subcriptionPrice.EffectiveTo >= now;
            if (isCurrentlyEffective) throw new UserFriendlyException("You can't edit active price in effect period");

            if (await IsConflictTimeWithOtherPrice(dto.SubcriptionServiceId, dto.EffectiveFrom, dto.EffectiveTo, dto.SubcriptionPriceId))
                throw new UserFriendlyException("Conflict time with other price");

            subcriptionPrice.EffectiveFrom = (dto.EffectiveFrom < now) ? now : dto.EffectiveFrom;
            subcriptionPrice.EffectiveTo = dto.EffectiveTo;
            subcriptionPrice.NewPrice = dto.NewPrice;
            await _subcriptionPriceRepository.UpdateAsync(subcriptionPrice);
        }
        //chi cho phep xoa cac price chua effect  va chua het han
        [Authorize(VCareerPermission.SubcriptionPrice.Delete)]
        public async Task DeleteSubcriptionPriceAsync(Guid subcriptionPriceId)
        {
            var now = _clock.Now;
            var subcriptionPrice = await _subcriptionPriceRepository.FirstOrDefaultAsync(x => x.Id == subcriptionPriceId);
            if (subcriptionPrice == null) throw new BusinessException("SubcriptionPrice not found");
            if (subcriptionPrice.IsExpried) throw new BusinessException("You cant delete expired subcription price");
            bool isCurrentlyEffective =
                 subcriptionPrice.EffectiveFrom <= now &&
                 subcriptionPrice.EffectiveTo >= now;

            if (subcriptionPrice.IsActive && isCurrentlyEffective)
                throw new UserFriendlyException("You can't delete active price in effect period");


            await _subcriptionPriceRepository.DeleteAsync(subcriptionPrice);
        }
        //deactive thi thoai mai
        // nhung ko cho active price da het han hoac bi trung thoi diem effect cua price khac
        [Authorize(VCareerPermission.SubcriptionPrice.SetStatus)]
        public async Task SetStatusSubcriptionPriceAsync(Guid subcriptionPriceId, bool isActive)
        {
            var now = _clock.Now;
            var subcriptionPrice = await _subcriptionPriceRepository.FirstOrDefaultAsync(x => x.Id == subcriptionPriceId);
            if (subcriptionPrice == null) throw new BusinessException("SubcriptionPrice not found");
            if (isActive)
            {
                if (subcriptionPrice.EffectiveTo < now)
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
            var now = _clock.Now;
            var expiredItems = list
                .Where(x => !x.IsExpried && x.EffectiveTo < now)
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
