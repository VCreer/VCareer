using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Volo.Abp.Domain.Entities.Auditing;
using static VCareer.Constants.SubcriptionServiceConstant.SubcriptionServicesConstant;

namespace VCareer.Models.SubcriptionService
{
    public class SubcriptionService : FullAuditedAggregateRoot<Guid>
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public SubcriptorTarget Target { get; set; }
        public decimal Price { get; set; }
        public int PercentSale { get; set; } = 0;
        public bool IsLimited { get; set; } // giới hạn số lượng mua trong 1 khonảg thời gian của toàn bộ người dùng
        public bool IsBuyLimited { get; set; } // giới hạn số lượng mua của mỗi cá nhân

        public int Quantity { get; set; }
        public bool IsActive { get; set; }
        ICollection<ChildService> ChildServices { get; set; } = new List<ChildService>();

    }
}
