using System;
using VCareer.Dto.JobDto;
using Volo.Abp.Application.Dtos;

namespace VCareer.Dto.Job
{
    /// <summary>
    /// DTO cho SavedJob (job đã lưu)
    /// </summary>
    public class SavedJobDto
    {
        public Guid JobId { get; set; }
        public string JobTitle { get; set; }
        public string CompanyName { get; set; }
        public string SalaryText { get; set; }
        public string Location { get; set; }
        public DateTime SavedAt { get; set; }
        public JobViewDto JobDetail { get; set; } // Full job details
    }

    /// <summary>
    /// DTO để check xem job đã được lưu chưa
    /// </summary>
    public class SavedJobStatusDto
    {
        public bool IsSaved { get; set; }
        public DateTime? SavedAt { get; set; }
    }
}

