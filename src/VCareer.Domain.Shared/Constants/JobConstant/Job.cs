using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VCareer.Constants.JobConstant
{

    // enum loại hình công việc
    public enum EmploymentType
    {
        PartTime = 1,        // Bán thời gian
        FullTime = 2,         // Toàn thời gian
        Internship = 3,       // Thực tập
        Contract = 4,        // Hợp đồng
        Freelance = 5,       // Tự do
        Other = 6           // Khác
    }

    //enum cho job status
    public enum JobStatus
    {
        Draft = 1,      // Nháp
        Open = 2,       // Đang mở
        Closed = 3,     // Đã đóng
        Expired = 4     // Hết hạn
    }

    public enum PositionType
    {
        Employee = 1,           // Nhân viên
        TeamLead = 2,           // Trưởng nhóm
        Manager = 3,            // Trưởng phòng/Phó phòng
        Supervisor = 4,         // Quản lý/Giám sát
        BranchManager = 5,      // Trưởng chi nhánh
        DeputyDirector = 6,     // Phó giám đốc
        Director = 7,           // Giám đốc
        Intern = 8,            // Thực tập sinh
        Specialist = 9,         // Chuyên viên
        SeniorSpecialist = 10,  // Chuyên viên cao cấp
        Expert = 11,            // Chuyên gia
        Consultant = 12         // Tư vấn
    }

    /// <summary>
    /// Enum cho kinh nghiệm (đơn giản hóa - chỉ 1 field duy nhất)
    /// </summary>
    public enum ExperienceLevel
    {
        None = 0,           // Không yêu cầu kinh nghiệm
        Under1 = 1,         // Dưới 1 năm
        Year1 = 2,          // 1 năm
        Year2 = 3,          // 2 năm
        Year3 = 4,          // 3 năm
        Year4 = 5,          // 4 năm
        Year5 = 6,          // 5 năm
        Year6 = 7,          // 6 năm
        Year7 = 8,          // 7 năm
        Year8 = 9,          // 8 năm
        Year9 = 10,         // 9 năm
        Year10 = 11,        // 10 năm
        Over10 = 12         // Trên 10 năm
    }

    public enum JobDisplayArea
    {
        MainMenuPage = 0,
        JobSimilarPage = 1,
        JobLocationPage = 2,
        JobCategorPage = 3
    }
    public enum JobPriorityLevel
    {
        Normal = 0,
        Feature = 1, //là mua gói nhưng ko có vip
        Vip = 2

    }

    public class Job
    {

    }
}
