//using AutoMapper;
//using System;
//using System.Collections.Generic;
//using System.Linq;
//using System.Text;
//using System.Threading.Tasks;
//using VCareer.Job.JobPosting.ISerices;
//using VCareer.Models.Job;
//using VCareer.Repositories.Job;
//using Volo.Abp.Application.Services;
//using Volo.Abp.Domain.Entities;

//namespace VCareer.Job.JobPosting.Services
//{
//    public class LocationAppService : ApplicationService, ILocationAppService
//    {
//        //private readonly ILocationRepository _locationRepository;
//        //private readonly IDistrictRepository _distictRepository;

//        //public LocationAppService(ILocationRepository localRepo, IDistrictRepository distRepo)
//        //{
//        //    _distictRepository = distRepo;
//        //    _locationRepository = localRepo;
//        //}

//        //public async Task<List<ProvinceDto>> GetAllProvincesAsync()
//        //{
//        //    var provinces = await _locationRepository.GetAllProvincesAsync();
//        //    return MapToProvinceDtos(provinces);
//        //}

//        //public async Task<District?> GetByDistrictIdAsync(int? id)
//        //{
//        //    var dis = await _distictRepository.GetByDistrictIdAsync(id);
//        //    if (dis == null)
//        //    {
//        //        throw new EntityNotFoundException(typeof(Province), id);
//        //    }

//        //    return MapToProvinceDto(dis);
//        //}

//        //public async Task<ProvinceDto?> GetByIDAsync(int? provinceId)
//        //{
//        //    var province = await _locationRepository.GetByIDAsync(provinceId);
//        //    if (province == null)
//        //    {
//        //        throw new EntityNotFoundException(typeof(Province), provinceId);
//        //    }

//        //    return MapToProvinceDto(province);
//        //}

//        //public async Task<List<ProvinceDto>> SearchProvincesByNameAsync(string searchTerm)
//        //{
//        //    if (string.IsNullOrWhiteSpace(searchTerm))
//        //    {
//        //        return await GetAllProvincesAsync();
//        //    }

//        //    var provinces = await _locationRepository.SearchProvincesByNameAsync(searchTerm);
//        //    return MapToProvinceDtos(provinces);
//        //}


//        //private List<ProvinceDto> MapToProvinceDtos(List<Province> provinces)
//        //{
//        //    return provinces.Select(MapToProvinceDto).ToList();
//        //}

//        //private List<ProvinceDto> MapToProvinceDtos(List<Province> provinces)
//        //{
//        //    return provinces.Select(MapToProvinceDto).ToList();
//        //}


//        ///// <summary>
//        ///// Map một Province sang ProvinceDto
//        ///// </summary>
//        //private ProvinceDto MapToProvinceDto(Province province)
//        //{
//        //    return new ProvinceDto
//        //    {
//        //        Id = province.Id,
//        //        Name = province.Name,
//        //        ListDistrict = province.Districts?.Select(d => new DistrictDto
//        //        {
//        //            Id = d.Id,
//        //            NameDistrict = d.Name
//        //        }).ToList() ?? new List<DistrictDto>()
//        //    };
//        //}
//}
