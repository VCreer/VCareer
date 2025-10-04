using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Volo.Abp.Domain.Entities;

namespace VCareer.Models.Companies
{
    public class Industry : Entity<int>
    {
        public string Name { get; set; }
        public ICollection<CompanyIndustry> CompanyIndustries { get; private set; }
    }
}