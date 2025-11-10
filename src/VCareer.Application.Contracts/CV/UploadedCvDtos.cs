using System;
using VCareer.Dto.FileDto;
using Volo.Abp.Application.Dtos;

namespace VCareer.Application.Contracts.CV
{
    /// <summary>
    /// DTO cho Uploaded CV
    /// </summary>
    public class UploadedCvDto : EntityDto<Guid>
    {
        public Guid CandidateId { get; set; }
        public Guid FileDescriptorId { get; set; }
        public string CvName { get; set; } = string.Empty;
        public bool IsDefault { get; set; }
        public bool IsPublic { get; set; }
        public string? Notes { get; set; }

        // File information từ FileDescriptor
        public FileDescriptorDto? FileDescriptor { get; set; }

        // Computed properties để dễ sử dụng
        public string? OriginalFileName => FileDescriptor?.OriginalName;
        public long? FileSize => FileDescriptor?.Size;
        public string? FileType => FileDescriptor?.Extension;
        public string? StoragePath => FileDescriptor?.StoragePath;
        public DateTime? UploadTime => FileDescriptor?.UploadTime;
    }

    /// <summary>
    /// DTO để tạo Uploaded CV mới (sau khi đã upload file)
    /// </summary>
    public class CreateUploadedCvDto
    {
        public Guid FileDescriptorId { get; set; }
        public string CvName { get; set; }
        public bool IsDefault { get; set; }
        public bool IsPublic { get; set; }
        public string? Notes { get; set; }
    }

    /// <summary>
    /// DTO để upload CV file (cho controller)
    /// </summary>
    public class UploadCvRequestDto
    {
        [System.ComponentModel.DataAnnotations.Required]
        public Microsoft.AspNetCore.Http.IFormFile File { get; set; }
        
        [System.ComponentModel.DataAnnotations.Required]
        [System.ComponentModel.DataAnnotations.StringLength(200)]
        public string CvName { get; set; }
        
        public bool IsDefault { get; set; } = false;
        
        public bool IsPublic { get; set; } = false;
        
        [System.ComponentModel.DataAnnotations.StringLength(1000)]
        public string? Notes { get; set; }
    }

    /// <summary>
    /// DTO để cập nhật Uploaded CV
    /// </summary>
    public class UpdateUploadedCvDto
    {
        public string? CvName { get; set; }
        public bool? IsDefault { get; set; }
        public bool? IsPublic { get; set; }
        public string? Notes { get; set; }
    }

    /// <summary>
    /// DTO để query danh sách Uploaded CV
    /// </summary>
    public class GetUploadedCvListDto : PagedAndSortedResultRequestDto
    {
        public Guid? CandidateId { get; set; }
        public bool? IsDefault { get; set; }
        public bool? IsPublic { get; set; }
        public string? SearchKeyword { get; set; }
    }
}