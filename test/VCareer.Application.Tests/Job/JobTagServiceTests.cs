using NSubstitute;
using Shouldly;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using VCareer.Dto.JobDto;
using VCareer.IRepositories.Category;
using VCareer.IRepositories.Job;
using VCareer.Models.Job;
using VCareer.Models.JobCategory;
using VCareer.Services.Job;
using Volo.Abp;
using Volo.Abp.Domain.Entities;
using VCareer.Constants.JobConstant;
using Xunit;
using static VCareer.Dto.JobDto.JobTagViewDto;

namespace VCareer.Job;

public class JobTagServiceTests
{
    /// <summary>
    /// Test thêm tags vào job thành công khi job tồn tại và tags hợp lệ
    /// </summary>
    [Fact]
    public async Task AddTagsToJob_adds_tags_successfully()
    {
        // Arrange: Tạo dữ liệu test
        var jobId = Guid.NewGuid();
        var job = CreateJobPost(jobId, "Test Job");
        var tag1 = CreateTag(1, "Tag 1");
        var tag2 = CreateTag(2, "Tag 2");
        var dto = new JobTagCreateUpdateDto
        {
            JobId = jobId,
            TagIds = new List<int> { 1, 2 }
        };

        var (service, jobTagRepo) = BuildService(
            new List<Job_Post> { job },
            new List<Tag> { tag1, tag2 },
            new List<JobTag>());

        // Act: Gọi hàm thêm tags
        await service.AddTagsToJob(dto);

        // Assert: Kiểm tra tags đã được thêm vào job
        await jobTagRepo.Received(1).InsertManyAsync(
            Arg.Is<List<JobTag>>(tags => 
                tags.Count == 2 && 
                tags.All(t => t.JobId == jobId) &&
                tags.Any(t => t.TagId == 1) &&
                tags.Any(t => t.TagId == 2)),
            Arg.Any<bool>());
    }

    /// <summary>
    /// Test thêm tags vào job thất bại khi job không tồn tại
    /// </summary>
    [Fact]
    public async Task AddTagsToJob_throws_when_job_not_found()
    {
        // Arrange: Tạo service với job không tồn tại
        var nonExistentJobId = Guid.NewGuid();
        var dto = new JobTagCreateUpdateDto
        {
            JobId = nonExistentJobId,
            TagIds = new List<int> { 1 }
        };

        var (service, _) = BuildService(new List<Job_Post>(), new List<Tag>(), new List<JobTag>());

        // Act & Assert: Kiểm tra ném exception khi job không tồn tại
        var ex = await Should.ThrowAsync<BusinessException>(() =>
            service.AddTagsToJob(dto));

        ex.Message.ShouldContain("Job Not Found");
    }

    /// <summary>
    /// Test thêm tags vào job không làm gì khi TagIds rỗng
    /// </summary>
    [Fact]
    public async Task AddTagsToJob_does_nothing_when_tag_ids_empty()
    {
        // Arrange: Tạo dto với TagIds rỗng
        var jobId = Guid.NewGuid();
        var job = CreateJobPost(jobId, "Test Job");
        var dto = new JobTagCreateUpdateDto
        {
            JobId = jobId,
            TagIds = new List<int>()
        };

        var (service, jobTagRepo) = BuildService(
            new List<Job_Post> { job },
            new List<Tag>(),
            new List<JobTag>());

        // Act: Gọi hàm thêm tags
        await service.AddTagsToJob(dto);

        // Assert: Kiểm tra không gọi InsertManyAsync
        await jobTagRepo.DidNotReceive().InsertManyAsync(Arg.Any<List<JobTag>>(), Arg.Any<bool>());
    }

    /// <summary>
    /// Test lấy tags theo jobId thành công khi job tồn tại
    /// </summary>
    [Fact]
    public async Task GetTagByJobId_returns_tags_successfully()
    {
        // Arrange: Tạo job và tags
        var jobId = Guid.NewGuid();
        var job = CreateJobPost(jobId, "Test Job");
        var jobTag1 = CreateJobTag(jobId, 1);
        var jobTag2 = CreateJobTag(jobId, 2);

        var (service, _) = BuildService(
            new List<Job_Post> { job },
            new List<Tag>(),
            new List<JobTag> { jobTag1, jobTag2 });

        // Act: Gọi hàm lấy tags
        var result = await service.GetTagByJobId(jobId);

        // Assert: Kiểm tra kết quả không null
        result.ShouldNotBeNull();
        result.Count.ShouldBe(2);
    }

    /// <summary>
    /// Test lấy tags theo jobId thất bại khi job không tồn tại
    /// </summary>
    [Fact]
    public async Task GetTagByJobId_throws_when_job_not_found()
    {
        // Arrange: Tạo service với job không tồn tại
        var nonExistentJobId = Guid.NewGuid();
        var (service, _) = BuildService(new List<Job_Post>(), new List<Tag>(), new List<JobTag>());

        // Act & Assert: Kiểm tra ném exception khi job không tồn tại
        var ex = await Should.ThrowAsync<BusinessException>(() =>
            service.GetTagByJobId(nonExistentJobId));

        ex.Message.ShouldContain("Job Not Found");
    }

    /// <summary>
    /// Test lấy tags theo jobId trả về rỗng khi job không có tags
    /// </summary>
    [Fact]
    public async Task GetTagByJobId_returns_empty_when_no_tags()
    {
        // Arrange: Tạo job không có tags
        var jobId = Guid.NewGuid();
        var job = CreateJobPost(jobId, "Test Job");
        var (service, _) = BuildService(
            new List<Job_Post> { job },
            new List<Tag>(),
            new List<JobTag>());

        // Act: Gọi hàm lấy tags
        var result = await service.GetTagByJobId(jobId);

        // Assert: Kiểm tra kết quả là list rỗng
        result.ShouldBeEmpty();
    }

    /// <summary>
    /// Test lấy tag theo tagId thành công khi tag tồn tại
    /// </summary>
    [Fact]
    public async Task GetTagByTagId_returns_tag_successfully()
    {
        // Arrange: Tạo job tag
        var jobId = Guid.NewGuid();
        var tagId = 1;
        var jobTag = CreateJobTag(jobId, tagId);

        var (service, _) = BuildService(
            new List<Job_Post>(),
            new List<Tag>(),
            new List<JobTag> { jobTag });

        // Act: Gọi hàm lấy tag
        var result = await service.GetTagByTagId(tagId);

        // Assert: Kiểm tra kết quả không null
        result.ShouldNotBeNull();
    }

    /// <summary>
    /// Test lấy tag theo tagId thất bại khi tag không tồn tại
    /// </summary>
    [Fact]
    public async Task GetTagByTagId_throws_when_tag_not_found()
    {
        // Arrange: Tạo service không có tag nào
        var nonExistentTagId = 999;
        var (service, _) = BuildService(new List<Job_Post>(), new List<Tag>(), new List<JobTag>());

        // Act & Assert: Kiểm tra ném exception khi tag không tồn tại
        var ex = await Should.ThrowAsync<BusinessException>(() =>
            service.GetTagByTagId(nonExistentTagId));

        ex.Message.ShouldContain("Tag Not Found");
    }

    /// <summary>
    /// Test cập nhật tags của job thành công khi job tồn tại
    /// </summary>
    [Fact]
    public async Task UpdateTagOfJob_updates_tags_successfully()
    {
        // Arrange: Tạo job với tags cũ
        var jobId = Guid.NewGuid();
        var job = CreateJobPost(jobId, "Test Job");
        var oldJobTag1 = CreateJobTag(jobId, 1);
        var oldJobTag2 = CreateJobTag(jobId, 2);
        var dto = new JobTagCreateUpdateDto
        {
            JobId = jobId,
            TagIds = new List<int> { 2, 3 } // Giữ tag 2, xóa tag 1, thêm tag 3
        };

        var (service, jobTagRepo) = BuildService(
            new List<Job_Post> { job },
            new List<Tag>(),
            new List<JobTag> { oldJobTag1, oldJobTag2 });

        // Act: Gọi hàm cập nhật tags
        await service.UpdateTagOfJob(dto);

        // Assert: Kiểm tra tags đã được cập nhật (xóa tag cũ, thêm tag mới)
        await jobTagRepo.Received(1).DeleteManyAsync(Arg.Any<List<JobTag>>());
        await jobTagRepo.Received(1).InsertManyAsync(Arg.Any<List<JobTag>>());
    }

    /// <summary>
    /// Test cập nhật tags của job thất bại khi job không tồn tại
    /// </summary>
    [Fact]
    public async Task UpdateTagOfJob_throws_when_job_not_found()
    {
        // Arrange: Tạo service với job không tồn tại
        var nonExistentJobId = Guid.NewGuid();
        var dto = new JobTagCreateUpdateDto
        {
            JobId = nonExistentJobId,
            TagIds = new List<int> { 1 }
        };

        var (service, _) = BuildService(new List<Job_Post>(), new List<Tag>(), new List<JobTag>());

        // Act & Assert: Kiểm tra ném exception khi job không tồn tại
        var ex = await Should.ThrowAsync<BusinessException>(() =>
            service.UpdateTagOfJob(dto));

        ex.Message.ShouldContain("Job Not Found");
    }

    // ========== Helper Methods ==========

    /// <summary>
    /// Tạo dữ liệu test cho Job_Post
    /// </summary>
    private static Job_Post CreateJobPost(Guid id, string title)
    {
        var job = new Job_Post
        {
            Title = title,
            Status = JobStatus.Open,
            IsDeleted = false
        };

        typeof(Job_Post)
            .GetProperty("Id")?
            .SetValue(job, id);

        return job;
    }

    /// <summary>
    /// Tạo dữ liệu test cho Tag
    /// </summary>
    private static Tag CreateTag(int id, string name)
    {
        var tag = new Tag
        {
            Name = name
        };

        typeof(Tag)
            .GetProperty("Id")?
            .SetValue(tag, id);

        return tag;
    }

    /// <summary>
    /// Tạo dữ liệu test cho JobTag
    /// </summary>
    private static JobTag CreateJobTag(Guid jobId, int tagId)
    {
        return new JobTag
        {
            JobId = jobId,
            TagId = tagId
        };
    }

    /// <summary>
    /// Tạo service test với các dependency giả (mock)
    /// </summary>
    private static (JobTagService service, IJobTagRepository jobTagRepo) BuildService(
        List<Job_Post>? jobData = null,
        List<Tag>? tagData = null,
        List<JobTag>? jobTagData = null)
    {
        jobData = jobData ?? new List<Job_Post>();
        tagData = tagData ?? new List<Tag>();
        jobTagData = jobTagData ?? new List<JobTag>();

        // Tạo mock repository cho Job_Post
        var jobPostRepo = Substitute.For<IJobPostRepository>();
        jobPostRepo.GetAsync(Arg.Any<Expression<Func<Job_Post, bool>>>())
            .Returns(ci =>
            {
                var predicate = ci.Arg<Expression<Func<Job_Post, bool>>>();
                var compiled = predicate.Compile();
                var job = jobData.FirstOrDefault(compiled);
                if (job == null)
                    throw new EntityNotFoundException();
                return Task.FromResult(job);
            });

        // Tạo mock repository cho Tag
        var tagRepo = Substitute.For<ITagRepository>();
        tagRepo.GetListAsync(Arg.Any<Expression<Func<Tag, bool>>>())
            .Returns(ci =>
            {
                var predicate = ci.Arg<Expression<Func<Tag, bool>>>();
                var compiled = predicate.Compile();
                return Task.FromResult(tagData.Where(compiled).ToList());
            });

        // Tạo mock repository cho JobTag
        var jobTagRepo = Substitute.For<IJobTagRepository>();
        jobTagRepo.GetListAsync(Arg.Any<Expression<Func<JobTag, bool>>>())
            .Returns(ci =>
            {
                var predicate = ci.Arg<Expression<Func<JobTag, bool>>>();
                var compiled = predicate.Compile();
                return Task.FromResult(jobTagData.Where(compiled).ToList());
            });

        jobTagRepo.GetAsync(Arg.Any<Expression<Func<JobTag, bool>>>())
            .Returns(ci =>
            {
                var predicate = ci.Arg<Expression<Func<JobTag, bool>>>();
                var compiled = predicate.Compile();
                var jobTag = jobTagData.FirstOrDefault(compiled);
                if (jobTag == null)
                    throw new EntityNotFoundException();
                return Task.FromResult(jobTag);
            });

        jobTagRepo.InsertManyAsync(Arg.Any<List<JobTag>>(), Arg.Any<bool>())
            .Returns(Task.CompletedTask);

        jobTagRepo.DeleteManyAsync(Arg.Any<List<JobTag>>())
            .Returns(Task.CompletedTask);

        // Tạo service với các dependency giả
        var service = new JobTagService(jobTagRepo, jobPostRepo, tagRepo);

        return (service, jobTagRepo);
    }
}

