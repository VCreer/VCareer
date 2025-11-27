using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Dto.Category;
using VCareer.Dto.JobDto;
using VCareer.IRepositories.Category;
using VCareer.IServices.IJobServices;
using VCareer.Models.JobCategory;
using Volo.Abp;
using Volo.Abp.Application.Services;

namespace VCareer.Services.Job
{
    public class TagService : ApplicationService, ITagService
    {
        private readonly ITagRepository _tagRepository;
        private readonly IJobTagRepository _jobTagRepository;
        private readonly IJobCategoryRepository _jobCategoryRepository;

        public TagService(ITagRepository tagRepository, IJobTagRepository jobTagRepository,IJobCategoryRepository jobCategoryRepository)
        {
            _tagRepository = tagRepository;
            _jobTagRepository = jobTagRepository;
            _jobCategoryRepository = jobCategoryRepository;
        }
        public async Task CreateTagsAsync(TagCreateDto dto)
        {
            if (dto.Names.Count <= 0) throw new UserFriendlyException("Tag names list cannot be empty.");
            var listTag = new List<Tag>();
            foreach (var name in dto.Names)
            {
                listTag.Add(new Tag { Name = name, CategoryId = dto.CategoryId });
            }
            await _tagRepository.InsertManyAsync(listTag);
        }

        public async Task DeleteTagsAsync(List<int> tagIds)
        {
            if (tagIds.Count == 0) throw new UserFriendlyException("Tag ids list cannot be empty.");
            var listAllowedToDelete = new List<int>();
            foreach (var tagId in tagIds)
            {
                var tagsInUse = await _jobTagRepository.GetListAsync(x => x.TagId == tagId);
                if (tagsInUse.Count == 0) listAllowedToDelete.Add(tagId); // khong co job nao su dung tag nay thi moi cho xoa0)
            }
            await _tagRepository.DeleteManyAsync(listAllowedToDelete);
        }

        public async Task<List<TagViewDto>> GetTagsByCategoryIdAsync(Guid categoryId)
        {
            var category = await _jobCategoryRepository.GetAsync(categoryId);
            if (category == null) throw new UserFriendlyException("Category not found.");

            var tags = await _tagRepository.GetListAsync(x => x.CategoryId == categoryId);
            if (tags == null) return new List<TagViewDto>();
            return ObjectMapper.Map<List<Tag>, List<TagViewDto>>(tags);
        }

        public async Task UpdateTagAsync(TagUpdateDto tagUpdateDto)
        {
            var tag = await _tagRepository.GetAsync(tagUpdateDto.TagId);
            if (tag == null) throw new UserFriendlyException("Tag not found.");

            tag.Name = tagUpdateDto.newName;
            await _tagRepository.UpdateAsync(tag);

        }
    }
}
