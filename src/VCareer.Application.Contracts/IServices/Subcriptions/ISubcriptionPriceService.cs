using AutoMapper.Internal.Mappers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Dto.Subcriptions;
using VCareer.IServices.Common;
using Volo.Abp;
using Volo.Abp.Application.Services;

namespace VCareer.IServices.Subcriptions
{
    public interface ISubcriptionPriceService : IApplicationService
    {
        public Task CreateSubcriptionPrice(SubcriptionPriceCreateDto dto);
        // la lay price dang effect hien tai
        public Task<decimal> GetCurrentPriceOfSubcription(Guid subcriptionId);
        public Task<List<SubcriptionPriceViewDto>> GetSubcriptionPricesService(Guid subcriptionId, int pageIndex);
        //chi cho edit cac price chua hoat dong 
        // han che viec employee chinh thoi gian trung vao cac price khac va vao thoi gian qua khu
        public Task UpdateSubcriptionPriceAsync(SubcriptionPriceUpdateDto dto);
        //chi cho phep xoa cac price chua effect  va chua het han
        public Task DeleteSubcriptionPriceAsync(Guid subcriptionPriceId);
        //deactive thi thoai mai
        // nhung ko cho active price da het han hoac bi trung thoi diem effect cua price khac
        public Task SetStatusSubcriptionPriceAsync(Guid subcriptionPriceId, bool isActive);
      
    }
}
