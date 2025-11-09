using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Dto.FileDto;
using Volo.Abp.Application.Services;

namespace VCareer.IServices.IFileServices
{
    public interface IFileServices :IApplicationService
    {
        Task<Guid> UploadAsync(UploadFileDto input); // Return FileDescriptor Id after upload
    /*    Task<FileDescriptorDto> DownloadAsync(string storageName);*/
        public Task HardDeleteAsync(string fileId);
        public Task SoftDeleteAsync(string fileId);
        Task<FileDescriptorDto> GetMetadataAsync(string storageName);
        Task<FileChunkResult> UploadChunkAsync(FileChunkInput input);
        
    }
}
