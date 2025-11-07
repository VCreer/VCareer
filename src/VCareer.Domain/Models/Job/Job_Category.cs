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
        /// Tên danh mục nghề nghiệp
        public string Name { get; set; }
        public string Slug { get; set; }
        public string Description { get; set; }
        public Guid? ParentId { get; set; } /// ID danh mục cha (null nếu là root)
        public int SortOrder { get; set; } = 0;/// Thứ tự hiển thị
        public bool IsActive { get; set; } = true; /// Trạng thái hoạt động
        public int JobCount { get; set; } = 0; /// Số lượng job trong danh mục này (bao gồm cả children)
        public virtual Job_Category Parent { get; set; } /// Navigation property - Danh mục cha

        public virtual ICollection<Job_Category> Children { get; set; } = new List<Job_Category>();
        public virtual ICollection<Job_Post> JobPostings { get; set; } = new List<Job_Post>();
    }
}
