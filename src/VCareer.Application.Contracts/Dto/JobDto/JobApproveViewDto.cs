using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants.JobConstant;

namespace VCareer.Dto.JobDto
{
    public class JobApproveViewDto
    {
        public RiskJobLevel RiskJobLevel { get; set; } = RiskJobLevel.NonCalculated;
        public string? CompanyImageUrl { get; set; }
        public int CompanyId { get; set; }
        public string? CompanyName { get; set; }
        public string Title { get; set; }
        public string JobId { get; }
        public DateTime? ExpiresAt { get; set; }
        public int ProvinceCode { get; set; } // code thanh pho
    }
}
