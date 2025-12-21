using NSubstitute;
using Shouldly;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using VCareer.Constants.JobConstant;
using VCareer.Dto.JobDto;
using VCareer.Dto.Notification;
using VCareer.IRepositories.Category;
using VCareer.IRepositories.ICompanyRepository;
using VCareer.IRepositories.Job;
using VCareer.IRepositories.Profile;
using VCareer.IRepositories.Subcriptions;
using VCareer.IServices.IActivityLogService;
using VCareer.IServices.IGeoServices;
using VCareer.IServices.IJobServices;
using VCareer.Repositories.Profile;
using VCareer.IServices.Notification;
using VCareer.IServices.Subcriptions;
using VCareer.Job.JobPosting.ISerices;
using VCareer.Models.Job;
using VCareer.Models.Subcription;
using VCareer.Models.Users;
using VCareer.Models.Companies;
using VCareer.Services.Job;
using VCareer.Services.LuceneService.JobSearch;
using Volo.Abp.Domain.Entities;
using Volo.Abp;
using Volo.Abp.Authorization;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;
using Volo.Abp.Users;
using Xunit;

namespace VCareer.Job;

public class JobPostServiceTests
{
    /// Test duyệt job thành công khi job tồn tại và chưa hết hạn
    [Fact]
    public async Task ApproveJobPostAsync_approves_job_successfully()
    {
        // Arrange: Tạo dữ liệu test
        var jobId = Guid.NewGuid();
        var recruiterId = Guid.NewGuid();
        var currentUserId = Guid.NewGuid();
        var job = CreateJobPost(jobId, recruiterId, JobStatus.Pending, DateTime.Now.AddDays(30));

        var (service, jobRepo) = BuildService(currentUserId, new List<Job_Post> { job });

        // Act: Gọi hàm duyệt job
        await service.ApproveJobPostAsync(jobId.ToString());

        // Assert: Kiểm tra job đã được cập nhật đúng
        await jobRepo.Received(1).UpdateAsync(
            Arg.Is<Job_Post>(j => j.Id == jobId && j.Status == JobStatus.Open),
            Arg.Any<bool>());
    }

    /// Test duyệt job thất bại khi job không tồn tại
    [Fact]
    public async Task ApproveJobPostAsync_throws_when_job_not_found()
    {
        // Arrange: Tạo service với danh sách job rỗng
        var nonExistentJobId = Guid.NewGuid();
        var currentUserId = Guid.NewGuid();
        var (service, _) = BuildService(currentUserId, new List<Job_Post>());

        // Act & Assert: Kiểm tra ném exception khi job không tồn tại
        var ex = await Should.ThrowAsync<BusinessException>(() =>
            service.ApproveJobPostAsync(nonExistentJobId.ToString()));

        ex.Message.ShouldContain("không tồn tại");
    }

    /// Test duyệt job thất bại khi job đã hết hạn
    [Fact]
    public async Task ApproveJobPostAsync_throws_when_job_expired()
    {
        // Arrange: Tạo job đã hết hạn
        var jobId = Guid.NewGuid();
        var recruiterId = Guid.NewGuid();
        var currentUserId = Guid.NewGuid();
        var expiredJob = CreateJobPost(jobId, recruiterId, JobStatus.Pending, DateTime.Now.AddDays(-1));
        var (service, _) = BuildService(currentUserId, new List<Job_Post> { expiredJob });

        // Act & Assert: Kiểm tra ném exception khi job đã hết hạn
        var ex = await Should.ThrowAsync<BusinessException>(() =>
            service.ApproveJobPostAsync(jobId.ToString()));

        ex.Message.ShouldContain("expired");
    }

    /// Test từ chối job thành công khi job tồn tại
    [Fact]
    public async Task RejectJobPostAsync_rejects_job_successfully()
    {
        // Arrange: Tạo dữ liệu test
        var jobId = Guid.NewGuid();
        var recruiterId = Guid.NewGuid();
        var currentUserId = Guid.NewGuid();
        var reasonReject = "Không phù hợp với yêu cầu";
        var job = CreateJobPost(jobId, recruiterId, JobStatus.Pending, DateTime.Now.AddDays(30));
        var user = CreateIdentityUser(recruiterId, "recruiter@test.com");

        var (service, jobRepo) = BuildService(currentUserId, new List<Job_Post> { job }, user);

        // Act: Gọi hàm từ chối job
        await service.RejectJobPostAsync(jobId.ToString(), reasonReject);

        // Assert: Kiểm tra job đã được cập nhật đúng
        await jobRepo.Received(1).UpdateAsync(
            Arg.Is<Job_Post>(j => j.Id == jobId && j.Status == JobStatus.Rejected && j.RejectedReason == reasonReject),
            Arg.Any<bool>());
    }

    /// Test từ chối job thất bại khi job không tồn tại
    [Fact]
    public async Task RejectJobPostAsync_throws_when_job_not_found()
    {
        // Arrange: Tạo service với danh sách job rỗng
        var nonExistentJobId = Guid.NewGuid();
        var currentUserId = Guid.NewGuid();
        var (service, _) = BuildService(currentUserId, new List<Job_Post>());

        // Act & Assert: Kiểm tra ném exception khi job không tồn tại
        var ex = await Should.ThrowAsync<BusinessException>(() =>
            service.RejectJobPostAsync(nonExistentJobId.ToString(), "Lý do"));

        ex.Message.ShouldContain("không tồn tại");
    }

    /// Test từ chối job thất bại khi không tìm thấy owner của job
    [Fact]
    public async Task RejectJobPostAsync_throws_when_owner_not_found()
    {
        // Arrange: Tạo job nhưng không có user tương ứng
        var jobId = Guid.NewGuid();
        var recruiterId = Guid.NewGuid();
        var currentUserId = Guid.NewGuid();
        var job = CreateJobPost(jobId, recruiterId, JobStatus.Pending, DateTime.Now.AddDays(30));
        var (service, _) = BuildService(currentUserId, new List<Job_Post> { job }, null);

        // Act & Assert: Kiểm tra ném exception khi không tìm thấy owner
        var ex = await Should.ThrowAsync<BusinessException>(() =>
            service.RejectJobPostAsync(jobId.ToString(), "Lý do"));

        ex.Message.ShouldContain("owner of this jobpost not found");
    }

    /// Test đóng job thành công khi job tồn tại
    [Fact]
    public async Task CloseJobPost_closes_job_successfully()
    {
        // Arrange: Tạo job đang mở
        var jobId = Guid.NewGuid();
        var recruiterId = Guid.NewGuid();
        var currentUserId = Guid.NewGuid();
        var job = CreateJobPost(jobId, recruiterId, JobStatus.Open, DateTime.Now.AddDays(30));
        var (service, jobRepo) = BuildService(currentUserId, new List<Job_Post> { job });

        // Act: Gọi hàm đóng job
        await service.CloseJobPost(jobId.ToString());

        // Assert: Kiểm tra job đã được cập nhật thành Closed
        await jobRepo.Received(1).UpdateAsync(
            Arg.Is<Job_Post>(j => j.Id == jobId && j.Status == JobStatus.Closed),
            Arg.Any<bool>());
    }

    /// Test đóng job thất bại khi job không tồn tại
    [Fact]
    public async Task CloseJobPost_throws_when_job_not_found()
    {
        // Arrange: Tạo service với danh sách job rỗng
        var nonExistentJobId = Guid.NewGuid();
        var currentUserId = Guid.NewGuid();
        var (service, _) = BuildService(currentUserId, new List<Job_Post>());

        // Act & Assert: Kiểm tra ném exception khi job không tồn tại
        var ex = await Should.ThrowAsync<BusinessException>(() =>
            service.CloseJobPost(nonExistentJobId.ToString()));

        ex.Message.ShouldContain("không tồn tại");
    }

    /// Test tạo job mới thành công khi user đã đăng nhập và là recruiter
    [Fact]
    public async Task CreateJobPost_creates_job_successfully()
    {
        // Tạo dữ liệu test
        var currentUserId = Guid.NewGuid();
        var recruiterId = Guid.NewGuid();
        var companyId = 1;
        var recruiter = CreateRecruiterProfile(recruiterId, currentUserId, companyId);
        var company = CreateCompany(companyId, "Test Company", "logo.jpg");
        var dto = new JobPostCreateDto
        {
            Title = "Test Job",
            Description = "Test Description",
            Benefits = "Test Benefits",
            Requirements = "Test Requirements",
            SalaryMin = 1000,
            SalaryMax = 2000,
            ExpiresAt = DateTime.Now.AddDays(30),
            JobCategoryId = Guid.NewGuid(),
            ProvinceCode = 1,
            WardCode = 1,
            WorkLocation = "Test Location",
            WorkTime = "Full-time",
            EmploymentType = EmploymentType.FullTime,
            PositionType = PositionType.Employee,
            Experience = ExperienceLevel.Year2,
            Quantity = 5,
            Slug = "test-job",
            SalaryDeal = false
        };

        var (service, jobRepo) = BuildService(currentUserId, new List<Job_Post>(), null, recruiter, company);

        // Act: Gọi hàm tạo job
        await service.CreateJobPost(dto);

        // Assert: Kiểm tra job đã được tạo với status Draft
        await jobRepo.Received(1).InsertAsync(
            Arg.Is<Job_Post>(j => j.Title == dto.Title && j.Status == JobStatus.Draft),
            Arg.Any<bool>());
    }

    /// Test tạo job thất bại khi user chưa đăng nhập
    [Fact]
    public async Task CreateJobPost_throws_when_user_not_authenticated()
    {
        // Arrange: Tạo service với user chưa đăng nhập
        var currentUserId = Guid.NewGuid();
        var dto = new JobPostCreateDto { Title = "Test Job" };
        var (service, _) = BuildService(currentUserId, new List<Job_Post>(), null, null, null, isAuthenticated: false);

        // Act & Assert: Kiểm tra ném exception khi user chưa đăng nhập
        var ex = await Should.ThrowAsync<AbpAuthorizationException>(() =>
            service.CreateJobPost(dto));

        ex.Message.ShouldContain("not authenticated");
    }

    /// Test tạo job thất bại khi không tìm thấy company
    [Fact]
    public async Task CreateJobPost_throws_when_company_not_found()
    {
        // Arrange: Tạo recruiter nhưng không có company
        var currentUserId = Guid.NewGuid();
        var recruiterId = Guid.NewGuid();
        var recruiter = CreateRecruiterProfile(recruiterId, currentUserId, 1);
        var dto = new JobPostCreateDto { Title = "Test Job" };
        var (service, _) = BuildService(currentUserId, new List<Job_Post>(), null, recruiter, null);

        // Act & Assert: Kiểm tra ném exception khi không tìm thấy company
        var ex = await Should.ThrowAsync<BusinessException>(() =>
            service.CreateJobPost(dto));

        ex.Message.ShouldContain("Company not found");
    }

    /// Test đăng job thành công khi job ở trạng thái Draft
    [Fact]
    public async Task PostJobAsync_posts_job_successfully()
    {
        // Arrange: Tạo job ở trạng thái Draft
        var jobId = Guid.NewGuid();
        var recruiterId = Guid.NewGuid();
        var currentUserId = Guid.NewGuid();
        var job = CreateJobPost(jobId, recruiterId, JobStatus.Draft, DateTime.Now.AddDays(30));
        var dto = new PostJobDto
        {
            JobId = jobId,
            ChildServiceIds = new List<Guid>()
        };

        var (service, jobRepo) = BuildService(currentUserId, new List<Job_Post> { job });

        // Act: Gọi hàm đăng job
        await service.PostJobAsync(dto);

        // Assert: Kiểm tra job đã được cập nhật thành Pending
        await jobRepo.Received(1).UpdateAsync(
            Arg.Is<Job_Post>(j => j.Id == jobId && j.Status == JobStatus.Pending),
            Arg.Any<bool>());
    }

    /// Test đăng job thất bại khi job không tồn tại
    [Fact]
    public async Task PostJobAsync_throws_when_job_not_found()
    {
        // Arrange: Tạo service với danh sách job rỗng
        var nonExistentJobId = Guid.NewGuid();
        var currentUserId = Guid.NewGuid();
        var dto = new PostJobDto { JobId = nonExistentJobId };
        var (service, _) = BuildService(currentUserId, new List<Job_Post>());

        // Act & Assert: Kiểm tra ném exception khi job không tồn tại
        var ex = await Should.ThrowAsync<BusinessException>(() =>
            service.PostJobAsync(dto));

        ex.Message.ShouldContain("doesn't exist");
    }

    /// Test đăng job thất bại khi job đã bị từ chối hoặc hết hạn
    [Fact]
    public async Task PostJobAsync_throws_when_job_expired_or_rejected()
    {
        // Arrange: Tạo job đã bị từ chối
        var jobId = Guid.NewGuid();
        var recruiterId = Guid.NewGuid();
        var currentUserId = Guid.NewGuid();
        var rejectedJob = CreateJobPost(jobId, recruiterId, JobStatus.Rejected, DateTime.Now.AddDays(30));
        var dto = new PostJobDto { JobId = jobId };
        var (service, _) = BuildService(currentUserId, new List<Job_Post> { rejectedJob });

        // Act & Assert: Kiểm tra ném exception khi job đã bị từ chối
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.PostJobAsync(dto));

        ex.Message.ShouldContain("expired or rejected");
    }

    /// Test đăng job thất bại khi job đã được duyệt hoặc đang chờ duyệt
    [Fact]
    public async Task PostJobAsync_throws_when_job_already_open_or_pending()
    {
        // Arrange: Tạo job đã được duyệt
        var jobId = Guid.NewGuid();
        var recruiterId = Guid.NewGuid();
        var currentUserId = Guid.NewGuid();
        var openJob = CreateJobPost(jobId, recruiterId, JobStatus.Open, DateTime.Now.AddDays(30));
        var dto = new PostJobDto { JobId = jobId };
        var (service, _) = BuildService(currentUserId, new List<Job_Post> { openJob });

        // Act & Assert: Kiểm tra ném exception khi job đã được duyệt
        var ex = await Should.ThrowAsync<BusinessException>(() =>
            service.PostJobAsync(dto));

        ex.Message.ShouldContain("already open or waiting for approval");
    }

    // ========== Helper Methods ==========

    /// Tạo dữ liệu test cho Job_Post
    private static Job_Post CreateJobPost(Guid id, Guid recruiterId, JobStatus status, DateTime expiresAt)
    {
        var job = new Job_Post
        {
            RecruiterId = recruiterId,
            Status = status,
            ExpiresAt = expiresAt,
            Title = "Test Job",
            CompanyName = "Test Company",
            IsDeleted = false
        };

        // Sử dụng reflection để set Id vì nó là protected
        typeof(Job_Post)
            .GetProperty("Id")?
            .SetValue(job, id);

        return job;
    }

    /// Tạo dữ liệu test cho IdentityUser
    private static IdentityUser CreateIdentityUser(Guid userId, string email)
    {
        return new IdentityUser(userId, email, email)
        {
            Name = "Test",
            Surname = "User"
        };
    }

    /// Tạo dữ liệu test cho RecruiterProfile
    private static RecruiterProfile CreateRecruiterProfile(Guid profileId, Guid userId, int companyId)
    {
        var user = CreateIdentityUser(userId, $"{userId}@test.com");
        var profile = new RecruiterProfile
        {
            UserId = userId,
            CompanyId = companyId,
            IsLead = false,
            Status = true,
            User = user
        };

        typeof(RecruiterProfile)
            .GetProperty("Id")?
            .SetValue(profile, profileId);

        return profile;
    }

    /// Tạo dữ liệu test cho Company
    private static Company CreateCompany(int id, string companyName, string logoUrl)
    {
        var company = new Company
        {
            CompanyName = companyName,
            LogoUrl = logoUrl
        };

        typeof(Company)
            .GetProperty("Id")?
            .SetValue(company, id);

        return company;
    }

    /// Tạo service test với các dependency giả (mock)
    private static (JobPostService service, IJobPostRepository jobRepo) BuildService(
        Guid currentUserId,
        List<Job_Post> jobData,
        IdentityUser? user = null,
        RecruiterProfile? recruiter = null,
        Company? company = null,
        bool isAuthenticated = true)
    {
        // Tạo mock repository cho Job_Post
        var jobRepo = Substitute.For<IJobPostRepository>();
        jobRepo.GetAsync(Arg.Any<Guid>(), Arg.Any<bool>())
            .Returns(ci =>
            {
                var id = ci.ArgAt<Guid>(0);
                var job = jobData.FirstOrDefault(j => j.Id == id);
                if (job == null)
                    throw new EntityNotFoundException();
                return Task.FromResult(job);
            });
        jobRepo.UpdateAsync(Arg.Any<Job_Post>(), Arg.Any<bool>())
            .Returns(ci => Task.FromResult(ci.Arg<Job_Post>()));
        jobRepo.InsertAsync(Arg.Any<Job_Post>(), Arg.Any<bool>())
            .Returns(ci => Task.FromResult(ci.Arg<Job_Post>()));

        // Tạo các mock repository khác
        var jobPriorityRepo = Substitute.For<IJobPriorityRepository>();
        var companyRepo = Substitute.For<ICompanyRepository>();
        if (company != null)
        {
            companyRepo.GetAsync(Arg.Is<int>(c => c == company.Id))
                .Returns(Task.FromResult(company));
        }

        var identityUserRepo = Substitute.For<IIdentityUserRepository>();
        if (user != null)
        {
            identityUserRepo.GetAsync(Arg.Is<Guid>(u => u == user.Id))
                .Returns(Task.FromResult(user));
        }

        var recruiterRepo = Substitute.For<IRecruiterRepository>();
        if (recruiter != null)
        {
            recruiterRepo.FindAsync(Arg.Any<Expression<Func<RecruiterProfile, bool>>>())
                .Returns(ci =>
                {
                    var predicate = ci.Arg<Expression<Func<RecruiterProfile, bool>>>();
                    var compiled = predicate.Compile();
                    return Task.FromResult(recruiter);
                });
        }

        var employeeRepo = Substitute.For<IEmployeeRepository>();
        var geoService = Substitute.For<IGeoService>();
        var jobCategoryRepo = Substitute.For<IJobCategoryRepository>();
        var effectingJobService = Substitute.For<IJobAffectingService>();
        var childServiceRepo = Substitute.For<IChildServiceRepository>();
        var tagService = Substitute.For<ITagService>();
        var jobTagService = Substitute.For<IJobTagService>();
        var activityLogService = Substitute.For<IActivityLogAppService>();
        var luceneJobIndexer = Substitute.For<ILuceneJobIndexer>();
        var jobAffectingRepo = Substitute.For<IEffectingJobServiceRepository>();
        var notificationService = Substitute.For<INotificationAppService>();
        var campaignRepo = Substitute.For<IRecruitmentCampainRepository>();
        var userChildServiceRepo = Substitute.For<IUser_ChildServiceRepository>();
        var jobSearchService = Substitute.For<VCareer.Job.JobPosting.ISerices.IJobSearchService>();

        // Tạo mock ICurrentUser
        var currentUser = Substitute.For<ICurrentUser>();
        currentUser.IsAuthenticated.Returns(isAuthenticated);
        if (isAuthenticated)
        {
            currentUser.Id.Returns((Guid?)currentUserId);
            currentUser.GetId().Returns(currentUserId);
        }

        // Tạo service với các dependency giả
        var service = new JobPostService(
            jobRepo,
            userChildServiceRepo,
            jobSearchService,
            jobPriorityRepo,
            companyRepo,
            currentUser,
            identityUserRepo,
            recruiterRepo,
            geoService,
            jobCategoryRepo,
            effectingJobService,
            childServiceRepo,
            tagService,
            jobAffectingRepo,
            employeeRepo,
            jobTagService,
            luceneJobIndexer,
            activityLogService,
            notificationService,
            campaignRepo);

        return (service, jobRepo);
    }
}

