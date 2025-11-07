using System;
using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Dtos;

namespace VCareer.Dto.CVDto
{
    /// <summary>
    /// DTO để tạo CV online
    /// </summary>
    public class CreateCVOnlineDto
    {
        [Required]
        [StringLength(255)]
        public string CVName { get; set; }

        /*[Required]
        [StringLength(50)]
        public string CVType { get; set; } // "Online"*/

        [StringLength(1000)]
        public string CareerObjective { get; set; }

        [Required]
        [StringLength(255)]
        public string FullName { get; set; }

        [Required]
        [EmailAddress]
        [StringLength(256)]
        public string Email { get; set; }

        [Phone]
        [StringLength(20)]
        public string PhoneNumber { get; set; }

        public DateTime? DateOfBirth { get; set; }

        [StringLength(500)]
        public string Address { get; set; }

        /// <summary>
        /// Kinh nghiệm làm việc (JSON string)
        /// </summary>
        public string WorkExperience { get; set; }

        /// <summary>
        /// Học vấn (JSON string)
        /// </summary>
        public string Education { get; set; }

        /// <summary>
        /// Kỹ năng (JSON string)
        /// </summary>
        public string Skills { get; set; }

        /// <summary>
        /// Dự án (JSON string)
        /// </summary>
        public string Projects { get; set; }

        /// <summary>
        /// Chứng chỉ (JSON string)
        /// </summary>
        public string Certificates { get; set; }

        /// <summary>
        /// Ngôn ngữ (JSON string)
        /// </summary>
        public string Languages { get; set; }

        [StringLength(1000)]
        public string Interests { get; set; }

        public bool IsPublic { get; set; } = false;
    }

    /// <summary>
    /// DTO để upload CV file đơn giản (chỉ cần file, không cần input fields)
    /// </summary>
    public class SimpleUploadCVDto
    {
        // Không cần input fields - chỉ cần file upload
        // File validation sẽ được xử lý trong service
    }

    /// <summary>
    /// DTO để upload CV file (cũ - có thể giữ lại cho tương lai)
    /// </summary>
    public class UploadCVDto
    {
        [Required]
        [StringLength(255)]
        public string CVName { get; set; }

        [Required]
        [StringLength(50)]
        public string CVType { get; set; } // "Upload"

        [Required]
        [StringLength(500)]
        public string FileUrl { get; set; }

        [Required]
        [StringLength(255)]
        public string OriginalFileName { get; set; }

        public long FileSize { get; set; }

        [Required]
        [StringLength(50)]
        public string FileType { get; set; }

        [StringLength(1000)]
        public string Description { get; set; }

        public bool IsPublic { get; set; } = false;
    }

    /// <summary>
    /// DTO để update CV
    /// </summary>
    public class UpdateCVDto
    {
        [StringLength(255)]
        public string CVName { get; set; }

        [StringLength(1000)]
        public string CareerObjective { get; set; }

        [StringLength(255)]
        public string FullName { get; set; }

        [EmailAddress]
        [StringLength(256)]
        public string Email { get; set; }

        [Phone]
        [StringLength(20)]
        public string PhoneNumber { get; set; }

        public DateTime? DateOfBirth { get; set; }

        [StringLength(500)]
        public string Address { get; set; }

        public string WorkExperience { get; set; }

        public string Education { get; set; }

        public string Skills { get; set; }

        public string Projects { get; set; }

        public string Certificates { get; set; }

        public string Languages { get; set; }

        [StringLength(1000)]
        public string Interests { get; set; }

        public bool? IsPublic { get; set; }

        public string Status { get; set; } // Draft, Published, Archived
    }

    /// <summary>
    /// DTO để trả về thông tin CV
    /// </summary>
    public class CVDto : EntityDto<Guid>
    {
        public Guid CandidateId { get; set; }

        public string CVName { get; set; }

        public string CVType { get; set; } // Online hoặc Upload

        public string Status { get; set; } // Draft, Published, Archived

        public bool IsDefault { get; set; }

        public bool IsPublic { get; set; }

        // Thông tin CV Online
        public string FullName { get; set; }

        public string Email { get; set; }

        public string PhoneNumber { get; set; }

        public DateTime? DateOfBirth { get; set; }

        public bool? Gender { get; set; }

        public string Address { get; set; }

        public string CareerObjective { get; set; }

        public string WorkExperience { get; set; }

        public string Education { get; set; }

        public string Skills { get; set; }

        public string Projects { get; set; }

        public string Certificates { get; set; }

        public string Languages { get; set; }

        public string Interests { get; set; }

        // Thông tin CV Upload
        public string OriginalFileName { get; set; }

        public string FileUrl { get; set; }

        public long? FileSize { get; set; }

        public string FileType { get; set; }

        public string Description { get; set; }

        // Audit fields
        public DateTime CreationTime { get; set; }

        public DateTime? LastModificationTime { get; set; }
    }

    /// <summary>
    /// DTO để set CV mặc định
    /// </summary>
    public class SetDefaultCVDto
    {
        [Required]
        public Guid CVId { get; set; }
    }

    /// <summary>
    /// DTO để set CV public/private
    /// </summary>
    public class SetPublicCVDto
    {
        [Required]
        public Guid CVId { get; set; }

        [Required]
        public bool IsPublic { get; set; }
    }

    /// <summary>
    /// DTO để list CVs với pagination
    /// </summary>
    public class GetCVListDto : PagedAndSortedResultRequestDto
    {
        public string CVType { get; set; } // Filter by Online/Upload

        public string Status { get; set; } // Filter by Draft/Published/Archived

        public bool? IsPublic { get; set; } // Filter by public/private

        public bool? IsDefault { get; set; } // Filter by default CV
    }
}
