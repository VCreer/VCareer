using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using NSubstitute;
using Shouldly;
using VCareer.Dto.Subcriptions;
using VCareer.IRepositories.Subcriptions;
using VCareer.Models.Subcription;
using VCareer.Models.Subcription_Payment;
using VCareer.Services.Subcription;
using Volo.Abp;
using Volo.Abp.Domain.Repositories;
using Xunit;
using static VCareer.Constants.JobConstant.SubcriptionContance;

namespace VCareer.Subcription;

public class SubcriptionPriceServiceTests
{
    #region UTCID01 - Success Case: Create subscription price successfully

    [Fact]
    public async Task CreateSubcriptionPrice_UTCID01_Success_WithValidData()
    {
        // Arrange
        var subcriptionServiceId = Guid.NewGuid();
        var subcriptionService = CreateSubcriptionService(subcriptionServiceId, "Test Package", 100000m, SubcriptionStatus.Active);
        
        var dto = new SubcriptionPriceCreateDto
        {
            SubcriptionServiceId = subcriptionServiceId,
            SalePercent = 10,
            EffectiveFrom = DateTime.UtcNow.AddDays(1),
            EffectiveTo = DateTime.UtcNow.AddDays(11)
        };

        var (service, priceRepo, serviceRepo) = BuildService(subcriptionService);

        // Act
        await service.CreateSubcriptionPrice(dto);

        // Assert
        await priceRepo.Received(1).InsertAsync(
            Arg.Is<SubcriptionPrice>(p =>
                p.SubcriptionServiceId == subcriptionServiceId &&
                p.OriginalPrice == 100000m &&
                p.SalePercent == 10 &&
                p.EffectiveFrom == dto.EffectiveFrom &&
                p.EffectiveTo == dto.EffectiveTo &&
                p.IsActive == true &&
                p.IsExpried == false
            )
        );
    }

    #endregion

    #region UTCID02 - Validation: SalePercent < 0

    [Fact]
    public async Task CreateSubcriptionPrice_UTCID02_Throws_WhenSalePercentIsNegative()
    {
        // Arrange
        var subcriptionServiceId = Guid.NewGuid();
        var subcriptionService = CreateSubcriptionService(subcriptionServiceId, "Test Package", 100000m, SubcriptionStatus.Active);
        
        var dto = new SubcriptionPriceCreateDto
        {
            SubcriptionServiceId = subcriptionServiceId,
            SalePercent = -1,
            EffectiveFrom = DateTime.UtcNow.AddDays(1),
            EffectiveTo = DateTime.UtcNow.AddDays(11)
        };

        var (service, _, _) = BuildService(subcriptionService);

        // Act & Assert
        var ex = await Should.ThrowAsync<UserFriendlyException>(() => service.CreateSubcriptionPrice(dto));
        ex.Message.ShouldContain("Sale percent must be between 0 and 100");
    }

    #endregion

    #region UTCID03 - Validation: SalePercent > 100

    [Fact]
    public async Task CreateSubcriptionPrice_UTCID03_Throws_WhenSalePercentExceeds100()
    {
        // Arrange
        var subcriptionServiceId = Guid.NewGuid();
        var subcriptionService = CreateSubcriptionService(subcriptionServiceId, "Test Package", 100000m, SubcriptionStatus.Active);
        
        var dto = new SubcriptionPriceCreateDto
        {
            SubcriptionServiceId = subcriptionServiceId,
            SalePercent = 101,
            EffectiveFrom = DateTime.UtcNow.AddDays(1),
            EffectiveTo = DateTime.UtcNow.AddDays(11)
        };

        var (service, _, _) = BuildService(subcriptionService);

        // Act & Assert
        var ex = await Should.ThrowAsync<UserFriendlyException>(() => service.CreateSubcriptionPrice(dto));
        ex.Message.ShouldContain("Sale percent must be between 0 and 100");
    }

    #endregion

    #region UTCID04 - Validation: SubcriptionServiceId not found

    [Fact]
    public async Task CreateSubcriptionPrice_UTCID04_Throws_WhenSubcriptionServiceNotFound()
    {
        // Arrange
        var nonExistentServiceId = Guid.NewGuid();
        
        var dto = new SubcriptionPriceCreateDto
        {
            SubcriptionServiceId = nonExistentServiceId,
            SalePercent = 10,
            EffectiveFrom = DateTime.UtcNow.AddDays(1),
            EffectiveTo = DateTime.UtcNow.AddDays(11)
        };

        var (service, _, serviceRepo) = BuildService(null);
        serviceRepo.FirstOrDefaultAsync(Arg.Any<Expression<Func<SubcriptionService, bool>>>())
            .Returns((SubcriptionService)null);

        // Act & Assert
        var ex = await Should.ThrowAsync<UserFriendlyException>(() => service.CreateSubcriptionPrice(dto));
        ex.Message.ShouldContain("Subcription not found");
    }

    #endregion

    #region UTCID05 - Validation: EffectiveFrom > EffectiveTo

    [Fact]
    public async Task CreateSubcriptionPrice_UTCID05_Throws_WhenEffectiveFromGreaterThanEffectiveTo()
    {
        // Arrange
        var subcriptionServiceId = Guid.NewGuid();
        var subcriptionService = CreateSubcriptionService(subcriptionServiceId, "Test Package", 100000m, SubcriptionStatus.Active);
        
        var dto = new SubcriptionPriceCreateDto
        {
            SubcriptionServiceId = subcriptionServiceId,
            SalePercent = 10,
            EffectiveFrom = DateTime.UtcNow.AddDays(11),
            EffectiveTo = DateTime.UtcNow.AddDays(1)
        };

        var (service, _, _) = BuildService(subcriptionService);

        // Act & Assert
        var ex = await Should.ThrowAsync<UserFriendlyException>(() => service.CreateSubcriptionPrice(dto));
        ex.Message.ShouldContain("EffectiveFrom must be less than EffectiveTo");
    }

    #endregion

    #region UTCID06 - Validation: EffectiveTo < DateTime.UtcNow

    [Fact]
    public async Task CreateSubcriptionPrice_UTCID06_Throws_WhenEffectiveToIsInPast()
    {
        // Arrange
        var subcriptionServiceId = Guid.NewGuid();
        var subcriptionService = CreateSubcriptionService(subcriptionServiceId, "Test Package", 100000m, SubcriptionStatus.Active);
        
        var dto = new SubcriptionPriceCreateDto
        {
            SubcriptionServiceId = subcriptionServiceId,
            SalePercent = 10,
            EffectiveFrom = DateTime.UtcNow.AddDays(-10),
            EffectiveTo = DateTime.UtcNow.AddDays(-1)
        };

        var (service, _, _) = BuildService(subcriptionService);

        // Act & Assert
        var ex = await Should.ThrowAsync<UserFriendlyException>(() => service.CreateSubcriptionPrice(dto));
        ex.Message.ShouldContain("EffectiveTo must be greater than now");
    }

    #endregion

    #region UTCID07 - Validation: Conflict time with other price

    [Fact]
    public async Task CreateSubcriptionPrice_UTCID07_Throws_WhenConflictTimeWithOtherPrice()
    {
        // Arrange
        var subcriptionServiceId = Guid.NewGuid();
        var subcriptionService = CreateSubcriptionService(subcriptionServiceId, "Test Package", 100000m, SubcriptionStatus.Active);
        
        // Existing price: Day 5 to Day 15
        var existingPrice = CreateSubcriptionPrice(
            Guid.NewGuid(),
            subcriptionServiceId,
            DateTime.UtcNow.AddDays(5),
            DateTime.UtcNow.AddDays(15),
            isActive: true,
            isExpired: false
        );

        // New price: Day 10 to Day 20 (overlaps with existing)
        var dto = new SubcriptionPriceCreateDto
        {
            SubcriptionServiceId = subcriptionServiceId,
            SalePercent = 10,
            EffectiveFrom = DateTime.UtcNow.AddDays(10),
            EffectiveTo = DateTime.UtcNow.AddDays(20)
        };

        var (service, priceRepo, serviceRepo) = BuildService(subcriptionService, new List<SubcriptionPrice> { existingPrice });

        // Act & Assert
        var ex = await Should.ThrowAsync<UserFriendlyException>(() => service.CreateSubcriptionPrice(dto));
        ex.Message.ShouldContain("Conflict time with other price");
    }

    #endregion

    #region UTCID08 - Boundary: SalePercent = 0

    [Fact]
    public async Task CreateSubcriptionPrice_UTCID08_Success_WhenSalePercentIsZero()
    {
        // Arrange
        var subcriptionServiceId = Guid.NewGuid();
        var subcriptionService = CreateSubcriptionService(subcriptionServiceId, "Test Package", 100000m, SubcriptionStatus.Active);
        
        var dto = new SubcriptionPriceCreateDto
        {
            SubcriptionServiceId = subcriptionServiceId,
            SalePercent = 0,
            EffectiveFrom = DateTime.UtcNow.AddDays(1),
            EffectiveTo = DateTime.UtcNow.AddDays(11)
        };

        var (service, priceRepo, _) = BuildService(subcriptionService);

        // Act
        await service.CreateSubcriptionPrice(dto);

        // Assert
        await priceRepo.Received(1).InsertAsync(
            Arg.Is<SubcriptionPrice>(p => p.SalePercent == 0)
        );
    }

    #endregion

    #region UTCID09 - Boundary: SalePercent = 100

    [Fact]
    public async Task CreateSubcriptionPrice_UTCID09_Success_WhenSalePercentIs100()
    {
        // Arrange
        var subcriptionServiceId = Guid.NewGuid();
        var subcriptionService = CreateSubcriptionService(subcriptionServiceId, "Test Package", 100000m, SubcriptionStatus.Active);
        
        var dto = new SubcriptionPriceCreateDto
        {
            SubcriptionServiceId = subcriptionServiceId,
            SalePercent = 100,
            EffectiveFrom = DateTime.UtcNow.AddDays(1),
            EffectiveTo = DateTime.UtcNow.AddDays(11)
        };

        var (service, priceRepo, _) = BuildService(subcriptionService);

        // Act
        await service.CreateSubcriptionPrice(dto);

        // Assert
        await priceRepo.Received(1).InsertAsync(
            Arg.Is<SubcriptionPrice>(p => p.SalePercent == 100)
        );
    }

    #endregion

    #region UTCID10 - Edge Case: EffectiveFrom < DateTime.UtcNow (should be set to UtcNow)

    [Fact]
    public async Task CreateSubcriptionPrice_UTCID10_Success_WhenEffectiveFromIsInPast_SetsToUtcNow()
    {
        // Arrange
        var subcriptionServiceId = Guid.NewGuid();
        var subcriptionService = CreateSubcriptionService(subcriptionServiceId, "Test Package", 100000m, SubcriptionStatus.Active);
        
        var pastDate = DateTime.UtcNow.AddDays(-5);
        var dto = new SubcriptionPriceCreateDto
        {
            SubcriptionServiceId = subcriptionServiceId,
            SalePercent = 10,
            EffectiveFrom = pastDate,
            EffectiveTo = DateTime.UtcNow.AddDays(11)
        };

        var (service, priceRepo, _) = BuildService(subcriptionService);

        // Act
        await service.CreateSubcriptionPrice(dto);

        // Assert
        await priceRepo.Received(1).InsertAsync(
            Arg.Is<SubcriptionPrice>(p =>
                p.EffectiveFrom >= DateTime.UtcNow.AddMinutes(-1) && // Allow small time difference
                p.EffectiveFrom <= DateTime.UtcNow.AddMinutes(1) &&
                p.EffectiveTo == dto.EffectiveTo
            )
        );
    }

    #endregion

    #region UTCID11 - Edge Case: No conflict when existing price is inactive

    [Fact]
    public async Task CreateSubcriptionPrice_UTCID11_Success_WhenExistingPriceIsInactive()
    {
        // Arrange
        var subcriptionServiceId = Guid.NewGuid();
        var subcriptionService = CreateSubcriptionService(subcriptionServiceId, "Test Package", 100000m, SubcriptionStatus.Active);
        
        // Existing inactive price: Day 5 to Day 15
        var existingPrice = CreateSubcriptionPrice(
            Guid.NewGuid(),
            subcriptionServiceId,
            DateTime.UtcNow.AddDays(5),
            DateTime.UtcNow.AddDays(15),
            isActive: false, // Inactive
            isExpired: false
        );

        // New price: Day 10 to Day 20 (overlaps but existing is inactive, so no conflict)
        var dto = new SubcriptionPriceCreateDto
        {
            SubcriptionServiceId = subcriptionServiceId,
            SalePercent = 10,
            EffectiveFrom = DateTime.UtcNow.AddDays(10),
            EffectiveTo = DateTime.UtcNow.AddDays(20)
        };

        var (service, priceRepo, _) = BuildService(subcriptionService, new List<SubcriptionPrice> { existingPrice });

        // Act
        await service.CreateSubcriptionPrice(dto);

        // Assert - Should succeed because existing price is inactive
        await priceRepo.Received(1).InsertAsync(Arg.Any<SubcriptionPrice>());
    }

    #endregion

    #region UTCID12 - Edge Case: No conflict when existing price is expired

    [Fact]
    public async Task CreateSubcriptionPrice_UTCID12_Success_WhenExistingPriceIsExpired()
    {
        // Arrange
        var subcriptionServiceId = Guid.NewGuid();
        var subcriptionService = CreateSubcriptionService(subcriptionServiceId, "Test Package", 100000m, SubcriptionStatus.Active);
        
        // Existing expired price: Day -15 to Day -5 (in the past)
        var existingPrice = CreateSubcriptionPrice(
            Guid.NewGuid(),
            subcriptionServiceId,
            DateTime.UtcNow.AddDays(-15),
            DateTime.UtcNow.AddDays(-5),
            isActive: true,
            isExpired: true // Expired
        );

        // New price: Day 1 to Day 11 (no conflict because existing is expired)
        var dto = new SubcriptionPriceCreateDto
        {
            SubcriptionServiceId = subcriptionServiceId,
            SalePercent = 10,
            EffectiveFrom = DateTime.UtcNow.AddDays(1),
            EffectiveTo = DateTime.UtcNow.AddDays(11)
        };

        var (service, priceRepo, _) = BuildService(subcriptionService, new List<SubcriptionPrice> { existingPrice });

        // Act
        await service.CreateSubcriptionPrice(dto);

        // Assert - Should succeed because existing price is expired
        await priceRepo.Received(1).InsertAsync(Arg.Any<SubcriptionPrice>());
    }

    #endregion

    #region UTCID13 - Edge Case: EffectiveFrom equals EffectiveTo (boundary)

    [Fact]
    public async Task CreateSubcriptionPrice_UTCID13_Throws_WhenEffectiveFromEqualsEffectiveTo()
    {
        // Arrange
        var subcriptionServiceId = Guid.NewGuid();
        var subcriptionService = CreateSubcriptionService(subcriptionServiceId, "Test Package", 100000m, SubcriptionStatus.Active);
        
        var sameDate = DateTime.UtcNow.AddDays(10);
        var dto = new SubcriptionPriceCreateDto
        {
            SubcriptionServiceId = subcriptionServiceId,
            SalePercent = 10,
            EffectiveFrom = sameDate,
            EffectiveTo = sameDate
        };

        var (service, _, _) = BuildService(subcriptionService);

        // Act & Assert
        var ex = await Should.ThrowAsync<UserFriendlyException>(() => service.CreateSubcriptionPrice(dto));
        ex.Message.ShouldContain("EffectiveFrom must be less than EffectiveTo");
    }

    #endregion

    #region UTCID14 - Edge Case: EffectiveTo exactly equals DateTime.UtcNow

    [Fact]
    public async Task CreateSubcriptionPrice_UTCID14_Throws_WhenEffectiveToEqualsUtcNow()
    {
        // Arrange
        var subcriptionServiceId = Guid.NewGuid();
        var subcriptionService = CreateSubcriptionService(subcriptionServiceId, "Test Package", 100000m, SubcriptionStatus.Active);
        
        var dto = new SubcriptionPriceCreateDto
        {
            SubcriptionServiceId = subcriptionServiceId,
            SalePercent = 10,
            EffectiveFrom = DateTime.UtcNow.AddDays(-1),
            EffectiveTo = DateTime.UtcNow
        };

        var (service, _, _) = BuildService(subcriptionService);

        // Act & Assert
        var ex = await Should.ThrowAsync<UserFriendlyException>(() => service.CreateSubcriptionPrice(dto));
        ex.Message.ShouldContain("EffectiveTo must be greater than now");
    }

    #endregion

    #region UTCID15 - Success: Multiple prices for same service but different time ranges

    [Fact]
    public async Task CreateSubcriptionPrice_UTCID15_Success_WhenNoTimeOverlap()
    {
        // Arrange
        var subcriptionServiceId = Guid.NewGuid();
        var subcriptionService = CreateSubcriptionService(subcriptionServiceId, "Test Package", 100000m, SubcriptionStatus.Active);
        
        // Existing price: Day 1 to Day 10
        var existingPrice = CreateSubcriptionPrice(
            Guid.NewGuid(),
            subcriptionServiceId,
            DateTime.UtcNow.AddDays(1),
            DateTime.UtcNow.AddDays(10),
            isActive: true,
            isExpired: false
        );

        // New price: Day 11 to Day 20 (no overlap)
        var dto = new SubcriptionPriceCreateDto
        {
            SubcriptionServiceId = subcriptionServiceId,
            SalePercent = 15,
            EffectiveFrom = DateTime.UtcNow.AddDays(11),
            EffectiveTo = DateTime.UtcNow.AddDays(20)
        };

        var (service, priceRepo, _) = BuildService(subcriptionService, new List<SubcriptionPrice> { existingPrice });

        // Act
        await service.CreateSubcriptionPrice(dto);

        // Assert - Should succeed because no time overlap
        await priceRepo.Received(1).InsertAsync(
            Arg.Is<SubcriptionPrice>(p =>
                p.EffectiveFrom == dto.EffectiveFrom &&
                p.EffectiveTo == dto.EffectiveTo &&
                p.SalePercent == 15
            )
        );
    }

    #endregion

    #region Helper Methods

    private static SubcriptionService CreateSubcriptionService(
        Guid id,
        string title,
        decimal originalPrice,
        SubcriptionStatus status)
    {
        var service = new SubcriptionService
        {
            Title = title,
            Description = "Test Description",
            Target = SubcriptorTarget.Recruiter,
            Status = status,
            OriginalPrice = originalPrice,
            IsActive = true,
            DayDuration = 10
        };

        // Set Id using reflection
        typeof(SubcriptionService)
            .GetProperty("Id")?
            .SetValue(service, id);

        return service;
    }

    private static SubcriptionPrice CreateSubcriptionPrice(
        Guid id,
        Guid subcriptionServiceId,
        DateTime effectiveFrom,
        DateTime effectiveTo,
        bool isActive,
        bool isExpired)
    {
        var price = new SubcriptionPrice
        {
            SubcriptionServiceId = subcriptionServiceId,
            OriginalPrice = 100000m,
            SalePercent = 10,
            EffectiveFrom = effectiveFrom,
            EffectiveTo = effectiveTo,
            IsActive = isActive,
            IsExpried = isExpired
        };

        // Set Id using reflection
        typeof(SubcriptionPrice)
            .GetProperty("Id")?
            .SetValue(price, id);

        return price;
    }

    private static (
        SubcriptionPriceService service,
        IRepository<SubcriptionPrice, Guid> priceRepo,
        ISubcriptionServiceRepository serviceRepo
    ) BuildService(
        SubcriptionService? subcriptionService,
        List<SubcriptionPrice>? existingPrices = null)
    {
        var priceRepo = Substitute.For<IRepository<SubcriptionPrice, Guid>>();
        var serviceRepo = Substitute.For<ISubcriptionServiceRepository>();

        // Setup service repository
        if (subcriptionService != null)
        {
            serviceRepo.FirstOrDefaultAsync(Arg.Any<Expression<Func<SubcriptionService, bool>>>())
                .Returns(subcriptionService);
        }

        // Setup price repository for conflict checking
        if (existingPrices != null && existingPrices.Any())
        {
            priceRepo.GetListAsync(Arg.Any<Expression<Func<SubcriptionPrice, bool>>>())
                .Returns(ci =>
                {
                    var predicate = ci.Arg<Expression<Func<SubcriptionPrice, bool>>>();
                    var compiled = predicate.Compile();
                    return Task.FromResult(existingPrices.Where(compiled).ToList());
                });
        }
        else
        {
            priceRepo.GetListAsync(Arg.Any<Expression<Func<SubcriptionPrice, bool>>>())
                .Returns(Task.FromResult(new List<SubcriptionPrice>()));
        }

        priceRepo.InsertAsync(Arg.Any<SubcriptionPrice>(), Arg.Any<bool>())
            .Returns(ci => Task.FromResult(ci.Arg<SubcriptionPrice>()));

        var service = new SubcriptionPriceService(priceRepo, serviceRepo);

        return (service, priceRepo, serviceRepo);
    }

    #endregion
}

