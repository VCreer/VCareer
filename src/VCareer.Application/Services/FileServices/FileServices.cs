using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants;
using VCareer.Constants.FilePolicy;
using VCareer.Dto.FileDto;
using VCareer.Files.BlobContainers;
using VCareer.IServices.IFileServices;
using VCareer.Models.FileMetadata;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.AuditLogging;
using Volo.Abp.BlobStoring;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Uow;
using static VCareer.Constants.FilePolicy.FilePolicyConfigs;

namespace VCareer.Services.FileServices
{
    public class FileServices : ApplicationService, IFileServices
    {
        private readonly IFileSecurityServices _fileSecurityServices;
        private readonly IBlobContainerFactory _blobFactory;
        private readonly FilePoliciesServices _filePoliciesServices;
        private readonly IRepository<FileDescriptor, Guid> _fileDescriptorRepository;

        public FileServices(IFileSecurityServices fileSecurityServices, IBlobContainer<BlobContainer> blobContainer, FilePoliciesServices filePoliciesServices, IBlobContainerFactory blobFactory, IRepository<FileDescriptor, Guid> fileDescriptorRepository)
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
   /*     public async Task<FileStreamResultDto> DownloadAsync(string storageName)
        {
            if (string.IsNullOrEmpty(storageName)) throw new ArgumentNullException("StorageName is null or empty");
            var file = await _fileDescriptorRepository.FirstOrDefaultAsync(f => f.StorageName == storageName);
            if (file == null) throw new BusinessException("File not found ");
            var mimeType = _fileSecurityServices.GetMimeType(file.Extension);

            var container = _blobFactory.Create(file.ContainerName);
            if (!await container.ExistsAsync(storageName)) throw new UserFriendlyException("File not found at local storage");



            var stream = await container.GetAsync(file.StorageName);
            if (stream == null) throw new BusinessException("Fail at read file ");

            return new FileStreamResultDto
            {
                Data= stream,
                MimeType = mimeType,
                FileName = file.OriginalName
            };

        }*/

        public Task<FileDescriptorDto> GetMetadataAsync(string storageName)
        {
            throw new NotImplementedException();
        }

        public async Task<Guid> UploadAsync(UploadFileDto input)
        {
            if (input == null)
            {
                throw new ArgumentNullException(nameof(input), "UploadFileDto cannot be null");
            }
            
            // Validate dependencies
            if (_fileSecurityServices == null)
            {
                throw new InvalidOperationException("FileSecurityServices is not initialized");
            }
            
            if (_filePoliciesServices == null)
            {
                throw new InvalidOperationException("FilePoliciesServices is not initialized");
            }
            
            if (_blobFactory == null)
            {
                throw new InvalidOperationException("BlobContainerFactory is not initialized");
            }
            
            if (_fileDescriptorRepository == null)
            {
                throw new InvalidOperationException("FileDescriptorRepository is not initialized");
            }
            
            FileDescriptorDto fileDescriptor;
            try
            {
                Logger.LogInformation("Starting CheckValidationAsync");
                fileDescriptor = await CheckValidationAsync(input);
                Logger.LogInformation($"CheckValidationAsync completed. StorageName: {fileDescriptor?.StorageName}, ContainerName: {fileDescriptor?.ContainerName}");
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, $"Error in CheckValidationAsync: {ex.Message}");
                throw new BusinessException($"Error in CheckValidationAsync: {ex.Message}", innerException: ex);
            }
            
            try
            {
                Logger.LogInformation("Starting StorageLocalAsync");
                await StorageLocalAsync(fileDescriptor, input.File);
                Logger.LogInformation("StorageLocalAsync completed");
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, $"Error in StorageLocalAsync: {ex.Message}");
                throw new BusinessException($"Error in StorageLocalAsync: {ex.Message}", innerException: ex);
            }
            
            FileDescriptor insertedEntity;
            try
            {
                Logger.LogInformation("Starting StorageDataBaseAsync");
                insertedEntity = await StorageDataBaseAsync(fileDescriptor);
                Logger.LogInformation($"StorageDataBaseAsync completed. Entity Id: {insertedEntity?.Id}");
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, $"Error in StorageDataBaseAsync: {ex.Message}");
                throw new BusinessException($"Error in StorageDataBaseAsync: {ex.Message}", innerException: ex);
            }
            
            if (insertedEntity == null)
            {
                throw new InvalidOperationException("Inserted FileDescriptor entity is null");
            }
            
            if (insertedEntity.Id == Guid.Empty)
            {
                throw new InvalidOperationException("Inserted FileDescriptor Id is empty");
            }
            
            return insertedEntity.Id; // Return the Id of inserted FileDescriptor
        }
        #region upload file logic

        //xử lý file 
        private async Task<FileDescriptorDto> CheckValidationAsync(UploadFileDto input)
        {
            Logger.LogInformation($"CheckValidationAsync called. File: {input?.File?.FileName}, ContainerType: {input?.ContainerType}, UserId: {input?.UserId}");
            
            if (input == null)
            {
                throw new ArgumentNullException(nameof(input), "UploadFileDto cannot be null");
            }
            
            if (input.File == null)
            {
                throw new ArgumentNullException(nameof(input.File), "File cannot be null");
            }
            
            if (string.IsNullOrEmpty(input.ContainerType))
            {
                throw new ArgumentException("ContainerType cannot be null or empty", nameof(input));
            }
            
            if (string.IsNullOrEmpty(input.UserId))
            {
                throw new ArgumentException("UserId cannot be null or empty", nameof(input));
            }
            
            // Convert string ContainerType to enum object
            object containerTypeEnum = ParseContainerType(input.ContainerType);
            
            var stream = input.File.OpenReadStream();
            if (stream == null)
            {
                throw new InvalidOperationException("Could not open file stream");
            }
            
            var sizeAllow = _filePoliciesServices.GetMaxFileSizeMb(containerTypeEnum);


            // Validate dependencies
            if (_fileSecurityServices == null)
            {
                throw new InvalidOperationException("FileSecurityServices is not initialized");
            }
            
            if (_filePoliciesServices == null)
            {
                throw new InvalidOperationException("FilePoliciesServices is not initialized");
            }

            if (string.IsNullOrEmpty(input.File.FileName))
            {
                throw new ArgumentException("File name cannot be null or empty", nameof(input));
            }

            if (!_fileSecurityServices.ValidateExtension(input.File.FileName, containerTypeEnum)) 
                throw new UserFriendlyException("File extension is not allowed");
                
            if (!_fileSecurityServices.ValidateSize(input.File.Length, containerTypeEnum)) 
                throw new UserFriendlyException($"File Size must be smaller than {sizeAllow}");
                
            //ở hàm này có thể ghi log vì đây là trường hợp giả mạo nếu invalid 
            try
            {
                var isValidMagic = await _fileSecurityServices.ValidateMimeAndMagicAsync(stream, containerTypeEnum);
                if (!isValidMagic)
                {
                    Logger.LogWarning($"File magic validation failed for file: {input.File.FileName}, ContentType: {input.File.ContentType}");
                    // Log để debug nhưng không throw exception ngay - có thể file hợp lệ nhưng magic signature không match
                    // Tạm thời chỉ warning và tiếp tục, nếu cần strict validation thì uncomment dòng dưới
                    // throw new UserFriendlyException("File invalid!!");
                }
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, $"Error validating file magic for: {input.File.FileName}");
                // Nếu có lỗi trong quá trình validate, log nhưng không block upload
                // throw new UserFriendlyException($"Lỗi khi kiểm tra file: {ex.Message}");
            }

            stream.Seek(0, SeekOrigin.Begin); // reset lại vị trí con trỏ về đầu stream sau khi đã đọc để kiểm tra mime và magic
            var safeName = _fileSecurityServices.GenerateSafeStorageName(input.File.FileName);
            
            if (string.IsNullOrEmpty(safeName))
            {
                throw new InvalidOperationException("Generated safe storage name is null or empty");
            }
            
            // GetContainerName expects the enum name (e.g., "Resumes"), not the full type name
            var containerTypeName = containerTypeEnum?.ToString();
            if (string.IsNullOrEmpty(containerTypeName))
            {
                throw new InvalidOperationException("ContainerTypeName is null or empty after parsing");
            }
            
            var containerName = _filePoliciesServices.GetContainerName(containerTypeName);
            if (string.IsNullOrEmpty(containerName))
            {
                throw new InvalidOperationException($"ContainerName is null or empty for containerType: {containerTypeName}");
            }
            
            var stogarePath = _filePoliciesServices.GetStoragePath(containerTypeName, containerName);
            if (string.IsNullOrEmpty(stogarePath))
            {
                throw new InvalidOperationException($"StoragePath is null or empty for containerType: {containerTypeName}, containerName: {containerName}");
            }
            
            stogarePath = stogarePath + "/" + safeName;

            // Ensure all required properties are set
            var extension = Path.GetExtension(input.File.FileName);
            var mimeType = input.File.ContentType ?? "application/octet-stream";
            var originalName = input.File.FileName ?? "unknown";
            var creatorId = input.UserId ?? throw new ArgumentException("UserId cannot be null");
            
            return new FileDescriptorDto
            {
                StorageName = safeName,
                MimeType = mimeType,
                OriginalName = originalName,
                CreatorId = creatorId,
                Extension = extension ?? "",
                ContainerName = containerName,
                Size = input.File.Length,
                Status = FileStatus.Active,
                StoragePath = stogarePath,
                UploadTime = DateTime.UtcNow
            };

        }

        /// <summary>
        /// Parse string ContainerType to enum object
        /// </summary>
        private object ParseContainerType(string containerType)
        {
            if (string.IsNullOrEmpty(containerType))
                throw new ArgumentException("ContainerType cannot be null or empty");

            // Try CandidateContainerType
            if (Enum.TryParse<CandidateContainerType>(containerType, true, out var candidateType))
                return candidateType;

            // Try RecruiterContainerType
            if (Enum.TryParse<RecruiterContainerType>(containerType, true, out var recruiterType))
                return recruiterType;

            // Try EmployeeContainerType
            if (Enum.TryParse<EmployeeContainerType>(containerType, true, out var employeeType))
                return employeeType;

            // Try SystemContainerType
            if (Enum.TryParse<SystemContainerType>(containerType, true, out var systemType))
                return systemType;

            throw new ArgumentException($"Container type '{containerType}' not found or unsupported");
        }

        //lưu file upload vào blob local
        private async Task StorageLocalAsync(FileDescriptorDto input, IFormFile file)
        {
            if (input == null)
            {
                throw new ArgumentNullException(nameof(input), "FileDescriptorDto cannot be null");
            }
            
            if (file == null)
            {
                throw new ArgumentNullException(nameof(file), "IFormFile cannot be null");
            }
            
            if (string.IsNullOrEmpty(input.ContainerName))
            {
                throw new ArgumentException("ContainerName cannot be null or empty", nameof(input));
            }
            
            if (string.IsNullOrEmpty(input.StorageName))
            {
                throw new ArgumentException("StorageName cannot be null or empty", nameof(input));
            }
            
            try
            {
                var container = _blobFactory.Create(input.ContainerName);
                if (container == null)
                {
                    throw new InvalidOperationException($"Could not create blob container for: {input.ContainerName}");
                }
                
                using (var stream = file.OpenReadStream())
                {
                    await container.SaveAsync(input.StorageName, stream, true);
                }
            }
            catch (Exception ex)
            {
                throw new BusinessException($"Error while saving file to storage. ContainerName: {input.ContainerName}, StorageName: {input.StorageName}", ex.ToString());
            }
        }
        //lưu file upload vào database
        private async Task<FileDescriptor> StorageDataBaseAsync(FileDescriptorDto input)
        {
            if (input == null)
            {
                throw new ArgumentNullException(nameof(input), "FileDescriptorDto cannot be null");
            }

            // Manual mapping thay vì dùng ObjectMapper để tránh lỗi mapping
            // Note: Id sẽ được ABP tự động tạo khi InsertAsync, không cần set thủ công
            // Validate all required properties
            if (string.IsNullOrEmpty(input.CreatorId))
            {
                throw new ArgumentException("CreatorId cannot be null or empty", nameof(input));
            }
            
            if (string.IsNullOrEmpty(input.StorageName))
            {
                throw new ArgumentException("StorageName cannot be null or empty", nameof(input));
            }
            
            if (string.IsNullOrEmpty(input.OriginalName))
            {
                throw new ArgumentException("OriginalName cannot be null or empty", nameof(input));
            }
            
            if (string.IsNullOrEmpty(input.ContainerName))
            {
                throw new ArgumentException("ContainerName cannot be null or empty", nameof(input));
            }
            
            if (string.IsNullOrEmpty(input.StoragePath))
            {
                throw new ArgumentException("StoragePath cannot be null or empty", nameof(input));
            }
            
            var entity = new FileDescriptor
            {
                CreatorId = input.CreatorId,
                StorageName = input.StorageName,
                OriginalName = input.OriginalName,
                Extension = input.Extension ?? "",
                Size = input.Size,
                MimeType = input.MimeType ?? "application/octet-stream",
                ContainerName = input.ContainerName,
                StoragePath = input.StoragePath,
                Status = input.Status,
                UploadTime = input.UploadTime
            };

            try
            {
                await _fileDescriptorRepository.InsertAsync(entity, autoSave: true);
                return entity; // Return inserted entity with Id
            }
            catch (Exception ex)
            {
                throw new BusinessException("Error while saving file metadata to database")
               .WithData("Exception", ex.Message);
            }
        }
        #endregion


        public Task<FileChunkResult> UploadChunkAsync(FileChunkInput input)
        {
            throw new NotImplementedException();
        }

    }
}
