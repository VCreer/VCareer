using Volo.Abp.ObjectMapping;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Dto.JobDto;
using VCareer.IRepositories.Category;
using VCareer.IRepositories.Job;
using VCareer.IServices.IJobServices;
using VCareer.Models.JobCategory;
using Volo.Abp;
using Volo.Abp.Application.Services;

using static VCareer.Dto.JobDto.JobTagViewDto;

namespace VCareer.Services.Job
{
    public class JobTagService : ApplicationService, IJobTagService
    {
        private readonly IJobTagRepository _jobTagRepository;
        private readonly IJobPostRepository _jobPostRepository;
        private readonly ITagRepository _tagRepository;

        public JobTagService(IJobTagRepository jobTagRepository, IJobPostRepository jobPostRepository,ITagRepository tagRepository) 
        {
            _jobTagRepository = jobTagRepository;
            _jobPostRepository = jobPostRepository;
            _tagRepository = tagRepository;
        }
        public async Task AddTagsToJob(JobTagCreateUpdateDto dto)
        {
            if (dto.TagIds == null || dto.TagIds.Count == 0) return;
            var tags = await _tagRepository.GetListAsync(x => dto.TagIds.Contains(x.Id));

            var job = await _jobPostRepository.GetAsync(x => x.Id == dto.JobId);
            if (job == null) throw new BusinessException($"Job Not Found.");

            List<JobTag> listJobTag = new List<JobTag>();
            foreach (var tag in tags)
            {
                listJobTag.Add(new JobTag { JobId = job.Id, TagId = tag.Id});
            }
            if (listJobTag.Count == 0) return;
            await _jobTagRepository.InsertManyAsync(listJobTag,true);
        }

        public async Task<List<JobTagViewDto>> GetTagByJobId(Guid jobId)
        {
            var job = await _jobPostRepository.GetAsync(x => x.Id == jobId);
            if (job == null) throw new BusinessException($"Job Not Found.");

            var tags = await _jobTagRepository.GetListAsync(x => x.JobId == jobId);
            if (tags == null) return new List<JobTagViewDto>();
            return ObjectMapper.Map<List<JobTag>, List<JobTagViewDto>>(tags);
        }

        public async Task<JobTagViewDto> GetTagByTagId(int tagId)
        {
            var tag = await _jobTagRepository.GetAsync(x => x.TagId == tagId);
            if (tag == null) throw new BusinessException($"Tag Not Found.");
            return ObjectMapper.Map<JobTag, JobTagViewDto>(tag);
        }

        public async Task UpdateTagOfJob(JobTagCreateUpdateDto dto)
        {
            var job = await _jobPostRepository.GetAsync(x => x.Id == dto.JobId);
            if (job == null)
                throw new BusinessException("Job Not Found.");

            // 1. Lấy danh sách JobTag hiện tại
            var oldTags = await _jobTagRepository.GetListAsync(x => x.JobId == dto.JobId);
            var oldTagIds = oldTags.Select(x => x.TagId).ToList();

            // 2. TagIds người dùng muốn giữ lại
            var newTagIds = dto.TagIds;

            // 3. Tính các tag cần xóa
            var tagIdsToDelete = oldTagIds.Where(x => !newTagIds.Contains(x)).ToList();
            if (tagIdsToDelete.Count > 0)
            {
                var tagsToDelete = oldTags.Where(x => tagIdsToDelete.Contains(x.TagId)).ToList();
                await _jobTagRepository.DeleteManyAsync(tagsToDelete);
            }

            // 4. Tính các tag cần thêm
            var tagIdsToAdd = newTagIds.Where(x => !oldTagIds.Contains(x)).ToList();
            if (tagIdsToAdd.Count > 0)
            {
                var tagsToAdd = tagIdsToAdd
                    .Select(tagId => new JobTag { JobId = dto.JobId, TagId = tagId })
                    .ToList();

                await _jobTagRepository.InsertManyAsync(tagsToAdd);
            }
        }

    }
}
