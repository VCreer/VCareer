using System.Collections.Generic;

namespace VCareer.Dto.Job
{
    /// <summary>
    /// Paged result DTO cho danh sách job
    /// </summary>
    public class PagedResultDto<T>
    {
        /// <summary>
        /// Danh sách items
        /// </summary>
        public List<T> Items { get; set; } = new List<T>();

        /// <summary>
        /// Tổng số records
        /// </summary>
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






