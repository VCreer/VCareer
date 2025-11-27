using System;
using System.Collections.Generic;
using VCareer.Constants;
using VCareer.Constants.JobConstant;

namespace VCareer.Dto.JobDto
{
    public class JobSearchInputDto
    {
        public string? Keyword { get; set; }
        /// Danh sách Category IDs (FE gửi leaf nodes)
        public List<Guid>? CategoryIds { get; set; }
        public List<int>? ProvinceCodes { get; set; }
        public List<int>? WardCodes { get; set; }
        public ExperienceLevel? ExperienceFilter { get; set; }
        public double? MinSalary { get; set; }
        public double? MaxSalary { get; set; }
        public bool? SalaryDeal { get; set; }
        public List<EmploymentType>? EmploymentTypes { get; set; } /// Loại hình công việc (Full-time, Part-time, Remote...)
        public List<PositionType>? PositionTypes { get; set; }  /// Vị trí (Intern, Junior, Senior...)
        public int SkipCount { get; set; } = 0; /// Skip count (cho pagination)
        public int MaxResultCount { get; set; } = 20;    /// Max result count (default 20)
    }


}



