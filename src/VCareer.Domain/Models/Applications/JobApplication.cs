using System;
using System.ComponentModel.DataAnnotations;
using VCareer.Models.Companies;
using VCareer.Models.Users;
using Volo.Abp.Domain.Entities.Auditing;

namespace VCareer.Models.Applications
{
    /// <summary>
    /// Đơn ứng tuyển công việc
    /// </summary>
    public class JobApplication : FullAuditedAggregateRoot<Guid>
    {
        /// <summary>
        /// ID công việc ứng tuyển
        /// </summary>
        [Required]
        public Guid JobId { get; set; }

        /// <summary>
        /// ID ứng viên
        /// </summary>
        [Required]
        public Guid CandidateId { get; set; }

        /// <summary>
        /// ID công ty
        /// </summary>
        [Required]
        public Guid CompanyId { get; set; }

        /// <summary>
        /// Loại CV sử dụng: "Library" (từ thư viện), "Upload" (tải lên mới)
        /// </summary>
        [Required]
        [StringLength(20)]
        public string CVType { get; set; }

        /// <summary>
        /// ID CV từ thư viện (nếu CVType = "Library")
        /// </summary>
        public Guid? CVId { get; set; }

        /// <summary>
        /// URL file CV tải lên (nếu CVType = "Upload")
        /// </summary>
        [StringLength(500)]
        public string UploadedCVUrl { get; set; }

        /// <summary>
        /// Tên file CV tải lên
        /// </summary>
        [StringLength(255)]
        public string UploadedCVName { get; set; }

        /// <summary>
        /// Kích thước file CV (bytes)
        /// </summary>
        public long? UploadedCVSize { get; set; }

        /// <summary>
        /// Loại file CV tải lên
        /// </summary>
        [StringLength(50)]
        public string UploadedCVType { get; set; }

        /// <summary>
        /// Thông tin ứng viên khi tải CV lên
        /// </summary>
        [StringLength(100)]
        public string CandidateName { get; set; }

        /// <summary>
        /// Email ứng viên khi tải CV lên
        /// </summary>
        [StringLength(100)]
        public string CandidateEmail { get; set; }

        /// <summary>
        /// Số điện thoại ứng viên khi tải CV lên
        /// </summary>
        [StringLength(20)]
        public string CandidatePhone { get; set; }

        /// <summary>
        /// Thư xin việc/Cover letter
        /// </summary>
        [StringLength(2000)]
        public string CoverLetter { get; set; }

        /// <summary>
        /// Trạng thái ứng tuyển: "Pending", "Reviewed", "Shortlisted", "Interviewed", "Accepted", "Rejected"
        /// </summary>
        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "Pending";

        /// <summary>
        /// Ghi chú từ nhà tuyển dụng
        /// </summary>
        [StringLength(1000)]
        public string RecruiterNotes { get; set; }

        /// <summary>
        /// Điểm đánh giá từ nhà tuyển dụng (1-5)
        /// </summary>
        public int? Rating { get; set; }

        /// <summary>
        /// Ngày xem hồ sơ bởi nhà tuyển dụng
        /// </summary>
        public DateTime? ViewedAt { get; set; }

        /// <summary>
        /// ID nhà tuyển dụng đã xem
        /// </summary>
        public Guid? ViewedBy { get; set; }

        /// <summary>
        /// Ngày phản hồi từ nhà tuyển dụng
        /// </summary>
        public DateTime? RespondedAt { get; set; }

        /// <summary>
        /// ID nhà tuyển dụng đã phản hồi
        /// </summary>
        public Guid? RespondedBy { get; set; }

        /// <summary>
        /// Lý do từ chối (nếu Status = "Rejected")
        /// </summary>
        [StringLength(500)]
        public string RejectionReason { get; set; }

        /// <summary>
        /// Ngày hẹn phỏng vấn
        /// </summary>
        public DateTime? InterviewDate { get; set; }

        /// <summary>
        /// Địa điểm phỏng vấn
        /// </summary>
        [StringLength(200)]
        public string InterviewLocation { get; set; }

        /// <summary>
        /// Ghi chú phỏng vấn
        /// </summary>
        [StringLength(1000)]
        public string InterviewNotes { get; set; }

        /// <summary>
        /// Có được ứng viên quan tâm không
        /// </summary>
        public bool IsInterested { get; set; } = true;

        /// <summary>
        /// Ngày ứng viên hủy ứng tuyển
        /// </summary>
        public DateTime? WithdrawnAt { get; set; }

        /// <summary>
        /// Lý do hủy ứng tuyển
        /// </summary>
        [StringLength(500)]
        public string WithdrawalReason { get; set; }

        // Navigation Properties
        public virtual CandidateProfile Candidate { get; set; }
        public virtual Company Company { get; set; }
        public virtual CurriculumVitae CV { get; set; }
    }

    /// <summary>
    /// Tài liệu đính kèm trong đơn ứng tuyển
    /// </summary>
    public class ApplicationDocument : FullAuditedAggregateRoot<Guid>
    {
        /// <summary>
        /// ID đơn ứng tuyển
        /// </summary>
        [Required]
        public Guid ApplicationId { get; set; }

        /// <summary>
        /// Tên tài liệu
        /// </summary>
        [Required]
        [StringLength(255)]
        public string DocumentName { get; set; }

        /// <summary>
        /// URL file tài liệu
        /// </summary>
        [Required]
        [StringLength(500)]
        public string DocumentUrl { get; set; }

        /// <summary>
        /// Loại tài liệu: "CV", "CoverLetter", "Certificate", "Portfolio", "Other"
        /// </summary>
        [Required]
        [StringLength(20)]
        public string DocumentType { get; set; }

        /// <summary>
        /// Kích thước file (bytes)
        /// </summary>
        public long FileSize { get; set; }

        /// <summary>
        /// Loại MIME của file
        /// </summary>
        [StringLength(100)]
        public string MimeType { get; set; }

        /// <summary>
        /// Mô tả tài liệu
        /// </summary>
        [StringLength(500)]
        public string Description { get; set; }

        /// <summary>
        /// Có phải tài liệu chính không
        /// </summary>
        public bool IsPrimary { get; set; } = false;

        /// <summary>
        /// Thứ tự hiển thị
        /// </summary>
        public int DisplayOrder { get; set; } = 0;

        // Navigation Properties
        public virtual JobApplication Application { get; set; }
    }
}
