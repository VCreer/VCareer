//using System;
//using System.Collections.Generic;
//using System.Linq;
//using System.Reflection;
//using System.Threading.Tasks;
//using System.Security.Claims;
//using NSubstitute;
//using Shouldly;
//using VCareer.Application.Applications;
//using VCareer.Dto.Applications;
//using VCareer.Models.Applications;
//using VCareer.Models.Users;
//using VCareer.CV;
//using VCareer.Application.Contracts.CV;
//using VCareer.Models.CV;
//using VCareer.Models.Job;
//using VCareer.Models.Companies;
//using Volo.Abp;
//using Volo.Abp.Application.Services;
//using Volo.Abp.Domain.Repositories;
//using Volo.Abp.ObjectMapping;
//using Volo.Abp.Users;
//using Volo.Abp.Emailing;
//using Volo.Abp.DependencyInjection;
//using Xunit;
//using Volo.Abp.Application;
//using VCareer.IServices.IActivityLogService;

//namespace VCareer.Applications;

//public class ApplicationAppServiceTests
//{
//    [Fact]
//    public async Task MarkAsViewedAsync_sets_fields_and_logs_for_recruiter()
//    {
//        var appId = Guid.NewGuid();
//        var userId = Guid.NewGuid();
//        var app = CreateApplication(appId, status: "Pending");

//        var (service, appRepo, activityLog) = BuildService(userId, app);

//        var result = await service.MarkAsViewedAsync(appId);

//        app.ViewedAt.ShouldNotBeNull();
//        app.ViewedBy.ShouldBe(userId);
//        await appRepo.Received(1).UpdateAsync(app, default);
//        await activityLog.Received(1).LogActivityAsync(
//            userId,
//            Arg.Any<VCareer.Models.ActivityLogs.ActivityType>(),
//            "ViewApplication",
//            Arg.Any<string>(),
//            app.Id,
//            nameof(JobApplication),
//            "{}");
//        result.ShouldNotBeNull();
//        result.Id.ShouldBe(appId);
//    }

//    [Fact]
//    public async Task UpdateApplicationStatusAsync_sets_rating_for_recruiter()
//    {
//        var appId = Guid.NewGuid();
//        var userId = Guid.NewGuid();
//        var app = CreateApplication(appId, status: "Pending");

//        var (service, appRepo, _) = BuildService(userId, app);

//        var input = new UpdateApplicationStatusDto
//        {
//            Status = "Reviewed",
//            Rating = 4
//        };

//        var dto = await service.UpdateApplicationStatusAsync(appId, input);

//        app.Rating.ShouldBe(4);
//        app.Status.ShouldBe("Reviewed");
//        app.RespondedAt.ShouldNotBeNull();
//        app.RespondedBy.ShouldBe(userId);
//        await appRepo.Received(1).UpdateAsync(app, default);
//        dto.Status.ShouldBe("Reviewed");
//    }

//    [Fact]
//    public async Task UpdateApplicationStatusAsync_sets_rating_and_notes_for_recruiter()
//    {
//        var appId = Guid.NewGuid();
//        var userId = Guid.NewGuid();
//        var app = CreateApplication(appId, status: "Pending");

//        var (service, appRepo, _) = BuildService(userId, app);

//        var input = new UpdateApplicationStatusDto
//        {
//            Status = "Reviewed",
//            Rating = 2,
//            RecruiterNotes = "Needs follow-up"
//        };

//        var dto = await service.UpdateApplicationStatusAsync(appId, input);

//        app.Rating.ShouldBe(2);
//        app.RecruiterNotes.ShouldBe("Needs follow-up");
//        app.Status.ShouldBe("Reviewed");
//        app.RespondedAt.ShouldNotBeNull();
//        app.RespondedBy.ShouldBe(userId);
//        await appRepo.Received(1).UpdateAsync(app, default);
//        dto.Status.ShouldBe("Reviewed");
//    }

//    [Fact]
//    public async Task UpdateApplicationStatusAsync_sets_recruiter_notes_without_rating()
//    {
//        var appId = Guid.NewGuid();
//        var userId = Guid.NewGuid();
//        var app = CreateApplication(appId, status: "Pending");

//        var (service, appRepo, _) = BuildService(userId, app);

//        var input = new UpdateApplicationStatusDto
//        {
//            Status = "Reviewed",
//            RecruiterNotes = "Good CV, schedule interview"
//        };

//        var dto = await service.UpdateApplicationStatusAsync(appId, input);

//        app.Rating.ShouldBeNull();
//        app.RecruiterNotes.ShouldBe("Good CV, schedule interview");
//        app.Status.ShouldBe("Reviewed");
//        app.RespondedAt.ShouldNotBeNull();
//        app.RespondedBy.ShouldBe(userId);
//        await appRepo.Received(1).UpdateAsync(app, default);
//        dto.Status.ShouldBe("Reviewed");
//    }

//    private static JobApplication CreateApplication(Guid id, string status)
//    {
//        var app = new JobApplication
//        {
//            Status = status
//        };

//        typeof(JobApplication)
//            .GetProperty("Id", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)
//            ?.SetValue(app, id);

//        return app;
//    }

//    private static (ApplicationAppService service,
//        IRepository<JobApplication, Guid> appRepo,
//        IActivityLogAppService activityLog) BuildService(Guid currentUserId, JobApplication application)
//    {
//        var appRepo = Substitute.For<IRepository<JobApplication, Guid>>();
//        appRepo.GetAsync(Arg.Any<Guid>(), Arg.Any<bool>())
//            .Returns(application);
//        appRepo.UpdateAsync(Arg.Any<JobApplication>(), Arg.Any<bool>())
//            .Returns(ci => Task.FromResult(ci.Arg<JobApplication>()));

//        var candidateRepo = Substitute.For<IRepository<CandidateProfile, Guid>>();
//        var jobRepo = Substitute.For<IRepository<Job_Post, Guid>>();
//        var candidateCvRepo = Substitute.For<IRepository<CandidateCv, Guid>>();
//        var uploadedCvRepo = Substitute.For<IRepository<UploadedCv, Guid>>();
//        var recruiterRepo = Substitute.For<IRepository<RecruiterProfile, Guid>>();
//        var companyRepo = Substitute.For<IRepository<Company, int>>();
//        var identityUserRepo = Substitute.For<IRepository<Volo.Abp.Identity.IdentityUser, Guid>>();
//        var candidateCvSvc = Substitute.For<ICandidateCvAppService>();
//        var uploadedCvSvc = Substitute.For<IUploadedCvAppService>();
//        var emailSender = Substitute.For<Volo.Abp.Emailing.IEmailSender>();
//        var configuration = Substitute.For<Microsoft.Extensions.Configuration.IConfiguration>();
//        var activityLog = Substitute.For<IActivityLogAppService>();

//        var currentUser = new FakeCurrentUser(currentUserId);

//        var objectMapper = Substitute.For<IObjectMapper>();
//        objectMapper.Map<JobApplication, ApplicationDto>(Arg.Any<JobApplication>())
//            .Returns(ci => new ApplicationDto
//            {
//                Id = ci.Arg<JobApplication>().Id,
//                Status = ci.Arg<JobApplication>().Status
//            });

//        var service = new ApplicationAppService(
//            appRepo,
//            candidateRepo,
//            jobRepo,
//            candidateCvRepo,
//            uploadedCvRepo,
//            recruiterRepo,
//            companyRepo,
//            identityUserRepo,
//            candidateCvSvc,
//            uploadedCvSvc,
//            currentUser,
//            emailSender,
//            configuration,
//            activityLog);

//        // Provide ObjectMapper via LazyServiceProvider because ObjectMapper has no setter
//        var lazy = new FakeLazyServiceProvider(objectMapper);
//        typeof(AbpServiceBase)
//            .GetProperty("LazyServiceProvider", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)
//            ?.SetValue(service, lazy);

//        return (service, appRepo, activityLog);
//    }

//    private class FakeLazyServiceProvider : IAbpLazyServiceProvider, ICachedServiceProviderBase, IKeyedServiceProvider, IServiceProvider
//    {
//        private readonly IObjectMapper _objectMapper;

//        public FakeLazyServiceProvider(IObjectMapper objectMapper)
//        {
//            _objectMapper = objectMapper;
//            ServiceProvider = Substitute.For<IServiceProvider>();
//        }

//        public IServiceProvider ServiceProvider { get; }

//        public T LazyGetService<T>() => (T?)GetService(typeof(T))!;
//        public T LazyGetService<T>(Func<IServiceProvider, object> factory) => (T)(GetService(typeof(T)) ?? factory(ServiceProvider));
//        public T LazyGetRequiredService<T>() where T : notnull => (T)(GetService(typeof(T)) ?? throw new AbpException($"{typeof(T).Name} not registered"));
//        public object? LazyGetService(Type serviceType) => GetService(serviceType);
//        public object LazyGetRequiredService(Type serviceType) => GetService(serviceType) ?? throw new AbpException($"{serviceType.Name} not registered");
//        public object LazyGetService(Type serviceType, Func<IServiceProvider, object> factory) => GetService(serviceType) ?? factory(ServiceProvider);

//        public object? GetService(Type serviceType)
//        {
//            if (serviceType == typeof(IObjectMapper)) return _objectMapper;
//            return null;
//        }

//        public object? GetService(Type serviceType, object? serviceKey)
//        {
//            if (serviceType == typeof(IObjectMapper)) return _objectMapper;
//            return null;
//        }

//        public T? GetService<T>(object? serviceKey = null)
//        {
//            return (T?)GetService(typeof(T), serviceKey);
//        }

//        public object? GetKeyedService(Type serviceType, object? serviceKey)
//        {
//            return GetService(serviceType, serviceKey);
//        }

//        public T? GetKeyedService<T>(object? serviceKey = null)
//        {
//            return (T?)GetService(typeof(T), serviceKey);
//        }

//        public object GetRequiredKeyedService(Type serviceType, object? serviceKey)
//        {
//            return GetService(serviceType, serviceKey) ?? throw new AbpException($"{serviceType.Name} not registered");
//        }

//        public T GetRequiredKeyedService<T>(object? serviceKey = null) where T : notnull
//        {
//            return (T)(GetService(typeof(T), serviceKey) ?? throw new AbpException($"{typeof(T).Name} not registered"));
//        }
//    }

//    private class FakeCurrentUser : ICurrentUser
//    {
//        public FakeCurrentUser(Guid id)
//        {
//            Id = id;
//        }

//        public Guid? Id { get; }
//        public Guid? TenantId => null;
//        public string? TenantName => null;
//        public string? UserName => "recruiter";
//        public string? Name => "Recruiter";
//        public string? SurName => string.Empty;
//        public string? PhoneNumber => string.Empty;
//        public string? Email => "recruiter@test.com";
//        public bool EmailConfirmed => true;
//        public bool PhoneNumberConfirmed => true;
//        public bool EmailVerified => true;
//        public bool PhoneNumberVerified => true;
//        public Claim[] Claims => Array.Empty<Claim>();
//        public string[] Roles => Array.Empty<string>();
//        public bool IsAuthenticated => true;
//        public string? FindClaimValue(string claimType) => Claims.FirstOrDefault(c => c.Type == claimType)?.Value;
//        public Claim? FindClaim(string claimType) => Claims.FirstOrDefault(c => c.Type == claimType);
//        public Claim[] FindClaims(string claimType) => Claims.Where(c => c.Type == claimType).ToArray();
//        public Claim[] GetAllClaims() => Claims.ToArray();
//        public Claim[] FindClaims(string claimType, string claimValue) => Claims.Where(c => c.Type == claimType && c.Value == claimValue).ToArray();
//        public Claim[] GetAllClaims(string claimType) => Claims.Where(c => c.Type == claimType).ToArray();
//        public Claim[] GetAllClaims(string claimType, string claimValue) => Claims.Where(c => c.Type == claimType && c.Value == claimValue).ToArray();
//        public bool IsInRole(string roleName) => Roles.Any(r => string.Equals(r, roleName, StringComparison.OrdinalIgnoreCase));
//        public string? TenantRoleName => null;
//    }
//}

