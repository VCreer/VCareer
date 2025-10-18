using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants.FileConstant;

namespace VCareer.Dto.FileDto
{
    public class UploadFileDto
    {
        public FileTypes Type{ get; set; }
        public float Size { get; set; }
        public string Name { get; set; }
    }
}
