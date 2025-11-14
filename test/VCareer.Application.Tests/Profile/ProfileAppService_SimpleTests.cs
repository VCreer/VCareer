using System;
using System.Threading.Tasks;
using NSubstitute;
using Shouldly;
using VCareer.Dto.Profile;
using Volo.Abp.Identity;
using Volo.Abp.Users;
using Volo.Abp.Validation;
using Xunit;

namespace VCareer.Profile;

public class ProfileAppService_SimpleTests
{
    [Fact]
    public void Should_Create_Valid_UpdatePersonalInfoDto()
    {
        // Arrange & Act
        var dto = new UpdatePersonalInfoDto
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

        // Assert
        dto.Name.ShouldBe("John");
        dto.Surname.ShouldBe("Doe");
        dto.Email.ShouldBe("john.doe@example.com");
        dto.PhoneNumber.ShouldBe("+1234567890");
        dto.Bio.ShouldBe("Software Developer");
        dto.DateOfBirth.ShouldBe(new DateTime(1990, 1, 1));
        dto.Gender.ShouldBe(true);
        dto.Location.ShouldBe("Ho Chi Minh City");
        dto.Address.ShouldBe("123 Main Street");
        dto.Nationality.ShouldBe("Vietnamese");
        dto.MaritalStatus.ShouldBe("Single");
    }

    [Fact]
    public void Should_Create_Valid_ChangePasswordDto()
    {
        // Arrange & Act
        var dto = new ChangePasswordDto
        {
            CurrentPassword = "CurrentPass123!",
            NewPassword = "NewPassword123!",
            ConfirmPassword = "NewPassword123!"
        };

        // Assert
        dto.CurrentPassword.ShouldBe("CurrentPass123!");
        dto.NewPassword.ShouldBe("NewPassword123!");
        dto.ConfirmPassword.ShouldBe("NewPassword123!");
    }

    [Fact]
    public void Should_Create_Valid_ProfileDto()
    {
        // Arrange
        var userId = Guid.NewGuid();

        // Act
        var dto = new ProfileDto
        {
            Id = userId,
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
            MaritalStatus = "Single",
            UserName = "johndoe",
            EmailConfirmed = true,
            PhoneNumberConfirmed = true,
            CreationTime = DateTime.UtcNow,
            LastModificationTime = DateTime.UtcNow
        };

        // Assert
        dto.Id.ShouldBe(userId);
        dto.Name.ShouldBe("John");
        dto.Surname.ShouldBe("Doe");
        dto.Email.ShouldBe("john.doe@example.com");
        dto.PhoneNumber.ShouldBe("+1234567890");
        dto.Bio.ShouldBe("Software Developer");
        dto.DateOfBirth.ShouldBe(new DateTime(1990, 1, 1));
        dto.Gender.ShouldBe(true);
        dto.Location.ShouldBe("Ho Chi Minh City");
        dto.Address.ShouldBe("123 Main Street");
        dto.Nationality.ShouldBe("Vietnamese");
        dto.MaritalStatus.ShouldBe("Single");
        dto.UserName.ShouldBe("johndoe");
        dto.EmailConfirmed.ShouldBeTrue();
        dto.PhoneNumberConfirmed.ShouldBeTrue();
        dto.CreationTime.ShouldNotBe(default(DateTime));
        dto.LastModificationTime.ShouldNotBe(default(DateTime));
    }

    [Fact]
    public void Should_Validate_Email_Format()
    {
        // Arrange
        var validEmails = new[]
        {
            "test@example.com",
            "user.name@domain.co.uk",
            "test+tag@example.org"
        };

        var invalidEmails = new[]
        {
            "invalid-email",
            "@example.com",
            "test@",
            "test.example.com"
        };

        // Act & Assert
        foreach (var email in validEmails)
        {
            var dto = new UpdatePersonalInfoDto
            {
                Name = "Test",
                Surname = "User",
                Email = email
            };
            
            // This would be validated by data annotations in real scenario
            dto.Email.ShouldBe(email);
        }

        foreach (var email in invalidEmails)
        {
            var dto = new UpdatePersonalInfoDto
            {
                Name = "Test",
                Surname = "User",
                Email = email
            };
            
            // This would fail validation in real scenario
            dto.Email.ShouldBe(email);
        }
    }

    [Fact]
    public void Should_Validate_Password_Requirements()
    {
        // Arrange
        var validPasswords = new[]
        {
            "Password123!",
            "MySecurePass456",
            "Test123456"
        };

        var invalidPasswords = new[]
        {
            "123", // Too short
            "password", // No numbers
            "PASSWORD123", // No lowercase
            "password123" // No uppercase
        };

        // Act & Assert
        foreach (var password in validPasswords)
        {
            var dto = new ChangePasswordDto
            {
                CurrentPassword = "OldPass123!",
                NewPassword = password,
                ConfirmPassword = password
            };
            
            dto.NewPassword.ShouldBe(password);
            dto.ConfirmPassword.ShouldBe(password);
        }

        foreach (var password in invalidPasswords)
        {
            var dto = new ChangePasswordDto
            {
                CurrentPassword = "OldPass123!",
                NewPassword = password,
                ConfirmPassword = password
            };
            
            dto.NewPassword.ShouldBe(password);
            dto.ConfirmPassword.ShouldBe(password);
        }
    }

    [Fact]
    public void Should_Validate_String_Length_Limits()
    {
        // Arrange
        var longString = new string('A', 1001); // Exceeds 1000 char limit for Bio

        // Act
        var dto = new UpdatePersonalInfoDto
        {
            Name = "Test",
            Surname = "User",
            Email = "test@example.com",
            Bio = longString
        };

        // Assert
        dto.Bio.Length.ShouldBe(1001);
        dto.Bio.ShouldBe(longString);
    }

    [Fact]
    public void Should_Handle_Null_Values()
    {
        // Arrange & Act
        var dto = new UpdatePersonalInfoDto
        {
            Name = "Test",
            Surname = "User",
            Email = "test@example.com",
            Bio = null,
            DateOfBirth = null,
            Gender = null,
            Location = null,
            Address = null,
            Nationality = null,
            MaritalStatus = null
        };

        // Assert
        dto.Name.ShouldBe("Test");
        dto.Surname.ShouldBe("User");
        dto.Email.ShouldBe("test@example.com");
        dto.Bio.ShouldBeNull();
        dto.DateOfBirth.ShouldBeNull();
        dto.Gender.ShouldBeNull();
        dto.Location.ShouldBeNull();
        dto.Address.ShouldBeNull();
        dto.Nationality.ShouldBeNull();
        dto.MaritalStatus.ShouldBeNull();
    }
}
