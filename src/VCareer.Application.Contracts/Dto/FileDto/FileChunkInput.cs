using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VCareer.Dto.FileDto
{
    public class FileChunkInput
    {
        public Guid UploadId { get; set; }       // ID duy nhất cho tiến trình upload
        public int ChunkIndex { get; set; }      // Thứ tự chunk (0-based)
        public int TotalChunks { get; set; }     // Tổng số chunk
        public IFormFile Chunk { get; set; }     // Dữ liệu chunk
        public string OriginalFileName { get; set; }
        public Guid UserId { get; set; }
    }
}
