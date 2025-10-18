using Abp.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VCareer.Models.File
{
    public enum FileType
    {
        Cv = 1,                  // Hồ sơ ứng viên
        CoverLetter = 2,         // Thư xin việc
        Avatar = 3,              // Ảnh đại diện người dùng
        CompanyLogo = 4,         // Logo công ty
        JobAttachment = 5,       // Tài liệu đính kèm tin tuyển dụng
        CandidatePortfolio = 6,  // Hồ sơ năng lực
    }

}
