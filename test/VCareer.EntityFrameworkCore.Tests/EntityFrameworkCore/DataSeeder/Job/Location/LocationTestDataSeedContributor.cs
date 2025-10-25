//using System;
//using System.Collections.Generic;
//using System.Linq;
//using System.Text;
//using System.Threading.Tasks;
//using VCareer.Job.Category;
//using VCareer.Job.Location;
//using VCareer.Models.Job;
//using Volo.Abp.Data;
//using Volo.Abp.DependencyInjection;
//using Volo.Abp.Domain.Repositories;

//namespace VCareer.EntityFrameworkCore.DataSeeder.Job.Location
//{
//    public class LocationTestDataSeedContributor : IDataSeedContributor, ITransientDependency
//    {

//        private readonly IRepository<Province, int> _locationRepository;
//        private readonly IRepository<District, int> _districtRepository;
//        private readonly LocationTestDataBuilder _dataBuilder;

//        public LocationTestDataSeedContributor(
//            IRepository<Province, int> locationRepository,
//            IRepository<District, int> districtRepository,
//            LocationTestDataBuilder dataBuilder)
//        {
//            _locationRepository = locationRepository;
//            _districtRepository = districtRepository;
//            _dataBuilder = dataBuilder;
//        }

//        public async Task SeedAsync(DataSeedContext context)
//        {
//            // ✅ Check nếu đã có Province data thì không seed nữa
//            if (await _locationRepository.GetCountAsync() > 0)
//            {
//                return;
//            }

//            // ✅ SỬA: DÙNG LocationTestDataBuilder.BuildWithIds() - CÓ ID & ProvinceId
//            var provinces = _dataBuilder.BuildWithIds();


//            // ✅ Insert Provinces (Districts sẽ tự insert qua navigation vì đã có ProvinceId)
//            await _locationRepository.InsertManyAsync(provinces);

//        }
//    }
//}

