using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static VCareer.Constants.JobConstant.SubcriptionContance;

namespace VCareer.Dto.Subcriptions
{
    public class SubcriptionPriceCreateDto
    {
        public Guid SubcriptionServiceId { get; set; }
        public int SalePercent { get; set; } = 0;
        public DateTime EffectiveFrom { get; set; }
        public DateTime EffectiveTo { get; set; }
    }

    public class SubcriptionPriceUpdateDto
    {
        public Guid SubcriptionPriceId { get; set; }
        public Guid SubcriptionServiceId { get; set; }
        public int SalePercent { get; set; } = 0;
        public DateTime EffectiveFrom { get; set; }
        public DateTime EffectiveTo { get; set; }
    }

    public class SubcriptionPriceViewDto
    {
        public Guid SubcriptionServiceId { get; set; }
        public decimal OriginalPrice { get; set; }
        public int SalePercent { get; set; } = 0;
        public CurrencyType type { get; set; } = CurrencyType.VND;
        public bool IsExpried { get; set; }
        public bool IsActive { get; set; } = true;// dung de tat mo price trong truong hop dot xuat
        public DateTime EffectiveFrom { get; set; }
        public DateTime EffectiveTo { get; set; }
    }
}
