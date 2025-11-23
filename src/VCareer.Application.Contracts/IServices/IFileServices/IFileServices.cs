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
        Task<Guid> UploadAsync(UploadFileDto input);
        Task<FileStreamResultDto> DownloadAsync(string fileOriginName, string containerName, DateTime uploadTime);
        public Task HardDeleteAsync(string fileId);
        public Task SoftDeleteAsync(string fileId);
        public Task<List<FileDescriptorDto>> GetListFileByContainer(string containerName);// ví dụ như  Candidate, Employee
        public Task<List<FileDescriptorDto>> GetListFileByContainerType(string containerType);//cv,avatar..vv 
     /*   Task<FileChunkResult> UploadChunkAsync(FileChunkInput input);*/
        
    }
}
