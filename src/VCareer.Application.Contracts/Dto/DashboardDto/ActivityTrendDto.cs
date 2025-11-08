using System;
using System.Collections.Generic;

namespace VCareer.Dto.DashboardDto
{
    /// <summary>
    /// DTO cho biểu đồ xu hướng hoạt động theo thời gian
    /// </summary>
    public class ActivityTrendDto
    {
        public List<DateActivityCountDto> DailyTrend { get; set; }
        public List<DateActivityCountDto> WeeklyTrend { get; set; }
        public List<DateActivityCountDto> MonthlyTrend { get; set; }
        
        public ActivityTrendDto()
        {
            DailyTrend = new List<DateActivityCountDto>();
            WeeklyTrend = new List<DateActivityCountDto>();
            MonthlyTrend = new List<DateActivityCountDto>();
        }
    }
    
    public class DateActivityCountDto
    {
        public DateTime Date { get; set; }
        public int Count { get; set; }
        public string Label { get; set; } // e.g., "Jan 2024", "Week 1", etc.
    }
}
























