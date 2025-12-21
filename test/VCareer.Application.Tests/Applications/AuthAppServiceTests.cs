//using System;
//using System.Collections.Generic;
//using System.Linq;
//using System.Threading.Tasks;
//using Microsoft.AspNetCore.Authentication;
//using Microsoft.AspNetCore.Http;
//using Microsoft.AspNetCore.Identity;
//using Microsoft.Extensions.Logging;
//using Microsoft.Extensions.Options;
//using NSubstitute;
//using Shouldly;
//using VCareer.Constants.Authentication;
//using VCareer.Constants.ErrorCodes;
//using VCareer.Dto.AuthDto;
//using VCareer.Jwt;
//using VCareer.Models.Companies;
//using VCareer.Models.Users;
//using VCareer.Services.Auth;
//using Volo.Abp;
//using Volo.Abp.Domain.Repositories;
//using Volo.Abp.Emailing;
//using Volo.Abp.Identity;
//using Volo.Abp.ObjectMapping;
//using Volo.Abp.TextTemplating;
//using Volo.Abp.Users;
//using Xunit;
//using IdentityUser = Volo.Abp.Identity.IdentityUser;
//using IdentityRole = Volo.Abp.Identity.IdentityRole;

//namespace VCareer.Applications;

//public class AuthAppServiceTests
//{
//    [Fact]
//    public async Task CandidateLogin_success_sets_tokens_and_cookies()
//    {
//        var user = new IdentityUser(Guid.NewGuid(), "user@test.com", "user@test.com");
//        var deps = BuildService(user, checkPassword: true, candidateStatus: true);

//        await deps.service.CandidateLoginAsync(new LoginDto { Email = user.Email, Password = "pwd" });

//        await deps.tokenGenerator.Received().CreateTokenAsync(user);
//        deps.httpContext.Response.Cookies.TryGetValue("access_token", out var accessCookie).ShouldBeTrue();
//        accessCookie.ShouldBe("access_token_value");
//    }

//    [Fact]
//    public async Task CandidateRegister_creates_user_role_and_profile()
//    {
//        var deps = BuildServiceForRegister();

//        await deps.service.CandidateRegisterAsync(new CandidateRegisterDto
//        {
//            Email = "new@test.com",
//            Password = "P@ssw0rd",
//            Name = "John Doe"
//        });

//        await deps.userManager.Received().CreateAsync(Arg.Any<IdentityUser>(), "P@ssw0rd");
//        await deps.userManager.Received().AddToRoleAsync(Arg.Any<IdentityUser>(), RoleName.CANDIDATE);
//        await deps.candidateRepo.Received().InsertAsync(Arg.Any<CandidateProfile>());
//    }

//    [Fact]
//    public async Task RecruiterLogin_success_sets_tokens()
//    {
//        var user = new IdentityUser(Guid.NewGuid(), "rec@test.com", "rec@test.com");
//        var deps = BuildService(user, checkPassword: true, recruiterStatus: true, withRecruiter: true);

//        await deps.service.RecruiterLoginAsync(new LoginDto { Email = user.Email, Password = "pwd" });

//        await deps.tokenGenerator.Received().CreateTokenAsync(user);
//        deps.httpContext.Response.Cookies.TryGetValue("access_token", out var accessCookie).ShouldBeTrue();
//        accessCookie.ShouldBe("access_token_value");
//    }

//    [Fact]
//    public async Task RecruiterRegister_creates_user_role_company_and_profile()
//    {
//        var deps = BuildServiceForRegister();

//        await deps.service.RecruiterRegisterAsync(new RecruiterRegisterDto
//        {
//            Email = "lead@test.com",
//            Password = "P@ssw0rd",
//            CompanyName = "ACME",
//            TaxCode = "123"
//        });

//        await deps.userManager.Received().CreateAsync(Arg.Any<IdentityUser>(), "P@ssw0rd");
//        await deps.userManager.Received().AddToRoleAsync(Arg.Any<IdentityUser>(), RoleName.LEADRECRUITER);
//        await deps.companyRepo.Received().InsertAsync(Arg.Any<Company>());
//        await deps.recruiterRepo.Received().InsertAsync(Arg.Any<RecruiterProfile>(), true);
//    }

//    [Fact]
//    public async Task EmployeeLogin_success_sets_tokens()
//    {
//        var user = new IdentityUser(Guid.NewGuid(), "emp@test.com", "emp@test.com");
//        var deps = BuildService(user, checkPassword: true, employeeStatus: true, withEmployee: true);

//        await deps.service.EmployeeLoginAsync(new EmployeeLoginDto { Email = user.Email, Password = "pwd" });

//        await deps.tokenGenerator.Received().CreateTokenAsync(user);
//        deps.httpContext.Response.Cookies.TryGetValue("access_token", out var accessCookie).ShouldBeTrue();
//        accessCookie.ShouldBe("access_token_value");
//    }

//    private static (AuthAppService service,
//        FakeUserManager userManager,
//        FakeSignInManager signInManager,
//        ITokenGenerator tokenGenerator,
//        IRepository<CandidateProfile, Guid> candidateRepo,
//        IRepository<RecruiterProfile, Guid> recruiterRepo,
//        IRepository<EmployeeProfile, Guid> employeeRepo,
//        IRepository<Company, int> companyRepo,
//        DefaultHttpContext httpContext) BuildService(
//        IdentityUser user,
//        bool checkPassword,
//        bool candidateStatus = false,
//        bool recruiterStatus = false,
//        bool employeeStatus = false,
//        bool withRecruiter = false,
//        bool withEmployee = false)
//    {
//        var userManager = new FakeUserManager(user);
//        var signInManager = new FakeSignInManager(userManager, checkPassword);
//        var tokenGenerator = Substitute.For<ITokenGenerator>();
//        tokenGenerator.CreateTokenAsync(user).Returns(new VCareer.Dto.JwtDto.TokenResponseDto
//        {
//            AccessToken = "access_token_value",
//            RefreshToken = "refresh_token_value",
//            ExpireMinuteAcesstoken = "5",
//            ExpireHourRefreshToken = "1"
//        });

//        var candidateRepo = Substitute.For<IRepository<CandidateProfile, Guid>>();
//        var recruiterRepo = Substitute.For<IRepository<RecruiterProfile, Guid>>();
//        var employeeRepo = Substitute.For<IRepository<EmployeeProfile, Guid>>();
//        var companyRepo = Substitute.For<IRepository<Company, int>>();
//        var emailSender = Substitute.For<IEmailSender>();
//        var templateRenderer = Substitute.For<ITemplateRenderer>();
//        var roleManager = new FakeRoleManager();
//        var configuration = Substitute.For<IConfiguration>();
//        var tokenOptions = Options.Create(new OptionConfigs.GoogleOptions());
//        var httpContext = new DefaultHttpContext();
//        var httpAccessor = Substitute.For<IHttpContextAccessor>();
//        httpAccessor.HttpContext.Returns(httpContext);

//        // seed profiles
//        if (candidateStatus)
//        {
//            candidateRepo.FirstOrDefaultAsync(Arg.Any<System.Linq.Expressions.Expression<Func<CandidateProfile, bool>>>())
//                .Returns(new CandidateProfile { UserId = user.Id, Status = true });
//        }
//        if (withRecruiter)
//        {
//            recruiterRepo.FirstOrDefaultAsync(Arg.Any<System.Linq.Expressions.Expression<Func<RecruiterProfile, bool>>>())
//                .Returns(new RecruiterProfile { UserId = user.Id, Status = recruiterStatus || true });
//        }
//        if (withEmployee)
//        {
//            employeeRepo.FirstOrDefaultAsync(Arg.Any<System.Linq.Expressions.Expression<Func<EmployeeProfile, bool>>>())
//                .Returns(new EmployeeProfile { UserId = user.Id, Status = employeeStatus || true });
//        }

//        var currentUser = Substitute.For<ICurrentUser>();
//        currentUser.Id.Returns((Guid?)user.Id);

//        var service = new AuthAppService(
//            userManager,
//            signInManager,
//            tokenGenerator,
//            (CurrentUser)null!,
//            emailSender,
//            templateRenderer,
//            roleManager,
//            tokenOptions,
//            configuration,
//            candidateRepo,
//            companyRepo,
//            recruiterRepo,
//            employeeRepo,
//            httpAccessor);

//        return (service, userManager, signInManager, tokenGenerator, candidateRepo, recruiterRepo, employeeRepo, companyRepo, httpContext);
//    }

//    private static (AuthAppService service,
//        FakeUserManager userManager,
//        IRepository<CandidateProfile, Guid> candidateRepo,
//        IRepository<RecruiterProfile, Guid> recruiterRepo,
//        IRepository<Company, int> companyRepo) BuildServiceForRegister()
//    {
//        var userManager = new FakeUserManager();
//        var signInManager = new FakeSignInManager(userManager, true);
//        var tokenGenerator = Substitute.For<ITokenGenerator>();
//        var candidateRepo = Substitute.For<IRepository<CandidateProfile, Guid>>();
//        var recruiterRepo = Substitute.For<IRepository<RecruiterProfile, Guid>>();
//        var employeeRepo = Substitute.For<IRepository<EmployeeProfile, Guid>>();
//        var companyRepo = Substitute.For<IRepository<Company, int>>();
//        var emailSender = Substitute.For<IEmailSender>();
//        var templateRenderer = Substitute.For<ITemplateRenderer>();
//        var roleManager = new FakeRoleManager();
//        roleManager.Roles.Add(new IdentityRole(Guid.NewGuid(), RoleName.CANDIDATE));
//        roleManager.Roles.Add(new IdentityRole(Guid.NewGuid(), RoleName.LEADRECRUITER));
//        var configuration = Substitute.For<IConfiguration>();
//        var tokenOptions = Options.Create(new OptionConfigs.GoogleOptions());
//        var httpAccessor = Substitute.For<IHttpContextAccessor>();
//        httpAccessor.HttpContext.Returns(new DefaultHttpContext());

//        var service = new AuthAppService(
//            userManager,
//            signInManager,
//            tokenGenerator,
//            (CurrentUser)null!,
//            emailSender,
//            templateRenderer,
//            roleManager,
//            tokenOptions,
//            configuration,
//            candidateRepo,
//            companyRepo,
//            recruiterRepo,
//            employeeRepo,
//            httpAccessor);

//        return (service, userManager, candidateRepo, recruiterRepo, companyRepo);
//    }

//    private class FakeUserManager : IdentityUserManager
//    {
//        private readonly IdentityUser _user;

//        public FakeUserManager(IdentityUser user = null!)
//            : base(Substitute.For<IUserStore<IdentityUser>>(),
//                Options.Create(new IdentityOptions()),
//                Substitute.For<IPasswordHasher<IdentityUser>>(),
//                Array.Empty<IUserValidator<IdentityUser>>(),
//                Array.Empty<IPasswordValidator<IdentityUser>>(),
//                Substitute.For<ILookupNormalizer>(),
//                Substitute.For<IdentityErrorDescriber>(),
//                Substitute.For<IServiceProvider>(),
//                Substitute.For<ILogger<IdentityUserManager>>())
//        {
//            _user = user;
//        }

//        public override Task<IdentityUser> FindByEmailAsync(string email)
//        {
//            return Task.FromResult(_user);
//        }

//        public override Task<IdentityResult> CreateAsync(IdentityUser user, string password = null)
//        {
//            return Task.FromResult(IdentityResult.Success);
//        }

//        public override Task<IdentityResult> AddToRoleAsync(IdentityUser user, string role)
//        {
//            return Task.FromResult(IdentityResult.Success);
//        }
//    }

//    private class FakeSignInManager : SignInManager<IdentityUser>
//    {
//        private readonly bool _checkPassword;

//        public FakeSignInManager(IdentityUserManager userManager, bool checkPassword)
//            : base(userManager,
//                  Substitute.For<IHttpContextAccessor>(),
//                  Substitute.For<IUserClaimsPrincipalFactory<IdentityUser>>(),
//                  Substitute.For<IOptions<IdentityOptions>>(),
//                  Substitute.For<ILogger<SignInManager<IdentityUser>>>(),
//                  Substitute.For<IAuthenticationSchemeProvider>(),
//                  Substitute.For<IUserConfirmation<IdentityUser>>())
//        {
//            _checkPassword = checkPassword;
//        }

//        public override Task<SignInResult> CheckPasswordSignInAsync(IdentityUser user, string password, bool lockoutOnFailure)
//        {
//            return Task.FromResult(_checkPassword ? SignInResult.Success : SignInResult.Failed);
//        }
//    }

//    private class FakeRoleManager : IdentityRoleManager
//    {
//        public List<IdentityRole> Roles { get; } = new();

//        public FakeRoleManager()
//            : base(Substitute.For<IRoleStore<IdentityRole>>(),
//                  Array.Empty<IRoleValidator<IdentityRole>>(),
//                  Substitute.For<ILookupNormalizer>(),
//                  Substitute.For<IdentityErrorDescriber>(),
//                  Substitute.For<ILogger<IdentityRoleManager>>())
//        {
//        }

//        public override Task<IdentityRole> FindByNameAsync(string roleName)
//        {
//            return Task.FromResult(Roles.FirstOrDefault(r => string.Equals(r.Name, roleName, StringComparison.OrdinalIgnoreCase)));
//        }
//    }
//}

