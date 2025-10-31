using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VCareer.Dto.FileDto
{
    public class UploadFileDto
    {
        public IFormFile File { get; set; }
        public string ContainerType { get; set; } // Ví dụ: Avatar, Resume, Document
        public string UserId { get; set; } // ID của người dùng tải lên
    }
}
