using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VCareer.Dto.Category
{
    public class TagUpdateDto
    {
        public int TagId { get; set; }
        public string newName { get; set; }
    }

    public class TagCreateDto
    {
        public List<string> Names{ get; set; }
        public Guid CategoryId { get; set; }
    }

    public class TagJobCreateDto 
    {
        public List<int> TagIds { get; set; }
        public Guid JobId { get; set; }
    }
}
