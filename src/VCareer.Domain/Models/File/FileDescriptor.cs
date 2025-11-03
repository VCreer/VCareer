using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Volo.Abp.Domain.Entities;

namespace VCareer.Models.FileMetadata
{
    public class FileDescriptor : Entity<Guid>
    {
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
