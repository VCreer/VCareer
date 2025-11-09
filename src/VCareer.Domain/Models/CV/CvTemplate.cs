using System;
using System.ComponentModel.DataAnnotations;
using Volo.Abp.Domain.Entities.Auditing;

namespace VCareer.Models.CV
{
    /// <summary>
    /// CV Template entity - Lưu thông tin về các mẫu CV có sẵn
    /// </summary>
    public class CvTemplate : FullAuditedAggregateRoot<Guid>
    {
        /// <summary>
        /// Tên template (ví dụ: "Modern Blue", "Classic Gray")
        /// </summary>
        [Required]
        [StringLength(200)]
        public string Name { get; set; }

        /// <summary>
        /// Mô tả template
        /// </summary>
        [StringLength(500)]
        public string? Description { get; set; }

        /// <summary>
        /// URL hình ảnh preview của template
        /// </summary>
        [StringLength(500)]
        public string? PreviewImageUrl { get; set; }

        /// <summary>
        /// HTML/CSS layout definition - Template HTML với placeholders
        /// Ví dụ: {{fullName}}, {{email}}, {{workExperience}}
        /// </summary>
        [Required]
        public string LayoutDefinition { get; set; }

        /// <summary>
        /// CSS styles cho template
        /// </summary>
        public string? Styles { get; set; }

        /// <summary>
        /// Danh sách các fields được hỗ trợ trong template (JSON array)
        /// Ví dụ: ["fullName", "email", "phone", "workExperience", "education"]
        /// </summary>
        public string? SupportedFields { get; set; }

        /// <summary>
        /// Category/Tag của template (ví dụ: "Modern", "Classic", "Creative")
        /// </summary>
        [StringLength(100)]
        public string? Category { get; set; }

        /// <summary>
        /// Thứ tự hiển thị (số càng nhỏ hiển thị càng trước)
        /// </summary>
        public int SortOrder { get; set; }

        /// <summary>
        /// Template có đang active không (chỉ template active mới hiển thị)
        /// </summary>
        public bool IsActive { get; set; }

        /// <summary>
        /// Template có phải template mặc định không
        /// </summary>
        public bool IsDefault { get; set; }

        /// <summary>
        /// Template có miễn phí không (true = free, false = premium)
        /// </summary>
        public bool IsFree { get; set; }

        /// <summary>
        /// Version của template (để track changes)
        /// </summary>
        [StringLength(20)]
        public string? Version { get; set; }
    }
}

