using NSubstitute;
using Shouldly;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VCareer.Application.Applications;
using VCareer.Dto.Applications;
using VCareer.IServices.Application;
using VCareer.IServices.IActivityLogService;
using VCareer.CV;
using VCareer.Application.Contracts.CV;
using VCareer.IServices.Notification;
using VCareer.IRepositories.Job;
using VCareer.IRepositories.Profile;
using VCareer.Models.Applications;
using VCareer.Models.CV;
using VCareer.Models.Job;
using VCareer.Models.Users;
using VCareer.Models.Companies;
using Volo.Abp;
using Volo.Abp.Domain.Entities;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Emailing;
using Volo.Abp.Identity;
using Volo.Abp.Users;
using Xunit;
using IdentityUser = Volo.Abp.Identity.IdentityUser;
using Microsoft.Extensions.Configuration;

namespace VCareer.Applications;

public class ApplicationAppServiceTests
{
    /// Test ứng tuyển với CV online thành công
    [Fact]
    public async Task ApplyWithOnlineCVAsync_creates_application_successfully()
    {
        // Arrange: Tạo dữ liệu test
        var userId = Guid.NewGuid();
        var candidateId = Guid.NewGuid();
        var jobId = Guid.NewGuid();
        var cvId = Guid.NewGuid();
        var companyId = 1;

        var candidate = CreateCandidateProfile(candidateId, userId);
        var job = CreateJobPost(jobId, companyId);
        var cv = CreateCandidateCv(cvId, userId);
        var recruiter = CreateRecruiterProfile(Guid.NewGuid(), Guid.NewGuid(), companyId);

        var dto = new ApplyWithOnlineCVDto
        {
            JobId = jobId,
            CandidateCvId = cvId,
            CoverLetter = "Test cover letter"
        };

        var (service, applicationRepo) = BuildService(
            userId,
            new List<CandidateProfile> { candidate },
            new List<Job_Post> { job },
            new List<CandidateCv> { cv },
            new List<RecruiterProfile> { recruiter },
            new List<JobApplication>());

        // Act: Gọi hàm ứng tuyển
        var result = await service.ApplyWithOnlineCVAsync(dto);

        // Assert: Kiểm tra application đã được tạo
        result.ShouldNotBeNull();
        result.JobId.ShouldBe(jobId);
        result.CVType.ShouldBe("Online");
        await applicationRepo.Received(1).InsertAsync(Arg.Is<JobApplication>(a => a.JobId == jobId && a.CandidateId == userId));
    }

    /// Test ứng tuyển với CV online thất bại khi candidate không tồn tại
    [Fact]
    public async Task ApplyWithOnlineCVAsync_throws_when_candidate_not_found()
    {
        // Arrange: Tạo service không có candidate
        var userId = Guid.NewGuid();
        var dto = new ApplyWithOnlineCVDto { JobId = Guid.NewGuid(), CandidateCvId = Guid.NewGuid() };

        var (service, _) = BuildService(
            userId,
            new List<CandidateProfile>(),
            new List<Job_Post>(),
            new List<CandidateCv>(),
            new List<RecruiterProfile>(),
            new List<JobApplication>());

        // Act & Assert: Kiểm tra ném exception
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.ApplyWithOnlineCVAsync(dto));

        ex.Message.ShouldContain("Không tìm thấy thông tin ứng viên");
    }

    /// Test ứng tuyển với CV online thất bại khi CV không tồn tại
    [Fact]
    public async Task ApplyWithOnlineCVAsync_throws_when_cv_not_found()
    {
        // Arrange: Tạo candidate nhưng không có CV
        var userId = Guid.NewGuid();
        var candidateId = Guid.NewGuid();
        var candidate = CreateCandidateProfile(candidateId, userId);
        var dto = new ApplyWithOnlineCVDto { JobId = Guid.NewGuid(), CandidateCvId = Guid.NewGuid() };

        var (service, _) = BuildService(
            userId,
            new List<CandidateProfile> { candidate },
            new List<Job_Post>(),
            new List<CandidateCv>(),
            new List<RecruiterProfile>(),
            new List<JobApplication>());

        // Act & Assert: Kiểm tra ném exception
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.ApplyWithOnlineCVAsync(dto));

        ex.Message.ShouldContain("CV không tồn tại");
    }

    /// Test ứng tuyển với CV online thất bại khi job không tồn tại
    [Fact]
    public async Task ApplyWithOnlineCVAsync_throws_when_job_not_found()
    {
        // Arrange: Tạo candidate và CV nhưng không có job
        var userId = Guid.NewGuid();
        var candidateId = Guid.NewGuid();
        var cvId = Guid.NewGuid();
        var candidate = CreateCandidateProfile(candidateId, userId);
        var cv = CreateCandidateCv(cvId, userId);
        var dto = new ApplyWithOnlineCVDto { JobId = Guid.NewGuid(), CandidateCvId = cvId };

        var (service, _) = BuildService(
            userId,
            new List<CandidateProfile> { candidate },
            new List<Job_Post>(),
            new List<CandidateCv> { cv },
            new List<RecruiterProfile>(),
            new List<JobApplication>());

        // Act & Assert: Kiểm tra ném exception
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.ApplyWithOnlineCVAsync(dto));

        ex.Message.ShouldContain("Công việc không tồn tại");
    }

    /// Test cập nhật trạng thái application thành công
    [Fact]
    public async Task UpdateApplicationStatusAsync_updates_status_successfully()
    {
        // Arrange: Tạo application và dto
        var applicationId = Guid.NewGuid();
        var application = CreateJobApplication(applicationId, Guid.NewGuid(), Guid.NewGuid(), 1);
        var dto = new UpdateApplicationStatusDto
        {
            Status = "Reviewed",
            RecruiterNotes = "Test notes",
            Rating = 4
        };

        var (service, applicationRepo) = BuildService(
            Guid.NewGuid(),
            new List<CandidateProfile>(),
            new List<Job_Post>(),
            new List<CandidateCv>(),
            new List<RecruiterProfile>(),
            new List<JobApplication> { application });

        // Act: Gọi hàm cập nhật trạng thái
        var result = await service.UpdateApplicationStatusAsync(applicationId, dto);

        // Assert: Kiểm tra application đã được cập nhật
        result.ShouldNotBeNull();
        result.Status.ShouldBe(dto.Status);
        await applicationRepo.Received(1).UpdateAsync(Arg.Is<JobApplication>(a => a.Status == dto.Status));
    }

    /// Test cập nhật trạng thái application thất bại khi application không tồn tại
    [Fact]
    public async Task UpdateApplicationStatusAsync_throws_when_application_not_found()
    {
        // Arrange: Tạo service không có application
        var nonExistentId = Guid.NewGuid();
        var dto = new UpdateApplicationStatusDto { Status = "Reviewed" };

        var (service, _) = BuildService(
            Guid.NewGuid(),
            new List<CandidateProfile>(),
            new List<Job_Post>(),
            new List<CandidateCv>(),
            new List<RecruiterProfile>(),
            new List<JobApplication>());

        // Act & Assert: Kiểm tra ném exception
        await Should.ThrowAsync<EntityNotFoundException>(() =>
            service.UpdateApplicationStatusAsync(nonExistentId, dto));
    }

    /// Test hủy application thành công
    [Fact]
    public async Task WithdrawApplicationAsync_withdraws_application_successfully()
    {
        // Arrange: Tạo application và candidate
        var userId = Guid.NewGuid();
        var candidateId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var application = CreateJobApplication(applicationId, Guid.NewGuid(), userId, 1);
        var candidate = CreateCandidateProfile(candidateId, userId);
        var dto = new WithdrawApplicationDto { WithdrawalReason = "Test reason" };

        var (service, applicationRepo) = BuildService(
            userId,
            new List<CandidateProfile> { candidate },
            new List<Job_Post>(),
            new List<CandidateCv>(),
            new List<RecruiterProfile>(),
            new List<JobApplication> { application });

        // Act: Gọi hàm hủy application
        var result = await service.WithdrawApplicationAsync(applicationId, dto);

        // Assert: Kiểm tra application đã được cập nhật
        result.ShouldNotBeNull();
        result.Status.ShouldBe("Withdrawn");
        await applicationRepo.Received(1).UpdateAsync(Arg.Is<JobApplication>(a => a.Status == "Withdrawn"));
    }

    /// Test hủy application thất bại khi không có quyền
    [Fact]
    public async Task WithdrawApplicationAsync_throws_when_user_not_authorized()
    {
        // Arrange: Tạo application với candidate khác
        var applicationId = Guid.NewGuid();
        var application = CreateJobApplication(applicationId, Guid.NewGuid(), Guid.NewGuid(), 1);
        var differentUserId = Guid.NewGuid();
        var dto = new WithdrawApplicationDto { WithdrawalReason = "Test reason" };

        var (service, _) = BuildService(
            differentUserId,
            new List<CandidateProfile>(),
            new List<Job_Post>(),
            new List<CandidateCv>(),
            new List<RecruiterProfile>(),
            new List<JobApplication> { application });

        // Act & Assert: Kiểm tra ném exception
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.WithdrawApplicationAsync(applicationId, dto));

        ex.Message.ShouldContain("không có quyền");
    }

    /// Test đánh dấu đã xem application thành công
    [Fact]
    public async Task MarkAsViewedAsync_marks_as_viewed_successfully()
    {
        // Arrange: Tạo application chưa được xem
        var applicationId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var application = CreateJobApplication(applicationId, Guid.NewGuid(), Guid.NewGuid(), 1);
        application.ViewedAt = null;

        var (service, applicationRepo) = BuildService(
            userId,
            new List<CandidateProfile>(),
            new List<Job_Post>(),
            new List<CandidateCv>(),
            new List<RecruiterProfile>(),
            new List<JobApplication> { application });

        // Act: Gọi hàm đánh dấu đã xem
        var result = await service.MarkAsViewedAsync(applicationId);

        // Assert: Kiểm tra application đã được cập nhật
        result.ShouldNotBeNull();
        await applicationRepo.Received(1).UpdateAsync(Arg.Is<JobApplication>(a => a.ViewedAt.HasValue));
    }

    /// Test kiểm tra trạng thái application khi đã ứng tuyển
    [Fact]
    public async Task CheckApplicationStatusAsync_returns_status_when_applied()
    {
        // Arrange: Tạo candidate và application
        var userId = Guid.NewGuid();
        var candidateId = Guid.NewGuid();
        var jobId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var candidate = CreateCandidateProfile(candidateId, userId);
        var application = CreateJobApplication(applicationId, jobId, userId, 1);
        application.Status = "Pending";

        var (service, _) = BuildService(
            userId,
            new List<CandidateProfile> { candidate },
            new List<Job_Post>(),
            new List<CandidateCv>(),
            new List<RecruiterProfile>(),
            new List<JobApplication> { application });

        // Act: Gọi hàm kiểm tra trạng thái
        var result = await service.CheckApplicationStatusAsync(jobId);

        // Assert: Kiểm tra kết quả
        result.ShouldNotBeNull();
        result.HasApplied.ShouldBeTrue();
        result.ApplicationId.ShouldBe(applicationId);
        result.Status.ShouldBe("Pending");
    }

    /// Test kiểm tra trạng thái application khi chưa ứng tuyển
    [Fact]
    public async Task CheckApplicationStatusAsync_returns_not_applied_when_no_application()
    {
        // Arrange: Tạo candidate nhưng không có application
        var userId = Guid.NewGuid();
        var candidateId = Guid.NewGuid();
        var jobId = Guid.NewGuid();
        var candidate = CreateCandidateProfile(candidateId, userId);

        var (service, _) = BuildService(
            userId,
            new List<CandidateProfile> { candidate },
            new List<Job_Post>(),
            new List<CandidateCv>(),
            new List<RecruiterProfile>(),
            new List<JobApplication>());

        // Act: Gọi hàm kiểm tra trạng thái
        var result = await service.CheckApplicationStatusAsync(jobId);

        // Assert: Kiểm tra kết quả
        result.ShouldNotBeNull();
        result.HasApplied.ShouldBeFalse();
    }

    /// Test lấy application theo ID thành công
    [Fact]
    public async Task GetApplicationAsync_returns_application_successfully()
    {
        // Arrange: Tạo application
        var applicationId = Guid.NewGuid();
        var application = CreateJobApplication(applicationId, Guid.NewGuid(), Guid.NewGuid(), 1);

        var (service, _) = BuildService(
            Guid.NewGuid(),
            new List<CandidateProfile>(),
            new List<Job_Post>(),
            new List<CandidateCv>(),
            new List<RecruiterProfile>(),
            new List<JobApplication> { application });

        // Act: Gọi hàm lấy application
        var result = await service.GetApplicationAsync(applicationId);

        // Assert: Kiểm tra kết quả
        result.ShouldNotBeNull();
        result.Id.ShouldBe(applicationId);
    }

    /// Test lấy application thất bại khi không tồn tại
    [Fact]
    public async Task GetApplicationAsync_throws_when_application_not_found()
    {
        // Arrange: Tạo service không có application
        var nonExistentId = Guid.NewGuid();

        var (service, _) = BuildService(
            Guid.NewGuid(),
            new List<CandidateProfile>(),
            new List<Job_Post>(),
            new List<CandidateCv>(),
            new List<RecruiterProfile>(),
            new List<JobApplication>());

        // Act & Assert: Kiểm tra ném exception
        await Should.ThrowAsync<EntityNotFoundException>(() =>
            service.GetApplicationAsync(nonExistentId));
    }

    /// Test xóa application thành công
    [Fact]
    public async Task DeleteApplicationAsync_deletes_application_successfully()
    {
        // Arrange: Tạo application
        var applicationId = Guid.NewGuid();
        var application = CreateJobApplication(applicationId, Guid.NewGuid(), Guid.NewGuid(), 1);

        var (service, applicationRepo) = BuildService(
            Guid.NewGuid(),
            new List<CandidateProfile>(),
            new List<Job_Post>(),
            new List<CandidateCv>(),
            new List<RecruiterProfile>(),
            new List<JobApplication> { application });

        // Act: Gọi hàm xóa application
        await service.DeleteApplicationAsync(applicationId);

        // Assert: Kiểm tra application đã được xóa
        await applicationRepo.Received(1).DeleteAsync(Arg.Is<JobApplication>(a => a.Id == applicationId));
    }

    // ========== Helper Methods ==========

    /// Tạo dữ liệu test cho CandidateProfile
    private static CandidateProfile CreateCandidateProfile(Guid id, Guid userId)
    {
        var profile = new CandidateProfile
        {
            UserId = userId
        };

        typeof(CandidateProfile)
            .GetProperty("Id")?
            .SetValue(profile, id);

        return profile;
    }

    /// Tạo dữ liệu test cho Job_Post
    private static Job_Post CreateJobPost(Guid id, int companyId)
    {
        var job = new Job_Post
        {
            Title = "Test Job",
            CompanyId = companyId
        };

        typeof(Job_Post)
            .GetProperty("Id")?
            .SetValue(job, id);

        return job;
    }

    /// Tạo dữ liệu test cho CandidateCv
    private static CandidateCv CreateCandidateCv(Guid id, Guid candidateId)
    {
        var cv = new CandidateCv
        {
            CandidateId = candidateId
        };

        typeof(CandidateCv)
            .GetProperty("Id")?
            .SetValue(cv, id);

        return cv;
    }

    /// Tạo dữ liệu test cho RecruiterProfile
    private static RecruiterProfile CreateRecruiterProfile(Guid id, Guid userId, int companyId)
    {
        var profile = new RecruiterProfile
        {
            UserId = userId,
            CompanyId = companyId
        };

        typeof(RecruiterProfile)
            .GetProperty("Id")?
            .SetValue(profile, id);

        return profile;
    }

    /// Tạo dữ liệu test cho JobApplication
    private static JobApplication CreateJobApplication(Guid id, Guid jobId, Guid candidateId, int companyId)
    {
        var application = new JobApplication
        {
            JobId = jobId,
            CandidateId = candidateId,
            CompanyId = companyId,
            Status = "Pending",
            CVType = "Online"
        };

        typeof(JobApplication)
            .GetProperty("Id")?
            .SetValue(application, id);

        return application;
    }

    /// Tạo service test với các dependency giả (mock)
    private static (ApplicationAppService service, IRepository<JobApplication, Guid> applicationRepo) BuildService(
        Guid currentUserId,
        List<CandidateProfile> candidateData,
        List<Job_Post> jobData,
        List<CandidateCv> cvData,
        List<RecruiterProfile> recruiterData,
        List<JobApplication> applicationData)
    {
        // Tạo mock repository cho JobApplication
        var applicationRepo = Substitute.For<IRepository<JobApplication, Guid>>();
        applicationRepo.GetQueryableAsync()
            .Returns(Task.FromResult(applicationData.AsQueryable()));
        applicationRepo.GetAsync(Arg.Any<Guid>())
            .Returns(ci =>
            {
                var id = ci.Arg<Guid>();
                var application = applicationData.FirstOrDefault(a => a.Id == id);
                if (application == null)
                    throw new EntityNotFoundException();
                return Task.FromResult(application);
            });
        applicationRepo.FirstOrDefaultAsync(Arg.Any<System.Linq.Expressions.Expression<Func<JobApplication, bool>>>())
            .Returns(ci =>
            {
                var predicate = ci.Arg<System.Linq.Expressions.Expression<Func<JobApplication, bool>>>();
                var compiled = predicate.Compile();
                return Task.FromResult(applicationData.FirstOrDefault(compiled));
            });
        applicationRepo.InsertAsync(Arg.Any<JobApplication>())
            .Returns(ci =>
            {
                var application = ci.Arg<JobApplication>();
                applicationData.Add(application);
                return Task.FromResult(application);
            });
        applicationRepo.UpdateAsync(Arg.Any<JobApplication>())
            .Returns(ci =>
            {
                var application = ci.Arg<JobApplication>();
                var existing = applicationData.FirstOrDefault(a => a.Id == application.Id);
                if (existing != null)
                {
                    var index = applicationData.IndexOf(existing);
                    applicationData[index] = application;
                }
                return Task.FromResult(application);
            });
        applicationRepo.DeleteAsync(Arg.Any<JobApplication>())
            .Returns(ci =>
            {
                var application = ci.Arg<JobApplication>();
                applicationData.RemoveAll(a => a.Id == application.Id);
                return Task.CompletedTask;
            });

        // Tạo mock repository cho CandidateProfile
        var candidateRepo = Substitute.For<IRepository<CandidateProfile, Guid>>();
        candidateRepo.FirstOrDefaultAsync(Arg.Any<System.Linq.Expressions.Expression<Func<CandidateProfile, bool>>>())
            .Returns(ci =>
            {
                var predicate = ci.Arg<System.Linq.Expressions.Expression<Func<CandidateProfile, bool>>>();
                var compiled = predicate.Compile();
                return Task.FromResult(candidateData.FirstOrDefault(compiled));
            });

        // Tạo mock repository cho Job_Post
        var jobRepo = Substitute.For<IRepository<Job_Post, Guid>>();
        jobRepo.GetQueryableAsync()
            .Returns(Task.FromResult(jobData.AsQueryable()));
        jobRepo.GetAsync(Arg.Any<Guid>())
            .Returns(ci =>
            {
                var id = ci.Arg<Guid>();
                var job = jobData.FirstOrDefault(j => j.Id == id);
                if (job == null)
                    throw new EntityNotFoundException();
                return Task.FromResult(job);
            });
        jobRepo.FirstOrDefaultAsync(Arg.Any<System.Linq.Expressions.Expression<Func<Job_Post, bool>>>())
            .Returns(ci =>
            {
                var predicate = ci.Arg<System.Linq.Expressions.Expression<Func<Job_Post, bool>>>();
                var compiled = predicate.Compile();
                return Task.FromResult(jobData.FirstOrDefault(compiled));
            });
        jobRepo.UpdateAsync(Arg.Any<Job_Post>())
            .Returns(ci => Task.FromResult(ci.Arg<Job_Post>()));

        // Tạo mock repository cho CandidateCv
        var cvRepo = Substitute.For<IRepository<CandidateCv, Guid>>();
        cvRepo.FirstOrDefaultAsync(Arg.Any<System.Linq.Expressions.Expression<Func<CandidateCv, bool>>>())
            .Returns(ci =>
            {
                var predicate = ci.Arg<System.Linq.Expressions.Expression<Func<CandidateCv, bool>>>();
                var compiled = predicate.Compile();
                return Task.FromResult(cvData.FirstOrDefault(compiled));
            });

        // Tạo mock repository cho UploadedCv
        var uploadedCvRepo = Substitute.For<IRepository<UploadedCv, Guid>>();

        // Tạo mock repository cho RecruiterProfile
        var recruiterRepo = Substitute.For<IRepository<RecruiterProfile, Guid>>();
        recruiterRepo.FirstOrDefaultAsync(Arg.Any<System.Linq.Expressions.Expression<Func<RecruiterProfile, bool>>>())
            .Returns(ci =>
            {
                var predicate = ci.Arg<System.Linq.Expressions.Expression<Func<RecruiterProfile, bool>>>();
                var compiled = predicate.Compile();
                return Task.FromResult(recruiterData.FirstOrDefault(compiled));
            });

        // Tạo mock repository cho Company
        var companyRepo = Substitute.For<IRepository<Company, int>>();

        // Tạo mock repository cho RecruitmentCampaign
        var campaignRepo = Substitute.For<IRepository<RecruitmentCampaign, Guid>>();

        // Tạo mock repository cho IdentityUser
        var identityUserRepo = Substitute.For<IRepository<IdentityUser, Guid>>();

        // Tạo mock ICurrentUser
        var currentUser = Substitute.For<ICurrentUser>();
        currentUser.IsAuthenticated.Returns(true);
        currentUser.Id.Returns((Guid?)currentUserId);
        currentUser.GetId().Returns(currentUserId);

        // Tạo mock các service
        var candidateCvService = Substitute.For<ICandidateCvAppService>();
        var uploadedCvService = Substitute.For<IUploadedCvAppService>();
        var emailSender = Substitute.For<IEmailSender>();
        var notificationService = Substitute.For<INotificationAppService>();
        var recruiterRepository = Substitute.For<IRecruiterRepository>();
        var jobPostRepository = Substitute.For<IJobPostRepository>();
        var activityLogService = Substitute.For<IActivityLogAppService>();
        var configuration = Substitute.For<IConfiguration>();

        // Tạo service với các dependency giả
        var service = new ApplicationAppService(
            applicationRepo,
            candidateRepo,
            jobRepo,
            campaignRepo,
            cvRepo,
            uploadedCvRepo,
            recruiterRepo,
            companyRepo,
            identityUserRepo,
            candidateCvService,
            uploadedCvService,
            currentUser,
            emailSender,
            configuration,
            activityLogService,
            notificationService,
            recruiterRepository,
            jobPostRepository);

        return (service, applicationRepo);
    }
}
