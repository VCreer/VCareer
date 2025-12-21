using NSubstitute;
using Shouldly;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VCareer.Application.Contracts.CV;
using VCareer.Models.CV;
using VCareer.Models.FileMetadata;
using VCareer.Models.Users;
using VCareer.Services.CV;
using Volo.Abp;
using Volo.Abp.BlobStoring;
using Volo.Abp.Domain.Entities;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Users;
using Xunit;
using Microsoft.AspNetCore.Http;
using VCareer.IServices.IFileServices;
using VCareer.Dto.FileDto;

namespace VCareer.UploadedCV;

public class UploadedCvAppServiceTests
{
    /// Test upload CV thành công
    [Fact]
    public async Task UploadCvAsync_uploads_cv_successfully()
    {
        // Arrange: Tạo dữ liệu test
        var userId = Guid.NewGuid();
        var candidateId = Guid.NewGuid();
        var fileDescriptorId = Guid.NewGuid();
        var candidate = CreateCandidateProfile(candidateId, userId);
        var formFile = CreateMockFormFile("test.pdf", "application/pdf");

        var (service, uploadedCvRepo) = BuildService(
            userId,
            new List<CandidateProfile> { candidate },
            new List<UploadedCv>(),
            fileDescriptorId);

        // Act: Gọi hàm upload CV
        var result = await service.UploadCvAsync(formFile, "Test CV", false, true, null);

        // Assert: Kiểm tra CV đã được upload
        result.ShouldNotBeNull();
        result.CvName.ShouldBe("Test CV");
        await uploadedCvRepo.Received(1).InsertAsync(Arg.Is<UploadedCv>(c => c.CandidateId == userId));
    }

    /// Test upload CV thất bại khi candidate không tồn tại
    [Fact]
    public async Task UploadCvAsync_throws_when_candidate_not_found()
    {
        // Arrange: Tạo service không có candidate
        var userId = Guid.NewGuid();
        var fileDescriptorId = Guid.NewGuid();
        var formFile = CreateMockFormFile("test.pdf", "application/pdf");

        var (service, _) = BuildService(
            userId,
            new List<CandidateProfile>(),
            new List<UploadedCv>(),
            fileDescriptorId);

        // Act & Assert: Kiểm tra ném exception
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.UploadCvAsync(formFile, "Test CV"));

        ex.Message.ShouldContain("Chỉ có candidate mới có thể upload CV");
    }

    /// Test lấy danh sách CV thành công
    [Fact]
    public async Task GetListAsync_returns_cv_list_successfully()
    {
        // Arrange: Tạo danh sách CV
        var userId = Guid.NewGuid();
        var cv1 = CreateUploadedCv(Guid.NewGuid(), userId);
        var cv2 = CreateUploadedCv(Guid.NewGuid(), userId);
        var input = new GetUploadedCvListDto { SkipCount = 0, MaxResultCount = 10 };

        var (service, _) = BuildService(
            userId,
            new List<CandidateProfile>(),
            new List<UploadedCv> { cv1, cv2 },
            Guid.NewGuid());

        // Act: Gọi hàm lấy danh sách CV
        var result = await service.GetListAsync(input);

        // Assert: Kiểm tra kết quả
        result.ShouldNotBeNull();
        result.Items.Count.ShouldBe(2);
    }

    /// Test lấy CV theo ID thành công
    [Fact]
    public async Task GetAsync_returns_cv_successfully()
    {
        // Arrange: Tạo CV
        var cvId = Guid.NewGuid();
        var cv = CreateUploadedCv(cvId, Guid.NewGuid());

        var (service, _) = BuildService(
            Guid.NewGuid(),
            new List<CandidateProfile>(),
            new List<UploadedCv> { cv },
            Guid.NewGuid());

        // Act: Gọi hàm lấy CV
        var result = await service.GetAsync(cvId);

        // Assert: Kiểm tra kết quả
        result.ShouldNotBeNull();
        result.Id.ShouldBe(cvId);
    }

    /// Test lấy CV thất bại khi không tồn tại
    [Fact]
    public async Task GetAsync_throws_when_cv_not_found()
    {
        // Arrange: Tạo service không có CV
        var nonExistentId = Guid.NewGuid();

        var (service, _) = BuildService(
            Guid.NewGuid(),
            new List<CandidateProfile>(),
            new List<UploadedCv>(),
            Guid.NewGuid());

        // Act & Assert: Kiểm tra ném exception
        await Should.ThrowAsync<EntityNotFoundException>(() =>
            service.GetAsync(nonExistentId));
    }

    /// Test cập nhật CV thành công
    [Fact]
    public async Task UpdateAsync_updates_cv_successfully()
    {
        // Arrange: Tạo CV và dto
        var userId = Guid.NewGuid();
        var cvId = Guid.NewGuid();
        var cv = CreateUploadedCv(cvId, userId);
        var dto = new UpdateUploadedCvDto
        {
            CvName = "Updated CV Name",
            Notes = "Updated notes"
        };

        var (service, uploadedCvRepo) = BuildService(
            userId,
            new List<CandidateProfile>(),
            new List<UploadedCv> { cv },
            Guid.NewGuid());

        // Act: Gọi hàm cập nhật CV
        var result = await service.UpdateAsync(cvId, dto);

        // Assert: Kiểm tra CV đã được cập nhật
        result.ShouldNotBeNull();
        await uploadedCvRepo.Received(1).UpdateAsync(Arg.Is<UploadedCv>(c => c.Id == cvId && c.CvName == dto.CvName));
    }

    /// Test cập nhật CV thất bại khi không có quyền
    [Fact]
    public async Task UpdateAsync_throws_when_user_not_authorized()
    {
        // Arrange: Tạo CV với user khác
        var cvId = Guid.NewGuid();
        var differentUserId = Guid.NewGuid();
        var cv = CreateUploadedCv(cvId, Guid.NewGuid());
        var dto = new UpdateUploadedCvDto { CvName = "Updated" };

        var (service, _) = BuildService(
            differentUserId,
            new List<CandidateProfile>(),
            new List<UploadedCv> { cv },
            Guid.NewGuid());

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
        var cv = CreateUploadedCv(cvId, userId);

        var (service, uploadedCvRepo) = BuildService(
            userId,
            new List<CandidateProfile>(),
            new List<UploadedCv> { cv },
            Guid.NewGuid());

        // Act: Gọi hàm xóa CV
        await service.DeleteAsync(cvId);

        // Assert: Kiểm tra CV đã được xóa
        await uploadedCvRepo.Received(1).DeleteAsync(Arg.Is<Guid>(id => id == cvId));
    }

    /// Test xóa CV thất bại khi không có quyền
    [Fact]
    public async Task DeleteAsync_throws_when_user_not_authorized()
    {
        // Arrange: Tạo CV với user khác
        var cvId = Guid.NewGuid();
        var differentUserId = Guid.NewGuid();
        var cv = CreateUploadedCv(cvId, Guid.NewGuid());

        var (service, _) = BuildService(
            differentUserId,
            new List<CandidateProfile>(),
            new List<UploadedCv> { cv },
            Guid.NewGuid());

        // Act & Assert: Kiểm tra ném exception
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.DeleteAsync(cvId));

        ex.Message.ShouldContain("không có quyền");
    }

    /// Test đặt CV làm mặc định thành công
    [Fact]
    public async Task SetDefaultAsync_sets_default_successfully()
    {
        // Arrange: Tạo CV và CV mặc định hiện có
        var userId = Guid.NewGuid();
        var cvId = Guid.NewGuid();
        var existingDefaultCvId = Guid.NewGuid();
        var cv = CreateUploadedCv(cvId, userId, isDefault: false);
        var existingDefault = CreateUploadedCv(existingDefaultCvId, userId, isDefault: true);

        var (service, uploadedCvRepo) = BuildService(
            userId,
            new List<CandidateProfile>(),
            new List<UploadedCv> { cv, existingDefault },
            Guid.NewGuid());

        // Act: Gọi hàm đặt CV làm mặc định
        await service.SetDefaultAsync(cvId);

        // Assert: Kiểm tra CV đã được đặt làm mặc định và CV cũ đã bỏ default
        await uploadedCvRepo.Received(1).UpdateAsync(Arg.Is<UploadedCv>(c => c.Id == existingDefaultCvId && c.IsDefault == false));
        await uploadedCvRepo.Received(1).UpdateAsync(Arg.Is<UploadedCv>(c => c.Id == cvId && c.IsDefault == true));
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

    /// Tạo dữ liệu test cho UploadedCv
    private static UploadedCv CreateUploadedCv(Guid id, Guid candidateId, bool isDefault = false)
    {
        var cv = new UploadedCv
        {
            CandidateId = candidateId,
            CvName = "Test CV",
            FileDescriptorId = Guid.NewGuid(),
            IsDefault = isDefault,
            IsPublic = true
        };

        typeof(UploadedCv)
            .GetProperty("Id")?
            .SetValue(cv, id);

        return cv;
    }

    /// Tạo mock IFormFile
    private static IFormFile CreateMockFormFile(string fileName, string contentType)
    {
        var file = Substitute.For<IFormFile>();
        file.FileName.Returns(fileName);
        file.ContentType.Returns(contentType);
        file.Length.Returns(1024);
        return file;
    }

    /// Tạo service test với các dependency giả (mock)
    private static (UploadedCvAppService service, IRepository<UploadedCv, Guid> uploadedCvRepo) BuildService(
        Guid currentUserId,
        List<CandidateProfile> candidateData,
        List<UploadedCv> cvData,
        Guid fileDescriptorId)
    {
        // Tạo mock repository cho UploadedCv
        var uploadedCvRepo = Substitute.For<IRepository<UploadedCv, Guid>>();
        uploadedCvRepo.GetQueryableAsync()
            .Returns(Task.FromResult(cvData.AsQueryable()));
        uploadedCvRepo.GetAsync(Arg.Any<Guid>())
            .Returns(ci =>
            {
                var id = ci.Arg<Guid>();
                var cv = cvData.FirstOrDefault(c => c.Id == id);
                if (cv == null)
                    throw new EntityNotFoundException();
                return Task.FromResult(cv);
            });
        uploadedCvRepo.FirstOrDefaultAsync(Arg.Any<System.Linq.Expressions.Expression<Func<UploadedCv, bool>>>())
            .Returns(ci =>
            {
                var predicate = ci.Arg<System.Linq.Expressions.Expression<Func<UploadedCv, bool>>>();
                var compiled = predicate.Compile();
                return Task.FromResult(cvData.FirstOrDefault(compiled));
            });
        uploadedCvRepo.InsertAsync(Arg.Any<UploadedCv>())
            .Returns(ci =>
            {
                var cv = ci.Arg<UploadedCv>();
                cvData.Add(cv);
                return Task.FromResult(cv);
            });
        uploadedCvRepo.UpdateAsync(Arg.Any<UploadedCv>())
            .Returns(ci =>
            {
                var cv = ci.Arg<UploadedCv>();
                var existing = cvData.FirstOrDefault(c => c.Id == cv.Id);
                if (existing != null)
                {
                    var index = cvData.IndexOf(existing);
                    cvData[index] = cv;
                }
                return Task.FromResult(cv);
            });
        uploadedCvRepo.DeleteAsync(Arg.Any<Guid>())
            .Returns(ci =>
            {
                var id = ci.Arg<Guid>();
                cvData.RemoveAll(c => c.Id == id);
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

        // Tạo mock repository cho FileDescriptor
        var fileDescriptorRepo = Substitute.For<IRepository<FileDescriptor, Guid>>();

        // Tạo mock IFileServices
        var fileServices = Substitute.For<IFileServices>();
        fileServices.UploadAsync(Arg.Any<UploadFileDto>())
            .Returns(Task.FromResult(fileDescriptorId));

        // Tạo mock IBlobContainerFactory
        var blobFactory = Substitute.For<IBlobContainerFactory>();

        // Tạo mock ICurrentUser
        var currentUser = Substitute.For<ICurrentUser>();
        currentUser.IsAuthenticated.Returns(true);
        currentUser.Id.Returns((Guid?)currentUserId);
        currentUser.GetId().Returns(currentUserId);

        // Tạo service với các dependency giả
        var service = new UploadedCvAppService(
            uploadedCvRepo,
            candidateRepo,
            fileDescriptorRepo,
            fileServices,
            blobFactory,
            currentUser);

        return (service, uploadedCvRepo);
    }
}

