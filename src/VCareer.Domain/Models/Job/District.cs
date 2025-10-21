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
        public int ProvinceId { get; set; }

        //tên phường
        public string Name { get; set; }

        // thuộc tỉnh nào
        public virtual Province Province { get; set; }
    }








}
