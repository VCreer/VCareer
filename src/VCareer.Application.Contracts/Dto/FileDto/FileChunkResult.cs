using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VCareer.Dto.FileDto
{
    public class FileChunkResult
    {
        public bool IsCompleted { get; set; }
        public string Message { get; set; }
        public string StorageName { get; set; }
    }
}
