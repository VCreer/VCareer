using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VCareer.Dto.FileDto
{
    public class FileStreamResultDto
    {
        public Stream Data { get; set; }
        public string MimeType { get; set; }
        public string FileName { get; set; }
    }
}
