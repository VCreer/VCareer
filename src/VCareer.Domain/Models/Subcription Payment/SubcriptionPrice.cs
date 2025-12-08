using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Models.Subcription;
using Volo.Abp.Domain.Entities.Auditing;
using static VCareer.Constants.JobConstant.SubcriptionContance;

namespace VCareer.Models.Subcription_Payment
{
    public class SubcriptionPrice : FullAuditedAggregateRoot<Guid>
    {
        public Guid SubcriptionServiceId { get; set; }
        public decimal OriginalPrice { get; set; }
        public int SalePercent { get; set; } = 0;
        public CurrencyType type { get; set; } = CurrencyType.VND;
        public bool IsExpried { get; set; }
        public bool IsActive { get; set; } = true;// dung de tat mo price trong truong hop dot xuat
        public DateTime EffectiveFrom { get; set; }
        public DateTime EffectiveTo { get; set; }

        public virtual SubcriptionService SubcriptionService { get; set; }
    }
}
