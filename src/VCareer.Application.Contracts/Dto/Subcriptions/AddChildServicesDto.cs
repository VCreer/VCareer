using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VCareer.Dto.Subcriptions
{
    public class AddChildServicesDto
    {
        public List<Guid> ChildServiceIds { get; set; }
        public Guid SubcriptionId { get; set; }

    }
}
