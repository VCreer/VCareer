using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using VCareer.Model;
using Volo.Abp.Application.Dtos;

namespace VCareer.Job
{

    public class JobSearchInputDto : PagedAndSortedResultRequestDto
    {
        public string? Keyword { get; set; } // Text search (title, desc, tags, location names, category path)
        public List<Guid>? CategoryIds { get; set; } // List leaf category Guids (node cuối)
        public List<int>? ProvinceIds { get; set; } // List ProvinceIds (thường 1, nhưng list để flex)
        public List<int>? DistrictIds { get; set; } // List DistrictIds (nhiều, thuộc province hoặc không)


        public EmploymentTye? EmploymentType { get; set; }

        public PositionTye? PositionType { get; set; }

        public decimal? SalaryMin { get; set; }
        public decimal? SalaryMax { get; set; }

        public int? ExperienceYearsMin { get; set; }
        public int? ExperienceYearsMax { get; set; }

        public string SortBy { get; set; } // "newest", "salary", "urgent" (default "newest")
    }

    // cây category 
    public class CategoryTreeDto
    {


        public Guid CategoryId { get; set; }


        public string CategoryName { get; set; }

        public List<CategoryTreeDto> Children { get; set; }

        public string FullPath { get; set; }



    }



    public class JobViewDto
    {
        public string ImageComapny { get; set; }
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string Slug { get; set; }
        public string CompanyName { get; set; } // Từ RecruiterProfile
        public string Location { get; set; } // Build: "Hà Nội - Hoàn Kiếm" (từ names)
        public string SalaryRange { get; set; } // Build: "1000-2500 USD" hoặc "Thỏa thuận"

        public DateTime PostAt { get; set; } // thời gian đăng

        public bool IsUrgent { get; set; }

    }

    public class JobViewDetail
    {
        public Guid Id { get; set; }

        // tiêu đề công việc
        public string Title { get; set; }
        public string Slug { get; set; }


        // mô tả , queyefn lợi ,yêu cầu ứng viên

        public string Description { get; set; }
        public string Requirements { get; set; }
        public string Benefits { get; set; }



        // thu nhập
        public decimal? SalaryMin { get; set; }
        public decimal? SalaryMax { get; set; }

        public string? SalaryDisplay { get; set; }



        //đại điểm làm việc
        public string? WorkLocationDescribe { get; set; }






        // hình thức làm việc
        public EmploymentTye EmploymentType { get; set; }

        //chức vụ
        public PositionTye PositionType { get; set; }






        // kinh nghiệm
        public int? ExperienceYearsMin { get; set; }
        public int? ExperienceYearsMax { get; set; }
        public string ExDisplay { get; set; }


        // thời gian làm việc
        public string WorkTimeDisplay { get; set; }





        // hạn nộp hồ sơ
        public DateTime? ExpiresAt { get; set; }
        public bool IsUrgent { get; set; } = false;






    }





    public class ProvinceDto
    {
        public int Id { get; set; }
        public string Name { get; set; }

        public List<DistrictDto> ListDistrict { get; set; }
    }

    public class DistrictDto
    {
        public int Id { get; set; }
        public string NameDistrict { get; set; }

    }



    public class PagedResultDto<T>
    {
        public List<T> Items { get; set; }
        public long TotalCount { get; set; }
    }




}
