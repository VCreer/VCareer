using NSubstitute;
using Shouldly;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VCareer.CV;
using VCareer.Models.CV;
using VCareer.Models.Users;
using VCareer.Services.CV;
using VCareer.Services.LuceneService.CandidateSearch;
using Volo.Abp;
using Volo.Abp.Domain.Entities;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Users;
using Xunit;
using Microsoft.Extensions.Logging;

namespace VCareer.CV;

public class CandidateCvAppServiceTests
{
    /// Test tạo CV thành công
    [Fact]
    public async Task CreateAsync_creates_cv_successfully()
    {
        // Arrange: Tạo dữ liệu test
        var userId = Guid.NewGuid();
        var candidateId = Guid.NewGuid();
        var templateId = Guid.NewGuid();
        var candidate = CreateCandidateProfile(candidateId, userId);
        var template = CreateCvTemplate(templateId, true);

        var dto = new CreateCandidateCvDto
        {
            TemplateId = templateId,
            CvName = "Test CV",
            DataJson = "{}",
            IsDefault = false,
            IsPublished = false,
            IsPublic = true
        };

        var (service, cvRepo) = BuildService(
            userId,
            new List<CandidateProfile> { candidate },
            new List<CvTemplate> { template },
            new List<CandidateCv>());

        // Act: Gọi hàm tạo CV
        var result = await service.CreateAsync(dto);

        // Assert: Kiểm tra CV đã được tạo
        result.ShouldNotBeNull();
        result.CvName.ShouldBe(dto.CvName);
        await cvRepo.Received(1).InsertAsync(Arg.Is<CandidateCv>(c => c.CandidateId == userId && c.TemplateId == templateId));
    }

    /// Test tạo CV thất bại khi candidate không tồn tại
    [Fact]
    public async Task CreateAsync_throws_when_candidate_not_found()
    {
        // Arrange: Tạo service không có candidate
        var userId = Guid.NewGuid();
        var templateId = Guid.NewGuid();
        var template = CreateCvTemplate(templateId, true);
        var dto = new CreateCandidateCvDto { TemplateId = templateId, CvName = "Test", DataJson = "{}" };

        var (service, _) = BuildService(
            userId,
            new List<CandidateProfile>(),
            new List<CvTemplate> { template },
            new List<CandidateCv>());

        // Act & Assert: Kiểm tra ném exception
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.CreateAsync(dto));

        ex.Message.ShouldContain("Chỉ có candidate mới có thể tạo CV");
    }

    /// Test tạo CV thất bại khi template không active
    [Fact]
    public async Task CreateAsync_throws_when_template_not_active()
    {
        // Arrange: Tạo template không active
        var userId = Guid.NewGuid();
        var candidateId = Guid.NewGuid();
        var templateId = Guid.NewGuid();
        var candidate = CreateCandidateProfile(candidateId, userId);
        var template = CreateCvTemplate(templateId, false); // Template không active
        var dto = new CreateCandidateCvDto { TemplateId = templateId, CvName = "Test", DataJson = "{}" };

        var (service, _) = BuildService(
            userId,
            new List<CandidateProfile> { candidate },
            new List<CvTemplate> { template },
            new List<CandidateCv>());

        // Act & Assert: Kiểm tra ném exception
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.CreateAsync(dto));

        ex.Message.ShouldContain("Template này không còn hoạt động");
    }

    /// Test tạo CV mặc định sẽ bỏ default của CV khác
    [Fact]
    public async Task CreateAsync_sets_default_and_removes_other_default()
    {
        // Arrange: Tạo CV mặc định hiện có
        var userId = Guid.NewGuid();
        var candidateId = Guid.NewGuid();
        var templateId = Guid.NewGuid();
        var existingCvId = Guid.NewGuid();
        var candidate = CreateCandidateProfile(candidateId, userId);
        var template = CreateCvTemplate(templateId, true);
        var existingCv = CreateCandidateCv(existingCvId, userId, templateId, isDefault: true);

        var dto = new CreateCandidateCvDto
        {
            TemplateId = templateId,
            CvName = "New Default CV",
            DataJson = "{}",
            IsDefault = true
        };

        var (service, cvRepo) = BuildService(
            userId,
            new List<CandidateProfile> { candidate },
            new List<CvTemplate> { template },
            new List<CandidateCv> { existingCv });

        // Act: Gọi hàm tạo CV mặc định
        await service.CreateAsync(dto);

        // Assert: Kiểm tra CV cũ đã bỏ default
        await cvRepo.Received(1).UpdateAsync(Arg.Is<CandidateCv>(c => c.Id == existingCvId && c.IsDefault == false));
    }

    /// Test cập nhật CV thành công
    [Fact]
    public async Task UpdateAsync_updates_cv_successfully()
    {
        // Arrange: Tạo CV và dto
        var userId = Guid.NewGuid();
        var cvId = Guid.NewGuid();
        var templateId = Guid.NewGuid();
        var cv = CreateCandidateCv(cvId, userId, templateId);
        var dto = new UpdateCandidateCvDto
        {
            CvName = "Updated CV Name",
            DataJson = "{\"updated\": true}"
        };

        var (service, cvRepo) = BuildService(
            userId,
            new List<CandidateProfile>(),
            new List<CvTemplate>(),
            new List<CandidateCv> { cv });

        // Act: Gọi hàm cập nhật CV
        var result = await service.UpdateAsync(cvId, dto);

        // Assert: Kiểm tra CV đã được cập nhật
        result.ShouldNotBeNull();
        await cvRepo.Received(1).UpdateAsync(Arg.Is<CandidateCv>(c => c.Id == cvId && c.CvName == dto.CvName));
    }

    /// Test cập nhật CV thất bại khi không có quyền
    [Fact]
    public async Task UpdateAsync_throws_when_user_not_authorized()
    {
        // Arrange: Tạo CV với user khác
        var cvId = Guid.NewGuid();
        var differentUserId = Guid.NewGuid();
        var cv = CreateCandidateCv(cvId, Guid.NewGuid(), Guid.NewGuid());
        var dto = new UpdateCandidateCvDto { CvName = "Updated" };

        var (service, _) = BuildService(
            differentUserId,
            new List<CandidateProfile>(),
            new List<CvTemplate>(),
            new List<CandidateCv> { cv });

        // Act & Assert: Kiểm tra ném exception
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.UpdateAsync(cvId, dto));

        ex.Message.ShouldContain("không có quyền");
    }

    /// Test xóa CV thành công
    [Fact]
    public async Task DeleteAsync_deletes_cv_successfully()
    {
        // Arrange: Tạo CV
        var userId = Guid.NewGuid();
        var cvId = Guid.NewGuid();
        var cv = CreateCandidateCv(cvId, userId, Guid.NewGuid());

        var (service, cvRepo) = BuildService(
            userId,
            new List<CandidateProfile>(),
            new List<CvTemplate>(),
            new List<CandidateCv> { cv });

        // Act: Gọi hàm xóa CV
        await service.DeleteAsync(cvId);

        // Assert: Kiểm tra CV đã được xóa
        await cvRepo.Received(1).DeleteAsync(Arg.Is<Guid>(id => id == cvId));
    }

    /// Test xóa CV thất bại khi không có quyền
    [Fact]
    public async Task DeleteAsync_throws_when_user_not_authorized()
    {
        // Arrange: Tạo CV với user khác
        var cvId = Guid.NewGuid();
        var differentUserId = Guid.NewGuid();
        var cv = CreateCandidateCv(cvId, Guid.NewGuid(), Guid.NewGuid());

        var (service, _) = BuildService(
            differentUserId,
            new List<CandidateProfile>(),
            new List<CvTemplate>(),
            new List<CandidateCv> { cv });

        // Act & Assert: Kiểm tra ném exception
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.DeleteAsync(cvId));

        ex.Message.ShouldContain("không có quyền");
    }

    /// Test lấy CV theo ID thành công
    [Fact]
    public async Task GetAsync_returns_cv_successfully()
    {
        // Arrange: Tạo CV
        var cvId = Guid.NewGuid();
        var cv = CreateCandidateCv(cvId, Guid.NewGuid(), Guid.NewGuid());

        var (service, _) = BuildService(
            Guid.NewGuid(),
            new List<CandidateProfile>(),
            new List<CvTemplate>(),
            new List<CandidateCv> { cv });

        // Act: Gọi hàm lấy CV
        var result = await service.GetAsync(cvId);

        // Assert: Kiểm tra kết quả
        result.ShouldNotBeNull();
        result.Id.ShouldBe(cvId);
    }

    /// Test đặt CV làm mặc định thành công
    [Fact]
    public async Task SetDefaultAsync_sets_default_successfully()
    {
        // Arrange: Tạo CV và CV mặc định hiện có
        var userId = Guid.NewGuid();
        var cvId = Guid.NewGuid();
        var existingDefaultCvId = Guid.NewGuid();
        var cv = CreateCandidateCv(cvId, userId, Guid.NewGuid(), isDefault: false);
        var existingDefault = CreateCandidateCv(existingDefaultCvId, userId, Guid.NewGuid(), isDefault: true);

        var (service, cvRepo) = BuildService(
            userId,
            new List<CandidateProfile>(),
            new List<CvTemplate>(),
            new List<CandidateCv> { cv, existingDefault });

        // Act: Gọi hàm đặt CV làm mặc định
        await service.SetDefaultAsync(cvId);

        // Assert: Kiểm tra CV đã được đặt làm mặc định và CV cũ đã bỏ default
        await cvRepo.Received(1).UpdateAsync(Arg.Is<CandidateCv>(c => c.Id == existingDefaultCvId && c.IsDefault == false));
        await cvRepo.Received(1).UpdateAsync(Arg.Is<CandidateCv>(c => c.Id == cvId && c.IsDefault == true));
    }

    /// Test đặt CV làm mặc định thất bại khi không có quyền
    [Fact]
    public async Task SetDefaultAsync_throws_when_user_not_authorized()
    {
        // Arrange: Tạo CV với user khác
        var cvId = Guid.NewGuid();
        var differentUserId = Guid.NewGuid();
        var cv = CreateCandidateCv(cvId, Guid.NewGuid(), Guid.NewGuid());

        var (service, _) = BuildService(
            differentUserId,
            new List<CandidateProfile>(),
            new List<CvTemplate>(),
            new List<CandidateCv> { cv });

        // Act & Assert: Kiểm tra ném exception
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.SetDefaultAsync(cvId));

        ex.Message.ShouldContain("không có quyền");
    }

    /// Test publish CV thành công
    [Fact]
    public async Task PublishAsync_publishes_cv_successfully()
    {
        // Arrange: Tạo CV chưa publish
        var userId = Guid.NewGuid();
        var cvId = Guid.NewGuid();
        var cv = CreateCandidateCv(cvId, userId, Guid.NewGuid(), isPublished: false);

        var (service, cvRepo) = BuildService(
            userId,
            new List<CandidateProfile>(),
            new List<CvTemplate>(),
            new List<CandidateCv> { cv });

        // Act: Gọi hàm publish CV
        await service.PublishAsync(cvId, true);

        // Assert: Kiểm tra CV đã được publish
        await cvRepo.Received(1).UpdateAsync(Arg.Is<CandidateCv>(c => c.Id == cvId && c.IsPublished == true));
    }

    /// Test tăng view count thành công
    [Fact]
    public async Task IncrementViewCountAsync_increments_count_successfully()
    {
        // Arrange: Tạo CV với view count = 0
        var cvId = Guid.NewGuid();
        var cv = CreateCandidateCv(cvId, Guid.NewGuid(), Guid.NewGuid());
        cv.ViewCount = 0;

        var (service, cvRepo) = BuildService(
            Guid.NewGuid(),
            new List<CandidateProfile>(),
            new List<CvTemplate>(),
            new List<CandidateCv> { cv });

        // Act: Gọi hàm tăng view count
        await service.IncrementViewCountAsync(cvId);

        // Assert: Kiểm tra view count đã được tăng
        await cvRepo.Received(1).UpdateAsync(Arg.Is<CandidateCv>(c => c.Id == cvId && c.ViewCount == 1));
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

    /// Tạo dữ liệu test cho CvTemplate
    private static CvTemplate CreateCvTemplate(Guid id, bool isActive)
    {
        var template = new CvTemplate
        {
            IsActive = isActive
        };

        typeof(CvTemplate)
            .GetProperty("Id")?
            .SetValue(template, id);

        return template;
    }

    /// Tạo dữ liệu test cho CandidateCv
    private static CandidateCv CreateCandidateCv(Guid id, Guid candidateId, Guid templateId, bool isDefault = false, bool isPublished = false)
    {
        var cv = new CandidateCv
        {
            CandidateId = candidateId,
            TemplateId = templateId,
            CvName = "Test CV",
            DataJson = "{}",
            IsDefault = isDefault,
            IsPublished = isPublished,
            IsPublic = true,
            ViewCount = 0
        };

        typeof(CandidateCv)
            .GetProperty("Id")?
            .SetValue(cv, id);

        return cv;
    }

    /// Tạo service test với các dependency giả (mock)
    private static (CandidateCvAppService service, IRepository<CandidateCv, Guid> cvRepo) BuildService(
        Guid currentUserId,
        List<CandidateProfile> candidateData,
        List<CvTemplate> templateData,
        List<CandidateCv> cvData)
    {
        // Tạo mock repository cho CandidateCv
        var cvRepo = Substitute.For<IRepository<CandidateCv, Guid>>();
        cvRepo.GetQueryableAsync()
            .Returns(Task.FromResult(cvData.AsQueryable()));
        cvRepo.GetAsync(Arg.Any<Guid>())
            .Returns(ci =>
            {
                var id = ci.Arg<Guid>();
                var cv = cvData.FirstOrDefault(c => c.Id == id);
                if (cv == null)
                    throw new EntityNotFoundException();
                return Task.FromResult(cv);
            });
        cvRepo.FirstOrDefaultAsync(Arg.Any<System.Linq.Expressions.Expression<Func<CandidateCv, bool>>>())
            .Returns(ci =>
            {
                var predicate = ci.Arg<System.Linq.Expressions.Expression<Func<CandidateCv, bool>>>();
                var compiled = predicate.Compile();
                return Task.FromResult(cvData.FirstOrDefault(compiled));
            });
        cvRepo.InsertAsync(Arg.Any<CandidateCv>())
            .Returns(ci =>
            {
                var cv = ci.Arg<CandidateCv>();
                cvData.Add(cv);
                return Task.FromResult(cv);
            });
        cvRepo.UpdateAsync(Arg.Any<CandidateCv>())
            .Returns(ci =>
            {
                var cv = ci.Arg<CandidateCv>();
                var existing = cvData.FirstOrDefault(c => c.Id == cv.Id);
                if (existing != null)
                {
                    var index = cvData.IndexOf(existing);
                    cvData[index] = cv;
                }
                return Task.FromResult(cv);
            });
        cvRepo.DeleteAsync(Arg.Any<Guid>())
            .Returns(ci =>
            {
                var id = ci.Arg<Guid>();
                cvData.RemoveAll(c => c.Id == id);
                return Task.CompletedTask;
            });

        // Tạo mock repository cho CvTemplate
        var templateRepo = Substitute.For<IRepository<CvTemplate, Guid>>();
        templateRepo.GetAsync(Arg.Any<Guid>())
            .Returns(ci =>
            {
                var id = ci.Arg<Guid>();
                var template = templateData.FirstOrDefault(t => t.Id == id);
                if (template == null)
                    throw new EntityNotFoundException();
                return Task.FromResult(template);
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

        // Tạo mock ICurrentUser
        var currentUser = Substitute.For<ICurrentUser>();
        currentUser.IsAuthenticated.Returns(true);
        currentUser.Id.Returns((Guid?)currentUserId);
        currentUser.GetId().Returns(currentUserId);

        // Tạo mock ILogger
        var logger = Substitute.For<ILogger<CandidateCvAppService>>();

        // Tạo mock CandidateIndexService
        var candidateIndexService = Substitute.For<CandidateIndexService>(null!, null!);
        candidateIndexService.IndexCandidateAsync(Arg.Any<Guid>())
            .Returns(Task.CompletedTask);

        // Tạo service với các dependency giả
        var service = new CandidateCvAppService(
            cvRepo,
            templateRepo,
            candidateRepo,
            currentUser,
            logger,
            candidateIndexService);

        return (service, cvRepo);
    }
}

