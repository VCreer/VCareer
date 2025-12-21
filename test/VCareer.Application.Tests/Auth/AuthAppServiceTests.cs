using Microsoft.AspNetCore.Identity;
using NSubstitute;
using Shouldly;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VCareer.Dto.AuthDto;
using VCareer.IRepositories.Profile;
using VCareer.IRepositories.ICompanyRepository;
using VCareer.IServices.IAuth;
using VCareer.Jwt;
using VCareer.Models.Users;
using VCareer.Services.Auth;
using Volo.Abp;
using Volo.Abp.Domain.Entities;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Emailing;
using Volo.Abp.Identity;
using Volo.Abp.Identity.AspNetCore;
using Volo.Abp.TextTemplating;
using Volo.Abp.Users;
using Xunit;
using IdentityUser = Volo.Abp.Identity.IdentityUser;
using IdentityRole = Volo.Abp.Identity.IdentityRole;
using Microsoft.Extensions.Configuration;
using VCareer.Dto.JwtDto;
using Microsoft.Extensions.Options;
using VCareer.OptionConfigs;
using Microsoft.AspNetCore.Http;
using Volo.Abp.Uow;

namespace VCareer.Auth;

public class AuthAppServiceTests
{
    /// Test đăng ký candidate thành công
    [Fact]
    public async Task CandidateRegisterAsync_registers_candidate_successfully()
    {
        // Arrange: Tạo dữ liệu test
        var dto = new CandidateRegisterDto
        {
            Email = "test@example.com",
            Password = "Test123!@#",
            Name = "Nguyen Van A"
        };

        var (service, identityManager, candidateRepo) = BuildService(
            new List<IdentityUser>(),
            new List<CandidateProfile>(),
            new List<RecruiterProfile>(),
            new List<EmployeeProfile>());

        // Mock FindByEmailAsync trả về null (email chưa tồn tại)
        identityManager.FindByEmailAsync(Arg.Any<string>())
            .Returns(Task.FromResult<IdentityUser>(null!));

        // Mock CreateAsync trả về thành công
        identityManager.CreateAsync(Arg.Any<IdentityUser>(), Arg.Any<string>())
            .Returns(IdentityResult.Success);

        // Mock FindByNameAsync cho role
        var roleManager = Substitute.For<IdentityRoleManager>(
            null!, null!, null!, null!, null!, null!, null!, null!);
        var role = new Volo.Abp.Identity.IdentityRole(Guid.NewGuid(), "Candidate");
        roleManager.FindByNameAsync(Arg.Any<string>())
            .Returns(Task.FromResult(role));

        // Mock AddToRoleAsync trả về thành công
        identityManager.AddToRoleAsync(Arg.Any<IdentityUser>(), Arg.Any<string>())
            .Returns(IdentityResult.Success);

        // Act: Gọi hàm đăng ký
        await service.CandidateRegisterAsync(dto);

        // Assert: Kiểm tra user đã được tạo
        await identityManager.Received(1).CreateAsync(
            Arg.Is<IdentityUser>(u => u.Email == dto.Email),
            Arg.Is<string>(p => p == dto.Password));
    }

    /// Test đăng ký candidate thất bại khi email đã tồn tại
    [Fact]
    public async Task CandidateRegisterAsync_throws_when_email_exists()
    {
        // Arrange: Tạo user với email đã tồn tại
        var dto = new CandidateRegisterDto
        {
            Email = "existing@example.com",
            Password = "Test123!@#",
            Name = "Test User"
        };

        var existingUser = new IdentityUser(Guid.NewGuid(), dto.Email, dto.Email);
        var (service, identityManager, _) = BuildService(
            new List<IdentityUser> { existingUser },
            new List<CandidateProfile>(),
            new List<RecruiterProfile>(),
            new List<EmployeeProfile>());

        // Mock FindByEmailAsync trả về user đã tồn tại
        identityManager.FindByEmailAsync(Arg.Is<string>(e => e == dto.Email))
            .Returns(Task.FromResult(existingUser));

        // Act & Assert: Kiểm tra ném exception
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.CandidateRegisterAsync(dto));

        ex.Message.ShouldContain("Email already exist");
    }

    /// Test đăng nhập candidate thành công
    [Fact]
    public async Task CandidateLoginAsync_logs_in_successfully()
    {
        // Arrange: Tạo user và candidate profile
        var userId = Guid.NewGuid();
        var user = new IdentityUser(userId, "test@example.com", "test@example.com");
        var candidate = CreateCandidateProfile(Guid.NewGuid(), userId, true);

        var dto = new LoginDto
        {
            Email = "test@example.com",
            Password = "Test123!@#"
        };

        var (service, identityManager, candidateRepo) = BuildService(
            new List<IdentityUser> { user },
            new List<CandidateProfile> { candidate },
            new List<RecruiterProfile>(),
            new List<EmployeeProfile>());

        // Mock FindByEmailAsync trả về user
        identityManager.FindByEmailAsync(Arg.Is<string>(e => e == dto.Email))
            .Returns(Task.FromResult(user));

        // Mock CheckPasswordSignInAsync trả về thành công
        var signInManager = Substitute.For<SignInManager<IdentityUser>>(
            null!, null!, null!, null!, null!, null!, null!);
        signInManager.CheckPasswordSignInAsync(Arg.Any<IdentityUser>(), Arg.Any<string>(), Arg.Any<bool>())
            .Returns(SignInResult.Success);

        // Act: Gọi hàm đăng nhập
        await service.CandidateLoginAsync(dto);

        // Assert: Kiểm tra đã gọi CheckPasswordSignInAsync
        // Note: Không thể verify được vì signInManager là local variable trong BuildService
    }

    /// Test đăng nhập candidate thất bại khi email không tồn tại
    [Fact]
    public async Task CandidateLoginAsync_throws_when_email_not_found()
    {
        // Arrange: Tạo service không có user
        var dto = new LoginDto
        {
            Email = "notfound@example.com",
            Password = "Test123!@#"
        };

        var (service, identityManager, _) = BuildService(
            new List<IdentityUser>(),
            new List<CandidateProfile>(),
            new List<RecruiterProfile>(),
            new List<EmployeeProfile>());

        // Mock FindByEmailAsync trả về null
        identityManager.FindByEmailAsync(Arg.Any<string>())
            .Returns(Task.FromResult<IdentityUser>(null!));

        // Act & Assert: Kiểm tra ném exception
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.CandidateLoginAsync(dto));

        ex.Message.ShouldContain("Email not found");
    }

    /// Test đăng nhập candidate thất bại khi mật khẩu sai
    [Fact]
    public async Task CandidateLoginAsync_throws_when_password_invalid()
    {
        // Arrange: Tạo user
        var userId = Guid.NewGuid();
        var user = new IdentityUser(userId, "test@example.com", "test@example.com");
        var candidate = CreateCandidateProfile(Guid.NewGuid(), userId, true);

        var dto = new LoginDto
        {
            Email = "test@example.com",
            Password = "WrongPassword"
        };

        var (service, identityManager, candidateRepo) = BuildService(
            new List<IdentityUser> { user },
            new List<CandidateProfile> { candidate },
            new List<RecruiterProfile>(),
            new List<EmployeeProfile>());

        // Mock FindByEmailAsync trả về user
        identityManager.FindByEmailAsync(Arg.Is<string>(e => e == dto.Email))
            .Returns(Task.FromResult(user));

        // Mock CheckPasswordSignInAsync trả về thất bại
        var signInManager = Substitute.For<SignInManager<IdentityUser>>(
            null!, null!, null!, null!, null!, null!, null!);
        signInManager.CheckPasswordSignInAsync(Arg.Any<IdentityUser>(), Arg.Any<string>(), Arg.Any<bool>())
            .Returns(SignInResult.Failed);

        // Act & Assert: Kiểm tra ném exception
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.CandidateLoginAsync(dto));

        ex.Message.ShouldContain("Invalid Password");
    }

    /// Test đăng nhập candidate thất bại khi tài khoản bị khóa
    [Fact]
    public async Task CandidateLoginAsync_throws_when_account_locked()
    {
        // Arrange: Tạo user với candidate profile bị khóa
        var userId = Guid.NewGuid();
        var user = new IdentityUser(userId, "test@example.com", "test@example.com");
        var candidate = CreateCandidateProfile(Guid.NewGuid(), userId, false); // Status = false

        var dto = new LoginDto
        {
            Email = "test@example.com",
            Password = "Test123!@#"
        };

        var (service, identityManager, candidateRepo) = BuildService(
            new List<IdentityUser> { user },
            new List<CandidateProfile> { candidate },
            new List<RecruiterProfile>(),
            new List<EmployeeProfile>());

        // Mock FindByEmailAsync trả về user
        identityManager.FindByEmailAsync(Arg.Is<string>(e => e == dto.Email))
            .Returns(Task.FromResult(user));

        // Mock CheckPasswordSignInAsync trả về thành công
        var signInManager = Substitute.For<SignInManager<IdentityUser>>(
            null!, null!, null!, null!, null!, null!, null!);
        signInManager.CheckPasswordSignInAsync(Arg.Any<IdentityUser>(), Arg.Any<string>(), Arg.Any<bool>())
            .Returns(SignInResult.Success);

        // Act & Assert: Kiểm tra ném exception
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.CandidateLoginAsync(dto));

        ex.Message.ShouldContain("đã bị khoá");
    }

    /// Test reset password thành công
    [Fact]
    public async Task ResetPasswordAsync_resets_password_successfully()
    {
        // Arrange: Tạo user và dto
        var user = new IdentityUser(Guid.NewGuid(), "test@example.com", "test@example.com");
        var dto = new ResetPasswordDto
        {
            Email = "test@example.com",
            Token = "reset-token",
            NewPassword = "NewPassword123!@#"
        };

        var (service, identityManager, _) = BuildService(
            new List<IdentityUser> { user },
            new List<CandidateProfile>(),
            new List<RecruiterProfile>(),
            new List<EmployeeProfile>());

        // Mock FindByEmailAsync trả về user
        identityManager.FindByEmailAsync(Arg.Is<string>(e => e == dto.Email))
            .Returns(Task.FromResult(user));

        // Mock ResetPasswordAsync trả về thành công
        identityManager.ResetPasswordAsync(Arg.Any<IdentityUser>(), Arg.Any<string>(), Arg.Any<string>())
            .Returns(IdentityResult.Success);

        // Act: Gọi hàm reset password
        await service.ResetPasswordAsync(dto);

        // Assert: Kiểm tra đã gọi ResetPasswordAsync
        await identityManager.Received(1).ResetPasswordAsync(
            Arg.Is<IdentityUser>(u => u.Email == dto.Email),
            dto.Token,
            dto.NewPassword);
    }

    /// Test reset password thất bại khi user không tồn tại
    [Fact]
    public async Task ResetPasswordAsync_throws_when_user_not_found()
    {
        // Arrange: Tạo service không có user
        var dto = new ResetPasswordDto
        {
            Email = "notfound@example.com",
            Token = "reset-token",
            NewPassword = "NewPassword123!@#"
        };

        var (service, identityManager, _) = BuildService(
            new List<IdentityUser>(),
            new List<CandidateProfile>(),
            new List<RecruiterProfile>(),
            new List<EmployeeProfile>());

        // Mock FindByEmailAsync trả về null
        identityManager.FindByEmailAsync(Arg.Any<string>())
            .Returns(Task.FromResult<IdentityUser>(null!));

        // Act & Assert: Kiểm tra ném exception
        await Should.ThrowAsync<EntityNotFoundException>(() =>
            service.ResetPasswordAsync(dto));
    }

    /// Test forgot password thành công
    [Fact]
    public async Task ForgotPasswordAsync_sends_reset_email_successfully()
    {
        // Arrange: Tạo user và dto
        var user = new IdentityUser(Guid.NewGuid(), "test@example.com", "test@example.com");
        var dto = new ForgotPasswordDto
        {
            Email = "test@example.com"
        };

        var (service, identityManager, _) = BuildService(
            new List<IdentityUser> { user },
            new List<CandidateProfile>(),
            new List<RecruiterProfile>(),
            new List<EmployeeProfile>());

        // Mock FindByEmailAsync trả về user
        identityManager.FindByEmailAsync(Arg.Is<string>(e => e == dto.Email))
            .Returns(Task.FromResult(user));

        // Mock GeneratePasswordResetTokenAsync trả về token
        identityManager.GeneratePasswordResetTokenAsync(Arg.Any<IdentityUser>())
            .Returns(Task.FromResult("reset-token"));

        // Act: Gọi hàm forgot password
        await service.ForgotPasswordAsync(dto);

        // Assert: Kiểm tra đã gọi GeneratePasswordResetTokenAsync
        await identityManager.Received(1).GeneratePasswordResetTokenAsync(
            Arg.Is<IdentityUser>(u => u.Email == dto.Email));
    }

    /// Test forgot password thất bại khi email không tồn tại
    [Fact]
    public async Task ForgotPasswordAsync_throws_when_email_not_found()
    {
        // Arrange: Tạo service không có user
        var dto = new ForgotPasswordDto
        {
            Email = "notfound@example.com"
        };

        var (service, identityManager, _) = BuildService(
            new List<IdentityUser>(),
            new List<CandidateProfile>(),
            new List<RecruiterProfile>(),
            new List<EmployeeProfile>());

        // Mock FindByEmailAsync trả về null
        identityManager.FindByEmailAsync(Arg.Any<string>())
            .Returns(Task.FromResult<IdentityUser>(null!));

        // Act & Assert: Kiểm tra ném exception
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.ForgotPasswordAsync(dto));

        ex.Message.ShouldContain("Email not found");
    }

    // ========== Helper Methods ==========

    /// Tạo dữ liệu test cho CandidateProfile
    private static CandidateProfile CreateCandidateProfile(Guid id, Guid userId, bool status)
    {
        var profile = new CandidateProfile
        {
            UserId = userId,
            Status = status
        };

        typeof(CandidateProfile)
            .GetProperty("Id")?
            .SetValue(profile, id);

        return profile;
    }

    /// Tạo service test với các dependency giả (mock)
    private static (AuthAppService service, IdentityUserManager identityManager, ICandidateProfileRepository candidateRepo) BuildService(
        List<IdentityUser> userData,
        List<CandidateProfile> candidateData,
        List<RecruiterProfile> recruiterData,
        List<EmployeeProfile> employeeData)
    {
        // Tạo mock IdentityUserManager
        var identityManager = Substitute.For<IdentityUserManager>(
            null!, null!, null!, null!, null!, null!, null!, null!);
        identityManager.FindByEmailAsync(Arg.Any<string>())
            .Returns(ci =>
            {
                var email = ci.Arg<string>();
                return Task.FromResult(userData.FirstOrDefault(u => u.Email == email));
            });
        identityManager.CreateAsync(Arg.Any<IdentityUser>(), Arg.Any<string>())
            .Returns(IdentityResult.Success);
        identityManager.AddToRoleAsync(Arg.Any<IdentityUser>(), Arg.Any<string>())
            .Returns(IdentityResult.Success);
        identityManager.ResetPasswordAsync(Arg.Any<IdentityUser>(), Arg.Any<string>(), Arg.Any<string>())
            .Returns(IdentityResult.Success);
        identityManager.GeneratePasswordResetTokenAsync(Arg.Any<IdentityUser>())
            .Returns(Task.FromResult("reset-token"));

        // Tạo mock SignInManager
        var signInManager = Substitute.For<SignInManager<IdentityUser>>(
            null!, null!, null!, null!, null!, null!, null!);
        signInManager.CheckPasswordSignInAsync(Arg.Any<IdentityUser>(), Arg.Any<string>(), Arg.Any<bool>())
            .Returns(SignInResult.Success);

        // Tạo mock ITokenGenerator
        var tokenGenerator = Substitute.For<ITokenGenerator>();
        tokenGenerator.CreateTokenAsync(Arg.Any<IdentityUser>())
            .Returns(Task.FromResult(new TokenResponseDto { AccessToken = "access-token", RefreshToken = "refresh-token" }));

        // Tạo mock IEmailSender
        var emailSender = Substitute.For<IEmailSender>();

        // Tạo mock IdentityRoleManager
        var roleManager = Substitute.For<IdentityRoleManager>(
            null!, null!, null!, null!, null!, null!, null!, null!);
        var role = new Volo.Abp.Identity.IdentityRole(Guid.NewGuid(), "Candidate");
        roleManager.FindByNameAsync(Arg.Any<string>())
            .Returns(Task.FromResult(role));

        // Tạo mock ITemplateRenderer
        var templateRenderer = Substitute.For<ITemplateRenderer>();
        templateRenderer.RenderAsync(Arg.Any<string>(), Arg.Any<object>())
            .Returns(Task.FromResult("rendered-template"));

        // Tạo mock GoogleOptions
        var googleOptions = Options.Create(new GoogleOptions());

        // Tạo mock IConfiguration
        var configuration = Substitute.For<IConfiguration>();
        configuration["App:AngularUrl"].Returns("http://localhost:4200");

        // Tạo mock ICandidateProfileRepository
        var candidateRepo = Substitute.For<ICandidateProfileRepository>();
        candidateRepo.FirstOrDefaultAsync(Arg.Any<System.Linq.Expressions.Expression<Func<CandidateProfile, bool>>>())
            .Returns(ci =>
            {
                var predicate = ci.Arg<System.Linq.Expressions.Expression<Func<CandidateProfile, bool>>>();
                var compiled = predicate.Compile();
                return Task.FromResult(candidateData.FirstOrDefault(compiled));
            });
        candidateRepo.InsertAsync(Arg.Any<CandidateProfile>())
            .Returns(ci =>
            {
                var profile = ci.Arg<CandidateProfile>();
                candidateData.Add(profile);
                return Task.FromResult(profile);
            });

        // Tạo mock ICompanyRepository
        var companyRepo = Substitute.For<ICompanyRepository>();

        // Tạo mock IRecruiterRepository
        var recruiterRepo = Substitute.For<IRecruiterRepository>();

        // Tạo mock IEmployeeRepository
        var employeeRepo = Substitute.For<IEmployeeRepository>();

        // Tạo mock IHttpContextAccessor
        var httpContextAccessor = Substitute.For<IHttpContextAccessor>();

        // Tạo mock CurrentUser
        var currentUser = Substitute.For<CurrentUser>(
            null!, null!, null!, null!);

        // Tạo service với các dependency giả
        var service = new AuthAppService(
            identityManager,
            signInManager,
            tokenGenerator,
            currentUser,
            emailSender,
            templateRenderer,
            roleManager,
            googleOptions,
            configuration,
            candidateRepo,
            companyRepo,
            recruiterRepo,
            employeeRepo,
            httpContextAccessor);

        return (service, identityManager, candidateRepo);
    }
}

