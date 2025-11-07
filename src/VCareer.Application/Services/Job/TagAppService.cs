using AutoMapper;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Job.JobPosting.ISerices;
using VCareer.Models.Job;
using Volo.Abp.Application.Services;

namespace VCareer.Services.Job
{
    public class TagAppService : ApplicationService, ITagAppService
    {
        //private readonly ITagRepository _repo;
        //private readonly IMapper _mapper;

        //// Constructor...

        //public async Task<TagDto> CreateOrGetTagAsync(string name)
        //{
        //    name = name.ToLower().Trim();
        //    var tag = await _repo.GetByNameAsync(name);
        //    if (tag == null)
        //    {
        //        tag = new Tag { Name = name, Slug = name.Replace(" ", "-") };
        //        await _repo.InsertAsync(tag);
        //    }
        //    return _mapper.Map<TagDto>(tag);
        //}

        //public async Task<List<TagDto>> GetPopularTagsAsync(int topN)
        //{
        //    var tags = await _repo.GetPopularTagsAsync(topN);
        //    return _mapper.Map<List<TagDto>>(tags);
        //}
    }
}
