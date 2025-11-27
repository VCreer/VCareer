using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VCareer.Dto.JobDto
{
    public class JobTagViewDto
    {
        public Guid JobId { get; set; }
        public int TagId { get; set; }

        public class JobTagCreateUpdateDto
        {
            public Guid JobId { get; set; }
            public List<int> TagIds { get; set; } = new List<int>();
        }
    }
}
