using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static VCareer.Constants.JobConstant.SubcriptionContance;

namespace VCareer.Dto.Subcriptions
{
    public class User_SubcirptionCreateDto
    {
        public Guid UserId { get; set; }
        public Guid SubcriptionServiceId { get; set; }
        public DateTime? EndDate { get; set; }
        public SubcriptionStatus status { get; set; }

    }
    public class User_SubcirptionUpdateDto
    {
        public DateTime? EndDate { get; set; }
        public SubcriptionStatus status { get; set; }

    }

    public class User_SubcirptionViewDto
    {
        public Guid UserId { get; set; }
        public Guid SubcriptionServiceId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public SubcriptionStatus status { get; set; }
    }
}
