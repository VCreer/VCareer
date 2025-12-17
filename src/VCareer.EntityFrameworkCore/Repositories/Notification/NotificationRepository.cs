using System;
using VCareer.EntityFrameworkCore;
using VCareer.IRepositories.Notification;
using VCareer.Models.Notification;
using Volo.Abp.Domain.Repositories.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore;

namespace VCareer.EntityFrameworkCore.Repositories.Notification
{
    public class NotificationRepository : EfCoreRepository<VCareerDbContext, UserNotification, Guid>, INotificationRepository
    {
        public NotificationRepository(IDbContextProvider<VCareerDbContext> dbContextProvider)
            : base(dbContextProvider)
        {
        }
    }
}

