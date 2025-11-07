using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants;
using VCareer.Dto.FileDto;
using VCareer.Files.BlobContainers;
using VCareer.IRepositories.IFileRepository;
using VCareer.IServices.IFileServices;
using VCareer.Models.FileMetadata;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.AuditLogging;
using Volo.Abp.BlobStoring;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.ObjectMapping;
using Volo.Abp.Uow;

namespace VCareer.Services.FileServices
{
    [RemoteService(false)] // trnáh tạo api động vì các service này ko liên quan nghiệp vụ, chỉ tương tác file
    public class FileServices : ApplicationService, IFileServices
    {
        private readonly IFileSecurityServices _fileSecurityServices;
        private readonly IBlobContainerFactory _blobFactory;
        private readonly FilePoliciesServices _filePoliciesServices;
        private readonly IFileDescriptorRepository _fileDescriptorRepository;

        public FileServices(IFileSecurityServices fileSecurityServices, IBlobContainer<BlobContainer> blobContainer, FilePoliciesServices filePoliciesServices, IBlobContainerFactory blobFactory, IFileDescriptorRepository fileDescriptorRepository)
        {
            _fileSecurityServices = fileSecurityServices;
            _blobFactory = blobFactory;
            _filePoliciesServices = filePoliciesServices;
            _fileDescriptorRepository = fileDescriptorRepository;
        }
        [UnitOfWork(IsDisabled = true)]
        public async Task HardDeleteAsync(string fileId)
        {
            var file = await _fileDescriptorRepository.FirstOrDefaultAsync(f => f.Id.ToString() == fileId);
            if (file == null) throw new BusinessException("File with id " + fileId + " not found");

            try
            {
                await DeleteLocalAsync(file);
                await DeleteDbAsync(file);
            }
            catch (Exception ex)
            {
                throw new BusinessException("Error while Delete file with id " + fileId + "").WithData("Exception", ex.Message);
            }
        }

        public async Task SoftDeleteAsync(string fileId)
        {
            var file = await _fileDescriptorRepository.FirstOrDefaultAsync(f => f.Id.ToString() == fileId);
            if (file == null) throw new UserFriendlyException("File not found");
            file.Status = FileStatus.Deleted;

            await _fileDescriptorRepository.UpdateAsync(file, autoSave: true);
        }
        #region delete file logic
        private async Task DeleteLocalAsync(FileDescriptor file)
        {
            var container = _blobFactory.Create(file.ContainerName);
            if (!await container.ExistsAsync(file.StorageName)) return;

            try
            {
                await container.DeleteAsync(file.StorageName);
            }
            catch (Exception ex)
            {
                throw new BusinessException("Error while Delete file to storage")
               .WithData("Exception", ex.Message)
               .WithData("StorageName", file.StorageName)
               .WithData("ContainerName", file.ContainerName);
            }
        }



        private async Task DeleteDbAsync(FileDescriptor file)
        {
            try
            {
                await _fileDescriptorRepository.DeleteAsync(file);
            }
            catch (Exception ex)
            {
                throw new BusinessException("Error while Delete file metadata to database")
               .WithData("Exception", ex.Message);
            }
        }
        #endregion
        // hàm này có trả dto chứa stream nên viết service hoặc controller phải để ý , nếu có lỗi thì check phần stream
        public async Task<FileStreamResultDto> DownloadAsync(string fileOriginName, string containerName, DateTime uploadTime)
        {
            if (string.IsNullOrEmpty(fileOriginName)) throw new ArgumentNullException("StorageName is null or empty");
            var file = await _fileDescriptorRepository.FirstOrDefaultAsync(f =>
            f.OriginalName == fileOriginName &&
            f.UploadTime == uploadTime &&
            f.ContainerName == containerName);
            if (file == null) throw new BusinessException("File not found ");
            var mimeType = _fileSecurityServices.GetMimeType(file.Extension);

            var container = _blobFactory.Create(file.ContainerName);
            if (!await container.ExistsAsync(file.StorageName)) throw new UserFriendlyException("File not found at local storage");

            var stream = await container.GetAsync(file.StorageName);
            if (stream == null) throw new BusinessException("Fail at read file ");

            return new FileStreamResultDto
            {
                Data = stream,
                MimeType = mimeType,
                FileName = file.OriginalName
            };

        }
        public async Task UploadAsync(UploadFileDto input)
        {
            using (var stream = input.File.OpenReadStream())
            {
                FileDescriptorDto fileDescriptor = await CheckValidationAsync(input, stream);
                await StorageLocalAsync(fileDescriptor, stream);
                await StorageDataBaseAsync(fileDescriptor);
            }
        }
        #region upload file logic

        //xử lý file 
        private async Task<FileDescriptorDto> CheckValidationAsync(UploadFileDto input, Stream stream)
        {
            var sizeAllow = _filePoliciesServices.GetMaxFileSizeMb(input.ContainerType);


            if (input.File == null) throw new UserFriendlyException("File is null");
            if (input.UserId == null) throw new ArgumentNullException("UserId is null");
            if (input.ContainerType == null) throw new ArgumentNullException("ContainerType is null");

            if (!_fileSecurityServices.ValidateExtension(input.File.FileName, input.ContainerType)) throw new UserFriendlyException("File extension is not allowed");
            if (!_fileSecurityServices.ValidateSize(input.File.Length, input.ContainerType)) throw new UserFriendlyException($"File Size must be smaller than {sizeAllow}");
            //ở hàm này có thể ghi log vì đây là trường hợp giả mạo nếu invalid 
            if (!await _fileSecurityServices.ValidateMimeAndMagicAsync(stream, input.ContainerType)) throw new UserFriendlyException("FIle invalid!!");

            stream.Seek(0, SeekOrigin.Begin); // reset lại vị trí con trỏ về đầu stream sau khi đã đọc để kiểm tra mime và magic
            var safeName = _fileSecurityServices.GenerateSafeStorageName(input.File.FileName);
            var containerName = _filePoliciesServices.GetContainerName(input.ContainerType);
            var stogarePath = _filePoliciesServices.GetStoragePath(input.ContainerType, containerName) + "/" + safeName;

            return new FileDescriptorDto
            {
                StorageName = safeName,
                MimeType = input.File.ContentType,
                OriginalName = input.File.FileName,
                CreatorId = input.UserId.ToString(),
                Extension = Path.GetExtension(input.File.FileName),
                ContainerName = containerName,
                Size = input.File.Length,
                Status = FileStatus.Public,
                StoragePath = stogarePath,
                UploadTime = DateTime.UtcNow
            };

        }


        //lưu file upload vào blob local
        private async Task StorageLocalAsync(FileDescriptorDto input, Stream stream)
        {
            try
            {
                var container = _blobFactory.Create(input.ContainerName);

                await container.SaveAsync(input.StorageName, stream, true);
            }
            catch (Exception ex)
            {
                throw new BusinessException("Error while saving file to storage", ex.ToString());
            }
        }
        //lưu file upload vào database
        private async Task StorageDataBaseAsync(FileDescriptorDto input)
        {
            var entity = ObjectMapper.Map<FileDescriptorDto, FileDescriptor>(input);
            try
            {
                await _fileDescriptorRepository.InsertAsync(entity, autoSave: true);
            }
            catch (Exception ex)
            {
                throw new BusinessException("Error while saving file metadata to database")
               .WithData("Exception", ex.Message);
            }
        }
        #endregion


        public async Task<List<FileDescriptorDto>> GetListFileByContainer(string containerName)
        {
            List<FileDescriptor> listFileMetadata = new List<FileDescriptor>();
            if (string.IsNullOrEmpty(containerName)) throw new ArgumentNullException("StorageName is null or empty");
            listFileMetadata = await _fileDescriptorRepository.GetListAsync(f => f.ContainerName == containerName);
            return ObjectMapper.Map<List<FileDescriptor>, List<FileDescriptorDto>>(listFileMetadata);
        }

        public async Task<List<FileDescriptorDto>> GetListFileByContainerType(string containerType)
        {
            List<FileDescriptor> listFileMetadata = new List<FileDescriptor>();
            if (string.IsNullOrEmpty(containerType)) throw new ArgumentNullException("StorageName is null or empty");
            listFileMetadata = await _fileDescriptorRepository.GetListAsync(f => f.FileType == containerType);
            return ObjectMapper.Map<List<FileDescriptor>, List<FileDescriptorDto>>(listFileMetadata);
        }
    }
}
