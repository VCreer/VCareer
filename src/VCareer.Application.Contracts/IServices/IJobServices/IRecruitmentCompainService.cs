using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Volo.Abp.Application.Services;

namespace VCareer.IServices.IJobServices
{
    public interface IRecruitmentCompainService :IApplicationService
    {
        public Task CreateRecruitmentCompain();
        public Task DeleteRecruitmentCompain();
        public Task UpdateRecruitmentCompain();
    }
}
