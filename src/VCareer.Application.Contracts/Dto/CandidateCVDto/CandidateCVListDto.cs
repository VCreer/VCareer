using System;

namespace VCareer.Dto.CandidateCVDto
{
    /// <summary>
    /// DTO để hiển thị CV trong danh sách cho Recruiter xem
    /// </summary>
    public class CandidateCVListDto
    {
        /// <summary>
        /// ID của CV
        /// </summary>
        public Guid CVId { get; set; }
        
        /// <summary>
        /// Tên CV
        /// </summary>
        public string CVName { get; set; }
        
        /// <summary>
        /// Loại CV: Online hoặc Upload
        /// </summary>
        public string CVType { get; set; }
        
        /// <summary>
        /// Trạng thái CV
        /// </summary>
        public string Status { get; set; }
        
        /// <summary>
        /// Họ tên candidate
        /// </summary>
        public string FullName { get; set; }
        
        /// <summary>
        /// Email candidate
        /// </summary>
        public string Email { get; set; }
        
        /// <summary>
        /// Số điện thoại
        /// </summary>
        public string PhoneNumber { get; set; }
        
        /// <summary>
        /// Địa chỉ
        /// </summary>
        public string Address { get; set; }
        
        /// <summary>
        /// Mục tiêu nghề nghiệp
        /// </summary>
        public string CareerObjective { get; set; }
        
        /// <summary>
        /// Kinh nghiệm làm việc (JSON)
        /// </summary>
        public string WorkExperience { get; set; }
        
        /// <summary>
        /// Học vấn (JSON)
        /// </summary>
        public string Education { get; set; }
        
        /// <summary>
        /// Kỹ năng (JSON)
        /// </summary>
        public string Skills { get; set; }
        
        /// <summary>
        /// URL file CV (nếu là Upload type)
        /// </summary>
        public string FileUrl { get; set; }
        
        /// <summary>
        /// Tên file gốc
        /// </summary>
        public string OriginalFileName { get; set; }
        
        /// <summary>
        /// Ngày tạo CV
        /// </summary>
        public DateTime CreationTime { get; set; }
        
        /// <summary>
        /// Ngày cập nhật lần cuối
        /// </summary>
        public DateTime? LastModificationTime { get; set; }
        
        /// <summary>
        /// ID của Candidate
        /// </summary>
        public Guid CandidateId { get; set; }
    }
}

