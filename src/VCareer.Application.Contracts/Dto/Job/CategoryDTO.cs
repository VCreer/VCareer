using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using VCareer.Model;
using Volo.Abp.Application.Dtos;

namespace VCareer.Dto.Job
{

    public class JobSearchInputDto : PagedAndSortedResultRequestDto
    {
        public string? Keyword { get; set; } // Text search (title, desc, tags, location names, category path)
        public List<Guid>? CategoryIds { get; set; } // List leaf category Guids (node cuối)
        public List<int>? ProvinceIds { get; set; } // List ProvinceIds (thường 1, nhưng list để flex)
        public List<int>? DistrictIds { get; set; } // List DistrictIds (nhiều, thuộc province hoặc không)


        public EmploymentType? EmploymentType { get; set; }

        public PositionType? PositionType { get; set; }

        public decimal? SalaryMin { get; set; }
        public decimal? SalaryMax { get; set; }

        public int? ExperienceYearsMin { get; set; }
        public int? ExperienceYearsMax { get; set; }

        public string SortBy { get; set; } // "newest", "salary", "urgent" (default "newest")
    }

    // cây category 
    public class CategoryTreeDto
    {
        /// <summary>
        /// ID danh mục
        /// </summary>
        public Guid CategoryId { get; set; }

        /// <summary>
        /// Tên danh mục
        /// </summary>
        public string CategoryName { get; set; }

        /// <summary>
        /// Slug cho URL
        /// </summary>
        public string Slug { get; set; }

        /// <summary>
        /// Mô tả danh mục
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Số lượng job trong danh mục này
        /// </summary>
        public int JobCount { get; set; }

        /// <summary>
        /// Danh sách danh mục con
        /// </summary>
        public List<CategoryTreeDto> Children { get; set; } = new List<CategoryTreeDto>();

        /// <summary>
        /// Đường dẫn đầy đủ từ root đến node này
        /// </summary>
        public string FullPath { get; set; }

        /// <summary>
        /// Có phải là leaf node không
        /// </summary>
        public bool IsLeaf { get; set; }
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
        public EmploymentType EmploymentType { get; set; }

        //chức vụ
        public PositionType PositionType { get; set; }






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
        /// <summary>
        /// ID tỉnh/thành phố
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Tên tỉnh/thành phố
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Mã tỉnh/thành phố
        /// </summary>
        public string Code { get; set; }

        /// <summary>
        /// Danh sách quận/huyện
        /// </summary>
        public List<DistrictDto> Districts { get; set; } = new List<DistrictDto>();
    }

    public class DistrictDto
    {
        /// <summary>
        /// ID quận/huyện
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Tên quận/huyện
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Mã quận/huyện
        /// </summary>
        public string Code { get; set; }

        /// <summary>
        /// ID tỉnh/thành phố
        /// </summary>
        public int ProvinceId { get; set; }
    }



    public class PagedResultDto<T>
    {
        public List<T> Items { get; set; }
        public long TotalCount { get; set; }
    }




}
