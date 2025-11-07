using System;
using System.ComponentModel.DataAnnotations;
using VCareer.Models.FileMetadata;
using VCareer.Models.Users;
using Volo.Abp.Domain.Entities.Auditing;

namespace VCareer.Models.CV
{
    /// <summary>
    /// Uploaded CV entity - Link FileDescriptor với CandidateProfile
    /// Sử dụng FileDescriptor để lưu metadata file (tên file, size, path, etc.)
    /// Entity này chỉ lưu metadata riêng cho CV (tên CV, isDefault, isPublic, notes)
    /// </summary>
    public class UploadedCv : FullAuditedAggregateRoot<Guid>
    {
        /// <summary>
        /// Candidate UserId - Foreign Key đến CandidateProfile.UserId
        /// </summary>
        [Required]
        public Guid CandidateId { get; set; }

        /// <summary>
        /// FileDescriptor ID - Foreign Key đến FileDescriptor (chứa metadata file: OriginalName, Size, StoragePath, etc.)
        /// </summary>
        [Required]
        public Guid FileDescriptorId { get; set; }

        /// <summary>
        /// Tên CV (do candidate tự đặt, có thể khác với tên file gốc trong FileDescriptor.OriginalName)
        /// </summary>
        [Required]
        [StringLength(200)]
        public string CvName { get; set; }

        /// <summary>
        /// CV có phải là mặc định không (chỉ 1 CV mặc định per candidate)
        /// </summary>
        public bool IsDefault { get; set; }

        /// <summary>
        /// CV có public không (cho recruiter xem)
        /// </summary>
        public bool IsPublic { get; set; }

        /// <summary>
        /// Mô tả/Ghi chú về CV này
        /// </summary>
        [StringLength(1000)]
        public string? Notes { get; set; }

        // === NAVIGATION PROPERTIES ===

        /// <summary>
        /// Candidate Profile - Foreign Key đến CandidateProfile
        /// </summary>
        public CandidateProfile? CandidateProfile { get; set; }

        /// <summary>
        /// File Descriptor - Foreign Key đến FileDescriptor (chứa thông tin file: OriginalName, Size, StoragePath, ContainerName, etc.)
        /// </summary>
        public FileDescriptor? FileDescriptor { get; set; }
    }
}
