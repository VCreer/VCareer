using System;
using System.ComponentModel.DataAnnotations;
using VCareer.Models.Users;
using Volo.Abp.Domain.Entities.Auditing;

namespace VCareer.Models.CV
{
    /// <summary>
    /// Candidate CV entity - Lưu CV của từng ứng viên với template và dữ liệu JSON
    /// </summary>
    public class CandidateCv : FullAuditedAggregateRoot<Guid>
    {
        /// <summary>
        /// Candidate UserId - Foreign Key đến CandidateProfile.UserId (và IdentityUser)
        /// Lưu ý: CandidateId = CandidateProfile.UserId = IdentityUser.Id
        /// </summary>
        [Required]
        public Guid CandidateId { get; set; }

        /// <summary>
        /// Template ID - Foreign Key đến CvTemplate
        /// </summary>
        [Required]
        public Guid TemplateId { get; set; }

        /// <summary>
        /// Tên CV (do candidate tự đặt)
        /// </summary>
        [Required]
        [StringLength(200)]
        public string CvName { get; set; }

        /// <summary>
        /// Dữ liệu CV dưới dạng JSON
        /// Chứa tất cả thông tin: personal info, work experience, education, skills, etc.
        /// </summary>
        [Required]
        public string DataJson { get; set; }

        /// <summary>
        /// Blocks structure dưới dạng JSON (cho block-based editor)
        /// Lưu nguyên cấu trúc blocks với thứ tự, title, meta (collapsed, pinned, etc.)
        /// Nếu có BlocksJson, sẽ ưu tiên dùng để rebuild blocks khi load.
        /// Nếu không có, sẽ fallback về DataJson để rebuild blocks.
        /// </summary>
        public string? BlocksJson { get; set; }

        /// <summary>
        /// Bản HTML đã render của CV tại thời điểm gần nhất.
        /// Đây là snapshot phục vụ cho việc xem/gửi mail nhanh,
        /// trong khi DataJson vẫn là nguồn dữ liệu chính (schema).
        /// </summary>
        public string? HtmlContent { get; set; }

        /// <summary>
        /// CV có được publish không (true = published, false = draft)
        /// </summary>
        public bool IsPublished { get; set; }

        /// <summary>
        /// CV có phải là mặc định không (chỉ 1 CV mặc định per candidate)
        /// </summary>
        public bool IsDefault { get; set; }

        /// <summary>
        /// CV có public không (cho recruiter xem)
        /// </summary>
        public bool IsPublic { get; set; }

        /// <summary>
        /// Thời gian publish (nếu có)
        /// </summary>
        public DateTime? PublishedAt { get; set; }

        /// <summary>
        /// Số lần view CV
        /// </summary>
        public int ViewCount { get; set; }

        /// <summary>
        /// Ghi chú/note của candidate về CV này
        /// </summary>
        [StringLength(1000)]
        public string? Notes { get; set; }

        // === NAVIGATION PROPERTIES ===

        /// <summary>
        /// Candidate Profile - Foreign Key đến CandidateProfile
        /// </summary>
        public CandidateProfile? CandidateProfile { get; set; }

        /// <summary>
        /// Template được sử dụng - Foreign Key đến CvTemplate
        /// </summary>
        public CvTemplate? Template { get; set; }
    }
}

