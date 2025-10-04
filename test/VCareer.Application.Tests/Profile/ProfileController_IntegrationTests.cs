using System;
using System.Threading.Tasks;
using NSubstitute;
using Shouldly;
using Volo.Abp.Data;
using Volo.Abp.Identity;
using Volo.Abp.Users;
using Xunit;

namespace VCareer.Profile;

public class ProfileController_IntegrationTests : VCareerApplicationTestBase<VCareerApplicationTestModule>
{
    private readonly IProfileAppService _profileAppService;
    private readonly IdentityUserManager _userManager;
    private readonly ICurrentUser _currentUser;

    public ProfileController_IntegrationTests()
    {
        _profileAppService = GetRequiredService<IProfileAppService>();
        _userManager = GetRequiredService<IdentityUserManager>();
        _currentUser = GetRequiredService<ICurrentUser>();
    }

    [Fact]
    public async Task Should_Update_Personal_Info_With_Valid_Data_Integration()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new Volo.Abp.Identity.IdentityUser(userId, "testuser", "test@example.com");
        user.Name = "Old Name";
        user.Surname = "Old Surname";

        await WithUnitOfWorkAsync(async () =>
        {
            await _userManager.CreateAsync(user);
            await _userManager.SetPhoneNumberAsync(user, "+1234567890");
        });

        // Mock current user
        _currentUser.Id.Returns(userId);
        _currentUser.IsAuthenticated.Returns(true);

        var updateDto = new UpdatePersonalInfoDto
        {
            Name = "John",
            Surname = "Doe",
            Email = "john.doe@example.com",
            PhoneNumber = "+9876543210",
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
        updatedUser.PhoneNumber.ShouldBe("+9876543210");
        updatedUser.GetProperty<string>("Bio").ShouldBe("Software Developer");
        updatedUser.GetProperty<DateTime?>("DateOfBirth").ShouldBe(new DateTime(1990, 1, 1));
        updatedUser.GetProperty<bool?>("Gender").ShouldBe(true);
        updatedUser.GetProperty<string>("Location").ShouldBe("Ho Chi Minh City");
        updatedUser.GetProperty<string>("Address").ShouldBe("123 Main Street");
        updatedUser.GetProperty<string>("Nationality").ShouldBe("Vietnamese");
        updatedUser.GetProperty<string>("MaritalStatus").ShouldBe("Single");
    }

    [Fact]
    public async Task Should_Change_Password_Integration()
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
        
        var isOldPasswordValid = await _userManager.CheckPasswordAsync(user, currentPassword);
        isOldPasswordValid.ShouldBeFalse();
    }

    [Fact]
    public async Task Should_Get_Profile_After_Update_Integration()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new Volo.Abp.Identity.IdentityUser(userId, "testuser", "test@example.com");
        user.Name = "John";
        user.Surname = "Doe";

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
    }

    [Fact]
    public async Task Should_Handle_Complete_Profile_Workflow_Integration()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new Volo.Abp.Identity.IdentityUser(userId, "testuser", "test@example.com");
        var currentPassword = "InitialPass123!";
        
        await WithUnitOfWorkAsync(async () =>
        {
            await _userManager.CreateAsync(user);
            await _userManager.AddPasswordAsync(user, currentPassword);
            await _userManager.SetPhoneNumberAsync(user, "+1111111111");
        });

        // Mock current user
        _currentUser.Id.Returns(userId);
        _currentUser.IsAuthenticated.Returns(true);

        // Step 1: Get initial profile
        var initialProfile = await _profileAppService.GetCurrentUserProfileAsync();
        initialProfile.PhoneNumber.ShouldBe("+1111111111");

        // Step 2: Update personal info
        var updateDto = new UpdatePersonalInfoDto
        {
            Name = "Updated Name",
            Surname = "Updated Surname",
            Email = "updated@example.com",
            PhoneNumber = "+2222222222",
            Bio = "Updated Bio"
        };

        await _profileAppService.UpdatePersonalInfoAsync(updateDto);

        // Step 3: Change password
        var changePasswordDto = new ChangePasswordDto
        {
            CurrentPassword = currentPassword,
            NewPassword = "NewPassword123!",
            ConfirmPassword = "NewPassword123!"
        };

        await _profileAppService.ChangePasswordAsync(changePasswordDto);

        // Step 4: Verify all changes
        var finalProfile = await _profileAppService.GetCurrentUserProfileAsync();
        finalProfile.Name.ShouldBe("Updated Name");
        finalProfile.Surname.ShouldBe("Updated Surname");
        finalProfile.Email.ShouldBe("updated@example.com");
        finalProfile.PhoneNumber.ShouldBe("+2222222222");
        finalProfile.Bio.ShouldBe("Updated Bio");

        // Verify password change
        var isNewPasswordValid = await _userManager.CheckPasswordAsync(user, "NewPassword123!");
        isNewPasswordValid.ShouldBeTrue();
    }
}
