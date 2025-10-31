using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Volo.Abp.Domain.Entities.Auditing;

namespace VCareer.Models.Job
{
    public class Province : FullAuditedAggregateRoot<int>
    {
        /// <summary>
        /// Tên tỉnh/thành phố
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Mã tỉnh/thành phố
        /// </summary>
        public string Code { get; set; }

        /// <summary>
        /// Trạng thái hoạt động
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Navigation property - Danh sách quận/huyện
        /// </summary>
        public virtual ICollection<District> Districts { get; set; } = new List<District>();

        public virtual ICollection<Job_Posting> Job_Posting { get; set; } = new List<Job_Posting>();
    }
}
