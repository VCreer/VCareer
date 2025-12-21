using NSubstitute;
using Shouldly;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VCareer.Dto.GeoDto;
using VCareer.IServices.IGeoServices;
using VCareer.Services.Geo;
using Volo.Abp;
using Volo.Abp.Caching;
using Xunit;
using System.Net.Http;
using Microsoft.Extensions.Http;

namespace VCareer.Geo;

public class GeoServiceTests
{
    /// Test lấy danh sách tỉnh thành thành công từ cache
    [Fact]
    public async Task GetProvincesAsync_returns_cached_provinces()
    {
        // Arrange: Tạo dữ liệu test
        var cachedProvinces = CreateProvinceList();
        var cache = Substitute.For<IDistributedCache<List<ProvinceDto>>>();
        cache.GetAsync(Arg.Any<string>())
            .Returns(Task.FromResult<List<ProvinceDto>>(cachedProvinces));

        var httpClientFactory = Substitute.For<IHttpClientFactory>();
        var service = new GeoService(httpClientFactory, cache);

        // Act: Gọi hàm lấy danh sách tỉnh thành
        var result = await service.GetProvincesAsync();

        // Assert: Kiểm tra kết quả từ cache
        result.ShouldNotBeNull();
        result.Count.ShouldBe(2);
        result.First().Name.ShouldBe("Hà Nội");
    }

    /// Test lấy tên tỉnh theo code thành công
    [Fact]
    public async Task GetProvinceNameByCode_returns_province_name_successfully()
    {
        // Arrange: Tạo dữ liệu test
        var provinces = CreateProvinceList();
        var cache = Substitute.For<IDistributedCache<List<ProvinceDto>>>();
        cache.GetAsync(Arg.Any<string>())
            .Returns(Task.FromResult<List<ProvinceDto>>(provinces));

        var httpClientFactory = Substitute.For<IHttpClientFactory>();
        var service = new GeoService(httpClientFactory, cache);

        // Act: Gọi hàm lấy tên tỉnh
        var result = await service.GetProvinceNameByCode(1);

        // Assert: Kiểm tra kết quả
        result.ShouldBe("Hà Nội");
    }

    /// Test lấy tên tỉnh thất bại khi code không tồn tại
    [Fact]
    public async Task GetProvinceNameByCode_throws_when_code_not_found()
    {
        // Arrange: Tạo dữ liệu test không có code 999
        var provinces = CreateProvinceList();
        var cache = Substitute.For<IDistributedCache<List<ProvinceDto>>>();
        cache.GetAsync(Arg.Any<string>())
            .Returns(Task.FromResult<List<ProvinceDto>>(provinces));

        var httpClientFactory = Substitute.For<IHttpClientFactory>();
        var service = new GeoService(httpClientFactory, cache);

        // Act & Assert: Kiểm tra ném exception
        var ex = await Should.ThrowAsync<BusinessException>(() =>
            service.GetProvinceNameByCode(999));

        ex.Message.ShouldContain("Cannot get province name");
    }

    /// Test lấy tên phường/xã theo code thành công
    [Fact]
    public async Task GetWardNameByCode_returns_ward_name_successfully()
    {
        // Arrange: Tạo dữ liệu test
        var provinces = CreateProvinceList();
        var cache = Substitute.For<IDistributedCache<List<ProvinceDto>>>();
        cache.GetAsync(Arg.Any<string>())
            .Returns(Task.FromResult<List<ProvinceDto>>(provinces));

        var httpClientFactory = Substitute.For<IHttpClientFactory>();
        var service = new GeoService(httpClientFactory, cache);

        // Act: Gọi hàm lấy tên phường/xã
        var result = await service.GetWardNameByCode(101, 1);

        // Assert: Kiểm tra kết quả
        result.ShouldBe("Phường Phúc Xá");
    }

    /// Test lấy tên phường/xã trả về empty khi wardCode null
    [Fact]
    public async Task GetWardNameByCode_returns_empty_when_wardCode_is_null()
    {
        // Arrange: Tạo dữ liệu test
        var provinces = CreateProvinceList();
        var cache = Substitute.For<IDistributedCache<List<ProvinceDto>>>();
        cache.GetAsync(Arg.Any<string>())
            .Returns(Task.FromResult<List<ProvinceDto>>(provinces));

        var httpClientFactory = Substitute.For<IHttpClientFactory>();
        var service = new GeoService(httpClientFactory, cache);

        // Act: Gọi hàm lấy tên phường/xã với wardCode null
        var result = await service.GetWardNameByCode(null, 1);

        // Assert: Kiểm tra kết quả là empty string
        result.ShouldBe(string.Empty);
    }

    /// Test lấy tên phường/xã thất bại khi province code không tồn tại
    [Fact]
    public async Task GetWardNameByCode_throws_when_province_not_found()
    {
        // Arrange: Tạo dữ liệu test không có province code 999
        var provinces = CreateProvinceList();
        var cache = Substitute.For<IDistributedCache<List<ProvinceDto>>>();
        cache.GetAsync(Arg.Any<string>())
            .Returns(Task.FromResult<List<ProvinceDto>>(provinces));

        var httpClientFactory = Substitute.For<IHttpClientFactory>();
        var service = new GeoService(httpClientFactory, cache);

        // Act & Assert: Kiểm tra ném exception
        var ex = await Should.ThrowAsync<BusinessException>(() =>
            service.GetWardNameByCode(101, 999));

        ex.Message.ShouldContain("Cannot get wards data");
    }

    /// Test lấy tên phường/xã thất bại khi ward code không tồn tại
    [Fact]
    public async Task GetWardNameByCode_throws_when_ward_not_found()
    {
        // Arrange: Tạo dữ liệu test không có ward code 999
        var provinces = CreateProvinceList();
        var cache = Substitute.For<IDistributedCache<List<ProvinceDto>>>();
        cache.GetAsync(Arg.Any<string>())
            .Returns(Task.FromResult<List<ProvinceDto>>(provinces));

        var httpClientFactory = Substitute.For<IHttpClientFactory>();
        var service = new GeoService(httpClientFactory, cache);

        // Act & Assert: Kiểm tra ném exception
        var ex = await Should.ThrowAsync<BusinessException>(() =>
            service.GetWardNameByCode(999, 1));

        ex.Message.ShouldContain("Cannot get province name");
    }

    // ========== Helper Methods ==========

    /// Tạo dữ liệu test cho danh sách tỉnh thành
    private static List<ProvinceDto> CreateProvinceList()
    {
        return new List<ProvinceDto>
        {
            new ProvinceDto
            {
                Code = 1,
                Name = "Hà Nội",
                Ward = new List<WardDto>
                {
                    new WardDto { Code = 101, Name = "Phường Phúc Xá" },
                    new WardDto { Code = 102, Name = "Phường Trúc Bạch" }
                }
            },
            new ProvinceDto
            {
                Code = 2,
                Name = "Hồ Chí Minh",
                Ward = new List<WardDto>
                {
                    new WardDto { Code = 201, Name = "Phường Bến Nghé" },
                    new WardDto { Code = 202, Name = "Phường Đa Kao" }
                }
            }
        };
    }
}

