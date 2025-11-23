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
        public decimal OriginalPrice { get; set; }
        public CurrencyType type { get; set; }
        public DateTime EffectiveFrom { get; set; }
        public DateTime EffectiveTo { get; set; }
    }

    public class SubcriptionUpdateDto
    {
        public Guid SubcriptionPriceId { get; set; }
        public int SalePercent { get; set; } = 0;
        public decimal OriginalPrice { get; set; }
        public CurrencyType type { get; set; }
        public DateTime EffectiveTo { get; set; }
    }

    public class SubcriptionPriceViewDto
    {
        public int SalePercent { get; set; } = 0;
        public decimal OriginalPrice { get; set; }
        public CurrencyType type { get; set; }
        public DateTime EffectiveFrom { get; set; }
        public DateTime EffectiveTo { get; set; }
    }
}
