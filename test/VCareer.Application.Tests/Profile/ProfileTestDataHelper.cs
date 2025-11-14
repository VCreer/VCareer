using System;
using System.Threading.Tasks;
using VCareer.Dto.Profile;
using Volo.Abp.Data;
using Volo.Abp.Identity;

namespace VCareer.Profile;

public static class ProfileTestDataHelper
{
    public static IdentityUser CreateTestUser(Guid? userId = null)
    {
        var id = userId ?? Guid.NewGuid();
        var user = new IdentityUser(id, $"testuser_{id:N}", $"test_{id:N}@example.com");
        user.Name = "Test";
        user.Surname = "User";
        // Note: PhoneNumber should be set using SetPhoneNumberAsync in tests
        user.SetProperty("Bio", "Test bio");
        user.SetProperty("Location", "Test location");
        user.SetProperty("DateOfBirth", new DateTime(1990, 1, 1));
        user.SetProperty("Gender", true);
        user.SetProperty("Address", "123 Test Street");
        user.SetProperty("Nationality", "Test Nationality");
        user.SetProperty("MaritalStatus", "Single");
        
        return user;
    }

    public static async Task<IdentityUser> CreateTestUserWithPhoneAsync(IdentityUserManager userManager, string phoneNumber = "+1234567890", Guid? userId = null)
    {
        var user = CreateTestUser(userId);
        
        await userManager.CreateAsync(user);
        await userManager.SetPhoneNumberAsync(user, phoneNumber);
        
        return user;
    }

    public static UpdatePersonalInfoDto CreateValidUpdatePersonalInfoDto()
    {
        return new UpdatePersonalInfoDto
        {
            Name = "John",
            Surname = "Doe",
            Email = "john.doe@example.com",
            PhoneNumber = "+1234567890",
            Bio = "Software Developer with 5 years experience",
            DateOfBirth = new DateTime(1990, 1, 1),
            Gender = true,
            Location = "Ho Chi Minh City, Vietnam",
            Address = "123 Main Street, District 1",
            Nationality = "Vietnamese",
            MaritalStatus = "Single"
        };
    }

    public static UpdatePersonalInfoDto CreateInvalidUpdatePersonalInfoDto()
    {
        return new UpdatePersonalInfoDto
        {
            Name = "", // Invalid: empty name
            Surname = "Doe",
            Email = "invalid-email-format", // Invalid: wrong email format
            PhoneNumber = "invalid-phone", // Invalid: wrong phone format
            Bio = new string('A', 1001), // Invalid: too long bio
            Location = new string('B', 501), // Invalid: too long location
            Address = new string('C', 1001), // Invalid: too long address
            Nationality = new string('D', 101), // Invalid: too long nationality
            MaritalStatus = new string('E', 51) // Invalid: too long marital status
        };
    }

    public static ChangePasswordDto CreateValidChangePasswordDto(string currentPassword = "CurrentPass123!")
    {
        return new ChangePasswordDto
        {
            CurrentPassword = currentPassword,
            NewPassword = "NewPassword123!",
            ConfirmPassword = "NewPassword123!"
        };
    }

    public static ChangePasswordDto CreateInvalidChangePasswordDto()
    {
        return new ChangePasswordDto
        {
            CurrentPassword = "WrongPassword", // Invalid: wrong current password
            NewPassword = "123", // Invalid: too short
            ConfirmPassword = "DifferentPassword" // Invalid: mismatched passwords
        };
    }

    public static ProfileDto CreateExpectedProfileDto(Guid userId)
    {
        return new ProfileDto
        {
            Id = userId,
            Name = "John",
            Surname = "Doe",
            Email = "john.doe@example.com",
            PhoneNumber = "+1234567890",
            Bio = "Software Developer with 5 years experience",
            DateOfBirth = new DateTime(1990, 1, 1),
            Gender = true,
            Location = "Ho Chi Minh City, Vietnam",
            Address = "123 Main Street, District 1",
            Nationality = "Vietnamese",
            MaritalStatus = "Single",
            UserName = $"testuser_{userId:N}",
            EmailConfirmed = false,
            PhoneNumberConfirmed = false,
            CreationTime = DateTime.UtcNow,
            LastModificationTime = null
        };
    }
}
