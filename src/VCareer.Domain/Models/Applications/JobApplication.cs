using System;
using System.ComponentModel.DataAnnotations;
using VCareer.Models.Companies;
using VCareer.Models.Users;
using VCareer.Models.CV;
using Volo.Abp.Domain.Entities.Auditing;

namespace VCareer.Models.Applications
{
    /// <summary>
    /// Đơn ứng tuyển công việc
    /// </summary>
    public class JobApplication : FullAuditedAggregateRoot<Guid>
    {
        /// <summary>
        /// ID công việc ứng tuyển (Job_Posting)
        /// </summary>
        [Required]
        public Guid JobId { get; set; }

        /// <summary>
        /// ID ứng viên
        /// </summary>
        [Required]
        public Guid CandidateId { get; set; }

        /// <summary>
        /// ID công ty (từ Job_Posting.RecruiterProfile.CompanyId)
        /// </summary>
        [Required]
        public int CompanyId { get; set; }

        /// <summary>
        /// Loại CV sử dụng: "Online" (CandidateCv), "Uploaded" (UploadedCv)
        /// </summary>
        [Required]
        [StringLength(20)]
        public string CVType { get; set; }

        /// <summary>
        /// ID CV online (CandidateCv) - nếu CVType = "Online"
        /// </summary>
        public Guid? CandidateCvId { get; set; }

        /// <summary>
        /// ID CV đã tải lên (UploadedCv) - nếu CVType = "Uploaded"
        /// </summary>
        public Guid? UploadedCvId { get; set; }

        /// <summary>
        /// Thư xin việc/Cover letter
        /// </summary>
        [StringLength(2000)]
        public string? CoverLetter { get; set; }

        /// <summary>
        /// Trạng thái ứng tuyển: "Pending", "Reviewed", "Shortlisted", "Interviewed", "Accepted", "Rejected", "Withdrawn"
        /// </summary>
        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "Pending";

        /// <summary>
        /// Ghi chú từ nhà tuyển dụng
        /// </summary>
        [StringLength(1000)]
        public string? RecruiterNotes { get; set; }

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
        public string? RejectionReason { get; set; }

        /// <summary>
        /// Ngày hẹn phỏng vấn
        /// </summary>
        public DateTime? InterviewDate { get; set; }

        /// <summary>
        /// Địa điểm phỏng vấn
        /// </summary>
        [StringLength(200)]
        public string? InterviewLocation { get; set; }

        /// <summary>
        /// Ghi chú phỏng vấn
        /// </summary>
        [StringLength(1000)]
        public string? InterviewNotes { get; set; }

        /// <summary>
        /// Ngày ứng viên hủy ứng tuyển
        /// </summary>
        public DateTime? WithdrawnAt { get; set; }

        /// <summary>
        /// Lý do hủy ứng tuyển
        /// </summary>
        [StringLength(500)]
        public string? WithdrawalReason { get; set; }

        // Navigation Properties
        public virtual CandidateProfile? Candidate { get; set; }
        public virtual Company? Company { get; set; }
        public virtual CandidateCv? CandidateCv { get; set; }
        public virtual UploadedCv? UploadedCv { get; set; }
    }
}
