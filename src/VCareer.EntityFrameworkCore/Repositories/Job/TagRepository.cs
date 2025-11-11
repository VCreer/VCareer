using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.EntityFrameworkCore;
using VCareer.IRepositories.Job;
using VCareer.Models.Job;
using Volo.Abp.Domain.Repositories.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore;

namespace VCareer.Repositories.Job
{
    public class TagRepository : EfCoreRepository<VCareerDbContext, Tag, int>, ITagRepository
    {
        public TagRepository(IDbContextProvider<VCareerDbContext> dbContextProvider) : base(dbContextProvider) { }


        // tìm kiếm tag theo tên, chuyển hết sang chữ thường
        public async Task<Tag> GetByNameAsync(string name)
        {
            return await GetAsync(t => t.Name == name.ToLower());
        }


        //tìm kei
        public async Task<List<Tag>> GetPopularTagsAsync(int topN)
        {
            var dbContext = await GetDbContextAsync();
            // Query với join count.
            var query = (from t in await GetQueryableAsync()
                         join jt in dbContext.Set<JobPostTag>() on t.Id equals jt.TagId
                         group t by t.Id into g
                         select new { Tag = g.FirstOrDefault(), Count = g.Count() })
                        .OrderByDescending(x => x.Count)
                        .Take(topN)
                        .Select(x => x.Tag);
            return await AsyncExecuter.ToListAsync(query);
        }
    }
}
