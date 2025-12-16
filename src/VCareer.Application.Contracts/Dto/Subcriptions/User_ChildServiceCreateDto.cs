using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static VCareer.Constants.JobConstant.SubcriptionContance;

namespace VCareer.Dto.Subcriptions
{
    public class User_ChildServiceViewDto
    {
        public Guid UserId { get; set; }
        public Guid UserSubcriptionId { get; set; } // để phân biệt với các dịch vụ con cùng id , nhưng mua khác lần 
        public Guid ChildServiceId { get; set; }
        public ChildServiceStatus Status { get; set; }
        public bool IsPrimaryOwner { get; set; } // la thang nay mua hay là thằng dùng nhờ (dùng để hiện/tắt nút share và trace)
        public bool IsLifeTime { get; set; } // có vĩnh viễn ko 
        public bool IsLimitUsedTime { get; set; }  //giới hạn số lần dùng
        public int? UsedTime { get; set; } //đã dùng bao nhiêu
        public int? TotalUsageLimit { get; set; }  //tổng lượt được phép dùng
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }

    //cái dto này mục đích để hiển thị lựa chọn cho hr staff sử dụng gói , quan trọng nhất là trường hợp gói được share
    //lý do phức tạp này là do nếu chưa dùng thì ko có userchildservice mà load lên , xong nếu trả về childserviceview dto thì vẫn cần
    // hiển thị cả cái hạn dựa trên user subcription service nữa .
    public class OptionsChildServiceViewDto
    {
        public User_ChildServiceViewDto? user_ChildServices { get; set; } // trường hợp người dùng dùng rồi mới có cái này
        public ChildServiceViewDto? childService { get; set; } // trường hợp chưa dùng thì chỉ load lên dc cái này số lần dùng full
        public User_SubcirptionViewDto? user_subcription { get; set; } //để lấy cái time cho trường hợp 2
        public SubcriptionsViewDto? subcriptionsViewDto { get; set; } //để lấy thêm thông tin hiển thị cho fe

    }

    public class User_ChildServiceUpdateDto
    {
        public ChildServiceStatus Status { get; set; }
        public int? UsedTime { get; set; } //đã dùng bao nhiêu
        public int? TotalUsageLimit { get; set; }  //tổng lượt được phép dùng
        public DateTime? EndDate { get; set; }
    }

    public class User_ChildServiceGetDto()
    {
        public ServiceTarget Target { get; set; }
        public ServiceAction Action { get; set; }
    }

    public class User_ChildServiceActiveDto
    {
        public Guid UserSubcriptionServiceId { get; set; }
        public Guid ChildServiceId { get; set; }
    }
}
