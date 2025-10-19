using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Models.Token;
using Volo.Abp.Domain.Repositories;

namespace VCareer.IRepositories.TokenRepository
{
    public interface IRefreshtokenRepository:IRepository<RefreshToken,Guid>
    {
        Task<RefreshToken?> FindByTokenAsync(string refreshToken);

    }
}
