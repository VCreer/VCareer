using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VCareer.Model
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


    public class Job
    {

    }
}
