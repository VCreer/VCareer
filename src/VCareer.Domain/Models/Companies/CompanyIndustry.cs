using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Volo.Abp.Domain.Entities;

namespace VCareer.Models.Companies
{
    public class CompanyIndustry : Entity<int>
    {
        public int CompanyId { get; set; }
        public int IndustryId { get; set; }
        public Company Company { get; private set; }
        public Industry Industry { get; private set; }
    }
}