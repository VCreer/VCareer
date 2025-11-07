using System;
using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Dtos;

namespace VCareer.CV
{
    /// <summary>
    /// DTO cho việc tạo mới CV Template (chỉ dành cho Admin)
    /// </summary>
    public class CreateCvTemplateDto
    {
        [Required]
        [StringLength(200)]
        public string Name { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        [StringLength(500)]
        public string? PreviewImageUrl { get; set; }

        [Required]
        public string LayoutDefinition { get; set; }

        public string? Styles { get; set; }

        public string? SupportedFields { get; set; }

        [StringLength(100)]
        public string? Category { get; set; }

        public int SortOrder { get; set; }

        public bool IsActive { get; set; }

        public bool IsDefault { get; set; }

        public bool IsFree { get; set; }

        [StringLength(20)]
        public string? Version { get; set; }
    }

    /// <summary>
    /// DTO cho việc cập nhật CV Template
    /// </summary>
    public class UpdateCvTemplateDto
    {
        [StringLength(200)]
        public string? Name { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        [StringLength(500)]
        public string? PreviewImageUrl { get; set; }

        public string? LayoutDefinition { get; set; }

        public string? Styles { get; set; }

        public string? SupportedFields { get; set; }

        [StringLength(100)]
        public string? Category { get; set; }

        public int? SortOrder { get; set; }

        public bool? IsActive { get; set; }

        public bool? IsDefault { get; set; }

        public bool? IsFree { get; set; }

        [StringLength(20)]
        public string? Version { get; set; }
    }

    /// <summary>
    /// DTO để trả về CV Template (ẩn LayoutDefinition nếu cần)
    /// </summary>
    public class CvTemplateDto : EntityDto<Guid>
    {
        public string Name { get; set; }

        public string? Description { get; set; }

        public string? PreviewImageUrl { get; set; }

        /// <summary>
        /// LayoutDefinition chỉ trả về cho admin hoặc khi get detail
        /// </summary>
        public string? LayoutDefinition { get; set; }

        public string? Styles { get; set; }

        public string? SupportedFields { get; set; }

        public string? Category { get; set; }

        public int SortOrder { get; set; }

        public bool IsActive { get; set; }

        public bool IsDefault { get; set; }

        public bool IsFree { get; set; }

        public string? Version { get; set; }
    }

    /// <summary>
    /// DTO để filter và search templates
    /// </summary>
    public class GetCvTemplateListDto : PagedAndSortedResultRequestDto
    {
        public string? Category { get; set; }

        public bool? IsActive { get; set; }

        public bool? IsFree { get; set; }

        public string? SearchKeyword { get; set; }
    }
}

