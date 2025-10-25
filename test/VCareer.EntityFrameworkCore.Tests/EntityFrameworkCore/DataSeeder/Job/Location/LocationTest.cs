//using Shouldly;
//using System;
//using System.Collections.Generic;
//using System.Linq;
//using System.Text;
//using System.Threading.Tasks;
//using VCareer.Job.Location;
//using VCareer.Models.Job;
//using VCareer.Repositories.Job;
//using Xunit;
//using static System.Runtime.InteropServices.JavaScript.JSType;

//namespace VCareer.EntityFrameworkCore.DataSeeder.Job.Location
//{
//    public class LocationTest : VCareerEntityFrameworkCoreTestBase
//    {
//        private readonly ILocationRepository _locationRepository;
//        private readonly IDistrictRepository _districtRepository;


//        public LocationTest()
//        {
//            _locationRepository = GetRequiredService<ILocationRepository>();
//            _districtRepository = GetRequiredService<IDistrictRepository>();

//        }


//        // test khi có full dữ liệu và load đúng duwx liệu

//        [Fact]
//        public async Task UTC01_GetAllProvincesAsync_WithValidData_ShouldReturnAllProvincesWithDistricts()
//        {
//            // Arrange
//            // Data đã được seed: 5 provinces, mỗi province có 2 districts

//            // Act
//            var provinces = await _locationRepository.GetAllProvincesAsync();

//            // Assert
//            provinces.ShouldNotBeNull();
//            provinces.Count.ShouldBe(5); // 5 provinces: HN, HCM, DN, AG, DongNai

//            // Verify each province has districts
//            foreach (var province in provinces)
//            {
//                province.Districts.ShouldNotBeNull();
//                province.Districts.Count.ShouldBe(2); // Each has 2 districts
//            }

//            // Verify specific 
//            var hanoi = provinces.FirstOrDefault(p => p.Name == "Hà Nội");
//            hanoi.ShouldNotBeNull();
//            hanoi.Districts.Any(d => d.Name == "Ba Đình").ShouldBeTrue();
//            hanoi.Districts.Any(d => d.Name == "Hoàn Kiếm").ShouldBeTrue();


//            //   new Province { Name = "Đà Nẵng", Districts = new List<District> { new District { Name = "Hải Châu" }, new District { Name = "Thanh Khê" } } },

//            // Verify specific 
//            var danang = provinces.FirstOrDefault(p => p.Name == "Đà Nẵng");
//            danang.ShouldNotBeNull();
//            danang.Districts.Any(d => d.Name == "Hải Châu").ShouldBeTrue();
//            danang.Districts.Any(d => d.Name == "Thanh Khê").ShouldBeTrue();


//        }


//        // tets khi không có data , sẽ trả về list rỗng
//        //[Fact]
//        //public async Task UTC02_GetAllProvincesAsync_EmptyDatabase_ShouldReturnEmptyList()
//        //{
//        //    // Arrange - Clear all data
//        //    var allProvinces = await _locationRepository.GetListAsync();
//        //    await _locationRepository.DeleteManyAsync(allProvinces);

//        //    // Act
//        //    var provinces = await _locationRepository.GetAllProvincesAsync();

//        //    // Assert
//        //    provinces.ShouldNotBeNull();
//        //    provinces.ShouldBeEmpty();
//        //}


//        //tìm kiếm tên đúng
//        [Fact]
//        public async Task UTC05_SearchProvincesByName_ExactMatch_ShouldReturnMatchingProvince()
//        {
//            // Arrange
//            var searchTerm = "Hà Nội";

//            // Act
//            var result = await _locationRepository.SearchProvincesByNameAsync(searchTerm);

//            // Assert
//            result.ShouldNotBeNull();
//            result.Count.ShouldBe(1);
//            result[0].Name.ShouldBe("Hà Nội");
//            result[0].Districts.Count.ShouldBe(2);
//        }


//        // tìm kiếm 1 phần từ khóa
//        [Fact]
//        public async Task UTC06_SearchProvincesByName_PartialMatch_ShouldReturnMatchingProvinces()
//        {
//            // Arrange
//            var searchTerm = "Nội"; // Matches "Hà Nội" 

//            // Act
//            var result = await _locationRepository.SearchProvincesByNameAsync(searchTerm);

//            // Assert
//            result.ShouldNotBeNull();
//            result.Count.ShouldBeGreaterThanOrEqualTo(1);
//            result[0].Name.ShouldBe("Hà Nội");
//        }

//        //timf khong match tu khoa 
//        [Fact]
//        public async Task UTC07_SearchProvincesByName_NoMatch_ShouldReturnEmptyList()
//        {
//            // Arrange
//            var searchTerm = "NonExistentProvince12345";

//            // Act
//            var result = await _locationRepository.SearchProvincesByNameAsync(searchTerm);

//            // Assert
//            result.ShouldNotBeNull();
//            result.ShouldBeEmpty();
//        }

//        // tìm kiếm chuỗi rỗng 
//        [Fact]
//        public async Task UTC08_SearchProvincesByName_EmptyTerm_ShouldReturnAllProvinces()
//        {
//            // Arrange
//            var searchTerm = "";

//            // Act
//            var result = await _locationRepository.SearchProvincesByNameAsync(searchTerm);

//            // Assert
//            result.ShouldNotBeNull();
//            result.Count.ShouldBe(5); // Returns all because "" is contained in all strings
//        }

//        //tìm kiếm theo chữ in hoa in thường
//        [Fact]
//        public async Task UTC09_SearchProvincesByName_DifferentCase_ShouldBeCaseInsensitive()
//        {
//            // Arrange
//            var searchTerms = new[] { "hà nội", "HÀ NỘI", "Hà Nội" };

//            foreach (var searchTerm in searchTerms)
//            {
//                // Act
//                var result = await _locationRepository.SearchProvincesByNameAsync(searchTerm);

//                // Assert
//                result.ShouldNotBeNull();
//                result.Count.ShouldBeGreaterThan(0);
//            }
//        }

//        // test với id hợp lệ của province
//        [Fact]
//        public async Task UTC10_GetByID_ValidId_ShouldReturnProvince()
//        {
//            // Arrange
//            var hanoiId = LocationTestDataBuilder.TestProvinceIds.HaNoi;

//            // Act
//            var province = await _locationRepository.GetByIDAsync(hanoiId);

//            // Assert
//            province.ShouldNotBeNull();
//            province.Id.ShouldBe(hanoiId);
//            province.Name.ShouldBe("Hà Nội");
//        }

//        // tets với id provicne không hợp lệ
//        [Fact]
//        public async Task UTC11_GetByID_InvalidId_ShouldReturnNull()
//        {
//            // Arrange
//            var invalidId = 999;

//            // Act
//            var province = await _locationRepository.GetByIDAsync(invalidId);

//            // Assert
//            province.ShouldBeNull();
//        }


//        // tests với id =null
//        [Fact]
//        public async Task UTC12_GetByID_NullId_ShouldReturnNull()
//        {
//            // Arrange
//            int? nullId = null;

//            // Act
//            var province = await _locationRepository.GetByIDAsync(nullId);

//            // Assert
//            province.ShouldBeNull();
//        }


//        // id district hop le
//        [Fact]
//        public async Task UTC13_GetByID_ValidId_ShouldReturnDistrict()
//        {
//            // Arrange
//            var badinhID = LocationTestDataBuilder.TestDistrictIds.BaDinh;

//            // Act
//            var district = await _districtRepository.GetByDistrictIdAsync(badinhID);

//            // Assert
//            district.ShouldNotBeNull();

//            district.Name.ShouldBe("Ba Đình");

//        }
//    }
//}