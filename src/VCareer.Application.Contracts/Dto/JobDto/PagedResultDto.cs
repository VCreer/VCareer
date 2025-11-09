using System.Collections.Generic;

namespace VCareer.Dto.JobDto
{
    public class PagedResultDto<T>
    {
        public List<T> Items { get; set; } = new List<T>();
        public long TotalCount { get; set; }

        public PagedResultDto()
        {
        }

        public PagedResultDto(List<T> items, long totalCount)
        {
            Items = items;
            TotalCount = totalCount;
        }
    }
}






