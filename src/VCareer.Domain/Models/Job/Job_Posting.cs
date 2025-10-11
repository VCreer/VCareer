using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.NetworkInformation;
using System.Text;
using System.Threading.Tasks;
using VCareer.Model;
using VCareer.Models.Companies;
using VCareer.Models.Users;
using Volo.Abp.Domain.Entities.Auditing;

namespace VCareer.Models.Job
{
    public class Job_Posting : FullAuditedAggregateRoot<Guid>
    {
        //hinhf ảnh
        public string Image { get; set; }

        // tiêu đề
        public string Title { get; set; }
        //đường dân
        public string Slug { get; set; }
        //mô tả
        public string Description { get; set; }
        //yêu cầu ứng viên
        public string Requirements { get; set; }
        //quyền lợi ứng viên
        public string Benefits { get; set; }
        // mức lương nhỏ nhất
        public decimal? SalaryMin { get; set; }
        // mức lương lớn nhất
        public decimal? SalaryMax { get; set; }

        //hình thức làm việc 
        public EmploymentTye EmploymentType { get; set; } // Enum: Full-time, Part-time, Contract, Internship

        //sô năm kinh nghiệm nhỏ nhất
        public int? ExperienceYearsMin { get; set; }

        //số năm kinh nghiệm lớn nhất
        public int? ExperienceYearsMax { get; set; }

        //thời gian làm việc
        public string WorkTime { get; set; }

        //địa điểm làm việc
        public string WorkLocation { get; set; }

        //Lương có thỏa thuận hay khong 
        public Boolean SalaryDeal { get; set; } = false;

        public string Keywords { get; set; }


        // nagyf tạo
        public DateTime PostedAt { get; set; }

        //sua ngay
        public DateTime UpdatedAt { get; set; }

        //hạn kết thúc
        public DateTime? ExpiresAt { get; set; }

        //trạng thái
        public JobStatus Status { get; set; } // Enum: Draft, Open, Closed

        //Số người nộp hồ sơ
        public int AppllyCount { get; set; }

        //tính chất công việc : gấp hay không
        public bool IsUrgent { get; set; } // Thêm tính chất gấp

        //id cua recurtier 
        public Guid RecuterId { get; set; }

        //id cua jobcategroy 
        public Guid JobCategoryId { get; set; }

        //chuyên môn của jbo là gì 
        public virtual Job_Category JobCategory { get; set; }

        //thuộc về recuiter nào
        public virtual RecruiterProfile RecruiterProfile { get; set; }

        //danh sách các tag của job
        public virtual ICollection<JobPostingTag> JobPostingTags { get; set; } = new List<JobPostingTag>();

        // method để lấy các tag của job )))) sao nó lại ở đây nhỉ ???
        public List<string> GetTags() => JobPostingTags.Select(t => t.Tag.Name).ToList();

        // tên tỉnh
        public virtual string Province
        { get; set; }
        // tên phường
        public virtual string District { get; set; }

    }
}
