using Microsoft.AspNetCore.Http;
using System;
using System.Linq;
using System.Threading.Tasks;
using VCareer;
using VCareer.Application.Contracts.CV;
using VCareer.Constants.FilePolicy;
using VCareer.Dto.FileDto;
using VCareer.Files.BlobContainers;
using VCareer.IServices.IFileServices;
using VCareer.Models.CV;
using VCareer.Models.FileMetadata;
using VCareer.Models.Users;
using VCareer.Services.FileServices;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.BlobStoring;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Users;

namespace VCareer.Services.CV
{
    /// <summary>
    /// Application Service cho Uploaded CV Management
    /// </summary>
    public class UploadedCvAppService : VCareerAppService, IUploadedCvAppService
    {
        private readonly IRepository<UploadedCv, Guid> _uploadedCvRepository;
        private readonly IRepository<CandidateProfile, Guid> _candidateProfileRepository;
        private readonly IRepository<FileDescriptor, Guid> _fileDescriptorRepository;
        private readonly IFileServices _fileServices;
        private readonly IBlobContainerFactory _blobFactory;
        private readonly ICurrentUser _currentUser;



        public UploadedCvAppService(
            IRepository<UploadedCv, Guid> uploadedCvRepository,
            IRepository<CandidateProfile, Guid> candidateProfileRepository,
            IRepository<FileDescriptor, Guid> fileDescriptorRepository,
            IFileServices fileServices,
            IBlobContainerFactory blobFactory,
              ICurrentUser currentUser
           )
        {
            _uploadedCvRepository = uploadedCvRepository;
            _candidateProfileRepository = candidateProfileRepository;
            _fileDescriptorRepository = fileDescriptorRepository;
            _fileServices = fileServices;
            _blobFactory = blobFactory;
            _currentUser = currentUser;
        }

        public async Task<UploadedCvDto> UploadCvAsync(IFormFile file, string cvName, bool isDefault = false, bool isPublic = false, string? notes = null)
        {
            /*  Guid userId;
              try
              {
                   userId = _currentUser.GetId();
              }
              catch (Exception ex)
              {
                  throw new UserFriendlyException($"Lỗi xác thực người dùng: {ex.Message}", innerException: ex);
              }

              if (userId == Guid.Empty)
              {
                  throw new UserFriendlyException("UserId không hợp lệ. Vui lòng đăng nhập lại.");
              }

              // Kiểm tra user có phải candidate không
              var candidate = await _candidateProfileRepository.FirstOrDefaultAsync(c => c.UserId == userId);
              if (candidate == null)
              {
                  throw new UserFriendlyException("Chỉ có candidate mới có thể upload CV.");
              }

              // Upload file qua FileServices với ContainerType = "Resumes"
              var uploadDto = new UploadFileDto
              {
                  File = file,
                  ContainerType = CandidateContainerType.Resumes.ToString(), // Convert enum to string
                  UserId = userId.ToString()
              };

              // Upload file (lưu vào blob storage và FileDescriptor vào DB)
              // FileServices.UploadAsync now returns the FileDescriptor Id
              Guid fileDescriptorId;
              try
              {
                  fileDescriptorId = await _fileServices.UploadAsync(uploadDto);
              }
              catch (Exception ex)
              {
                  throw new UserFriendlyException($"Lỗi khi upload file: {ex.Message}", innerException: ex);
              }

              if (fileDescriptorId == Guid.Empty)
              {
                  throw new UserFriendlyException("FileDescriptorId không hợp lệ sau khi upload.");
              }

              // Lấy FileDescriptor vừa tạo bằng Id
              FileDescriptor fileDescriptor;
              try
              {
                  fileDescriptor = await _fileDescriptorRepository.GetAsync(fileDescriptorId);
              }
              catch (Exception ex)
              {
                  throw new UserFriendlyException($"Không tìm thấy file descriptor sau khi upload. FileDescriptorId: {fileDescriptorId}. Error: {ex.Message}", innerException: ex);
              }

              // Nếu set làm default, bỏ default của các CV upload khác
              if (isDefault)
              {
                  var existingDefault = await _uploadedCvRepository.FirstOrDefaultAsync(
                      x => x.CandidateId == userId && x.IsDefault);
                  if (existingDefault != null)
                  {
                      existingDefault.IsDefault = false;
                      await _uploadedCvRepository.UpdateAsync(existingDefault);
                  }
              }

              // Tạo UploadedCv record
              var uploadedCv = new UploadedCv
              {
                  CandidateId = userId,
                  FileDescriptorId = fileDescriptor.Id,
                  CvName = cvName ?? throw new ArgumentNullException(nameof(cvName)),
                  IsDefault = isDefault,
                  IsPublic = isPublic,
                  Notes = notes
              };

              try
              {
                  await _uploadedCvRepository.InsertAsync(uploadedCv);
              }
              catch (Exception ex)
              {
                  throw new UserFriendlyException($"Lỗi khi tạo UploadedCv record: {ex.Message}", innerException: ex);
              }

              // Load FileDescriptor để map vào DTO
              uploadedCv.FileDescriptor = fileDescriptor;

              try
              {
                  return await MapToDtoAsync(uploadedCv);
              }
              catch (Exception ex)
              {
                  throw new UserFriendlyException($"Lỗi khi map UploadedCv sang DTO: {ex.Message}", innerException: ex);
              }*/

            throw new NotImplementedException();
        }

        public async Task<PagedResultDto<UploadedCvDto>> GetListAsync(GetUploadedCvListDto input)
        {
            var userId = _currentUser.GetId();

            // Chỉ lấy CV của current user nếu không có CandidateId trong input
            var candidateId = input.CandidateId ?? userId;

            var query = await _uploadedCvRepository.GetQueryableAsync();
            query = query.Where(x => x.CandidateId == candidateId);

            // Apply filters
            if (input.IsDefault.HasValue)
            {
                query = query.Where(x => x.IsDefault == input.IsDefault.Value);
            }

            if (input.IsPublic.HasValue)
            {
                query = query.Where(x => x.IsPublic == input.IsPublic.Value);
            }

            if (!string.IsNullOrEmpty(input.SearchKeyword))
            {
                query = query.Where(x => x.CvName.Contains(input.SearchKeyword) || 
                                       (x.Notes != null && x.Notes.Contains(input.SearchKeyword)));
            }

            // Apply sorting - default sort by CreationTime descending
            query = query.OrderByDescending(x => x.CreationTime);

            var totalCount = query.Count();
            var items = query
                .Skip(input.SkipCount)
                .Take(input.MaxResultCount)
                .ToList();

            // Load FileDescriptors
            var fileDescriptorIds = items.Select(x => x.FileDescriptorId).ToList();
            var fileDescriptors = await _fileDescriptorRepository.GetListAsync(f => fileDescriptorIds.Contains(f.Id));
            var fileDescriptorDict = fileDescriptors.ToDictionary(f => f.Id);

            // Map to DTOs
            var dtos = items.Select(x =>
            {
                var dto = ObjectMapper.Map<UploadedCv, UploadedCvDto>(x);
                if (fileDescriptorDict.TryGetValue(x.FileDescriptorId, out var fd))
                {
                    dto.FileDescriptor = ObjectMapper.Map<FileDescriptor, FileDescriptorDto>(fd);
                }
                return dto;
            }).ToList();

            return new PagedResultDto<UploadedCvDto>(totalCount, dtos);
        }

        public async Task<UploadedCvDto> GetAsync(Guid id)
        {
            var userId = _currentUser.GetId();

            var uploadedCv = await _uploadedCvRepository.GetAsync(id);

            // Kiểm tra quyền: chỉ có thể xem CV của chính mình (trừ khi IsPublic = true và là recruiter)
            if (uploadedCv.CandidateId != userId && !uploadedCv.IsPublic)
            {
                throw new UserFriendlyException("Bạn không có quyền xem CV này.");
            }

            return await MapToDtoAsync(uploadedCv);
        }

        public async Task<UploadedCvDto> UpdateAsync(Guid id, UpdateUploadedCvDto input)
        {
            var userId = _currentUser.GetId();

            var uploadedCv = await _uploadedCvRepository.GetAsync(id);

            // Kiểm tra quyền: chỉ có thể update CV của chính mình
            if (uploadedCv.CandidateId != userId)
            {
                throw new UserFriendlyException("Bạn không có quyền cập nhật CV này.");
            }

            // Update fields
            if (input.CvName != null)
            {
                uploadedCv.CvName = input.CvName;
            }

            if (input.IsDefault.HasValue)
            {
                // Nếu set làm default, bỏ default của các CV upload khác
                if (input.IsDefault.Value)
                {
                    var existingDefault = await _uploadedCvRepository.FirstOrDefaultAsync(
                        x => x.CandidateId == userId && x.IsDefault && x.Id != id);
                    if (existingDefault != null)
                    {
                        existingDefault.IsDefault = false;
                        await _uploadedCvRepository.UpdateAsync(existingDefault);
                    }
                }
                uploadedCv.IsDefault = input.IsDefault.Value;
            }

            if (input.IsPublic.HasValue)
            {
                uploadedCv.IsPublic = input.IsPublic.Value;
            }

            if (input.Notes != null)
            {
                uploadedCv.Notes = input.Notes;
            }

            await _uploadedCvRepository.UpdateAsync(uploadedCv);

            return await MapToDtoAsync(uploadedCv);
        }

        public async Task DeleteAsync(Guid id)
        {
            var userId = _currentUser.GetId();

            var uploadedCv = await _uploadedCvRepository.GetAsync(id);

            // Kiểm tra quyền: chỉ có thể xóa CV của chính mình
            if (uploadedCv.CandidateId != userId)
            {
                throw new UserFriendlyException("Bạn không có quyền xóa CV này.");
            }

            // Soft delete: xóa FileDescriptor (sẽ xóa file trong blob storage)
            if (uploadedCv.FileDescriptorId != Guid.Empty)
            {
                await _fileServices.SoftDeleteAsync(uploadedCv.FileDescriptorId.ToString());
            }

            // Xóa UploadedCv record
            await _uploadedCvRepository.DeleteAsync(uploadedCv);
        }

        public async Task SetDefaultAsync(Guid id)
        {
            var userId = _currentUser.GetId();

            var uploadedCv = await _uploadedCvRepository.GetAsync(id);

            // Kiểm tra quyền
            if (uploadedCv.CandidateId != userId)
            {
                throw new UserFriendlyException("Bạn không có quyền thao tác CV này.");
            }

            // Bỏ default của các CV upload khác
            var existingDefaults = await _uploadedCvRepository.GetListAsync(
                x => x.CandidateId == userId && x.IsDefault && x.Id != id);
            foreach (var existing in existingDefaults)
            {
                existing.IsDefault = false;
                await _uploadedCvRepository.UpdateAsync(existing);
            }

            uploadedCv.IsDefault = true;
            await _uploadedCvRepository.UpdateAsync(uploadedCv);
        }

        public async Task<byte[]> DownloadCvAsync(Guid id)
        {
            var userId = _currentUser.GetId();
            var uploadedCv = await _uploadedCvRepository.GetAsync(id);

            // Kiểm tra quyền
            if (uploadedCv.CandidateId != userId && !uploadedCv.IsPublic)
            {
                throw new UserFriendlyException("Bạn không có quyền download CV này.");
            }

            // Load FileDescriptor
            var fileDescriptor = await _fileDescriptorRepository.GetAsync(uploadedCv.FileDescriptorId);

            // Download file từ blob storage
            var container = _blobFactory.Create(fileDescriptor.ContainerName);
            var fileBytes = await container.GetAllBytesAsync(fileDescriptor.StorageName);

            return fileBytes;
        }

        /// <summary>
        /// Map UploadedCv entity to DTO, including FileDescriptor
        /// </summary>
        private async Task<UploadedCvDto> MapToDtoAsync(UploadedCv uploadedCv)
        {
            if (uploadedCv == null)
            {
                throw new ArgumentNullException(nameof(uploadedCv));
            }

            UploadedCvDto dto;
            try
            {
                dto = ObjectMapper.Map<UploadedCv, UploadedCvDto>(uploadedCv);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Error mapping UploadedCv to DTO: {ex.Message}", ex);
            }

            if (dto == null)
            {
                throw new InvalidOperationException("ObjectMapper.Map returned null for UploadedCv to UploadedCvDto");
            }
            
            // Ensure required properties are set
            if (string.IsNullOrEmpty(dto.CvName))
            {
                dto.CvName = uploadedCv.CvName ?? "Untitled CV";
            }

            // Load FileDescriptor if not already loaded
            if (uploadedCv.FileDescriptor == null && uploadedCv.FileDescriptorId != Guid.Empty)
            {
                try
                {
                    uploadedCv.FileDescriptor = await _fileDescriptorRepository.GetAsync(uploadedCv.FileDescriptorId);
                }
                catch (Exception ex)
                {
                            // Log but don't fail - FileDescriptor might be optional
                    // Could not load FileDescriptor, continue without it
                }
            }

            if (uploadedCv.FileDescriptor != null)
            {
                try
                {
                    dto.FileDescriptor = ObjectMapper.Map<FileDescriptor, FileDescriptorDto>(uploadedCv.FileDescriptor);
                }
                catch (Exception ex)
                {
                    throw new InvalidOperationException($"Error mapping FileDescriptor to DTO: {ex.Message}", ex);
                }
            }

            return dto;
        }
    }
}
