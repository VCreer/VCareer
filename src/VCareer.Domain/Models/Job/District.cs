using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Volo.Abp.Domain.Entities.Auditing;

namespace VCareer.Models.Job
{
    public class District : FullAuditedAggregateRoot<int>
    {
        /// <summary>
        /// ID tỉnh/thành phố
        /// </summary>
        public int ProvinceId { get; set; }

        /// <summary>
        /// Tên quận/huyện
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Mã quận/huyện (nếu có)
        /// </summary>
        public string Code { get; set; }

        /// <summary>
        /// Trạng thái hoạt động
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Navigation property - Tỉnh/thành phố
        /// </summary>
        public virtual Province Province { get; set; }
    }








}
