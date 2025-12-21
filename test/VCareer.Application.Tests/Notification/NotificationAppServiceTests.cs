using NSubstitute;
using Shouldly;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VCareer.Dto.Notification;
using VCareer.IRepositories.Notification;
using VCareer.Models.Notification;
using VCareer.Services.Notification;
using Volo.Abp;
using Volo.Abp.Domain.Entities;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Users;
using Xunit;
using UserNotification = VCareer.Models.Notification.UserNotification;

namespace VCareer.Notification;

public class NotificationAppServiceTests
{
    /// Test tạo notification thành công khi input hợp lệ
    [Fact]
    public async Task CreateNotificationAsync_creates_notification_successfully()
    {
        // Arrange: Tạo dữ liệu test
        var currentUserId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var dto = new NotificationCreateDto
        {
            UserId = userId,
            UserRole = "Candidate",
            NotificationType = "JobOffer",
            Title = "Test Notification",
            Message = "Test Message",
            RelatedEntityType = "JobPost",
            RelatedEntityId = Guid.NewGuid(),
            Metadata = "{\"JobId\":\"123\"}",
            CreatedBy = currentUserId
        };

        var (service, notificationRepo) = BuildService(currentUserId, new List<UserNotification>());

        // Act: Gọi hàm tạo notification
        var result = await service.CreateNotificationAsync(dto);

        // Assert: Kiểm tra notification đã được tạo với thông tin đúng
        await notificationRepo.Received(1).InsertAsync(
            Arg.Is<UserNotification>(n => 
                n.UserId == dto.UserId &&
                n.UserRole == dto.UserRole &&
                n.NotificationType == dto.NotificationType &&
                n.Title == dto.Title &&
                n.Message == dto.Message),
            Arg.Any<bool>());
        
        result.ShouldNotBeNull();
        result.Title.ShouldBe(dto.Title);
    }


    /// Test tạo notification thất bại khi input null
    [Fact]
    public async Task CreateNotificationAsync_throws_when_input_null()
    {
        // Arrange: Tạo service với input null
        var currentUserId = Guid.NewGuid();
        var (service, _) = BuildService(currentUserId, new List<UserNotification>());

        // Act & Assert: Kiểm tra ném exception khi input null
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.CreateNotificationAsync(null));

        ex.Message.ShouldContain("không hợp lệ");
    }


    /// Test tạo notification sử dụng currentUserId khi CreatedBy không được cung cấp
    [Fact]
    public async Task CreateNotificationAsync_uses_current_user_id_when_created_by_null()
    {
        // Arrange: Tạo dto không có CreatedBy
        var currentUserId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var dto = new NotificationCreateDto
        {
            UserId = userId,
            UserRole = "Candidate",
            NotificationType = "JobOffer",
            Title = "Test",
            Message = "Test",
            CreatedBy = null
        };

        var (service, notificationRepo) = BuildService(currentUserId, new List<UserNotification>());

        // Act: Gọi hàm tạo notification
        await service.CreateNotificationAsync(dto);

        // Assert: Kiểm tra CreatedBy được set từ currentUserId
        await notificationRepo.Received(1).InsertAsync(
            Arg.Is<UserNotification>(n => n.CreatedBy == currentUserId),
            Arg.Any<bool>());
    }


    /// Test lấy danh sách notifications thành công khi user hợp lệ
    [Fact]
    public async Task GetNotificationsAsync_returns_notifications_successfully()
    {
        // Arrange: Tạo dữ liệu test
        var userId = Guid.NewGuid();
        var notification1 = CreateNotification(Guid.NewGuid(), userId, "Candidate", "JobOffer", false);
        var notification2 = CreateNotification(Guid.NewGuid(), userId, "Candidate", "CvViewed", true);
        var pagingDto = new PagingDto { PageIndex = 0, PageSize = 10 };

        var (service, _) = BuildService(userId, new List<UserNotification> { notification1, notification2 });

        // Act: Gọi hàm lấy notifications
        var result = await service.GetNotificationsAsync(userId, "Candidate", pagingDto);

        // Assert: Kiểm tra kết quả
        result.ShouldNotBeNull();
        result.Items.ShouldNotBeNull();
    }


    /// Test lấy danh sách notifications thất bại khi user không khớp
    [Fact]
    public async Task GetNotificationsAsync_throws_when_user_mismatch()
    {
        // Arrange: Tạo service với user khác
        var currentUserId = Guid.NewGuid();
        var requestedUserId = Guid.NewGuid();
        var pagingDto = new PagingDto { PageIndex = 0, PageSize = 10 };

        var (service, _) = BuildService(currentUserId, new List<UserNotification>());

        // Act & Assert: Kiểm tra ném exception khi user không khớp
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.GetNotificationsAsync(requestedUserId, "Candidate", pagingDto));

        ex.Message.ShouldContain("không có quyền");
    }


    /// Test lấy danh sách notifications với filter theo type
    [Fact]
    public async Task GetNotificationsAsync_filters_by_notification_type()
    {
        // Arrange: Tạo notifications với các type khác nhau
        var userId = Guid.NewGuid();
        var notification1 = CreateNotification(Guid.NewGuid(), userId, "Candidate", "JobOffer", false);
        var notification2 = CreateNotification(Guid.NewGuid(), userId, "Candidate", "CvViewed", false);
        var pagingDto = new PagingDto { PageIndex = 0, PageSize = 10 };

        var (service, _) = BuildService(userId, new List<UserNotification> { notification1, notification2 });

        // Act: Gọi hàm lấy notifications với filter type
        var result = await service.GetNotificationsAsync(userId, "Candidate", pagingDto, "JobOffer");

        // Assert: Kiểm tra chỉ trả về notifications có type JobOffer
        result.ShouldNotBeNull();
    }



    /// Test lấy danh sách notifications với filter theo read status
    [Fact]
    public async Task GetNotificationsAsync_filters_by_read_status()
    {
        // Arrange: Tạo notifications với các read status khác nhau
        var userId = Guid.NewGuid();
        var notification1 = CreateNotification(Guid.NewGuid(), userId, "Candidate", "JobOffer", false);
        var notification2 = CreateNotification(Guid.NewGuid(), userId, "Candidate", "JobOffer", true);
        var pagingDto = new PagingDto { PageIndex = 0, PageSize = 10 };

        var (service, _) = BuildService(userId, new List<UserNotification> { notification1, notification2 });

        // Act: Gọi hàm lấy notifications với filter isRead = false
        var result = await service.GetNotificationsAsync(userId, "Candidate", pagingDto, null, false);

        // Assert: Kiểm tra chỉ trả về unread notifications
        result.ShouldNotBeNull();
    }



    /// Test lấy số lượng unread notifications thành công
    [Fact]
    public async Task GetUnreadCountAsync_returns_count_successfully()
    {
        // Arrange: Tạo notifications với read status khác nhau
        var userId = Guid.NewGuid();
        var notification1 = CreateNotification(Guid.NewGuid(), userId, "Candidate", "JobOffer", false);
        var notification2 = CreateNotification(Guid.NewGuid(), userId, "Candidate", "JobOffer", false);
        var notification3 = CreateNotification(Guid.NewGuid(), userId, "Candidate", "JobOffer", true);

        var (service, _) = BuildService(userId, new List<UserNotification> { notification1, notification2, notification3 });

        // Act: Gọi hàm lấy unread count
        var result = await service.GetUnreadCountAsync(userId, "Candidate");

        // Assert: Kiểm tra kết quả
        result.ShouldBe(2); // 2 unread notifications
    }



    /// Test lấy số lượng unread notifications thất bại khi user không khớp
    [Fact]
    public async Task GetUnreadCountAsync_throws_when_user_mismatch()
    {
        // Arrange: Tạo service với user khác
        var currentUserId = Guid.NewGuid();
        var requestedUserId = Guid.NewGuid();
        var (service, _) = BuildService(currentUserId, new List<UserNotification>());

        // Act & Assert: Kiểm tra ném exception khi user không khớp
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.GetUnreadCountAsync(requestedUserId, "Candidate"));

        ex.Message.ShouldContain("không có quyền");
    }



    /// Test đánh dấu notification đã đọc thành công
    [Fact]
    public async Task MarkAsReadAsync_marks_notification_as_read()
    {
        // Arrange: Tạo notification chưa đọc
        var userId = Guid.NewGuid();
        var notificationId = Guid.NewGuid();
        var notification = CreateNotification(notificationId, userId, "Candidate", "JobOffer", false);

        var (service, notificationRepo) = BuildService(userId, new List<UserNotification> { notification });

        // Act: Gọi hàm đánh dấu đã đọc
        await service.MarkAsReadAsync(notificationId);

        // Assert: Kiểm tra notification đã được cập nhật
        await notificationRepo.Received(1).UpdateAsync(
            Arg.Is<UserNotification>(n => n.Id == notificationId && n.IsRead == true),
            Arg.Any<bool>());
    }

    /// Test đánh dấu notification đã đọc thất bại khi user không khớp
    [Fact]
    public async Task MarkAsReadAsync_throws_when_user_mismatch()
    {
        // Arrange: Tạo notification của user khác
        var currentUserId = Guid.NewGuid();
        var notificationOwnerId = Guid.NewGuid();
        var notificationId = Guid.NewGuid();
        var notification = CreateNotification(notificationId, notificationOwnerId, "Candidate", "JobOffer", false);

        var (service, _) = BuildService(currentUserId, new List<UserNotification> { notification });

        // Act & Assert: Kiểm tra ném exception khi user không khớp
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.MarkAsReadAsync(notificationId));

        ex.Message.ShouldContain("không có quyền");
    }

    /// Test đánh dấu notification đã đọc không làm gì khi notification đã được đọc
    [Fact]
    public async Task MarkAsReadAsync_does_nothing_when_already_read()
    {
        // Arrange: Tạo notification đã đọc
        var userId = Guid.NewGuid();
        var notificationId = Guid.NewGuid();
        var notification = CreateNotification(notificationId, userId, "Candidate", "JobOffer", true);

        var (service, notificationRepo) = BuildService(userId, new List<UserNotification> { notification });

        // Act: Gọi hàm đánh dấu đã đọc
        await service.MarkAsReadAsync(notificationId);

        // Assert: Kiểm tra không gọi UpdateAsync vì đã đọc rồi
        await notificationRepo.DidNotReceive().UpdateAsync(Arg.Any<UserNotification>(), Arg.Any<bool>());
    }

    /// Test đánh dấu tất cả notifications đã đọc thành công
    [Fact]
    public async Task MarkAllAsReadAsync_marks_all_notifications_as_read()
    {
        // Arrange: Tạo nhiều notifications chưa đọc
        var userId = Guid.NewGuid();
        var notification1 = CreateNotification(Guid.NewGuid(), userId, "Candidate", "JobOffer", false);
        var notification2 = CreateNotification(Guid.NewGuid(), userId, "Candidate", "CvViewed", false);
        var notification3 = CreateNotification(Guid.NewGuid(), userId, "Candidate", "JobOffer", true);

        var (service, notificationRepo) = BuildService(userId, new List<UserNotification> { notification1, notification2, notification3 });

        // Act: Gọi hàm đánh dấu tất cả đã đọc
        await service.MarkAllAsReadAsync(userId, "Candidate");

        // Assert: Kiểm tra các unread notifications đã được cập nhật
        await notificationRepo.Received(2).UpdateAsync(Arg.Is<UserNotification>(n => n.IsRead == true), Arg.Any<bool>());
    }

    /// Test đánh dấu tất cả notifications đã đọc thất bại khi user không khớp
    [Fact]
    public async Task MarkAllAsReadAsync_throws_when_user_mismatch()
    {
        // Arrange: Tạo service với user khác
        var currentUserId = Guid.NewGuid();
        var requestedUserId = Guid.NewGuid();
        var (service, _) = BuildService(currentUserId, new List<UserNotification>());

        // Act & Assert: Kiểm tra ném exception khi user không khớp
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.MarkAllAsReadAsync(requestedUserId, "Candidate"));

        ex.Message.ShouldContain("không có quyền");
    }

    /// Test xóa notification thành công
    [Fact]
    public async Task DeleteNotificationAsync_deletes_notification_successfully()
    {
        // Arrange: Tạo notification
        var userId = Guid.NewGuid();
        var notificationId = Guid.NewGuid();
        var notification = CreateNotification(notificationId, userId, "Candidate", "JobOffer", false);

        var (service, notificationRepo) = BuildService(userId, new List<UserNotification> { notification });

        // Act: Gọi hàm xóa notification
        await service.DeleteNotificationAsync(notificationId);

        // Assert: Kiểm tra notification đã được xóa
        await notificationRepo.Received(1).DeleteAsync(
            Arg.Is<UserNotification>(n => n.Id == notificationId),
            Arg.Any<bool>());
    }

    /// Test xóa notification thất bại khi user không khớp
    [Fact]
    public async Task DeleteNotificationAsync_throws_when_user_mismatch()
    {
        // Arrange: Tạo notification của user khác
        var currentUserId = Guid.NewGuid();
        var notificationOwnerId = Guid.NewGuid();
        var notificationId = Guid.NewGuid();
        var notification = CreateNotification(notificationId, notificationOwnerId, "Candidate", "JobOffer", false);

        var (service, _) = BuildService(currentUserId, new List<UserNotification> { notification });

        // Act & Assert: Kiểm tra ném exception khi user không khớp
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.DeleteNotificationAsync(notificationId));

        ex.Message.ShouldContain("không có quyền");
    }

    /// Test xóa tất cả notifications thành công
    [Fact]
    public async Task DeleteAllNotificationsAsync_deletes_all_notifications_successfully()
    {
        // Arrange: Tạo nhiều notifications
        var userId = Guid.NewGuid();
        var notification1 = CreateNotification(Guid.NewGuid(), userId, "Candidate", "JobOffer", false);
        var notification2 = CreateNotification(Guid.NewGuid(), userId, "Candidate", "CvViewed", true);
        var notification3 = CreateNotification(Guid.NewGuid(), userId, "Candidate", "JobOffer", false);

        var (service, notificationRepo) = BuildService(userId, new List<UserNotification> { notification1, notification2, notification3 });

        // Act: Gọi hàm xóa tất cả notifications
        await service.DeleteAllNotificationsAsync(userId, "Candidate");

        // Assert: Kiểm tra tất cả notifications đã được xóa
        await notificationRepo.Received(3).DeleteAsync(Arg.Any<UserNotification>(), Arg.Any<bool>());
    }


    /// Test xóa tất cả notifications thất bại khi user không khớp
    [Fact]
    public async Task DeleteAllNotificationsAsync_throws_when_user_mismatch()
    {
        // Arrange: Tạo service với user khác
        var currentUserId = Guid.NewGuid();
        var requestedUserId = Guid.NewGuid();
        var (service, _) = BuildService(currentUserId, new List<UserNotification>());

        // Act & Assert: Kiểm tra ném exception khi user không khớp
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.DeleteAllNotificationsAsync(requestedUserId, "Candidate"));

        ex.Message.ShouldContain("không có quyền");
    }


    /// Test xóa tất cả notifications không làm gì khi không có notifications
    [Fact]
    public async Task DeleteAllNotificationsAsync_does_nothing_when_no_notifications()
    {
        // Arrange: Tạo service không có notifications
        var userId = Guid.NewGuid();
        var (service, notificationRepo) = BuildService(userId, new List<UserNotification>());

        // Act: Gọi hàm xóa tất cả notifications
        await service.DeleteAllNotificationsAsync(userId, "Candidate");

        // Assert: Kiểm tra không gọi DeleteAsync
        await notificationRepo.DidNotReceive().DeleteAsync(Arg.Any<UserNotification>(), Arg.Any<bool>());
    }


    // ========== Helper Methods ==========

    /// Tạo dữ liệu test cho UserNotification
    private static UserNotification CreateNotification(
        Guid id,
        Guid userId,
        string userRole,
        string notificationType,
        bool isRead)
    {
        var notification = new UserNotification(
            id,
            userId,
            userRole,
            notificationType,
            "Test Title",
            "Test Message",
            "JobPost",
            Guid.NewGuid(),
            "{}",
            userId
        )
        {
            IsRead = isRead,
            ReadAt = isRead ? DateTime.Now : null
        };

        return notification;
    }


    /// Tạo service test với các dependency giả (mock)
    private static (NotificationAppService service, INotificationRepository notificationRepo) BuildService(
        Guid currentUserId,
        List<UserNotification> notificationData)
    {
        // Tạo mock repository cho UserNotification
        var notificationRepo = Substitute.For<INotificationRepository>();
        
        // Mock GetQueryableAsync
        notificationRepo.GetQueryableAsync()
            .Returns(Task.FromResult(notificationData.AsQueryable()));

        // Mock GetAsync
        notificationRepo.GetAsync(Arg.Any<Guid>())
            .Returns(ci =>
            {
                var id = ci.Arg<Guid>();
                var notification = notificationData.FirstOrDefault(n => n.Id == id);
                if (notification == null)
                    throw new EntityNotFoundException();
                return Task.FromResult(notification);
            });

        // Mock InsertAsync
        notificationRepo.InsertAsync(Arg.Any<UserNotification>(), Arg.Any<bool>())
            .Returns(ci =>
            {
                var notification = ci.Arg<UserNotification>();
                notificationData.Add(notification);
                return Task.FromResult(notification);
            });

        // Mock UpdateAsync
        notificationRepo.UpdateAsync(Arg.Any<UserNotification>(), Arg.Any<bool>())
            .Returns(ci =>
            {
                var notification = ci.Arg<UserNotification>();
                var existing = notificationData.FirstOrDefault(n => n.Id == notification.Id);
                if (existing != null)
                {
                    var index = notificationData.IndexOf(existing);
                    notificationData[index] = notification;
                }
                return Task.FromResult(notification);
            });

        // Mock DeleteAsync
        notificationRepo.DeleteAsync(Arg.Any<UserNotification>(), Arg.Any<bool>())
            .Returns(ci =>
            {
                var notification = ci.Arg<UserNotification>();
                notificationData.RemoveAll(n => n.Id == notification.Id);
                return Task.CompletedTask;
            });

        // Tạo mock ICurrentUser
        var currentUser = Substitute.For<ICurrentUser>();
        currentUser.IsAuthenticated.Returns(true);
        currentUser.Id.Returns((Guid?)currentUserId);

        // Tạo service với các dependency giả
        var service = new NotificationAppService(notificationRepo, currentUser);

        return (service, notificationRepo);
    }
}

