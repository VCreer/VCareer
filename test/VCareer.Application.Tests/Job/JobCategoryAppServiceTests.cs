using NSubstitute;
using Shouldly;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using VCareer.Dto.Category;
using VCareer.IRepositories.Category;
using VCareer.IRepositories.Job;
using VCareer.Models.Job;
using VCareer.Models.JobCategory;
using VCareer.Services.Job;
using Volo.Abp.Domain.Repositories;
using Xunit;

namespace VCareer.Job;

public class JobCategoryAppServiceTests
{
    /// <summary>
    /// Test tạo category thành công khi dữ liệu hợp lệ
    /// </summary>
    [Fact]
    public async Task CreateCategoryAsync_creates_category_successfully()
    {
        // Arrange: Tạo dữ liệu test
        var dto = new CategoryUpdateCreateDto
        {
            Name = "Test Category",
            Slug = "test-category",
            Description = "Test Description",
            IsActive = true,
            SortOrder = 1,
            ParentId = null
        };

        var (service, categoryRepo) = BuildService();

        // Act: Gọi hàm tạo category
        await service.CreateCategoryAsync(dto);

        // Assert: Kiểm tra category đã được tạo với thông tin đúng
        await categoryRepo.Received(1).InsertAsync(
            Arg.Is<Job_Category>(c => 
                c.Name == dto.Name && 
                c.Slug == dto.Slug && 
                c.Description == dto.Description &&
                c.IsActive == dto.IsActive &&
                c.SortOrder == dto.SortOrder &&
                c.ParentId == dto.ParentId),
            Arg.Any<bool>());
    }

    /// <summary>
    /// Test tạo category với parent category thành công
    /// </summary>
    [Fact]
    public async Task CreateCategoryAsync_creates_category_with_parent_successfully()
    {
        // Arrange: Tạo category với parent
        var parentId = Guid.NewGuid();
        var dto = new CategoryUpdateCreateDto
        {
            Name = "Child Category",
            Slug = "child-category",
            Description = "Child Description",
            IsActive = true,
            SortOrder = 2,
            ParentId = parentId
        };

        var (service, categoryRepo) = BuildService();

        // Act: Gọi hàm tạo category
        await service.CreateCategoryAsync(dto);

        // Assert: Kiểm tra category đã được tạo với parentId đúng
        await categoryRepo.Received(1).InsertAsync(
            Arg.Is<Job_Category>(c => c.ParentId == parentId),
            Arg.Any<bool>());
    }

    /// <summary>
    /// Test xóa category thành công khi category tồn tại và không có children
    /// </summary>
    [Fact]
    public async Task DeleteCategoryAsync_deletes_category_successfully()
    {
        // Arrange: Tạo category không có children
        var categoryId = Guid.NewGuid();
        var category = CreateJobCategory(categoryId, "Test Category", null, new List<Job_Category>());
        var (service, categoryRepo) = BuildService(new List<Job_Category> { category });

        // Act: Gọi hàm xóa category
        await service.DeleteCategoryAsync(categoryId);

        // Assert: Kiểm tra category đã được xóa
        await categoryRepo.Received(1).DeleteAsync(
            Arg.Is<Job_Category>(c => c.Id == categoryId),
            Arg.Any<bool>());
    }

    /// <summary>
    /// Test xóa category thất bại khi category không tồn tại
    /// </summary>
    [Fact]
    public async Task DeleteCategoryAsync_throws_when_category_not_found()
    {
        // Arrange: Tạo service với danh sách category rỗng
        var nonExistentCategoryId = Guid.NewGuid();
        var (service, _) = BuildService(new List<Job_Category>());

        // Act & Assert: Kiểm tra ném exception khi category không tồn tại
        var ex = await Should.ThrowAsync<Exception>(() =>
            service.DeleteCategoryAsync(nonExistentCategoryId));

        ex.Message.ShouldContain("Category not found");
    }

    /// <summary>
    /// Test xóa category thất bại khi category có children
    /// </summary>
    [Fact]
    public async Task DeleteCategoryAsync_throws_when_category_has_children()
    {
        // Arrange: Tạo category có children
        var parentId = Guid.NewGuid();
        var childId = Guid.NewGuid();
        var parent = CreateJobCategory(parentId, "Parent Category", null, new List<Job_Category>());
        var child = CreateJobCategory(childId, "Child Category", parentId, new List<Job_Category>());
        parent.Children.Add(child);

        var (service, _) = BuildService(new List<Job_Category> { parent, child });

        // Act & Assert: Kiểm tra ném exception khi category có children
        var ex = await Should.ThrowAsync<Exception>(() =>
            service.DeleteCategoryAsync(parentId));

        ex.Message.ShouldContain("Category has children");
    }

    /// <summary>
    /// Test lấy danh sách category tree thành công khi có dữ liệu
    /// </summary>
    [Fact]
    public async Task GetCategoryTreeAsync_returns_category_tree_successfully()
    {
        // Arrange: Tạo dữ liệu category tree
        var rootCategory = CreateJobCategory(Guid.NewGuid(), "Root Category", null, new List<Job_Category>());
        var (service, _) = BuildService(new List<Job_Category> { rootCategory }, rootCategories: new List<Job_Category> { rootCategory });

        // Act: Gọi hàm lấy category tree
        var result = await service.GetCategoryTreeAsync();

        // Assert: Kiểm tra kết quả không null
        result.ShouldNotBeNull();
    }

    /// <summary>
    /// Test lấy danh sách category tree trả về rỗng khi không có dữ liệu
    /// </summary>
    [Fact]
    public async Task GetCategoryTreeAsync_returns_empty_when_no_categories()
    {
        // Arrange: Tạo service không có category nào
        var (service, _) = BuildService(new List<Job_Category>(), rootCategories: new List<Job_Category>());

        // Act: Gọi hàm lấy category tree
        var result = await service.GetCategoryTreeAsync();

        // Assert: Kiểm tra kết quả là list rỗng
        result.ShouldBeEmpty();
    }

    /// <summary>
    /// Test tìm kiếm category thành công khi có keyword hợp lệ
    /// </summary>
    [Fact]
    public async Task SearchCategoriesAsync_returns_categories_when_keyword_valid()
    {
        // Arrange: Tạo dữ liệu test
        var keyword = "test";
        var (service, _) = BuildService();

        // Act: Gọi hàm tìm kiếm category
        var result = await service.SearchCategoriesAsync(keyword);

        // Assert: Kiểm tra kết quả không null
        result.ShouldNotBeNull();
    }

    /// <summary>
    /// Test tìm kiếm category trả về rỗng khi keyword rỗng
    /// </summary>
    [Fact]
    public async Task SearchCategoriesAsync_returns_empty_when_keyword_empty()
    {
        // Arrange: Tạo service với keyword rỗng
        var (service, _) = BuildService();

        // Act: Gọi hàm tìm kiếm với keyword rỗng
        var result = await service.SearchCategoriesAsync("");

        // Assert: Kiểm tra kết quả là list rỗng
        result.ShouldBeEmpty();
    }

    /// <summary>
    /// Test tìm kiếm category trả về rỗng khi keyword là null
    /// </summary>
    [Fact]
    public async Task SearchCategoriesAsync_returns_empty_when_keyword_null()
    {
        // Arrange: Tạo service với keyword null
        var (service, _) = BuildService();

        // Act: Gọi hàm tìm kiếm với keyword null
        var result = await service.SearchCategoriesAsync(null);

        // Assert: Kiểm tra kết quả là list rỗng
        result.ShouldBeEmpty();
    }

    /// <summary>
    /// Test cập nhật category thành công khi category tồn tại
    /// </summary>
    [Fact]
    public async Task UpdateCategoryAsync_updates_category_successfully()
    {
        // Arrange: Tạo category và dto cập nhật
        var categoryId = Guid.NewGuid();
        var category = CreateJobCategory(categoryId, "Old Name", null, new List<Job_Category>());
        var dto = new CategoryUpdateCreateDto
        {
            Name = "New Name",
            Slug = "new-slug",
            Description = "New Description",
            IsActive = false,
            SortOrder = 5,
            ParentId = null
        };

        var (service, categoryRepo) = BuildService(new List<Job_Category> { category });

        // Act: Gọi hàm cập nhật category
        await service.UpdateCategoryAsync(categoryId, dto);

        // Assert: Kiểm tra category đã được cập nhật
        await categoryRepo.Received(1).UpdateAsync(
            Arg.Is<Job_Category>(c => c.Id == categoryId && c.Name == dto.Name),
            Arg.Any<bool>());
    }

    /// <summary>
    /// Test cập nhật category thất bại khi category không tồn tại
    /// </summary>
    [Fact]
    public async Task UpdateCategoryAsync_throws_when_category_not_found()
    {
        // Arrange: Tạo service với danh sách category rỗng
        var nonExistentCategoryId = Guid.NewGuid();
        var dto = new CategoryUpdateCreateDto { Name = "New Name" };
        var (service, _) = BuildService(new List<Job_Category>());

        // Act & Assert: Kiểm tra ném exception khi category không tồn tại
        var ex = await Should.ThrowAsync<Exception>(() =>
            service.UpdateCategoryAsync(nonExistentCategoryId, dto));

        ex.Message.ShouldContain("Category not found");
    }

    // ========== Helper Methods ==========

    /// <summary>
    /// Tạo dữ liệu test cho Job_Category
    /// </summary>
    private static Job_Category CreateJobCategory(Guid id, string name, Guid? parentId, List<Job_Category> children)
    {
        var category = new Job_Category
        {
            Name = name,
            Slug = name.ToLower().Replace(" ", "-"),
            Description = $"Description for {name}",
            IsActive = true,
            SortOrder = 1,
            ParentId = parentId,
            Children = children
        };

        // Sử dụng reflection để set Id vì nó là protected
        typeof(Job_Category)
            .GetProperty("Id")?
            .SetValue(category, id);

        return category;
    }

    /// <summary>
    /// Tạo service test với các dependency giả (mock)
    /// </summary>
    private static (JobCategoryAppService service, IJobCategoryRepository categoryRepo) BuildService(
        List<Job_Category>? categoryData = null,
        List<Job_Category>? rootCategories = null)
    {
        categoryData = categoryData ?? new List<Job_Category>();
        rootCategories = rootCategories ?? new List<Job_Category>();

        // Tạo mock repository cho Job_Category
        var categoryRepo = Substitute.For<IJobCategoryRepository>();
        
        // Mock FindAsync
        categoryRepo.FindAsync(Arg.Any<Guid>())
            .Returns(ci =>
            {
                var id = ci.Arg<Guid>();
                var category = categoryData.FirstOrDefault(c => c.Id == id);
                return Task.FromResult(category);
            });

        // Mock InsertAsync
        categoryRepo.InsertAsync(Arg.Any<Job_Category>(), Arg.Any<bool>())
            .Returns(ci => Task.FromResult(ci.Arg<Job_Category>()));

        // Mock DeleteAsync
        categoryRepo.DeleteAsync(Arg.Any<Job_Category>(), Arg.Any<bool>())
            .Returns(Task.CompletedTask);

        // Mock UpdateAsync
        categoryRepo.UpdateAsync(Arg.Any<Job_Category>(), Arg.Any<bool>())
            .Returns(ci => Task.FromResult(ci.Arg<Job_Category>()));

        // Mock GetFullCategoryTreeAsync
        categoryRepo.GetFullCategoryTreeAsync()
            .Returns(Task.FromResult(rootCategories));

        // Tạo mock repository cho Job_Post
        var jobPostRepo = Substitute.For<IJobPostRepository>();

        // Tạo service với các dependency giả
        var service = new JobCategoryAppService(categoryRepo, jobPostRepo);

        return (service, categoryRepo);
    }
}

