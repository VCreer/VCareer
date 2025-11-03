using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Volo.Abp.Domain.Entities.Auditing;
using Volo.Abp.Identity;

namespace VCareer.Models.Users
{
    /// <summary>
    /// CurriculumVitae entity - Quan hệ 1-nhiều với CandidateProfile
    /// Cho phép candidate có nhiều phiên bản CV
    /// </summary>
    public class CurriculumVitae : FullAuditedAggregateRoot<Guid>
    {
        /// <summary>
        /// Candidate ID - Foreign Key
        /// </summary>
        public Guid CandidateId { get; set; }

        /// <summary>
        /// Tên CV (do candidate tự đặt)
        /// </summary>
        public string CVName { get; set; }

        /// <summary>
        /// Loại CV: Online hoặc Upload
        /// </summary>
        public string CVType { get; set; } // "Online", "Upload"

        /// <summary>
        /// Trạng thái CV: Draft, Published, Archived
        /// </summary>
        public string Status { get; set; } // "Draft", "Published", "Archived"

        /// <summary>
        /// CV có phải là mặc định không
        /// </summary>
        public bool IsDefault { get; set; }

        /// <summary>
        /// CV có public không (cho recruiter xem)
        /// </summary>
        public bool IsPublic { get; set; }

        // === THÔNG TIN CHO CV ONLINE ===
        
        /// <summary>
        /// Họ và tên
        /// </summary>
        public string FullName { get; set; }

        /// <summary>
        /// Email
        /// </summary>
        public string Email { get; set; }

        /// <summary>
        /// Số điện thoại
        /// </summary>
        public string PhoneNumber { get; set; }

        /// <summary>
        /// Ngày sinh
        /// </summary>
        public DateTime? DateOfBirth { get; set; }

        /// <summary>
        /// Địa chỉ
        /// </summary>
        public string Address { get; set; }

        /// <summary>
        /// Mục tiêu nghề nghiệp
        /// </summary>
        public string CareerObjective { get; set; }

        /// <summary>
        /// Kinh nghiệm làm việc (JSON format)
        /// </summary>
        public string WorkExperience { get; set; }

        /// <summary>
        /// Học vấn (JSON format)
        /// </summary>
        public string Education { get; set; }

        /// <summary>
        /// Kỹ năng (JSON format)
        /// </summary>
        public string Skills { get; set; }

        /// <summary>
        /// Dự án (JSON format)
        /// </summary>
        public string Projects { get; set; }

        /// <summary>
        /// Chứng chỉ (JSON format)
        /// </summary>
        public string Certificates { get; set; }

        /// <summary>
        /// Ngôn ngữ (JSON format)
        /// </summary>
        public string? Languages { get; set; }

        /// <summary>
        /// Sở thích
        /// </summary>
        public string? Interests { get; set; }

        // === THÔNG TIN CHO CV UPLOAD ===

        /// <summary>
        /// Tên file CV gốc
        /// </summary>
        public string? OriginalFileName { get; set; }

        /// <summary>
        /// Đường dẫn file CV trên cloud storage
        /// </summary>
        public string? FileUrl { get; set; }

        /// <summary>
        /// Kích thước file (bytes)
        /// </summary>
        public long? FileSize { get; set; }

        /// <summary>
        /// Loại file (pdf, doc, docx)
        /// </summary>
        public string? FileType { get; set; }

        /// <summary>
        /// Mô tả CV upload
        /// </summary>
        public string? Description { get; set; }

        // === NAVIGATION PROPERTIES ===

        /// <summary>
        /// Candidate profile
        /// </summary>
        public CandidateProfile Candidate { get; set; }

        /// <summary>
        /// User (IdentityUser)
        /// </summary>
        
    }
}
