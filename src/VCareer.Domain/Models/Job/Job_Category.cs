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
        // tên category
        public string Name { get; set; }
        //tên đường dẫn url cho seo
        public string Slug { get; set; }

        //id của category cha
        public Guid? ParentId { get; set; }

        //nagy tạo 
        public DateTime CreatedAt { get; set; }
        //nagy sửa
        public DateTime UpdatedAt { get; set; }
        //trang thia
        public Boolean IsActive { get; set; }
        //category cha của nó
        public virtual Job_Category Parent { get; set; }
        //nó có nhiều  chuyên môn
        public virtual ICollection<Job_Category> Children { get; set; }
        // có nhiều job posting
        public virtual ICollection<Job_Posting> JobPostings { get; set; }
    }
}
