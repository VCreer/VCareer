using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Models.CV;
using Volo.Abp.Domain.Entities.Auditing;
using Volo.Abp.Identity;

namespace VCareer.Models.Users
{
    public class CandidateProfile : FullAuditedAggregateRoot<Guid>
    {
        public Guid UserId { get; set; }
        public string? Email { get; set; }
        public DateTime? DateOfbirth { get; set; }
        public bool? Gender { get; set; }
        public string? Location { get; set; }
        public bool ProfileVisibility { get; set; } = true;
        public bool Status { get; set; } = true;
        public IdentityUser User { get; set; }
        public long? QuotaUsedBytes { get; set; } 
        public long? MaxQuotaBytes { get; set; }

        // Thông tin nghề nghiệp
        public string? JobTitle { get; set; } // Vị trí chuyên môn
        public string? Skills { get; set; } // Kỹ năng (có thể lưu dạng JSON hoặc string phân cách)
        public int? Experience { get; set; } // Kinh nghiệm (số năm)
        public decimal? Salary { get; set; } // Mức lương mong muốn (decimal 18,2)
        public string? WorkLocation { get; set; } // Địa điểm làm việc

        // === NAVIGATION PROPERTIES ===

        /// <summary>
        /// Danh sách CVs online của candidate này (tạo từ template)
        /// </summary>
        public ICollection<CandidateCv>? CandidateCvs { get; set; }

        /// <summary>
        /// Danh sách CVs đã upload (file) của candidate này
        /// </summary>
        public ICollection<UploadedCv>? UploadedCvs { get; set; }
    }
}
