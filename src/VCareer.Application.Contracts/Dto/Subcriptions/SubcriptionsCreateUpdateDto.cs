using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static VCareer.Constants.JobConstant.SubcriptionContance;

namespace VCareer.Dto.Subcriptions
{
    public class SubcriptionsCreateDto
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public SubcriptorTarget Target { get; set; }
        public SubcriptionStatus Status { get; set; }
        public decimal OriginalPrice { get; set; } // giá gốc , sau thêm giá thì chỉnh percent sale ơ bang price
        public bool IsLimited { get; set; } = true; // giới hạn số lượng mua trong 1 khonảg thời gian của toàn bộ người dùng
        public bool IsBuyLimited { get; set; } = false; // giới hạn số lượng mua của mỗi cá nhân
        public int TotalBuyEachUser { get; set; } // số lượng tối đa mua của mỗi cá nhân
        public bool IsLifeTime { get; set; }
        public int? DayDuration { get; set; }
        public bool IsActive { get; set; } = false;
    }

    public class SubcriptionsUpdateDto
    {
        public Guid SubcriptionId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public bool IsActive { get; set; } = true;
        public int? DayDuration { get; set; }
    }

    public class SubcriptionsViewDto
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public SubcriptorTarget Target { get; set; }
        public SubcriptionStatus Status { get; set; }
        public bool IsLimited { get; set; } = true; // giới hạn số lượng mua trong 1 khonảg thời gian của toàn bộ người dùng
        public bool IsBuyLimited { get; set; } = false; // giới hạn số lượng mua của mỗi cá nhân
        public int TotalBuyEachUser { get; set; } // số lượng tối đa mua của mỗi cá nhân
        public bool IsActive { get; set; } = false;
    }
}
