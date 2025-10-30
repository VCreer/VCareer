using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants;
using VCareer.Dto.FileDto;
using VCareer.Files.BlobContainers;
using VCareer.IServices.IFileServices;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.BlobStoring;

namespace VCareer.Services.FileServices
{
    public class FileServices : ApplicationService, IFileServices
    {
        private readonly IFileSecurityServices _fileSecurityServices;
        private readonly IBlobContainerFactory _blobFactory;
        private readonly FilePoliciesServices _filePoliciesServices;

        public FileServices(IFileSecurityServices fileSecurityServices, IBlobContainer<BlobContainer> blobContainer, FilePoliciesServices filePoliciesServices, IBlobContainerFactory blobFactory)
        {
            _fileSecurityServices = fileSecurityServices;
            _blobFactory = blobFactory;
            _filePoliciesServices = filePoliciesServices;
        }
        public Task DeleteAsync(string storageName, Guid userId)
        {
            throw new NotImplementedException();
        }

        public Task<FileDescriptorDto> DownloadAsync(string storageName)
        {
            throw new NotImplementedException();
        }

        public Task<FileDescriptorDto> GetMetadataAsync(string storageName)
        {
            throw new NotImplementedException();
        }

        public async Task UploadAsync(UploadFileDto input)
        {
            FileDescriptorDto fileDescriptor = await CheckValidationAsync(input);
            await StorageLocalAsync(fileDescriptor, input.File);
            await StorageDataBaseAsync(fileDescriptor);
        }


        //xử lý file 
        private async Task<FileDescriptorDto> CheckValidationAsync(UploadFileDto input)
        {
            var stream = input.File.OpenReadStream();
            var sizeAllow = _filePoliciesServices.GetMaxFileSizeMb(input.ContainerType);


            if (input.File == null) throw new UserFriendlyException("File is null");
            if (input.UserId == null) throw new ArgumentNullException("UserId is null");
            if (input.ContainerType == null) throw new ArgumentNullException("ContainerType is null");

            if (!_fileSecurityServices.ValidateExtension(input.File.FileName, input.ContainerType)) throw new UserFriendlyException("File extension is not allowed");
            if (!_fileSecurityServices.ValidateSize(input.File.Length, input.ContainerType)) throw new UserFriendlyException($"File Size must be smaller than {sizeAllow}");
            //ở hàm này có thể ghi log vì đây là trường hợp giả mạo nếu invalid 
            if (!await _fileSecurityServices.ValidateMimeAndMagicAsync(stream, input.ContainerType)) throw new UserFriendlyException("FIle invalid!!");

            stream.Seek(0, SeekOrigin.Begin); // reset lại vị trí con trỏ về đầu stream sau khi đã đọc để kiểm tra mime và magic
            var safeName = _fileSecurityServices.GenerateSafeStorageName(input.UserId.ToString(), input.File.FileName);
            var containerName = _filePoliciesServices.GetContainerName(input.ContainerType);
            var stogarePath = _filePoliciesServices.GetStoragePath(input.ContainerType, containerName) + "/" + safeName;

            return new FileDescriptorDto
            {
                StorageName = safeName,
                MimeType = input.File.ContentType,
                OriginalName = input.File.FileName,
                OwnerId = input.UserId.ToString(),
                Extension = Path.GetExtension(input.File.FileName),
                ContainerName = containerName,
                Size = input.File.Length,
                Status = FileStatus.Active,
                StoragePath = stogarePath,
                UploadTime = DateTime.UtcNow

            };

        }


        //lưu file upload vào blob local
        private async Task StorageLocalAsync(FileDescriptorDto input, IFormFile file)
        {
            try
            {
                var container = _blobFactory.Create(input.ContainerName);
                using (var stream = file.OpenReadStream())
                {
                    await container.SaveAsync(input.StorageName, stream, true);
                }
            }
            catch (Exception ex)
            {
                throw new BusinessException("Error while saving file to storage", ex.ToString());
            }
        }
        //lưu file upload vào database
        private async Task StorageDataBaseAsync(FileDescriptorDto input) { 
        
        }



        public Task<FileChunkResult> UploadChunkAsync(FileChunkInput input)
        {
            throw new NotImplementedException();
        }

       }
}
