using System;
using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Dtos;

namespace VCareer.Application.Contracts.Applications
{
    /// <summary>
    /// DTO để nộp đơn ứng tuyển với CV online (CandidateCv)
    /// </summary>
    public class ApplyWithOnlineCVDto
    {
        /// <summary>
        /// ID công việc ứng tuyển
        /// </summary>
        [Required]
        public Guid JobId { get; set; }

        /// <summary>
        /// ID CV online (CandidateCv)
        /// </summary>
        [Required]
        public Guid CandidateCvId { get; set; }

        /// <summary>
        /// Thư xin việc/Cover letter (optional)
        /// </summary>
        [StringLength(2000)]
        public string? CoverLetter { get; set; }
    }

    /// <summary>
    /// DTO để nộp đơn ứng tuyển với CV đã tải lên (UploadedCv)
    /// </summary>
    public class ApplyWithUploadedCVDto
    {
        /// <summary>
        /// ID công việc ứng tuyển
        /// </summary>
        [Required]
        public Guid JobId { get; set; }

        /// <summary>
        /// ID CV đã tải lên (UploadedCv)
        /// </summary>
        [Required]
        public Guid UploadedCvId { get; set; }

        /// <summary>
        /// Thư xin việc/Cover letter (optional)
        /// </summary>
        [StringLength(2000)]
        public string? CoverLetter { get; set; }
    }

    /// <summary>
    /// DTO cập nhật trạng thái đơn ứng tuyển (cho nhà tuyển dụng)
    /// </summary>
    public class UpdateApplicationStatusDto
    {
        /// <summary>
        /// Trạng thái mới: "Pending", "Reviewed", "Shortlisted", "Interviewed", "Accepted", "Rejected"
        /// </summary>
        [Required]
        [StringLength(20)]
        public string Status { get; set; }

        /// <summary>
        /// Ghi chú từ nhà tuyển dụng
        /// </summary>
        [StringLength(1000)]
        public string? RecruiterNotes { get; set; }

        /// <summary>
        /// Điểm đánh giá (1-5)
        /// </summary>
        [Range(1, 5)]
        public int? Rating { get; set; }

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
    }

    /// <summary>
    /// DTO hủy đơn ứng tuyển (cho ứng viên)
    /// </summary>
    public class WithdrawApplicationDto
    {
        /// <summary>
        /// Lý do hủy ứng tuyển
        /// </summary>
        [StringLength(500)]
        public string? WithdrawalReason { get; set; }
    }

    /// <summary>
    /// DTO thông tin đơn ứng tuyển
    /// </summary>
    public class ApplicationDto : FullAuditedEntityDto<Guid>
    {
        /// <summary>
        /// ID công việc ứng tuyển
        /// </summary>
        public Guid JobId { get; set; }

        /// <summary>
        /// Tên công việc
        /// </summary>
        public string? JobTitle { get; set; }

        /// <summary>
        /// ID ứng viên
        /// </summary>
        public Guid CandidateId { get; set; }

        /// <summary>
        /// Tên ứng viên
        /// </summary>
        public string? CandidateName { get; set; }

        /// <summary>
        /// ID công ty
        /// </summary>
        public int CompanyId { get; set; }

        /// <summary>
        /// Tên công ty
        /// </summary>
        public string? CompanyName { get; set; }

        /// <summary>
        /// Loại CV sử dụng: "Online" hoặc "Uploaded"
        /// </summary>
        public string CVType { get; set; }

        /// <summary>
        /// ID CV online (CandidateCv)
        /// </summary>
        public Guid? CandidateCvId { get; set; }

        /// <summary>
        /// Tên CV online
        /// </summary>
        public string? CandidateCvName { get; set; }

        /// <summary>
        /// ID CV đã tải lên (UploadedCv)
        /// </summary>
        public Guid? UploadedCvId { get; set; }

        /// <summary>
        /// Tên CV đã tải lên
        /// </summary>
        public string? UploadedCvName { get; set; }

        /// <summary>
        /// Thư xin việc
        /// </summary>
        public string? CoverLetter { get; set; }

        /// <summary>
        /// Trạng thái ứng tuyển
        /// </summary>
        public string Status { get; set; }

        /// <summary>
        /// Ghi chú từ nhà tuyển dụng
        /// </summary>
        public string? RecruiterNotes { get; set; }

        /// <summary>
        /// Điểm đánh giá
        /// </summary>
        public int? Rating { get; set; }

        /// <summary>
        /// Ngày xem hồ sơ
        /// </summary>
        public DateTime? ViewedAt { get; set; }

        /// <summary>
        /// Ngày phản hồi
        /// </summary>
        public DateTime? RespondedAt { get; set; }

        /// <summary>
        /// Lý do từ chối
        /// </summary>
        public string? RejectionReason { get; set; }

        /// <summary>
        /// Ngày hẹn phỏng vấn
        /// </summary>
        public DateTime? InterviewDate { get; set; }

        /// <summary>
        /// Địa điểm phỏng vấn
        /// </summary>
        public string? InterviewLocation { get; set; }

        /// <summary>
        /// Ghi chú phỏng vấn
        /// </summary>
        public string? InterviewNotes { get; set; }

        /// <summary>
        /// Ngày hủy ứng tuyển
        /// </summary>
        public DateTime? WithdrawnAt { get; set; }

        /// <summary>
        /// Lý do hủy ứng tuyển
        /// </summary>
        public string? WithdrawalReason { get; set; }
    }

    /// <summary>
    /// DTO danh sách đơn ứng tuyển
    /// </summary>
    public class GetApplicationListDto : PagedAndSortedResultRequestDto
    {
        /// <summary>
        /// ID công việc (lọc theo công việc)
        /// </summary>
        public Guid? JobId { get; set; }

        /// <summary>
        /// ID ứng viên (lọc theo ứng viên)
        /// </summary>
        public Guid? CandidateId { get; set; }

        /// <summary>
        /// ID công ty (lọc theo công ty)
        /// </summary>
        public int? CompanyId { get; set; }

        /// <summary>
        /// Trạng thái ứng tuyển
        /// </summary>
        public string? Status { get; set; }

        /// <summary>
        /// Loại CV
        /// </summary>
        public string? CVType { get; set; }

        /// <summary>
        /// Từ ngày ứng tuyển
        /// </summary>
        public DateTime? FromDate { get; set; }

        /// <summary>
        /// Đến ngày ứng tuyển
        /// </summary>
        public DateTime? ToDate { get; set; }

        /// <summary>
        /// Có được xem chưa
        /// </summary>
        public bool? IsViewed { get; set; }

        /// <summary>
        /// Có được phản hồi chưa
        /// </summary>
        public bool? IsResponded { get; set; }
    }

    /// <summary>
    /// DTO thống kê đơn ứng tuyển
    /// </summary>
    public class ApplicationStatisticsDto
    {
        /// <summary>
        /// Tổng số đơn ứng tuyển
        /// </summary>
        public int TotalApplications { get; set; }

        /// <summary>
        /// Số đơn chờ xử lý
        /// </summary>
        public int PendingApplications { get; set; }

        /// <summary>
        /// Số đơn đã xem
        /// </summary>
        public int ReviewedApplications { get; set; }

        /// <summary>
        /// Số đơn vào vòng phỏng vấn
        /// </summary>
        public int ShortlistedApplications { get; set; }

        /// <summary>
        /// Số đơn được chấp nhận
        /// </summary>
        public int AcceptedApplications { get; set; }

        /// <summary>
        /// Số đơn bị từ chối
        /// </summary>
        public int RejectedApplications { get; set; }

        /// <summary>
        /// Số đơn bị hủy
        /// </summary>
        public int WithdrawnApplications { get; set; }

        /// <summary>
        /// Tỷ lệ phản hồi (%)
        /// </summary>
        public decimal ResponseRate { get; set; }

        /// <summary>
        /// Tỷ lệ chấp nhận (%)
        /// </summary>
        public decimal AcceptanceRate { get; set; }
    }
}
