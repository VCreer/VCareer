using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using NSubstitute;
using Shouldly;
using Volo.Abp.Data;
using Volo.Abp.Identity;
using Volo.Abp.Modularity;
using Volo.Abp.Users;
using Volo.Abp.Validation;
using Xunit;

namespace VCareer.Profile;

public abstract class ProfileAppService_Tests<TStartupModule> : VCareerApplicationTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{
    private readonly IProfileAppService _profileAppService;
    private readonly IdentityUserManager _userManager;
    private readonly ICurrentUser _currentUser;

    protected ProfileAppService_Tests()
    {
        _profileAppService = GetRequiredService<IProfileAppService>();
        _userManager = GetRequiredService<IdentityUserManager>();
        _currentUser = GetRequiredService<ICurrentUser>();
    }

    [Fact]
    public async Task Should_Get_Current_User_Profile_Successfully()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new Volo.Abp.Identity.IdentityUser(userId, "testuser", "test@example.com");
        user.Name = "John";
        user.Surname = "Doe";
        user.SetProperty("Bio", "Test bio");
        user.SetProperty("Location", "Test location");

        await WithUnitOfWorkAsync(async () =>
        {
            await _userManager.CreateAsync(user);
            await _userManager.SetPhoneNumberAsync(user, "+1234567890");
        });

        // Mock current user
        _currentUser.Id.Returns(userId);
        _currentUser.IsAuthenticated.Returns(true);

        // Act
        var result = await _profileAppService.GetCurrentUserProfileAsync();

        // Assert
        result.ShouldNotBeNull();
        result.Id.ShouldBe(userId);
        result.Name.ShouldBe("John");
        result.Surname.ShouldBe("Doe");
        result.Email.ShouldBe("test@example.com");
        result.PhoneNumber.ShouldBe("+1234567890");
        result.Bio.ShouldBe("Test bio");
        result.Location.ShouldBe("Test location");
    }

    [Fact]
    public async Task Should_Update_Personal_Info_Successfully()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new Volo.Abp.Identity.IdentityUser(userId, "testuser", "test@example.com");
        user.Name = "Old Name";
        user.Surname = "Old Surname";

        await WithUnitOfWorkAsync(async () =>
        {
            await _userManager.CreateAsync(user);
        });

        // Mock current user
        _currentUser.Id.Returns(userId);
        _currentUser.IsAuthenticated.Returns(true);

        var updateDto = new UpdatePersonalInfoDto
        {
            Name = "John",
            Surname = "Doe",
            Email = "john.doe@example.com",
            PhoneNumber = "+1234567890",
            Bio = "Software Developer",
            DateOfBirth = new DateTime(1990, 1, 1),
            Gender = true,
            Location = "Ho Chi Minh City",
            Address = "123 Main Street",
            Nationality = "Vietnamese",
            MaritalStatus = "Single"
        };

        // Act
        await _profileAppService.UpdatePersonalInfoAsync(updateDto);

        // Assert
        var updatedUser = await _userManager.GetByIdAsync(userId);
        updatedUser.Name.ShouldBe("John");
        updatedUser.Surname.ShouldBe("Doe");
        updatedUser.Email.ShouldBe("john.doe@example.com");
        updatedUser.PhoneNumber.ShouldBe("+1234567890");
        updatedUser.GetProperty<string>("Bio").ShouldBe("Software Developer");
        updatedUser.GetProperty<DateTime?>("DateOfBirth").ShouldBe(new DateTime(1990, 1, 1));
        updatedUser.GetProperty<bool?>("Gender").ShouldBe(true);
        updatedUser.GetProperty<string>("Location").ShouldBe("Ho Chi Minh City");
        updatedUser.GetProperty<string>("Address").ShouldBe("123 Main Street");
        updatedUser.GetProperty<string>("Nationality").ShouldBe("Vietnamese");
        updatedUser.GetProperty<string>("MaritalStatus").ShouldBe("Single");
    }

    [Fact]
    public async Task Should_Not_Update_Personal_Info_With_Invalid_Email()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new Volo.Abp.Identity.IdentityUser(userId, "testuser", "test@example.com");

        await WithUnitOfWorkAsync(async () =>
        {
            await _userManager.CreateAsync(user);
        });

        // Mock current user
        _currentUser.Id.Returns(userId);
        _currentUser.IsAuthenticated.Returns(true);

        var updateDto = new UpdatePersonalInfoDto
        {
            Name = "John",
            Surname = "Doe",
            Email = "invalid-email-format", // Invalid email
            PhoneNumber = "+1234567890"
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<AbpValidationException>(async () =>
        {
            await _profileAppService.UpdatePersonalInfoAsync(updateDto);
        });

        exception.ValidationErrors.ShouldNotBeEmpty();
    }

    [Fact]
    public async Task Should_Not_Update_Personal_Info_With_Empty_Name()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new Volo.Abp.Identity.IdentityUser(userId, "testuser", "test@example.com");

        await WithUnitOfWorkAsync(async () =>
        {
            await _userManager.CreateAsync(user);
        });

        // Mock current user
        _currentUser.Id.Returns(userId);
        _currentUser.IsAuthenticated.Returns(true);

        var updateDto = new UpdatePersonalInfoDto
        {
            Name = "", // Empty name
            Surname = "Doe",
            Email = "test@example.com"
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<AbpValidationException>(async () =>
        {
            await _profileAppService.UpdatePersonalInfoAsync(updateDto);
        });

        exception.ValidationErrors.ShouldNotBeEmpty();
    }

    [Fact]
    public async Task Should_Change_Password_Successfully()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new Volo.Abp.Identity.IdentityUser(userId, "testuser", "test@example.com");
        var currentPassword = "CurrentPass123!";
        
        await WithUnitOfWorkAsync(async () =>
        {
            await _userManager.CreateAsync(user);
            await _userManager.AddPasswordAsync(user, currentPassword);
        });

        // Mock current user
        _currentUser.Id.Returns(userId);
        _currentUser.IsAuthenticated.Returns(true);

        var changePasswordDto = new ChangePasswordDto
        {
            CurrentPassword = currentPassword,
            NewPassword = "NewPassword123!",
            ConfirmPassword = "NewPassword123!"
        };

        // Act
        await _profileAppService.ChangePasswordAsync(changePasswordDto);

        // Assert
        var isNewPasswordValid = await _userManager.CheckPasswordAsync(user, "NewPassword123!");
        isNewPasswordValid.ShouldBeTrue();
    }

    [Fact]
    public async Task Should_Not_Change_Password_With_Wrong_Current_Password()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new Volo.Abp.Identity.IdentityUser(userId, "testuser", "test@example.com");
        var currentPassword = "CurrentPass123!";
        
        await WithUnitOfWorkAsync(async () =>
        {
            await _userManager.CreateAsync(user);
            await _userManager.AddPasswordAsync(user, currentPassword);
        });

        // Mock current user
        _currentUser.Id.Returns(userId);
        _currentUser.IsAuthenticated.Returns(true);

        var changePasswordDto = new ChangePasswordDto
        {
            CurrentPassword = "WrongPassword", // Wrong current password
            NewPassword = "NewPassword123!",
            ConfirmPassword = "NewPassword123!"
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<Volo.Abp.UserFriendlyException>(async () =>
        {
            await _profileAppService.ChangePasswordAsync(changePasswordDto);
        });

        exception.Message.ShouldContain("Current password is incorrect");
    }

    [Fact]
    public async Task Should_Not_Change_Password_With_Mismatched_Confirm_Password()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new Volo.Abp.Identity.IdentityUser(userId, "testuser", "test@example.com");
        var currentPassword = "CurrentPass123!";
        
        await WithUnitOfWorkAsync(async () =>
        {
            await _userManager.CreateAsync(user);
            await _userManager.AddPasswordAsync(user, currentPassword);
        });

        // Mock current user
        _currentUser.Id.Returns(userId);
        _currentUser.IsAuthenticated.Returns(true);

        var changePasswordDto = new ChangePasswordDto
        {
            CurrentPassword = currentPassword,
            NewPassword = "NewPassword123!",
            ConfirmPassword = "DifferentPassword123!" // Mismatched password
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<AbpValidationException>(async () =>
        {
            await _profileAppService.ChangePasswordAsync(changePasswordDto);
        });

        exception.ValidationErrors.ShouldNotBeEmpty();
    }

    [Fact]
    public async Task Should_Not_Change_Password_With_Short_New_Password()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new Volo.Abp.Identity.IdentityUser(userId, "testuser", "test@example.com");
        var currentPassword = "CurrentPass123!";
        
        await WithUnitOfWorkAsync(async () =>
        {
            await _userManager.CreateAsync(user);
            await _userManager.AddPasswordAsync(user, currentPassword);
        });

        // Mock current user
        _currentUser.Id.Returns(userId);
        _currentUser.IsAuthenticated.Returns(true);

        var changePasswordDto = new ChangePasswordDto
        {
            CurrentPassword = currentPassword,
            NewPassword = "123", // Too short
            ConfirmPassword = "123"
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<AbpValidationException>(async () =>
        {
            await _profileAppService.ChangePasswordAsync(changePasswordDto);
        });

        exception.ValidationErrors.ShouldNotBeEmpty();
    }

    [Fact]
    public async Task Should_Throw_Exception_When_User_Not_Found()
    {
        // Arrange
        var nonExistentUserId = Guid.NewGuid();
        
        // Mock current user with non-existent ID
        _currentUser.Id.Returns(nonExistentUserId);
        _currentUser.IsAuthenticated.Returns(true);

        var updateDto = new UpdatePersonalInfoDto
        {
            Name = "John",
            Surname = "Doe",
            Email = "test@example.com"
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<Volo.Abp.UserFriendlyException>(async () =>
        {
            await _profileAppService.UpdatePersonalInfoAsync(updateDto);
        });

        exception.Message.ShouldContain("User not found");
    }

    [Fact]
    public async Task Should_Throw_Exception_When_User_Not_Authenticated()
    {
        // Arrange
        _currentUser.IsAuthenticated.Returns(false);

        var updateDto = new UpdatePersonalInfoDto
        {
            Name = "John",
            Surname = "Doe",
            Email = "test@example.com"
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<Volo.Abp.UserFriendlyException>(async () =>
        {
            await _profileAppService.UpdatePersonalInfoAsync(updateDto);
        });

        exception.Message.ShouldContain("User not found");
    }
}

public class ProfileAppService_Tests : ProfileAppService_Tests<VCareerApplicationTestModule>
{
    // This class inherits all test methods from the abstract base class
    // No additional implementation needed for basic functionality tests
}