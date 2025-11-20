using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VCareer.IServices.Common
{
    public class PagingDto
    {
        public int PageSize { get; set; } = 10;
        public int PageIndex { get; set; } = 1;
    }

}
