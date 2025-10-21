using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Models.Job;
using Volo.Abp.Application.Services;

namespace VCareer.Job.JobPosting.ISerices
{
    public interface ILocationAppService : IApplicationService
    {
        // lấy danh sách tất cả tỉnh
        Task<List<ProvinceDto>> GetAllProvincesAsync();



        // tìm kiếm provicne theo tên province
        Task<List<ProvinceDto>> SearchProvincesByNameAsync(string searchTerm);



        //tim kiem provincee thoe id
        Task<ProvinceDto?> GetByIDAsync(int? provinceID);


        //tim kiem district theo id
        Task<District?> GetByDistrictIdAsync(int? id);


    }
}
