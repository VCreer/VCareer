using System;
using Volo.Abp.Application.Dtos;

namespace VCareer.Dto.Profile
{
    public class ProfileDto : EntityDto<Guid>
    {
        public string Name { get; set; }
        public string Surname { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string Bio { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public bool? Gender { get; set; }
        public string Location { get; set; }
        public string Address { get; set; }
        public string Nationality { get; set; }
        public string MaritalStatus { get; set; }
        public string UserName { get; set; }
        public bool EmailConfirmed { get; set; }
        public bool PhoneNumberConfirmed { get; set; }
        public DateTime CreationTime { get; set; }
        public DateTime? LastModificationTime { get; set; }
        public string UserType { get; set; } // Candidate, Employee, Recruiter
        public int? CompanyId { get; set; } // Company ID for Recruiter

        // Thông tin nghề nghiệp (chỉ áp dụng cho Candidate)
        public string JobTitle { get; set; } // Vị trí chuyên môn
        public string Skills { get; set; } // Kỹ năng
        public int? Experience { get; set; } // Kinh nghiệm (số năm)
        public decimal? Salary { get; set; } // Mức lương mong muốn (decimal 18,2)
        public string WorkLocation { get; set; } // Địa điểm làm việc
        public bool? ProfileVisibility { get; set; } // Cho phép NTD tìm kiếm hồ sơ (chỉ áp dụng cho Candidate)
    }
}
