using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.EntityFrameworkCore;
using VCareer.IRepositories.TokenRepository;
using VCareer.Models.Token;
using Volo.Abp.Domain.Repositories.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore;

namespace VCareer.Repositories.TokenRepositories
{
    public class RefreshTokenRepository : EfCoreRepository<VCareerDbContext, RefreshToken, Guid>, IRefreshtokenRepository
    {
        public RefreshTokenRepository(IDbContextProvider<VCareerDbContext> dbContextProvider) : base(dbContextProvider)
        {
        }

        public async Task<RefreshToken?> FindByTokenAsync(string refreshToken)
        {
            return await (await GetDbSetAsync()).FirstOrDefaultAsync(t => t.Token == refreshToken);
        }
    }
}
