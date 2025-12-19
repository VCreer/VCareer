using System;
using System.ComponentModel.DataAnnotations;
using VCareer.Models.ActivityLogs;
using Volo.Abp.Application.Dtos;

namespace VCareer.Dto.ActivityLogDto
{
    public class ActivityLogFilterDto : PagedAndSortedResultRequestDto
    {
        public ActivityType? ActivityType { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        
        // SearchKeyword is optional - không bắt buộc
        public string? SearchKeyword { get; set; }
    }
}







































