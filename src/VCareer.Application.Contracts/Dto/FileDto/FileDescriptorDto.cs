using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VCareer.Dto.FileDto
{
    public class FileDescriptorDto
    {
        public Guid Id { get; set; }
        public string CreatorId { get; set; }
        public string StorageName { get; set; }
        public string OriginalName { get; set; }
        public string Extension { get; set; }
        public long Size { get; set; }
        public string MimeType { get; set; }
        public string ContainerName { get; set; }
        public string StoragePath { get; set; }
        public int Status { get; set; }
        public DateTime UploadTime { get; set; }
    }

}
