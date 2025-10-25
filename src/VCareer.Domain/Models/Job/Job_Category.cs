using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Volo.Abp.Domain.Entities.Auditing;

namespace VCareer.Models.Job
{
    public class Job_Category : FullAuditedAggregateRoot<Guid>
    {
        /// <summary>
        /// Tên danh mục nghề nghiệp
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Slug cho URL (SEO-friendly)
        /// </summary>
        public string Slug { get; set; }

        /// <summary>
        /// Mô tả ngắn về danh mục
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// ID danh mục cha (null nếu là root)
        /// </summary>
        public Guid? ParentId { get; set; }

        /// <summary>
        /// Thứ tự hiển thị
        /// </summary>
        public int SortOrder { get; set; } = 0;

        /// <summary>
        /// Trạng thái hoạt động
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Số lượng job trong danh mục này (bao gồm cả children)
        /// </summary>
        public int JobCount { get; set; } = 0;

        /// <summary>
        /// Navigation property - Danh mục cha
        /// </summary>
        public virtual Job_Category Parent { get; set; }

        /// <summary>
        /// Navigation property - Danh sách danh mục con
        /// </summary>
        public virtual ICollection<Job_Category> Children { get; set; } = new List<Job_Category>();

        /// <summary>
        /// Navigation property - Danh sách job posting
        /// </summary>
        public virtual ICollection<Job_Posting> JobPostings { get; set; } = new List<Job_Posting>();
    }
}
