using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants.JobConstant;

namespace VCareer.Dto.JobDto
{
    public class JobFilterDto
    {
        public JobPriorityLevel? PriorityLevel { get; set; } = null;
        public RecruiterLevel? RecruiterLevel { get; set; } = null;
        public RiskJobLevel? RiskJobLevel { get; set; } = null;
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;

    }
}
