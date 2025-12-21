using Microsoft.AspNetCore.Identity;
using NSubstitute;
using Shouldly;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VCareer.Dto.Profile;
using VCareer.Models.Users;
using VCareer.Services.Profile;
using Volo.Abp;
using Volo.Abp.Domain.Entities;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;
using Volo.Abp.Users;
using Xunit;
using IdentityUser = Volo.Abp.Identity.IdentityUser;

namespace VCareer.Profile;

public class ProfileAppServiceTests
{
    /// Test cập nhật thông tin cá nhân thành công
    [Fact]
    public async Task UpdatePersonalInfoAsync_updates_personal_info_successfully()
    {
        // Arrange: Tạo dữ liệu test
        var userId = Guid.NewGuid();
        var user = CreateIdentityUser(userId, "test@example.com", "Test", "User");
        var dto = new UpdatePersonalInfoDto
        {
            Name = "New Name",
            Surname = "New Surname",
            Email = "newemail@example.com",
            PhoneNumber = "0123456789"
        };

        var (service, userManager, _) = BuildService(
            userId,
            new List<IdentityUser> { user },
            new List<CandidateProfile>(),
            new List<EmployeeProfile>(),
            new List<RecruiterProfile>());

        // Act: Gọi hàm cập nhật thông tin
        await service.UpdatePersonalInfoAsync(dto);

        // Assert: Kiểm tra user đã được cập nhật
        user.Name.ShouldBe(dto.Name);
        user.Surname.ShouldBe(dto.Surname);
    }

    /// Test cập nhật thông tin cá nhân thất bại khi user không tồn tại
    [Fact]
    public async Task UpdatePersonalInfoAsync_throws_when_user_not_found()
    {
        // Arrange: Tạo service không có user
        var nonExistentUserId = Guid.NewGuid();
        var dto = new UpdatePersonalInfoDto { Name = "Test" };

        var (service, _, _) = BuildService(
            nonExistentUserId,
            new List<IdentityUser>(),
            new List<CandidateProfile>(),
            new List<EmployeeProfile>(),
            new List<RecruiterProfile>());

        // Act & Assert: Kiểm tra ném exception khi user không tồn tại
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.UpdatePersonalInfoAsync(dto));

        ex.Message.ShouldContain("User not found");
    }

    /// Test đổi mật khẩu thành công khi mật khẩu cũ đúng
    [Fact]
    public async Task ChangePasswordAsync_changes_password_successfully()
    {
        // Arrange: Tạo user và dto
        var userId = Guid.NewGuid();
        var user = CreateIdentityUser(userId, "test@example.com", "Test", "User");
        var dto = new ChangePasswordDto
        {
            CurrentPassword = "OldPassword123!",
            NewPassword = "NewPassword123!",
            ConfirmPassword = "NewPassword123!"
        };

        var (service, userManager, _) = BuildService(
            userId,
            new List<IdentityUser> { user },
            new List<CandidateProfile>(),
            new List<EmployeeProfile>(),
            new List<RecruiterProfile>());

        // Mock CheckPasswordAsync để trả về true (mật khẩu cũ đúng)
        userManager.CheckPasswordAsync(Arg.Any<IdentityUser>(), Arg.Is<string>(p => p == dto.CurrentPassword))
            .Returns(Task.FromResult(true));

        // Mock ChangePasswordAsync để trả về thành công
        userManager.ChangePasswordAsync(Arg.Any<IdentityUser>(), dto.CurrentPassword, dto.NewPassword)
            .Returns(IdentityResult.Success);

        // Act: Gọi hàm đổi mật khẩu
        await service.ChangePasswordAsync(dto);

        // Assert: Kiểm tra ChangePasswordAsync đã được gọi
        await userManager.Received(1).ChangePasswordAsync(
            Arg.Is<IdentityUser>(u => u.Id == userId),
            dto.CurrentPassword,
            dto.NewPassword);
    }

    /// Test đổi mật khẩu thất bại khi mật khẩu cũ sai
    [Fact]
    public async Task ChangePasswordAsync_throws_when_current_password_incorrect()
    {
        // Arrange: Tạo user và dto với mật khẩu cũ sai
        var userId = Guid.NewGuid();
        var user = CreateIdentityUser(userId, "test@example.com", "Test", "User");
        var dto = new ChangePasswordDto
        {
            CurrentPassword = "WrongPassword",
            NewPassword = "NewPassword123!",
            ConfirmPassword = "NewPassword123!"
        };

        var (service, userManager, _) = BuildService(
            userId,
            new List<IdentityUser> { user },
            new List<CandidateProfile>(),
            new List<EmployeeProfile>(),
            new List<RecruiterProfile>());

        // Mock CheckPasswordAsync để trả về false (mật khẩu cũ sai)
        userManager.CheckPasswordAsync(Arg.Any<IdentityUser>(), Arg.Any<string>())
            .Returns(Task.FromResult(false));

        // Act & Assert: Kiểm tra ném exception khi mật khẩu cũ sai
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.ChangePasswordAsync(dto));

        ex.Message.ShouldContain("Current password is incorrect");
    }

    /// Test đổi mật khẩu thất bại khi mật khẩu mới và xác nhận không khớp
    [Fact]
    public async Task ChangePasswordAsync_throws_when_passwords_not_match()
    {
        // Arrange: Tạo dto với mật khẩu mới và xác nhận không khớp
        var userId = Guid.NewGuid();
        var user = CreateIdentityUser(userId, "test@example.com", "Test", "User");
        var dto = new ChangePasswordDto
        {
            CurrentPassword = "OldPassword123!",
            NewPassword = "NewPassword123!",
            ConfirmPassword = "DifferentPassword123!"
        };

        var (service, userManager, _) = BuildService(
            userId,
            new List<IdentityUser> { user },
            new List<CandidateProfile>(),
            new List<EmployeeProfile>(),
            new List<RecruiterProfile>());

        // Mock CheckPasswordAsync để trả về true
        userManager.CheckPasswordAsync(Arg.Any<IdentityUser>(), Arg.Any<string>())
            .Returns(Task.FromResult(true));

        // Act & Assert: Kiểm tra ném exception khi mật khẩu không khớp
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.ChangePasswordAsync(dto));

        ex.Message.ShouldContain("do not match");
    }

    /// Test lấy profile của user hiện tại thành công
    [Fact]
    public async Task GetCurrentUserProfileAsync_returns_profile_successfully()
    {
        // Arrange: Tạo user và candidate profile
        var userId = Guid.NewGuid();
        var user = CreateIdentityUser(userId, "test@example.com", "Test", "User");
        var candidateProfile = CreateCandidateProfile(Guid.NewGuid(), userId, "Test Candidate");

        var (service, _, _) = BuildService(
            userId,
            new List<IdentityUser> { user },
            new List<CandidateProfile> { candidateProfile },
            new List<EmployeeProfile>(),
            new List<RecruiterProfile>());

        // Act: Gọi hàm lấy profile
        var result = await service.GetCurrentUserProfileAsync();

        // Assert: Kiểm tra kết quả
        result.ShouldNotBeNull();
        result.Id.ShouldBe(userId);
    }

    /// Test lấy profile thất bại khi user chưa đăng nhập
    [Fact]
    public async Task GetCurrentUserProfileAsync_throws_when_user_not_authenticated()
    {
        // Arrange: Tạo service với user chưa đăng nhập
        var (service, _, _) = BuildService(
            null,
            new List<IdentityUser>(),
            new List<CandidateProfile>(),
            new List<EmployeeProfile>(),
            new List<RecruiterProfile>(),
            isAuthenticated: false);

        // Act & Assert: Kiểm tra ném exception khi user chưa đăng nhập
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.GetCurrentUserProfileAsync());

        ex.Message.ShouldContain("not authenticated");
    }

    /// Test xóa tài khoản thành công
    [Fact]
    public async Task DeleteAccountAsync_deletes_account_successfully()
    {
        // Arrange: Tạo user
        var userId = Guid.NewGuid();
        var user = CreateIdentityUser(userId, "test@example.com", "Test", "User");

        var (service, userManager, _) = BuildService(
            userId,
            new List<IdentityUser> { user },
            new List<CandidateProfile>(),
            new List<EmployeeProfile>(),
            new List<RecruiterProfile>());

        // Mock DeleteAsync để trả về thành công
        userManager.DeleteAsync(Arg.Any<IdentityUser>())
            .Returns(IdentityResult.Success);

        // Act: Gọi hàm xóa tài khoản
        await service.DeleteAccountAsync();

        // Assert: Kiểm tra DeleteAsync đã được gọi
        await userManager.Received(1).DeleteAsync(
            Arg.Is<IdentityUser>(u => u.Id == userId));
    }

    /// Test xóa tài khoản thất bại khi user chưa đăng nhập
    [Fact]
    public async Task DeleteAccountAsync_throws_when_user_not_authenticated()
    {
        // Arrange: Tạo service với user chưa đăng nhập
        var (service, _, _) = BuildService(
            null,
            new List<IdentityUser>(),
            new List<CandidateProfile>(),
            new List<EmployeeProfile>(),
            new List<RecruiterProfile>(),
            isAuthenticated: false);

        // Act & Assert: Kiểm tra ném exception khi user chưa đăng nhập
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.DeleteAccountAsync());

        ex.Message.ShouldContain("not authenticated");
    }

    /// Test cập nhật visibility profile thành công
    [Fact]
    public async Task UpdateProfileVisibilityAsync_updates_visibility_successfully()
    {
        // Arrange: Tạo candidate profile
        var userId = Guid.NewGuid();
        var candidateProfileId = Guid.NewGuid();
        var candidateProfile = CreateCandidateProfile(candidateProfileId, userId, "Test Candidate");

        var (service, _, candidateRepo) = BuildService(
            userId,
            new List<IdentityUser>(),
            new List<CandidateProfile> { candidateProfile },
            new List<EmployeeProfile>(),
            new List<RecruiterProfile>());

        // Act: Gọi hàm cập nhật visibility
        await service.UpdateProfileVisibilityAsync(true);

        // Assert: Kiểm tra profile đã được cập nhật
        await candidateRepo.Received(1).UpdateAsync(
            Arg.Is<CandidateProfile>(p => p.Id == candidateProfileId && p.ProfileVisibility == true));
    }

    /// Test cập nhật job status thành công
    [Fact]
    public async Task UpdateJobStatusAsync_updates_job_status_successfully()
    {
        // Arrange: Tạo candidate profile
        var userId = Guid.NewGuid();
        var candidateProfileId = Guid.NewGuid();
        var candidateProfile = CreateCandidateProfile(candidateProfileId, userId, "Test Candidate");

        var (service, _, candidateRepo) = BuildService(
            userId,
            new List<IdentityUser>(),
            new List<CandidateProfile> { candidateProfile },
            new List<EmployeeProfile>(),
            new List<RecruiterProfile>());

        // Act: Gọi hàm cập nhật job status
        await service.UpdateJobStatusAsync(true);

        // Assert: Kiểm tra profile đã được cập nhật
        await candidateRepo.Received(1).UpdateAsync(
            Arg.Is<CandidateProfile>(p => p.Id == candidateProfileId && p.Status == true));
    }

    // ========== Helper Methods ==========

    /// Tạo dữ liệu test cho IdentityUser
    private static IdentityUser CreateIdentityUser(Guid id, string email, string name, string surname)
    {
        return new IdentityUser(id, email, email)
        {
            Name = name,
            Surname = surname
        };
    }

    /// Tạo dữ liệu test cho CandidateProfile
    private static CandidateProfile CreateCandidateProfile(Guid id, Guid userId, string fullName)
    {
        var profile = new CandidateProfile
        {
            UserId = userId,
            ProfileVisibility = false,
            Status = false
        };

        typeof(CandidateProfile)
            .GetProperty("Id")?
            .SetValue(profile, id);

        return profile;
    }

    /// Tạo service test với các dependency giả (mock)
    private static (ProfileAppService service, IdentityUserManager userManager, IRepository<CandidateProfile, Guid> candidateRepo) BuildService(
        Guid? currentUserId,
        List<IdentityUser> userData,
        List<CandidateProfile> candidateData,
        List<EmployeeProfile> employeeData,
        List<RecruiterProfile> recruiterData,
        bool isAuthenticated = true)
    {
        // Tạo mock IdentityUserManager - sử dụng Substitute để mock
        // IdentityUserManager có nhiều dependencies, nên mock trực tiếp các methods
        var userManager = Substitute.For<IdentityUserManager>(
            null!, null!, null!, null!, null!, null!, null!, null!);

        if (currentUserId.HasValue)
        {
            var user = userData.FirstOrDefault(u => u.Id == currentUserId.Value);
            if (user != null)
            {
                userManager.GetByIdAsync(Arg.Is<Guid>(id => id == currentUserId.Value))
                    .Returns(Task.FromResult(user));
            }
        }

        userManager.CheckPasswordAsync(Arg.Any<IdentityUser>(), Arg.Any<string>())
            .Returns(Task.FromResult(false));

        userManager.ChangePasswordAsync(Arg.Any<IdentityUser>(), Arg.Any<string>(), Arg.Any<string>())
            .Returns(IdentityResult.Success);

        userManager.DeleteAsync(Arg.Any<IdentityUser>())
            .Returns(IdentityResult.Success);

        userManager.SetEmailAsync(Arg.Any<IdentityUser>(), Arg.Any<string>())
            .Returns(IdentityResult.Success);

        // Tạo mock repository cho CandidateProfile
        var candidateRepo = Substitute.For<IRepository<CandidateProfile, Guid>>();
        candidateRepo.FirstOrDefaultAsync(Arg.Any<System.Linq.Expressions.Expression<Func<CandidateProfile, bool>>>())
            .Returns(ci =>
            {
                var predicate = ci.Arg<System.Linq.Expressions.Expression<Func<CandidateProfile, bool>>>();
                var compiled = predicate.Compile();
                return Task.FromResult(candidateData.FirstOrDefault(compiled));
            });
        candidateRepo.UpdateAsync(Arg.Any<CandidateProfile>())
            .Returns(ci => Task.FromResult(ci.Arg<CandidateProfile>()));

        // Tạo mock repository cho EmployeeProfile
        var employeeRepo = Substitute.For<IRepository<EmployeeProfile, Guid>>();
        employeeRepo.FirstOrDefaultAsync(Arg.Any<System.Linq.Expressions.Expression<Func<EmployeeProfile, bool>>>())
            .Returns(ci =>
            {
                var predicate = ci.Arg<System.Linq.Expressions.Expression<Func<EmployeeProfile, bool>>>();
                var compiled = predicate.Compile();
                return Task.FromResult(employeeData.FirstOrDefault(compiled));
            });

        // Tạo mock repository cho RecruiterProfile
        var recruiterRepo = Substitute.For<IRepository<RecruiterProfile, Guid>>();
        recruiterRepo.FirstOrDefaultAsync(Arg.Any<System.Linq.Expressions.Expression<Func<RecruiterProfile, bool>>>())
            .Returns(ci =>
            {
                var predicate = ci.Arg<System.Linq.Expressions.Expression<Func<RecruiterProfile, bool>>>();
                var compiled = predicate.Compile();
                return Task.FromResult(recruiterData.FirstOrDefault(compiled));
            });

        // Tạo mock repository cho IdentityUser
        var identityUserRepo = Substitute.For<IRepository<IdentityUser, Guid>>();

        // Tạo mock ICurrentUser
        var currentUser = Substitute.For<ICurrentUser>();
        currentUser.IsAuthenticated.Returns(isAuthenticated);
        if (isAuthenticated && currentUserId.HasValue)
        {
            currentUser.Id.Returns((Guid?)currentUserId.Value);
            currentUser.GetId().Returns(currentUserId.Value);
        }

        // Tạo mock IEmailSender
        var emailSender = Substitute.For<Volo.Abp.Emailing.IEmailSender>();

        // Tạo mock CandidateIndexService - sử dụng Substitute.For để mock interface hoặc class
        var candidateIndexService = Substitute.For<VCareer.Services.LuceneService.CandidateSearch.CandidateIndexService>(
            null!, null!);
        candidateIndexService.RemoveCandidateFromIndexAsync(Arg.Any<Guid>())
            .Returns(Task.CompletedTask);
        candidateIndexService.IndexCandidateAsync(Arg.Any<Guid>())
            .Returns(Task.CompletedTask);

        // Tạo service với các dependency giả
        var service = new ProfileAppService(
            userManager,
            currentUser,
            candidateRepo,
            employeeRepo,
            recruiterRepo,
            emailSender,
            candidateIndexService,
            identityUserRepo);

        return (service, userManager, candidateRepo);
    }
}

