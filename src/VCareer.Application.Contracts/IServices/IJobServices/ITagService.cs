using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Dto.Category;
using Volo.Abp.Application.Services;

namespace VCareer.IServices.IJobServices
{
    public interface ITagService : IApplicationService
    {
        public Task CreateTagsAsync(List<string> listName);
        public Task CreateTagAsync(string name);
        public Task GetTagsByIdAsync(int tagId);
        public Task UpdateTagAsync(TagUpdateDto tagUpdateDto);
        public Task DeleteTagAsync(int tagId);

    }
}
