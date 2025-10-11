using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Models.Job;
using Volo.Abp.Domain.Repositories;

namespace VCareer.Repositories.Job
{
    public interface ITagRepository : IRepository<Tag, Guid>
    {

        // hàm này tìm tag theo tên
        Task<Tag> GetByNameAsync(string name); 

        // hàm này lấy các tag phổ biến
        Task<List<Tag>> GetPopularTagsAsync(int topN); 
    }
}
