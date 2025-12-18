using System;
using VCareer.Models.Notification;
using Volo.Abp.Domain.Repositories;

namespace VCareer.IRepositories.Notification
{
    public interface INotificationRepository : IRepository<UserNotification, Guid>
    {
    }
}

