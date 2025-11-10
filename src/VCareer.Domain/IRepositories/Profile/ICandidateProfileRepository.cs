using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Models.Users;
using Volo.Abp.Domain.Repositories;

namespace VCareer.IRepositories.Profile
{
    public interface ICandidateProfileRepository : IRepository<CandidateProfile, Guid>
    {
    }
}
